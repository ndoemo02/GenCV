import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Tesseract from 'tesseract.js';
import type { UploadedAsset } from '../../types';
import { sanitizeRawCvText } from '../cv/sanitize';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface OcrResult {
  rawText: string;
  confidence: number;
}

const MIN_TEXT_PDF_LENGTH = 500;
const MIN_VALID_CV_LENGTH = 300;
const OCR_LANGUAGES = 'pol+eng';
const MAX_OCR_PAGES = 3;

export class CvParsingError extends Error {
  constructor(message = 'Nie uda³o siê odczytaæ treœci CV. Spróbuj wrzuciæ oryginalny PDF lub wyraŸniejszy skan.') {
    super(message);
    this.name = 'CvParsingError';
  }
}

const base64ToUint8Array = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const base64ToBlob = (base64: string, mimeType: string) => new Blob([base64ToUint8Array(base64)], { type: mimeType });

const recognizeImage = async (imageSource: string) => {
  const result = await Tesseract.recognize(imageSource, OCR_LANGUAGES);
  return {
    text: sanitizeRawCvText(result.data.text || ''),
    confidence: Number.isFinite(result.data.confidence) ? result.data.confidence / 100 : 0,
  };
};

const ocrPdfAsset = async (asset: UploadedAsset): Promise<OcrResult> => {
  const pdf = await getDocument({ data: base64ToUint8Array(asset.base64) }).promise;
  const texts: string[] = [];
  const confidences: number[] = [];

  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, MAX_OCR_PAGES); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new CvParsingError();
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const recognized = await recognizeImage(canvas.toDataURL('image/png'));
    if (recognized.text) {
      texts.push(recognized.text);
      confidences.push(recognized.confidence);
    }
  }

  const rawText = sanitizeRawCvText(texts.join('\n'));
  const confidence = confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : 0;
  console.log('CV RAW TEXT LENGTH', rawText.length);
  console.log('OCR CONFIDENCE', confidence);
  return { rawText, confidence };
};

export const extractPdfText = async (asset: UploadedAsset) => {
  const pdf = await getDocument({ data: base64ToUint8Array(asset.base64) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();

    if (text) {
      pages.push(text);
    }
  }

  const rawText = sanitizeRawCvText(pages.join('\n'));
  console.log('CV RAW TEXT LENGTH', rawText.length);
  return {
    rawText,
    isScanned: rawText.length < MIN_TEXT_PDF_LENGTH,
  };
};

export const runOcr = async (asset: UploadedAsset): Promise<OcrResult> => {
  if (asset.mimeType.toLowerCase().includes('pdf') || asset.name.toLowerCase().endsWith('.pdf')) {
    return ocrPdfAsset(asset);
  }

  const blob = base64ToBlob(asset.base64, asset.mimeType);
  const objectUrl = URL.createObjectURL(blob);

  try {
    const result = await recognizeImage(objectUrl);
    console.log('CV RAW TEXT LENGTH', result.text.length);
    console.log('OCR CONFIDENCE', result.confidence);
    return {
      rawText: result.text,
      confidence: result.confidence,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const assertCvText = (rawText: string) => {
  if (sanitizeRawCvText(rawText).length < MIN_VALID_CV_LENGTH) {
    throw new CvParsingError();
  }
};

