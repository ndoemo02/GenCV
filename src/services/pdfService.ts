import type { StructuredCvDocument } from '../types';
import { renderStructuredPdf } from '../lib/renderers/pdfRenderer';

export const compileATSFriendlyPDF = async (structuredCv: StructuredCvDocument, includeAtsLayer = true) =>
  renderStructuredPdf(structuredCv, { includeAtsLayer });
