const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const INLINE_WHITESPACE = /[^\S\r\n]+/g;
const MAX_RAW_LENGTH = 15000;

export const PHONE_REGEX = /(\+?\d[\d\s()-]{7,}\d)/g;
export const EMAIL_REGEX = /[\w.-]+@[\w.-]+\.[a-z]{2,}/gi;

const normalizeLine = (line: string) =>
  line
    .normalize('NFC')
    .replace(CONTROL_CHARACTERS, '')
    // Usuń śmieci OCR na początku linii (typowe błędy Tesseract)
    .replace(/^[•·\*\-|_~=]+/, '')
    .replace(INLINE_WHITESPACE, ' ')
    .trim();

export const sanitizeRawCvText = (raw: string): string => {
  const normalized = String(raw ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARACTERS, '');

  const seen = new Set<string>();
  const lines: string[] = [];

  for (const line of normalized.split('\n')) {
    const clean = normalizeLine(line);
    if (!clean || clean.length < 2) {
      continue;
    }

    const key = clean.toLocaleLowerCase('pl-PL');
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    lines.push(clean);
  }

  return lines.join('\n').slice(0, MAX_RAW_LENGTH).trim();
};

const COMMON_TRASH = /^(umiejetnosci|umiejętności|umiej|umeęno|kompetencje|doswiadczenie|doświadczenie|dosw|dośw|zawodowe|wyksztalcenie|wykształcenie|wykszt|edukacja|profil|podsumowanie|hobby|jezyki|języki|skills|experience|education|summary|languages|clausula|klauzula|contact|kontakt|urodzenia|urodz|miejscowosc|adres|hobby|zainteresowania|szkolenia|kursy)([:\s•·|]|$)/i;

export const sanitizeInlineText = (raw: string | undefined): string | undefined => {
  if (!raw) {
    return undefined;
  }

  const sanitized = sanitizeRawCvText(raw)
    .replace(/\n+/g, ' ')
    .replace(COMMON_TRASH, '')
    // Usuń pozostałości Copyright i dziwne kody OCR
    .replace(/[©®™†‡]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
    
  return sanitized || undefined;
};

export const stripContactInfo = (text: string | undefined): string | undefined => {
  if (!text) return undefined;
  return text
    .replace(EMAIL_REGEX, '')
    .replace(PHONE_REGEX, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || undefined;
};

export const sanitizeStringList = (items: Array<string | undefined> | undefined, limit = 24): string[] => {
  if (!items?.length) {
    return [];
  }

  const seen = new Set<string>();
  const clean: string[] = [];

  for (const item of items) {
    const value = sanitizeInlineText(item);
    if (!value) {
      continue;
    }

    const key = value.toLocaleLowerCase('pl-PL');
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    clean.push(value);

    if (clean.length >= limit) {
      break;
    }
  }

  return clean;
};

export const joinSanitizedBlocks = (...parts: Array<string | undefined>): string =>
  sanitizeRawCvText(parts.filter(Boolean).join('\n'));
