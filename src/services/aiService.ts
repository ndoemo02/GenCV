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
      // Rozbijamy po popularnych separatorach list, dodajemy '-' oraz ','
      return item.split(/[•·\|\*\n\-]|\s{3,}/).map(p => p.trim()).filter(p => p.length > 2);
    });
  }
  if (typeof items === 'string') {
    return items.split(/[•·\|\*\n\-]|\s{3,}/).map(p => p.trim()).filter(p => p.length > 2);
  }
  return [];
};

const sanitizeNormalizedCv = (candidate: NormalizedCvSchema): NormalizedCvSchema => {
  let fullName = sanitizeInlineText(candidate.fullName);
  let headline = sanitizeInlineText(candidate.headline);
  
  // ✅ NOWY: Agresywna filtracja imion, które są nagłówkami sekcji
  if (fullName && /(obsługa|obsluga|umiejętności|umiejetnosci|język|jezyk|angielski|niemiecki|doświadczenie|doswiadczenie|wykształcenie|wyksztalcenie|elektronarzędzi|elektronarzedzi)/i.test(fullName)) {
    fullName = 'Imię i Nazwisko';
  }
  
  // ✅ Headline nie może być długim zdaniem (prawdopodobnie z OCR summary)
  if (headline && headline.split(' ').length > 8) {
    headline = undefined;
  }

  // Filtracja dla headline (stanowiska) - usuń telefon/email jeśli się przyplątał
  if (headline) {
    headline = stripContactInfo(headline);
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
    skills: smartSplitList(candidate.skills).slice(0, 30),
    experience: (candidate.experience || [])
      .map((entry) => ({
        company: sanitizeInlineText(entry.company) || 'Doświadczenie zawodowe',
        role: sanitizeInlineText(entry.role) || 'Specjalista',
        startDate: sanitizeInlineText(entry.startDate),
        endDate: sanitizeInlineText(entry.endDate),
        bullets: smartSplitList(entry.bullets),
      }))
    .filter((entry) => entry.company || entry.role || entry.bullets.length),
  education: candidate.education
    .map((entry) => ({
      institution: sanitizeInlineText(entry.institution) || 'Edukacja',
      degree: sanitizeInlineText(entry.degree) || 'Kierunek / Stopień',
      endDate: sanitizeInlineText(entry.endDate),
    }))
    .filter((entry) => entry.institution || entry.degree),
  certifications: sanitizeStringList(candidate.certifications, 15),
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
    education: (payload.education || []).map(edu => ({
      institution: edu.institution,
      degree: edu.degree,
      startDate: edu.startDate,
      endDate: edu.endDate,
    })),
    certifications: payload.certifications || [],
  });
};

const extractNormalizedCvWithGemini = async (
  parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>,
  fallbackText: string,
  additionalContext = '',
) => {
    const apiKey = getApiKey();
    const model = 'gemini-2.0-flash'; // Korzystajmy z najstabilniejszego modelu flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Przygotuj prompt z instrukcją JSON i prośbą o uzupełnienia
    const schemaText = `
JESTEŚ ELITARNYM EKSPERTEM HR I SYSTEMÓW ATS. Twoim zadaniem jest transformacja surowych danych z CV (tekst/obraz) w ustrukturyzowany, PROFESJONALNY profil.

### KRYTYCZNE ZASADY (PRZETWARZANIE):
1. **Dokończ i Uzupełnij (AGRESYWNIE)**: To jest Twoje najważniejsze zadanie. Jeśli w CV są tylko krótkie hasła (np. "produkcja balustrad"), MUSISZ ROZWINĄĆ je w 4-6 profesjonalnych punktów (bullets). 
   - Każdy punkt musi być rozbudowany (min. 12 słów).
   - Używaj profesjonalnej terminologii (np. "Obsługa i konserwacja półautomatycznych systemów spawalniczych MIG/MAG", zamiast "Spawanie").
   - Jeśli danych brakuje, WYMYŚL typowe, profesjonalne obowiązki dla tego stanowiska, aby CV wyglądało na bogate i eksperckie.
2. **Korekta OCR**: Napraw błędy odczytu i scalaj rozbite słowa.
3. **Podsumowanie**: Stwórz PROFESJONALNE podsumowanie zawodowe (summary) o długości min. 250-300 znaków, podkreślając ambicje i kluczowe kompetencje.
4. **Headline**: Ustaw konkretną, chwytliwą rolę zawodową (np. "Ekspert Spawalnictwa i Montażu Konstrukcji").

### SPECJALNE INSTRUKCJE OD UŻYTKOWNIKA (PRIORYTET):
Gdy użytkownik podaje "Dodatkowe uwagi" lub "Kontekst" - MUSISZ je bezwzględnie zastosować i wpleść w całą treść CV.
KONTEKST DODATKOWY: ${additionalContext || 'Brak szczególnych uwag.'}

Wymagany schemat JSON: 
{
  fullName: string, 
  headline: string, 
  summary: string, 
  contact: { email: string, phone: string, location: string, links: string[] },
  skills: string[],
  experience: Array<{ company: string, role: string, startDate: string, endDate: string, bullets: string[] }>,
  education: Array<{ institution: string, degree: string, startDate: string, endDate: string }>,
  certifications: string[]
}
`.trim();

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
          responseMimeType: 'application/json',
          temperature: 0.2 // Niska temperatura dla stabilności schematu, ale wystarczająca dla kreatywnych uzupełnień
        }
      })
    });

    if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);
    const data = await res.json();
    const resultRaw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultRaw) throw new Error('Pusta odpowiedź z Gemini');

    const parsed = safeJsonParse<Partial<NormalizedCvSchema>>(resultRaw);
    const normalized = normalizeGeminiCv(parsed);
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
        text: `Znormalizuj, popraw i profesionalnie UZUPEŁNIJ (enrich) dane kandydata. Użyj kontekstu jeśli jest podany. 
        Tekst z dokumentu: ${sanitizedText}\nKontekst dodatkowy: ${sanitizedContext}`,
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
Zanalizuj CV z załączonego dokumentu. 
NAJWAŻNIEJSZE: 
1. Wyciągnij dane (imię, kontakt, doświadczenie).
2. Profesjonalnie ROZWIŃ (uzupełnij) punkty doświadczenia i podsumowanie, aby CV wyglądało na bogatsze i bardziej wartościowe dla rekrutera.
3. Jeśli widzisz błędy w formatowaniu OCR (np. rozsypane litery), sklej je w poprawne słowa.

Kontekst kandydata: ${additionalContext}
`.trim();

  return await extractNormalizedCvWithGemini(
    [
      { inlineData: { data: cleanBase64, mimeType: asset.mimeType } },
      { text: prompt },
    ],
    '',
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

