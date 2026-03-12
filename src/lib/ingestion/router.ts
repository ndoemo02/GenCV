import type { IngestionResult, Step1Submission } from '../../types';
import { extractNormalizedCvFromAsset, extractNormalizedCvFromText, fallbackNormalizeCv } from '../../services/aiService';

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

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

const getFileKind = (mimeType: string, fileName: string) => {
  const lowerMime = mimeType.toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) return 'pdf';
  if (lowerMime.includes('wordprocessingml') || lowerName.endsWith('.docx')) return 'docx';
  if (lowerMime.includes('png') || lowerMime.includes('jpeg') || lowerMime.includes('jpg') || /\.(png|jpg|jpeg)$/.test(lowerName)) return 'image';
  return 'text';
};

export const routeIngestion = async ({ sourceFile, rawText, additionalContext }: Step1Submission): Promise<IngestionResult> => {
  const warnings: string[] = [];

  if (!sourceFile) {
    const mergedText = normalizeWhitespace(`${rawText}\n${additionalContext}`);
    const normalizedCv = mergedText ? await extractNormalizedCvFromText(mergedText, additionalContext) : fallbackNormalizeCv(additionalContext);
    return {
      source: 'text',
      rawText: mergedText,
      normalizedCv,
      confidence: mergedText.length > 120 ? 0.86 : 0.7,
      warnings: mergedText ? [] : ['Brak tresci CV, profil opiera sie glownie na dodatkowym kontekscie.'],
    };
  }

  const fileKind = getFileKind(sourceFile.mimeType, sourceFile.name);

  if (fileKind === 'pdf') {
    const decoded = decodeBase64Text(sourceFile.base64);
    if (!decoded) {
      warnings.push('PDF routed to multimodal fallback because local text extraction was unavailable.');
    }

    const normalizedCv = await extractNormalizedCvFromAsset(
      sourceFile,
      'Przetworz zalaczony PDF CV. Najpierw wyciagnij tresc dokumentu, a gdy to niemozliwe uzyj fallbacku multimodalnego.',
      decoded,
    );

    return {
      source: 'pdf',
      rawText: normalizeWhitespace(`${decoded}\n${rawText}\n${additionalContext}`),
      normalizedCv,
      confidence: decoded ? 0.84 : 0.72,
      warnings,
    };
  }

  if (fileKind === 'docx') {
    const decoded = decodeBase64Text(sourceFile.base64);
    if (!decoded) {
      warnings.push('DOCX extraction used parser fallback; enrich with pasted text for higher confidence.');
    }

    const normalizedCv = await extractNormalizedCvFromAsset(
      sourceFile,
      'Przetworz zalaczony plik DOCX CV i znormalizuj jego tresc do struktury kandydata.',
      decoded,
    );

    return {
      source: 'docx',
      rawText: normalizeWhitespace(`${decoded}\n${rawText}\n${additionalContext}`),
      normalizedCv,
      confidence: decoded ? 0.81 : 0.68,
      warnings,
    };
  }

  if (fileKind === 'image') {
    const normalizedCv = await extractNormalizedCvFromAsset(
      sourceFile,
      'Zinterpretuj zalaczony obraz CV przy uzyciu parsowania multimodalnego Gemini.',
      rawText,
    );

    return {
      source: 'image',
      rawText: normalizeWhitespace(`${rawText}\n${additionalContext}`),
      normalizedCv,
      confidence: 0.74,
      warnings: ['Image parsing can miss smaller labels. Review extracted dates and contact details.'],
    };
  }

  const mergedText = normalizeWhitespace(`${decodeBase64Text(sourceFile.base64)}\n${rawText}\n${additionalContext}`);
  const normalizedCv = await extractNormalizedCvFromText(mergedText, additionalContext);
  return {
    source: 'text',
    rawText: mergedText,
    normalizedCv,
    confidence: 0.76,
    warnings: [],
  };
};
