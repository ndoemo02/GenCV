import { Type, ThinkingLevel } from '@google/genai';
import type {
  CareerAnalysis,
  CareerRoadmap,
  IngestionResult,
  NormalizedCvSchema,
  StructuredCvDocument,
  UploadedAsset,
} from '../types';
import { getGeminiClient, hasGeminiKey } from '../lib/gemini/client';
import { computeCareerIntelligence } from '../lib/career/intelligence';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const decodeBase64Text = (base64: string) => {
  if (typeof atob !== 'function') {
    return '';
  }

  try {
    return decodeURIComponent(
      Array.from(atob(base64))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  } catch {
    return '';
  }
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const parseBullets = (rawText: string) =>
  rawText
    .split(/\n|\u2022|\-|\*/)
    .map((line) => normalizeWhitespace(line))
    .filter((line) => line.length > 18)
    .slice(0, 8);

const extractEmail = (rawText: string) => rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
const extractPhone = (rawText: string) => rawText.match(/(\+?\d[\d\s-]{7,}\d)/)?.[0]?.trim();

export const fallbackNormalizeCv = (rawText: string): NormalizedCvSchema => {
  const lines = rawText
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const topLines = lines.slice(0, 4);
  const experienceBullets = parseBullets(rawText);
  const inferredSkills = Array.from(
    new Set(
      rawText
        .match(/\b(react|sprzedaz|sales|crm|excel|negocjacje|zarzadzanie|angielski|niemiecki|figma|typescript|marketing|klient)\b/gi) ?? [],
    ),
  ).map((skill) => skill.toLowerCase());

  return {
    language: /[ąćęłńóśźż]/i.test(rawText) ? 'pl' : 'en',
    fullName: topLines[0] || 'Kandydat FlowAssist',
    headline: topLines[1] || 'Specjalista z potencjałem rozwoju',
    summary: topLines.slice(2, 4).join(' ') || rawText.slice(0, 240),
    contact: {
      email: extractEmail(rawText),
      phone: extractPhone(rawText),
      location: rawText.match(/(Warszawa|Krakow|Wroclaw|Gdansk|Poznan|Berlin|Remote)/i)?.[0],
      links: [],
    },
    skills: inferredSkills.length ? inferredSkills : ['komunikacja', 'organizacja pracy'],
    experience: [
      {
        company: 'Dotychczasowe doświadczenie',
        role: topLines[1] || 'Specjalista',
        bullets: experienceBullets.length ? experienceBullets : ['Doświadczenie wymaga doprecyzowania na podstawie pełnego CV.'],
      },
    ],
    education: [],
    certifications: [],
  };
};

const normalizeGeminiCv = (payload: Partial<NormalizedCvSchema>, rawText: string): NormalizedCvSchema => {
  const fallback = fallbackNormalizeCv(rawText);
  return {
    language: payload.language || fallback.language,
    fullName: payload.fullName || fallback.fullName,
    headline: payload.headline || fallback.headline,
    summary: payload.summary || fallback.summary,
    contact: {
      email: payload.contact?.email || fallback.contact.email,
      phone: payload.contact?.phone || fallback.contact.phone,
      location: payload.contact?.location || fallback.contact.location,
      links: payload.contact?.links || fallback.contact.links,
    },
    skills: payload.skills?.length ? payload.skills : fallback.skills,
    experience: payload.experience?.length ? payload.experience : fallback.experience,
    education: payload.education ?? fallback.education,
    certifications: payload.certifications ?? fallback.certifications,
  };
};

const extractNormalizedCvWithGemini = async (parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>, fallbackText: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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

  const parsed = JSON.parse(response.text || '{}') as Partial<NormalizedCvSchema>;
  return normalizeGeminiCv(parsed, fallbackText);
};

export const extractNormalizedCvFromText = async (rawText: string, additionalContext = ''): Promise<NormalizedCvSchema> => {
  const fallback = fallbackNormalizeCv(`${rawText}\n${additionalContext}`);
  if (!hasGeminiKey()) {
    return fallback;
  }

  try {
    return await extractNormalizedCvWithGemini(
      [
        {
          text: `Znormalizuj ponizsze dane kandydata do struktury CV. Zwracaj tylko JSON. Tekst: ${rawText}\nKontekst: ${additionalContext}`,
        },
      ],
      rawText,
    );
  } catch {
    return fallback;
  }
};

export const extractNormalizedCvFromAsset = async (
  asset: UploadedAsset,
  instruction: string,
  fallbackText = '',
): Promise<NormalizedCvSchema> => {
  const decoded = fallbackText || decodeBase64Text(asset.base64);
  const fallback = fallbackNormalizeCv(decoded || asset.name);
  if (!hasGeminiKey()) {
    return fallback;
  }

  try {
    return await extractNormalizedCvWithGemini(
      [
        { inlineData: { data: asset.base64, mimeType: asset.mimeType } },
        { text: `${instruction} Zwracaj tylko JSON zgodny ze schematem CV.` },
      ],
      decoded,
    );
  } catch {
    return fallback;
  }
};

export const generateStructuredCv = async (
  ingestion: IngestionResult,
  additionalContext: string,
): Promise<StructuredCvDocument> => {
  const { normalizedCv } = ingestion;
  const sections = [
    {
      title: 'Profil',
      items: [normalizedCv.summary || 'Kandydat posiada bazowe dane wymagajace dalszego uzupelnienia.'],
    },
    {
      title: 'Doswiadczenie',
      items: normalizedCv.experience.flatMap((entry) => [
        `${entry.role} | ${entry.company}`,
        ...entry.bullets.map((bullet) => `- ${bullet}`),
      ]),
    },
    {
      title: 'Kompetencje',
      items: normalizedCv.skills,
    },
  ].filter((section) => section.items.length > 0);

  return {
    fullName: normalizedCv.fullName,
    targetRole: additionalContext || normalizedCv.headline,
    summary: normalizedCv.summary,
    contactLine: [normalizedCv.contact.email, normalizedCv.contact.phone, normalizedCv.contact.location]
      .filter(Boolean)
      .join(' | '),
    sections,
    atsKeywords: Array.from(new Set([...normalizedCv.skills, normalizedCv.headline, additionalContext])).filter(Boolean),
  };
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
