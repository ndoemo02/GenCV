
const SECTION_HEADERS_REGEX = /(umiejetnosci|umiejętności|umiej|umeęno|kompetencje|doswiadczenie|doświadczenie|dosw|dośw|zawodowe|wyksztalcenie|wykształcenie|wykszt|edukacja|profil|podsumowanie|hobby|jezyki|języki|skills|experience|education|summary|languages|clausula|klauzula|contact|kontakt|urodzenia|urodz|miejscowosc|adres|hobby|zainteresowania|szkolenia|kursy)/i;

const sanitizeInlineText = (text) => {
  if (!text) return text;
  return text.trim().replace(/\s+/g, ' ');
};

const sanitizeNormalizedCv = (candidate) => {
  let fullName = sanitizeInlineText(candidate.fullName);
  
  if (fullName) {
    const fnLower = fullName.toLowerCase();
    const isHeader = SECTION_HEADERS_REGEX.test(fnLower);
    const isGarbage = fullName.length > 25 && !fullName.includes(' ');
    const isTooLong = fullName.length > 40;
    const isTooHeavyUppercase = (fullName.match(/[A-ZĄĘÓŚŁŻŹĆ]/g)?.length ?? 0) > fullName.length * 0.65 && fullName.length > 8;
    const hasForbiddenChars = /[©®™]/.test(fullName);
    const hasDigit = /\d/.test(fullName);
    const startsWithKeyword = /^(umiej|dosw|wyksz|edu|pro|zawod)/i.test(fullName);
    
    const containsSectionKeywords = /(doświadczenie|umiejętności|zawodowe|kompetencje|edukacja)/i.test(fnLower);
    
    if (isHeader || isGarbage || isTooLong || isTooHeavyUppercase || hasForbiddenChars || startsWithKeyword || hasDigit || containsSectionKeywords) {
      fullName = 'Imię i Nazwisko';
    }
  }

  return {
    ...candidate,
    fullName: fullName || 'Imię i Nazwisko',
  };
};

const testCases = [
  { fullName: "UMEĘNOŚĆ DOŚWIADCZENIE ZAWODOWE" }, // The "impossible" case from screenshot
  { fullName: "sia podnosi swoje kwalkac SPANACZ ŚL ©" }, // The subtitle from screenshot
  { fullName: "DOŚWIADCZENIE Zawodowe" },
  { fullName: "UMIEJĘTNOŚCI" },
  { fullName: "Jan Kowalski" },
  { fullName: "908" }, // A random number
  { fullName: "WWW.GENCY.PL" }, // URL
];

console.log("=== Testing Paranoid Sanitization Logic ===");
testCases.forEach(c => {
    const result = sanitizeNormalizedCv(c);
    console.log(`Input: [${c.fullName}] -> Result: [${result.fullName}]`);
});
