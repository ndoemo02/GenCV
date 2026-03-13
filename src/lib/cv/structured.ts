import type { NormalizedCvSchema, StructuredCV, StructuredCVEducationEntry, StructuredCVExperienceEntry } from '../../types';
import { sanitizeInlineText, sanitizeRawCvText, sanitizeStringList } from './sanitize';

export interface StructuredCvValidationResult {
  valid: boolean;
  reasons: string[];
}

export interface StructuredCvDisplaySection {
  title: string;
  items: string[];
}

const PLACEHOLDER_PATTERN = /\b(lorem ipsum|placeholder|todo|tbd|n\/a|example cv|uzupelnij|brak danych|xxx+)\b/i;
const NON_ALPHANUMERIC = /[^\p{L}\p{N}]+/gu;

const suspiciousToken = (token: string) => {
  if (token.length < 4) {
    return false;
  }

  if (/^(.)\1{3,}$/u.test(token)) {
    return true;
  }

  if (/^[^\p{L}\p{N}]+$/u.test(token)) {
    return true;
  }

  if (token.length > 24 && !/[aeiouy¹êó]/iu.test(token)) {
    return true;
  }

  const symbolRatio = token.replace(/[\p{L}\p{N}]/gu, '').length / token.length;
  return symbolRatio > 0.35;
};

const collectCvText = (cv: StructuredCV): string[] => [
  cv.personal?.name,
  cv.personal?.title,
  cv.personal?.email,
  cv.personal?.phone,
  cv.personal?.location,
  cv.summary,
  ...(cv.skills ?? []),
  ...(cv.experience ?? []).flatMap((entry) => [entry.role, entry.company, entry.description, entry.start, entry.end]),
  ...(cv.education ?? []).flatMap((entry) => [entry.school, entry.degree, entry.start, entry.end]),
].filter((value): value is string => Boolean(value));

const repeatedTokenRatio = (text: string) => {
  const tokens = text
    .toLocaleLowerCase('pl-PL')
    .split(NON_ALPHANUMERIC)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  if (!tokens.length) {
    return 0;
  }

  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const repeated = Array.from(counts.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  return repeated / tokens.length;
};

const garbageTokenRatio = (text: string) => {
  const tokens = text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.length) {
    return 0;
  }

  return tokens.filter(suspiciousToken).length / tokens.length;
};

const sanitizeExperience = (normalizedCv: NormalizedCvSchema): StructuredCVExperienceEntry[] =>
  normalizedCv.experience
    .map((entry) => ({
      company: sanitizeInlineText(entry.company),
      role: sanitizeInlineText(entry.role),
      description: sanitizeInlineText(entry.bullets.join(' ')),
      start: sanitizeInlineText(entry.startDate),
      end: sanitizeInlineText(entry.endDate),
    }))
    .filter((entry) => entry.company || entry.role || entry.description);

const sanitizeEducation = (normalizedCv: NormalizedCvSchema): StructuredCVEducationEntry[] =>
  normalizedCv.education
    .map((entry) => ({
      school: sanitizeInlineText(entry.institution),
      degree: sanitizeInlineText(entry.degree),
      start: undefined,
      end: sanitizeInlineText(entry.endDate),
    }))
    .filter((entry) => entry.school || entry.degree);

export const buildStructuredCvFromNormalized = (normalizedCv: NormalizedCvSchema, additionalContext: string): StructuredCV => ({
  personal: {
    name: sanitizeInlineText(normalizedCv.fullName),
    title: sanitizeInlineText(additionalContext) || sanitizeInlineText(normalizedCv.headline),
    email: sanitizeInlineText(normalizedCv.contact.email),
    phone: sanitizeInlineText(normalizedCv.contact.phone),
    location: sanitizeInlineText(normalizedCv.contact.location),
  },
  summary: sanitizeInlineText(normalizedCv.summary),
  skills: sanitizeStringList(normalizedCv.skills, 20),
  experience: sanitizeExperience(normalizedCv),
  education: sanitizeEducation(normalizedCv),
});

export const countStructuredSections = (cv: StructuredCV) =>
  [cv.summary, cv.skills?.length, cv.experience?.length, cv.education?.length].filter(Boolean).length;

export const validateStructuredCv = (cv: StructuredCV): StructuredCvValidationResult => {
  const reasons: string[] = [];
  const text = sanitizeRawCvText(collectCvText(cv).join('\n'));

  if (!cv.personal?.name) {
    reasons.push('missing_name');
  }

  if (countStructuredSections(cv) < 2) {
    reasons.push('missing_sections');
  }

  if (text && PLACEHOLDER_PATTERN.test(text)) {
    reasons.push('hallucinated_placeholders');
  }

  if (repeatedTokenRatio(text) > 0.3) {
    reasons.push('repeated_tokens');
  }

  if (garbageTokenRatio(text) > 0.18) {
    reasons.push('ocr_garbage');
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
};

export const getStructuredCvDisplaySections = (cv: StructuredCV): StructuredCvDisplaySection[] => {
  const sections: StructuredCvDisplaySection[] = [];

  if (cv.summary) {
    sections.push({
      title: 'Profil',
      items: [cv.summary],
    });
  }

  if (cv.experience?.length) {
    sections.push({
      title: 'Doswiadczenie',
      items: cv.experience.flatMap((entry) => {
        const title = [entry.role, entry.company].filter(Boolean).join(' | ');
        const dateLine = [entry.start, entry.end].filter(Boolean).join(' - ');
        return [title, dateLine, entry.description].filter(Boolean) as string[];
      }),
    });
  }

  if (cv.skills?.length) {
    sections.push({
      title: 'Kompetencje',
      items: cv.skills,
    });
  }

  if (cv.education?.length) {
    sections.push({
      title: 'Edukacja',
      items: cv.education.flatMap((entry) => {
        const title = [entry.degree, entry.school].filter(Boolean).join(' | ');
        const dateLine = [entry.start, entry.end].filter(Boolean).join(' - ');
        return [title, dateLine].filter(Boolean) as string[];
      }),
    });
  }

  return sections.filter((section) => section.items.length > 0);
};

export const getStructuredCvContactLine = (cv: StructuredCV) =>
  [cv.personal?.email, cv.personal?.phone, cv.personal?.location].filter(Boolean).join(' | ');

export const getStructuredCvDisplayName = (cv: StructuredCV) => cv.personal?.name || 'Kandydat FlowAssist';

export const getStructuredCvDisplayTitle = (cv: StructuredCV) => cv.personal?.title || 'Specjalista';

export const getStructuredCvAtsKeywords = (cv: StructuredCV) =>
  sanitizeStringList([
    cv.personal?.title,
    ...(cv.skills ?? []),
    ...(cv.experience ?? []).flatMap((entry) => [entry.role, entry.company]),
  ], 24);

const parseLegacyContactLine = (contactLine: string | undefined) => {
  if (!contactLine) {
    return {};
  }

  const parts = contactLine.split('|').map((part) => part.trim()).filter(Boolean);
  return {
    email: parts.find((part) => /@/.test(part)),
    phone: parts.find((part) => /\d{7,}/.test(part.replace(/\D/g, ''))),
    location: parts.find((part) => !/@/.test(part) && !/\d{7,}/.test(part.replace(/\D/g, ''))),
  };
};

export const coerceStructuredCv = (value: unknown): StructuredCV => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const candidate = value as Record<string, unknown>;
  if ('personal' in candidate || 'experience' in candidate || 'education' in candidate || 'skills' in candidate) {
    return {
      personal: {
        name: sanitizeInlineText(candidate.personal && typeof candidate.personal === 'object' ? (candidate.personal as Record<string, unknown>).name as string | undefined : undefined),
        title: sanitizeInlineText(candidate.personal && typeof candidate.personal === 'object' ? (candidate.personal as Record<string, unknown>).title as string | undefined : undefined),
        email: sanitizeInlineText(candidate.personal && typeof candidate.personal === 'object' ? (candidate.personal as Record<string, unknown>).email as string | undefined : undefined),
        phone: sanitizeInlineText(candidate.personal && typeof candidate.personal === 'object' ? (candidate.personal as Record<string, unknown>).phone as string | undefined : undefined),
        location: sanitizeInlineText(candidate.personal && typeof candidate.personal === 'object' ? (candidate.personal as Record<string, unknown>).location as string | undefined : undefined),
      },
      summary: sanitizeInlineText(candidate.summary as string | undefined),
      skills: sanitizeStringList(Array.isArray(candidate.skills) ? candidate.skills.map((item) => String(item)) : []),
      experience: Array.isArray(candidate.experience)
        ? candidate.experience
            .map((item) => item as Record<string, unknown>)
            .map((entry) => ({
              company: sanitizeInlineText(entry.company as string | undefined),
              role: sanitizeInlineText(entry.role as string | undefined),
              description: sanitizeInlineText(entry.description as string | undefined),
              start: sanitizeInlineText(entry.start as string | undefined),
              end: sanitizeInlineText(entry.end as string | undefined),
            }))
            .filter((entry) => entry.company || entry.role || entry.description)
        : [],
      education: Array.isArray(candidate.education)
        ? candidate.education
            .map((item) => item as Record<string, unknown>)
            .map((entry) => ({
              school: sanitizeInlineText(entry.school as string | undefined),
              degree: sanitizeInlineText(entry.degree as string | undefined),
              start: sanitizeInlineText(entry.start as string | undefined),
              end: sanitizeInlineText(entry.end as string | undefined),
            }))
            .filter((entry) => entry.school || entry.degree)
        : [],
    };
  }

  const legacy = candidate as {
    fullName?: string;
    targetRole?: string;
    summary?: string;
    contactLine?: string;
    sections?: Array<{ title?: string; items?: string[] }>;
  };
  const contact = parseLegacyContactLine(legacy.contactLine);
  const skillSection = legacy.sections?.find((section) => /kompetencje|skills/i.test(section.title || ''));
  const experienceSection = legacy.sections?.find((section) => /doswiadczenie|experience/i.test(section.title || ''));

  const experience = (experienceSection?.items ?? []).reduce<StructuredCVExperienceEntry[]>((accumulator, item) => {
    const cleanItem = sanitizeInlineText(item);
    if (!cleanItem) {
      return accumulator;
    }

    const [role, company] = cleanItem.split('|').map((part) => part.trim());
    accumulator.push({
      role: role || undefined,
      company: company || undefined,
      description: cleanItem,
    });
    return accumulator;
  }, []);

  return {
    personal: {
      name: sanitizeInlineText(legacy.fullName),
      title: sanitizeInlineText(legacy.targetRole),
      email: sanitizeInlineText(contact.email),
      phone: sanitizeInlineText(contact.phone),
      location: sanitizeInlineText(contact.location),
    },
    summary: sanitizeInlineText(legacy.summary),
    skills: sanitizeStringList(skillSection?.items ?? []),
    experience,
    education: [],
  };
};
