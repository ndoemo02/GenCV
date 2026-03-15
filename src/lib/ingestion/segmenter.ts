import type { EducationEntry, ExperienceEntry, NormalizedCvSchema, ParsedCvSectionEducation, ParsedCvSectionExperience, ParsedCvSections } from '../../types';
import { sanitizeInlineText, sanitizeRawCvText, sanitizeStringList } from '../cv/sanitize';

const SECTION_PATTERNS: Array<{ key: keyof ParsedCvSections; pattern: RegExp }> = [
  { key: 'profileSummary', pattern: /^(profil|o mnie|podsumowanie|profil zawodowy)$/i },
  { key: 'experience', pattern: /^(do\u015bwiadczenie|doswiadczenie|do\u015bwiadczenie zawodowe|doswiadczenie zawodowe|historia zatrudnienia)$/i },
  { key: 'skills', pattern: /^(umiej\u0119tno\u015bci|umiejetnosci|kompetencje|skillset|skills)$/i },
  { key: 'languages', pattern: /^(j\u0119zyki|jezyki|languages)$/i },
  { key: 'education', pattern: /^(wykszta\u0142cenie|wyksztalcenie|edukacja|education)$/i },
  { key: 'courses', pattern: /^(kursy|certyfikaty|szkolenia|courses)$/i },
];

const MONTH_NAMES = '(sty|lut|mar|kwi|maj|cze|lip|sie|wrz|pa\u017a|paz|lis|gru|jan|feb|apr|jun|jul|aug|sep|oct|nov|dec)';
const DATE_RANGE_PATTERN = new RegExp(`((?:${MONTH_NAMES})\\s+\\d{4}|\\d{2}[./-]\\d{4}|\\d{4})\\s*(?:-|\u2013|do|to)\\s*((?:${MONTH_NAMES})\\s+\\d{4}|obecnie|present|aktualnie|\\d{2}[./-]\\d{4}|\\d{4})`, 'i');
const YEAR_PATTERN = /(?:19|20)\d{2}/g;
const SPLIT_PATTERN = /[,|;\u2022]/;

const uniqueLines = (rawText: string) =>
  sanitizeRawCvText(rawText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const detectSection = (line: string) => SECTION_PATTERNS.find((entry) => entry.pattern.test(line))?.key;

const HEADER_KEYWORDS_BLACKLIST = /(umiejetnosci|umiej\u0119tno\u015bci|doswiadczenie|do\u015bwiadczenie|wyksztalcenie|wykszta\u0142cenie|profil|podsumowanie|hobby|jezyki|j\u0119zyki|skills|experience|education|summary|languages|clausula|klauzula|contact|kontakt|urodzenia|urodz|miejscowosc|adres|zainteresowania|szkolenia|kursy)/i;

const collectHeader = (lines: string[]) => {
  const top = lines.slice(0, 10);
  const email = top.find((line) => /@/.test(line));
  const phone = top.find((line) => /\+?\d[\d\s()-]{7,}\d/.test(line));
  const location = top.find((line) =>
    /(warszawa|krak\u00f3w|krakow|wroc\u0142aw|wroclaw|gda\u0144sk|gdansk|pozna\u0144|poznan|berlin|remote|polska|poland|piekary|\u015bl\u0105sk)/i.test(line)
  );

  const nameCandidate = top.find((line) =>
    /^[A-Z][a-z\u00f3\u0105\u0107\u0119\u0142\u0144\u015b\u017a\u017c][\p{L}'-]+(?:\s+[A-Z][a-z\u00f3\u0105\u0107\u0119\u0142\u0144\u015b\u017a\u017c][\p{L}'-]+){1,3}$/u.test(line) &&
    !HEADER_KEYWORDS_BLACKLIST.test(line)
  );

  const name =
    nameCandidate ||
    top.find(
      (line) =>
        /^[\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+){1,3}$/u.test(line) &&
        !HEADER_KEYWORDS_BLACKLIST.test(line) &&
        line.length < 40,
    );

  const title = top.find(
    (line) =>
      line !== name &&
      !/@/.test(line) &&
      !/\d/.test(line) &&
      line.length > 8 &&
      line.length < 80 &&
      !HEADER_KEYWORDS_BLACKLIST.test(line),
  );
  return { name, title, email, phone, location };
};

const splitListItems = (lines: string[]) =>
  sanitizeStringList(
    lines.flatMap((line) => line.split(SPLIT_PATTERN).map((item) => item.trim())),
    20,
  );

const extractTimeline = (line: string) => {
  const range = line.match(DATE_RANGE_PATTERN);
  if (range) {
    return {
      start: sanitizeInlineText(range[1]),
      end: sanitizeInlineText(range[2]),
    };
  }

  const years = line.match(YEAR_PATTERN) ?? [];
  if (years.length >= 2) {
    return {
      start: years[0],
      end: years[1],
    };
  }

  return {
    start: undefined,
    end: undefined,
  };
};

const normalizeRoleCompany = (line: string) => {
  const clean = sanitizeInlineText(line)
    ?.replace(DATE_RANGE_PATTERN, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!clean) {
    return { role: undefined, company: undefined };
  }

  if (clean.includes('|')) {
    const [role, company] = clean.split('|').map((part) => part.trim());
    return { role: sanitizeInlineText(role), company: sanitizeInlineText(company) };
  }

  if (clean.includes(' @ ')) {
    const [role, company] = clean.split(' @ ').map((part) => part.trim());
    return { role: sanitizeInlineText(role), company: sanitizeInlineText(company) };
  }

  if (clean.includes(' - ')) {
    const [role, company] = clean.split(' - ').map((part) => part.trim());
    return { role: sanitizeInlineText(role), company: sanitizeInlineText(company) };
  }

  return { role: sanitizeInlineText(clean), company: undefined };
};

const buildExperience = (lines: string[]): ParsedCvSectionExperience[] => {
  const entries: ParsedCvSectionExperience[] = [];
  let current: ParsedCvSectionExperience | null = null;

  for (const line of lines) {
    if (line.length < 3) {
      continue;
    }

    const timeline = extractTimeline(line);
    const looksLikeHeader = Boolean(timeline.start || /\|| @ | - /.test(line));

    if (looksLikeHeader) {
      if (current && (current.role || current.company || current.description)) {
        entries.push(current);
      }

      const roleCompany = normalizeRoleCompany(line);
      current = {
        role: roleCompany.role,
        company: roleCompany.company,
        start: timeline.start,
        end: timeline.end,
      };
      continue;
    }

    if (!current) {
      current = { description: sanitizeInlineText(line) };
      continue;
    }

    current.description = [current.description, sanitizeInlineText(line)]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  if (current && (current.role || current.company || current.description)) {
    entries.push(current);
  }

  return entries.map((entry) => ({
    company: sanitizeInlineText(entry.company),
    role: sanitizeInlineText(entry.role),
    bullets: entry.description ? [sanitizeInlineText(entry.description)] : [],
    start: sanitizeInlineText(entry.start),
    end: sanitizeInlineText(entry.end),
  }));
}

const buildEducation = (lines: string[]): ParsedCvSectionEducation[] => {
  const items: ParsedCvSectionEducation[] = [];

  for (const line of lines) {
    const timeline = extractTimeline(line);
    const clean = sanitizeInlineText(line)
      ?.replace(DATE_RANGE_PATTERN, '')
      .trim();
    if (!clean) {
      continue;
    }

    const [degree, school] = clean.split(/\|| - /).map((part) => part.trim());
    items.push({
      degree: sanitizeInlineText(degree),
      school: sanitizeInlineText(school || degree),
      start: timeline.start,
      end: timeline.end,
    });
  }

  return items;
};

export const segmentCvText = (
  rawText: string,
): ParsedCvSections & { header: ReturnType<typeof collectHeader> } => {
  const lines = uniqueLines(rawText);
  const sections: ParsedCvSections = {
    profileSummary: '',
    experience: [],
    skills: [],
    education: [],
    languages: [],
    courses: [],
  };
  const header = collectHeader(lines);

  let activeSection: keyof ParsedCvSections | null = null;
  const buckets: Record<string, string[]> = {
    profileSummary: [],
    experience: [],
    skills: [],
    education: [],
    languages: [],
    courses: [],
  };

  for (const line of lines) {
    const section = detectSection(line);
    if (section) {
      activeSection = section;
      continue;
    }

    if (activeSection) {
      buckets[activeSection].push(line);
    }
  }

  sections.profileSummary = sanitizeInlineText(buckets.profileSummary.join(' ')) || '';
  sections.experience = buildExperience(buckets.experience);
  sections.skills = splitListItems(buckets.skills);
  sections.education = buildEducation(buckets.education);
  sections.languages = splitListItems(buckets.languages);
  sections.courses = splitListItems(buckets.courses);

  if (!sections.profileSummary) {
    sections.profileSummary =
      sanitizeInlineText(
        lines
          .slice(0, 6)
          .filter(
            (line) =>
              line !== header.name &&
              line !== header.title &&
              !/@/.test(line) &&
              !/\d{7,}/.test(line),
          )
          .join(' '),
      ) || '';
  }

  if (!sections.skills.length) {
    sections.skills = splitListItems(
      lines.filter((line) =>
        /\b(react|typescript|sprzeda\u017c|sprzedaz|crm|excel|angielski|niemiecki|autocad|spawanie|negocjacje|obs\u0142uga klienta|obsluga klienta|mig|tig|spawacz|obr\u00f3bka stali|elektronarz\u0119dzia)\b/i.test(
          line,
        ),
      ),
    );
  }

  return {
    ...sections,
    header,
  };
};

export const buildNormalizedCvFromSegments = (
  rawText: string,
  additionalContext = '',
): NormalizedCvSchema => {
  const sanitized = sanitizeRawCvText(rawText);
  const segmented = segmentCvText(sanitized);
  const summary =
    segmented.profileSummary || sanitizeInlineText(additionalContext) || sanitized.slice(0, 280);
  const experience: ExperienceEntry[] = segmented.experience.length
    ? segmented.experience.map((entry: any) => ({
        company: entry.company || 'Firma do uzupelnienia',
        role: entry.role || 'Stanowisko do uzupelnienia',
        startDate: entry.start,
        endDate: entry.end,
        bullets: entry.bullets || [],
      }))
    : [];
  const education: EducationEntry[] = segmented.education.map((entry) => ({
    institution: entry.school || 'Szkola do uzupelnienia',
    degree: entry.degree || 'Kierunek do uzupelnienia',
    endDate: entry.end,
  }));

  return {
    language: /[\u0105\u0119\u00f3\u015b\u0142\u017c\u017a\u0107\u0144\u0104\u0118\u00d3\u015a\u0141\u017b\u0179\u0106\u0143]/i.test(
      sanitized,
    )
      ? 'pl'
      : 'en',
    fullName: segmented.header.name || 'Imi\u0119 i Nazwisko',
    headline:
      sanitizeInlineText(additionalContext) ||
      segmented.header.title ||
      segmented.experience[0]?.role ||
      'Specjalista',
    summary,
    contact: {
      email: segmented.header.email,
      phone: segmented.header.phone,
      location: segmented.header.location,
      links: [],
    },
    skills: sanitizeStringList([...segmented.skills, ...segmented.languages], 20),
    experience,
    education,
    certifications: sanitizeStringList(segmented.courses, 10),
  };
};
