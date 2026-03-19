import type { IngestionResult, Step1Submission } from '../../types';
import { extractNormalizedCvFromAsset, extractNormalizedCvFromText } from '../../services/aiService';
import { logPipeline } from '../debug/pipeline';
import { joinSanitizedBlocks, sanitizeRawCvText } from '../cv/sanitize';
import { assertCvText, extractPdfText, runOcr } from './extractors';

const getFileKind = (mimeType: string, fileName: string) => {
  const lowerMime = mimeType.toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) return 'pdf';
  if (lowerMime.includes('wordprocessingml') || lowerName.endsWith('.docx')) return 'docx';
  if (lowerMime.startsWith('image/') || /\.(png|jpg|jpeg)$/.test(lowerName)) return 'image';
  return 'text';
};

export const routeIngestion = async ({ sourceFile, rawText, additionalContext }: Step1Submission): Promise<IngestionResult> => {
  const warnings: string[] = [];
  const rawCombined = [rawText, additionalContext].filter(Boolean).join('\n');
  const sanitizedInput = sanitizeRawCvText(rawCombined);

  logPipeline('ingestion_input', {
    raw_length: rawCombined.length,
    sanitized_length: sanitizedInput.length,
  });

  if (!sourceFile) {
    if (!sanitizedInput) {
      throw new Error('Nie uda³o siê odczytaæ treci CV. Spróbuj wrzuciæ oryginalny PDF lub wyraniejszy skan.');
    }

    const normalizedCv = await extractNormalizedCvFromText(sanitizedInput, additionalContext);
    return {
      source: 'text',
      rawText: sanitizedInput,
      normalizedCv,
      confidence: sanitizedInput.length > 120 ? 0.86 : 0.7,
      warnings: [],
    };
  }

  const fileKind = getFileKind(sourceFile.mimeType, sourceFile.name);

  if (fileKind === 'pdf') {
    const extractedPdf = await extractPdfText(sourceFile);
    console.log('CV RAW TEXT LENGTH', extractedPdf.rawText.length);

    let extractedText = extractedPdf.rawText;
    let confidence = extractedPdf.isScanned ? 0 : 0.92;

    if (extractedPdf.isScanned) {
      warnings.push('PDF wygl¹da na skan lub layout-heavy dokument, uruchomiono OCR.');
      const ocr = await runOcr(sourceFile);
      extractedText = ocr.rawText;
      confidence = ocr.confidence;
    }

    assertCvText(extractedText);
    const mergedText = joinSanitizedBlocks(extractedText, rawText, additionalContext);
    
    let normalizedCv;
    if (extractedPdf.isScanned) {
      normalizedCv = await extractNormalizedCvFromAsset(sourceFile, '', mergedText, additionalContext);
    } else {
      normalizedCv = await extractNormalizedCvFromText(mergedText, additionalContext);
    }

    return {
      source: 'pdf',
      rawText: mergedText,
      normalizedCv,
      confidence,
      warnings,
    };
  }

  if (fileKind === 'image') {
    const ocr = await runOcr(sourceFile);
    assertCvText(ocr.rawText);
    const mergedText = joinSanitizedBlocks(ocr.rawText, rawText, additionalContext);
    const normalizedCv = await extractNormalizedCvFromAsset(sourceFile, '', mergedText, additionalContext);

    return {
      source: 'image',
      rawText: mergedText,
      normalizedCv,
      confidence: ocr.confidence,
      warnings,
    };
  }

  if (fileKind === 'docx') {
    const mergedText = joinSanitizedBlocks(sanitizedInput, additionalContext);
    const normalizedCv = await extractNormalizedCvFromAsset(
      sourceFile,
      'Przetworz zalaczony plik DOCX CV i znormalizuj jego tresc do struktury kandydata.',
      mergedText,
      additionalContext,
    );

    return {
      source: 'docx',
      rawText: mergedText,
      normalizedCv,
      confidence: mergedText ? 0.81 : 0.73,
      warnings,
    };
  }

  const mergedText = joinSanitizedBlocks(sanitizedInput, rawText, additionalContext);
  const normalizedCv = await extractNormalizedCvFromText(mergedText, additionalContext);
  return {
    source: 'text',
    rawText: mergedText,
    normalizedCv,
    confidence: 0.76,
    warnings: [],
  };
};
