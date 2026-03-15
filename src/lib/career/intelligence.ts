import { Type, ThinkingLevel } from '@google/genai';
import type { CareerAnalysis, CareerRoadmap, NormalizedCvSchema, RoadmapVariant } from '../../types';
import { getGeminiClient, hasGeminiKey } from '../gemini/client';

const uid = (label: string) => `${label}-${Math.random().toString(36).slice(2, 8)}`;

const seniorityFromExperience = (normalizedCv: NormalizedCvSchema) => {
  const yearsHint = normalizedCv.experience.length;
  if (yearsHint >= 4) return 'senior';
  if (yearsHint >= 2) return 'mid';
  return 'junior';
};

const inferRole = (normalizedCv: NormalizedCvSchema, additionalContext: string) => {
  const haystack = `${normalizedCv.headline} ${normalizedCv.summary} ${normalizedCv.skills.join(' ')} ${additionalContext}`.toLowerCase();
  if (haystack.includes('sprzed') || haystack.includes('sales')) return 'Specjalista sprzedazy';
  if (haystack.includes('marketing')) return 'Specjalista marketingu';
  if (haystack.includes('react') || haystack.includes('typescript')) return 'Frontend Developer';
  if (haystack.includes('spaw')) return 'Spawacz';
  return normalizedCv.headline || 'Specjalista';
};

const inferMissingSkills = (normalizedCv: NormalizedCvSchema, additionalContext: string) => {
  const known = normalizedCv.skills.map((skill) => skill.toLowerCase());
  const context = additionalContext.toLowerCase();
  const desired = ['crm', 'niemiecki', 'sprzedaz consultative', 'analiza rynku', 'excel', 'negocjacje'];
  return desired.filter((skill) => context.includes(skill) || !known.includes(skill));
};

const scoreReadiness = (normalizedCv: NormalizedCvSchema) => {
  let score = 35;
  if (normalizedCv.summary.length > 120) score += 15;
  if (normalizedCv.skills.length >= 6) score += 20;
  if (normalizedCv.experience.some((entry) => entry.bullets.length >= 3)) score += 15;
  if (normalizedCv.contact.email) score += 10;
  if (normalizedCv.contact.phone) score += 5;
  return Math.min(score, 100);
};

const scoreClarity = (normalizedCv: NormalizedCvSchema) => {
  let score = 40;
  if (normalizedCv.headline.length > 8) score += 15;
  if (normalizedCv.summary.length > 80) score += 15;
  if (normalizedCv.skills.length >= 5) score += 15;
  if (normalizedCv.experience.length > 0) score += 10;
  return Math.min(score, 100);
};

const scoreGrowth = (strongestSkills: string[], missingSkills: string[]) => {
  const base = 55 + strongestSkills.length * 4 - Math.min(missingSkills.length, 5) * 2;
  return Math.max(35, Math.min(base, 95));
};

const buildRoadmap = (
  variant: RoadmapVariant,
  normalizedCv: NormalizedCvSchema,
  strongestSkills: string[],
  missingSkills: string[],
  currentRole: string,
): CareerRoadmap => {
  const map = {
    conservative: {
      targetRole: currentRole,
      timeline: '0-3 miesiace',
      riskLevel: 'low' as const,
      reasoning: 'Bazujemy na obecnym profilu i porzadkujemy CV pod role, w ktorych kandydat ma juz wiarygodne dowody.',
      nextActions: [
        'Doprecyzuj ostatnie 3 wyniki zawodowe w liczbach.',
        'Uzupelnij sekcje kompetencji o narzedzia praktycznie uzywane w pracy.',
        'Zloz aplikacje na role zgodne z obecnym profilem w ciagu 14 dni.',
      ],
    },
    ambitious: {
      targetRole: `${currentRole} / Team Lead`,
      timeline: '4-9 miesiecy',
      riskLevel: 'medium' as const,
      reasoning: `Najmocniejsze atuty (${strongestSkills.slice(0, 3).join(', ')}) daja podstawe do wejscia poziom wyzej, ale trzeba domknac luki.` ,
      nextActions: [
        'Zdobadz jeden projekt lub case pokazujacy odpowiedzialnosc za wynik.',
        `Uzupelnij brakujace kompetencje: ${missingSkills.slice(0, 3).join(', ') || 'zarzadzanie stakeholderami'}.`,
        'Zaktualizuj LinkedIn i CV pod role z wieksza odpowiedzialnoscia.',
      ],
    },
    pivot: {
      targetRole: 'Rola pokrewna z nowej sciezki',
      timeline: '6-12 miesiecy',
      riskLevel: 'high' as const,
      reasoning: 'Sciezka pivot zaklada wykorzystanie transferowalnych umiejetnosci i stopniowe budowanie wiarygodnosci w nowej branzy.',
      nextActions: [
        'Wybierz jedna docelowa nisze i zbuduj mini-portfolio lub case study.',
        'Przetlumacz dotychczasowe sukcesy na jezyk nowej branzy.',
        'Uzupelnij kluczowe luki kompetencyjne jednym kursem i jednym projektem praktycznym.',
      ],
    },
  } satisfies Record<RoadmapVariant, Omit<CareerRoadmap, 'id' | 'variant'>>;

  return {
    id: uid(variant),
    variant,
    ...map[variant],
  };
};

const fallbackAnalysis = (normalizedCv: NormalizedCvSchema, additionalContext: string): CareerAnalysis => {
  const estimatedCurrentRole = inferRole(normalizedCv, additionalContext);
  const strongestSkills = normalizedCv.skills.slice(0, 6);
  const missingSkills = inferMissingSkills(normalizedCv, additionalContext).slice(0, 6);
  const readinessScore = scoreReadiness(normalizedCv);
  const profileClarity = scoreClarity(normalizedCv);
  const growthPotential = scoreGrowth(strongestSkills, missingSkills);
  const roadmaps = (['conservative', 'ambitious', 'pivot'] as RoadmapVariant[]).map((variant) =>
    buildRoadmap(variant, normalizedCv, strongestSkills, missingSkills, estimatedCurrentRole),
  );

  return {
    id: uid('analysis'),
    estimatedCurrentRole,
    seniorityLevel: seniorityFromExperience(normalizedCv),
    strongestSkills,
    missingSkills,
    profileClarity,
    growthPotential,
    readinessScore,
    roadmaps,
  };
};

export const computeCareerIntelligence = async (
  normalizedCv: NormalizedCvSchema,
  additionalContext: string,
): Promise<CareerAnalysis> => {
  const fallback = fallbackAnalysis(normalizedCv, additionalContext);
  if (!hasGeminiKey()) {
    return fallback;
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [
          {
            text: `Przeanalizuj profil zawodowy i zwroc tylko JSON. CV: ${JSON.stringify(normalizedCv)}. Kontekst: ${additionalContext}`,
          },
        ],
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedCurrentRole: { type: Type.STRING },
            seniorityLevel: { type: Type.STRING },
            strongestSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            profileClarity: { type: Type.NUMBER },
            growthPotential: { type: Type.NUMBER },
            readinessScore: { type: Type.NUMBER },
            roadmaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  variant: { type: Type.STRING },
                  targetRole: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  timeline: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                  nextActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['variant', 'targetRole', 'reasoning', 'timeline', 'riskLevel', 'nextActions'],
              },
            },
          },
          required: ['estimatedCurrentRole', 'seniorityLevel', 'strongestSkills', 'missingSkills', 'profileClarity', 'growthPotential', 'readinessScore', 'roadmaps'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}') as CareerAnalysis;
    const roadmaps = (parsed.roadmaps || fallback.roadmaps).map((roadmap, index) => ({
      ...fallback.roadmaps[index],
      ...roadmap,
      id: roadmap.id || uid(`roadmap-${index}`),
    }));

    return {
      ...fallback,
      ...parsed,
      id: parsed.id || fallback.id,
      profileClarity: Math.max(0, Math.min(100, Math.round(parsed.profileClarity ?? fallback.profileClarity))),
      growthPotential: Math.max(0, Math.min(100, Math.round(parsed.growthPotential ?? fallback.growthPotential))),
      readinessScore: Math.max(0, Math.min(100, Math.round(parsed.readinessScore ?? fallback.readinessScore))),
      roadmaps,
    };
  } catch {
    return fallback;
  }
};
