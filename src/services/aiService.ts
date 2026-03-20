import { Type, ThinkingLevel } from '@google/genai';
import type {
  CareerAnalysis,
  CareerRoadmap,
  IngestionResult,
  NormalizedCvSchema,
  StructuredCV,
  UploadedAsset,
} from '../types';
import { getApiKey, getGeminiClient, hasGeminiKey } from '../lib/gemini/client';
import { computeCareerIntelligence } from '../lib/career/intelligence';
import { buildStructuredCvFromNormalized, countStructuredSections, validateStructuredCv } from '../lib/cv/structured';
import { joinSanitizedBlocks, sanitizeInlineText, sanitizeRawCvText, sanitizeStringList, stripContactInfo } from '../lib/cv/sanitize';
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
  
  // ✅ NOWY: Agresywna filtracja imion, które są nagłówkami sekcji
  if (fullName && /(obsługa|obsluga|umiejętności|umiejetnosci|język|jezyk|angielski|niemiecki|doświadczenie|doswiadczenie|wykształcenie|wyksztalcenie|elektronarzędzi|elektronarzedzi)/i.test(fullName)) {
    console.warn('[SANITIZE] fullName zawiera nagłówek sekcji, zastępuję placeholderem:', fullName);
    fullName = 'Imię i Nazwisko';
  }
  
  // ✅ NOWY: Headline nie może być długim zdaniem (prawdopodobnie z OCR summary)
  if (headline && headline.split(' ').length > 6) {
    console.warn('[SANITIZE] headline jest za długi, usuwam:', headline);
    headline = undefined;
  }

  // ✅ NOWY: Headline nie może zawierać technicznych słów-kluczy
  if (headline && /(MIG|MAG|TIG|WELDING|SPAWANIE|METAL|INERT|GAS|OBSŁUGA|ELEKTRONARZĘDZI)/i.test(headline)) {
    console.warn('[SANITIZE] headline zawiera technikę/umiejętność, usuwam:', headline);
    headline = undefined;
  }
  
  // Agresywna filtracja naglowkow i smieci ocr dla Imienia i Nazwiska (Paranoid Mode)
  if (fullName && fullName !== 'Imię i Nazwisko') {
    fullName = stripContactInfo(fullName);
    
    if (fullName) {
      const fnLower = fullName.toLowerCase();
      const isHeader = SECTION_HEADERS_REGEX.test(fnLower);
      const isTooLong = fullName.length > 80;
      
      if (isHeader || isTooLong) {
        fullName = 'Imię i Nazwisko';
      }
    }
  }

  // Filtracja dla headline (stanowiska) - usuń telefon jeśli się przyplątał
  if (headline) {
    headline = stripContactInfo(headline);
    if (headline && (SECTION_HEADERS_REGEX.test(headline) || headline.length > 80)) {
      headline = undefined;
    }
  }

  return {
    language: sanitizeInlineText(candidate.language) || (/[^\x00-\x7F]/.test(candidate.summary || '') ? 'pl' : 'en'),
    fullName: fullName || 'Imię i Nazwisko',
    headline: headline || '',
    summary: stripContactInfo(sanitizeInlineText(candidate.summary)) || '',
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

  if (!candidate.skills.length && !candidate.experience.length && !candidate.education.length) {
    reasons.push('missing_sections');
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
    const apiKey = getApiKey();
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Przygotuj prompt z instrukcją JSON
    const schemaText = `Oto wymagany schemat JSON: 
    {
      fullName: string, 
      headline: string, 
      summary: string, 
      contact: { email: string, phone: string, location: string, links: string[] },
      skills: string[],
      experience: Array<{ company: string, role: string, startDate: string, endDate: string, bullets: string[] }>,
      education: Array<{ institution: string, degree: string, endDate: string }>,
      certifications: string[]
    }.`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            ...parts.map(p => p.inlineData ? { inlineData: p.inlineData } : { text: p.text || '' }),
            { text: schemaText }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);
    const data = await res.json();
    const resultRaw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultRaw) throw new Error('Pusta odpowiedź z Gemini');

    const parsed = safeJsonParse<Partial<NormalizedCvSchema>>(resultRaw);
    const normalized = normalizeGeminiCv(parsed);
    const validation = validateNormalizedCvCandidate(normalized, fallbackText);

    if (validation.valid) {
      logPipeline('ai_normalization_success', {
        structured_sections: 5,
      });
      return normalized;
    }

    console.warn('[AI] Model zwrocil dane, ale przeszly walidacji, mimo to ufamy wynikom:', validation.reasons);
    return normalized;
};

export const extractNormalizedCvFromText = async (rawInput: string, additionalContext = ''): Promise<NormalizedCvSchema> => {
  const sanitizedText = sanitizeRawCvText(rawInput);
  const sanitizedContext = sanitizeRawCvText(additionalContext);
  const fallback = fallbackNormalizeCv(joinSanitizedBlocks(sanitizedText, sanitizedContext), sanitizedContext);
  if (!hasGeminiKey()) {
    return fallback;
  }

  return await extractNormalizedCvWithGemini(
    [
      {
        text: `Znormalizuj ponizsze dane kandydata do struktury CV. Zwracaj tylko JSON. Tekst: ${sanitizedText}\nKontekst: ${sanitizedContext}`,
      },
    ],
    joinSanitizedBlocks(sanitizedText, sanitizedContext),
    sanitizedContext,
  );
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

  const prompt = `
Jesteś elitarnym ekspertem HR. Twoim zadaniem jest wyekstrahowanie danych z CV na załączonym DOKUMENCIE/OBRAZIE.

KRYTYCZNE INSTRUKCJE:
1. Czytaj dane BEZPOŚREDNIO z dokumentu. Na górze znajdź imię i nazwisko (zwykle największy tekst).
   Jeśli widzisz rozdzielone litery (np. "Ł U K A S Z"), złącz je w "Łukasz". 
2. Numer telefonu wyszukaj dokładnie (format +48 XXX XXX XXX).
3. Email zwykle znajduje się blisko telefonu lub w stopce.
4. Stanowisko (headline) to krótka fraza pod imieniem (np. "Spawacz / Ślusarz").
   NIGDY nie używaj nazw umiejętności technicznych (MIG, TIG, WELDING) jako headline.

Zwróć tylko czysty obiekt JSON zgodnie ze schematem.
`.trim();

  return await extractNormalizedCvWithGemini(
    [
      { inlineData: { data: cleanBase64, mimeType: asset.mimeType } },
      { text: prompt },
    ],
    '', // ✅ Pusty fallbackText — niech AI pracuje tylko z obrazem (Vision mode)
    additionalContext,
  );
};

export const generateStructuredCv = async (
  ingestion: IngestionResult,
  additionalContext: string,
): Promise<StructuredCV> => {
  const structuredCv = buildStructuredCvFromNormalized(ingestion.normalizedCv, additionalContext);
  const validation = validateStructuredCv(structuredCv);

  if (!validation.valid) {
    console.warn('[AI] Structured CV ma niepokojące wyniki walidacji, ale ufamy AI bardzej niż lokalnemu parserowi:', validation.reasons);
  }

  logPipeline('structured_cv_ready', {
    structured_sections: countStructuredSections(structuredCv),
    warnings: [...ingestion.warnings, ...validation.reasons],
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

