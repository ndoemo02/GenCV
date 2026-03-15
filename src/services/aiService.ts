import { Type, ThinkingLevel } from '@google/genai';
import type {
  CareerAnalysis,
  CareerRoadmap,
  IngestionResult,
  NormalizedCvSchema,
  StructuredCV,
  UploadedAsset,
} from '../types';
import { getGeminiClient, hasGeminiKey } from '../lib/gemini/client';
import { computeCareerIntelligence } from '../lib/career/intelligence';
import { buildStructuredCvFromNormalized, countStructuredSections, validateStructuredCv } from '../lib/cv/structured';
import { joinSanitizedBlocks, sanitizeInlineText, sanitizeRawCvText, sanitizeStringList } from '../lib/cv/sanitize';
import { logPipeline } from '../lib/debug/pipeline';
import { buildNormalizedCvFromSegments } from '../lib/ingestion/segmenter';
import { CvParsingError } from '../lib/ingestion/extractors';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const safeJsonParse = <T>(raw: string): T => {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned) as T;
};

const countAiTokens = (response: { usageMetadata?: { totalTokenCount?: number; candidatesTokenCount?: number; promptTokenCount?: number } }) =>
  response.usageMetadata?.totalTokenCount ?? response.usageMetadata?.candidatesTokenCount ?? response.usageMetadata?.promptTokenCount ?? 0;

const SECTION_HEADERS_REGEX = /(umiejetnosci|umiejętności|umiej|umeęno|kompetencje|doswiadczenie|doświadczenie|dosw|dośw|zawodowe|wyksztalcenie|wykształcenie|wykszt|edukacja|profil|podsumowanie|hobby|jezyki|języki|skills|experience|education|summary|languages|clausula|klauzula|contact|kontakt|urodzenia|urodz|miejscowosc|adres|hobby|zainteresowania|szkolenia|kursy)/i;

const smartSplitList = (items: string[] | string | undefined): string[] => {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items.flatMap(item => {
      if (typeof item !== 'string') return [];
      // Rozbijamy po popularnych separatorach list (kropki, pionowe kreski, gwiazdki, nowe linie, duze odstepy)
      return item.split(/[•·\|\*\n]|\s{3,}/).map(p => p.trim()).filter(p => p.length > 2);
    });
  }
  if (typeof items === 'string') {
    return items.split(/[•·\|\*\n]|\s{3,}/).map(p => p.trim()).filter(p => p.length > 2);
  }
  return [];
};

const sanitizeNormalizedCv = (candidate: NormalizedCvSchema): NormalizedCvSchema => {
  let fullName = sanitizeInlineText(candidate.fullName);
  let headline = sanitizeInlineText(candidate.headline);
  
  // Agresywna filtracja naglowkow i smieci ocr dla Imienia i Nazwiska (Paranoid Mode)
  if (fullName) {
    const fnLower = fullName.toLowerCase();
    const isHeader = SECTION_HEADERS_REGEX.test(fnLower);
    const isGarbage = fullName.length > 25 && !fullName.includes(' ');
    const isTooLong = fullName.length > 40;
    const isTooHeavyUppercase = (fullName.match(/[A-ZĄĘÓŚŁŻŹĆ]/g)?.length ?? 0) > fullName.length * 0.65 && fullName.length > 8;
    const hasForbiddenChars = /[©®™]/.test(fullName);
    const hasDigit = /\d/.test(fullName);
    const startsWithKeyword = /^(umiej|dosw|wyksz|edu|pro|zawod)/i.test(fullName);
    
    // Jeśli zawiera słowa typowe dla sekcji potraktuj jako garbage
    const containsSectionKeywords = /(doświadczenie|umiejętności|zawodowe|kompetencje|edukacja)/i.test(fnLower);
    
    if (isHeader || isGarbage || isTooLong || isTooHeavyUppercase || hasForbiddenChars || startsWithKeyword || hasDigit || containsSectionKeywords) {
      fullName = 'Imię i Nazwisko';
    }
  }

  // Filtracja dla headline (stanowiska)
  if (headline) {
    if (SECTION_HEADERS_REGEX.test(headline) || headline.length > 60 || headline.includes('©')) {
      headline = undefined;
    }
  }

  return {
    language: sanitizeInlineText(candidate.language) || (/[^\x00-\x7F]/.test(candidate.summary || '') ? 'pl' : 'en'),
    fullName: fullName || 'Imię i Nazwisko',
    headline: headline,
    summary: sanitizeInlineText(candidate.summary),
    contact: {
      email: sanitizeInlineText(candidate.contact.email),
      phone: sanitizeInlineText(candidate.contact.phone),
      location: sanitizeInlineText(candidate.contact.location),
      links: sanitizeStringList(candidate.contact.links, 6),
    },
    skills: smartSplitList(candidate.skills).slice(0, 24),
    experience: (candidate.experience || [])
      .map((entry) => ({
        company: sanitizeInlineText(entry.company) || 'Doswiadczenie zawodowe',
        role: sanitizeInlineText(entry.role) || 'Specjalista',
        startDate: sanitizeInlineText(entry.startDate),
        endDate: sanitizeInlineText(entry.endDate),
        bullets: smartSplitList(entry.bullets),
      }))
    .filter((entry) => entry.company || entry.role || entry.bullets.length),
  education: candidate.education
    .map((entry) => ({
      institution: sanitizeInlineText(entry.institution) || 'Edukacja',
      degree: sanitizeInlineText(entry.degree) || 'Kierunek do uzupelnienia',
      endDate: sanitizeInlineText(entry.endDate),
    }))
    .filter((entry) => entry.institution || entry.degree),
  certifications: sanitizeStringList(candidate.certifications, 10),
  };
};

const validateNormalizedCvCandidate = (candidate: NormalizedCvSchema, rawText: string) => {
  const reasons: string[] = [];
  const structured = buildStructuredCvFromNormalized(candidate, '');
  const structuredValidation = validateStructuredCv(structured);

  if (!candidate.fullName || candidate.fullName.length < 3) {
    reasons.push('missing_name');
  }

  if (!candidate.summary || candidate.summary.length < 24) {
    reasons.push('missing_summary');
  }

  if (!candidate.skills.length && !candidate.experience.length) {
    reasons.push('missing_sections');
  }

  if (structuredValidation.reasons.length) {
    reasons.push(...structuredValidation.reasons);
  }

  if (!sanitizeRawCvText(rawText)) {
    reasons.push('empty_input');
  }

  return {
    valid: reasons.length === 0,
    reasons: Array.from(new Set(reasons)),
  };
};

export const fallbackNormalizeCv = (rawInput: string, additionalContext = ''): NormalizedCvSchema =>
  sanitizeNormalizedCv(buildNormalizedCvFromSegments(rawInput, additionalContext));

const normalizeGeminiCv = (payload: Partial<NormalizedCvSchema>): NormalizedCvSchema => {
  return sanitizeNormalizedCv({
    language: payload.language || 'pl',
    fullName: payload.fullName || 'Imię i Nazwisko',
    headline: payload.headline,
    summary: payload.summary,
    contact: {
      email: payload.contact?.email,
      phone: payload.contact?.phone,
      location: payload.contact?.location,
      links: payload.contact?.links || [],
    },
    skills: payload.skills || [],
    experience: (payload.experience || []).map(exp => ({
      company: exp.company,
      role: exp.role,
      startDate: exp.startDate,
      endDate: exp.endDate,
      bullets: exp.bullets || []
    })),
    education: payload.education || [],
    certifications: payload.certifications || [],
  });
};

const extractNormalizedCvWithGemini = async (
  parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>,
  fallbackText: string,
  additionalContext = '',
) => {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING },
            fullName: { type: Type.STRING },
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            contact: {
              type: Type.OBJECT,
              properties: {
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                location: { type: Type.STRING },
                links: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  institution: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                },
              },
            },
            certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['fullName', 'headline', 'summary', 'skills', 'experience'],
        },
      },
    });

    const aiTokens = countAiTokens(response);
    const parsed = safeJsonParse<Partial<NormalizedCvSchema>>(response.text || '{}');
    const normalized = normalizeGeminiCv(parsed);
    const validation = validateNormalizedCvCandidate(normalized, fallbackText);

    if (validation.valid) {
      logPipeline('ai_normalization_success', {
        ai_tokens: aiTokens,
        structured_sections: countStructuredSections(buildStructuredCvFromNormalized(normalized, additionalContext)),
      });
      return normalized;
    }

    console.warn('[AI] Model zwrocil dane, ale nie przeszly walidacji:', validation.reasons);
  } catch (err) {
    console.error('[AI] Blad modelu Gemini:', err);
  }

  // Fallback tylko w przypadku bledu lub skrajnie slabej jakosci AI
  console.info('[AI] Uruchamiam fallback OCR parser...');
  return fallbackNormalizeCv(fallbackText, additionalContext);
};

export const extractNormalizedCvFromText = async (rawInput: string, additionalContext = ''): Promise<NormalizedCvSchema> => {
  const sanitizedText = sanitizeRawCvText(rawInput);
  const sanitizedContext = sanitizeRawCvText(additionalContext);
  const fallback = fallbackNormalizeCv(joinSanitizedBlocks(sanitizedText, sanitizedContext), sanitizedContext);
  if (!hasGeminiKey()) {
    return fallback;
  }

  try {
    return await extractNormalizedCvWithGemini(
      [
        {
          text: `Znormalizuj ponizsze dane kandydata do struktury CV. Zwracaj tylko JSON. Tekst: ${sanitizedText}\nKontekst: ${sanitizedContext}`,
        },
      ],
      joinSanitizedBlocks(sanitizedText, sanitizedContext),
      sanitizedContext,
    );
  } catch {
    return fallback;
  }
};

export const extractNormalizedCvFromAsset = async (
  asset: UploadedAsset,
  instruction: string,
  fallbackText = '',
  additionalContext = '',
): Promise<NormalizedCvSchema> => {
  const sanitizedFallbackText = sanitizeRawCvText(fallbackText);
  const fallback = sanitizedFallbackText ? fallbackNormalizeCv(sanitizedFallbackText, additionalContext) : null;
  if (!hasGeminiKey()) {
    if (fallback) {
      return fallback;
    }

    throw new CvParsingError();
  }

  const cleanBase64 = asset.base64.includes('base64,') 
    ? asset.base64.split('base64,')[1] 
    : asset.base64;

  try {
    const prompt = `
  Jesteś ekspertem HR i systemem ATS. Twoim zadaniem jest wyekstrahowanie i uporządkowanie danych z załączonego CV.
  
  INSTRUKCJE:
  1. Zidentyfikuj Imię i Nazwisko. Zwykle znajduje się na samej górze. 
     NIGDY nie używaj "UMIEJĘTNOŚCI", "DOŚWIADCZENIE" ani nagłówków sekcji jako nazwiska.
  2. Podsumowanie zawodowe powinno być zwięzłe (2-4 zdania). Nie kopiuj tam listy umiejętności.
  3. Umiejętności (skills) muszą być tablicą krótko brzmiących kompetencji.
  4. Doświadczenie zawodowe musi zawierać daty, firmę i rolę. Sortuj chronologicznie (najnowsze na górze).
  5. Napraw literówki wynikające z OCR.
  6. Ignoruj klauzule RODO.
  7. Zwróć tylko czysty obiekt JSON zgodnie ze schematem.

  ${instruction}
  `.trim();

    return await extractNormalizedCvWithGemini(
      [
        { inlineData: { data: cleanBase64, mimeType: asset.mimeType } },
        { text: prompt },
      ],
      sanitizedFallbackText || sanitizeRawCvText(additionalContext),
      additionalContext,
    );
  } catch (err) {
    console.error('[AI] Wyjatek w extractNormalizedCvFromAsset:', err);
    if (fallback) {
      return fallback;
    }

    throw new CvParsingError();
  }
};

export const generateStructuredCv = async (
  ingestion: IngestionResult,
  additionalContext: string,
): Promise<StructuredCV> => {
  const structuredCv = buildStructuredCvFromNormalized(ingestion.normalizedCv, additionalContext);
  const validation = validateStructuredCv(structuredCv);

  if (!validation.valid) {
    const fallbackStructuredCv = buildStructuredCvFromNormalized(fallbackNormalizeCv(ingestion.rawText, additionalContext), additionalContext);
    logPipeline('structured_cv_fallback', {
      structured_sections: countStructuredSections(fallbackStructuredCv),
      reasons: validation.reasons,
    });
    return fallbackStructuredCv;
  }

  logPipeline('structured_cv_ready', {
    structured_sections: countStructuredSections(structuredCv),
    warnings: ingestion.warnings,
  });

  return structuredCv;
};

export const generateCareerAnalysis = async (normalizedCv: NormalizedCvSchema, additionalContext: string): Promise<CareerAnalysis> =>
  computeCareerIntelligence(normalizedCv, additionalContext);

export const generateCareerRoadmaps = async (
  normalizedCv: NormalizedCvSchema,
  additionalContext: string,
): Promise<CareerRoadmap[]> => {
  const analysis = await computeCareerIntelligence(normalizedCv, additionalContext);
  return analysis.roadmaps;
};

/** @deprecated Visual CV generation is no longer used. Structured PDF rendering replaces it. */
export const generateVisualCV = async (): Promise<null> => {
  console.warn('generateVisualCV is deprecated. Use generateStructuredCv() and pdfRenderer.ts instead.');
  return null;
};

export const toCareerProfile = (analysis: CareerAnalysis, normalizedCv: NormalizedCvSchema) => ({
  id: `profile-${uid()}`,
  fullName: normalizedCv.fullName,
  currentRole: analysis.estimatedCurrentRole,
  seniorityLevel: analysis.seniorityLevel,
  strongestSkills: analysis.strongestSkills,
  missingSkills: analysis.missingSkills,
  lastUpdatedAt: new Date().toISOString(),
});

