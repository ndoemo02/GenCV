import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import regularFontUrl from '../../assets/fonts/Arial-Regular.ttf';
import boldFontUrl from '../../assets/fonts/Arial-Bold.ttf';
import type { StructuredCvDocument } from '../../types';

interface PdfRendererOptions {
  includeAtsLayer?: boolean;
}

const wrapText = (text: string, maxChars: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) {
        lines.push(current);
      }
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
};

const loadFontBytes = async (fontUrl: string) => {
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(`Nie udalo sie zaladowac fontu PDF: ${fontUrl}`);
  }

  return new Uint8Array(await response.arrayBuffer());
};

export const renderStructuredPdf = async (
  document: StructuredCvDocument,
  options: PdfRendererOptions = {},
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regularFontBytes, boldFontBytes] = await Promise.all([
    loadFontBytes(regularFontUrl),
    loadFontBytes(boldFontUrl),
  ]);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(regularFontBytes, { subset: true });
  const bold = await pdfDoc.embedFont(boldFontBytes, { subset: true });

  page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: page.getHeight(), color: rgb(0.04, 0.05, 0.07) });
  page.drawRectangle({ x: 36, y: 36, width: page.getWidth() - 72, height: page.getHeight() - 72, borderColor: rgb(0.25, 0.25, 0.3), borderWidth: 1 });
  page.drawText(document.fullName, { x: 56, y: 780, size: 24, font: bold, color: rgb(0.95, 0.95, 0.95) });
  page.drawText(document.targetRole, { x: 56, y: 754, size: 12, font, color: rgb(0.65, 0.67, 0.72) });
  page.drawText(document.contactLine || 'FlowAssist Career', { x: 56, y: 736, size: 10, font, color: rgb(0.78, 0.8, 0.84) });

  let cursorY = 700;
  for (const line of wrapText(document.summary, 80)) {
    page.drawText(line, { x: 56, y: cursorY, size: 10, font, color: rgb(0.88, 0.88, 0.9) });
    cursorY -= 14;
  }

  cursorY -= 10;

  for (const section of document.sections) {
    page.drawText(section.title.toUpperCase(), { x: 56, y: cursorY, size: 11, font: bold, color: rgb(0.96, 0.96, 0.96) });
    cursorY -= 18;

    for (const item of section.items) {
      for (const line of wrapText(item, 78)) {
        page.drawText(line, { x: 68, y: cursorY, size: 10, font, color: rgb(0.82, 0.84, 0.88) });
        cursorY -= 13;
      }
      cursorY -= 4;
    }

    cursorY -= 8;
    if (cursorY < 100) {
      break;
    }
  }

  if (options.includeAtsLayer) {
    page.drawText(document.atsKeywords.join(' | '), {
      x: 20,
      y: 20,
      size: 8,
      font,
      color: rgb(0, 0, 0),
      opacity: 0,
    });
  }

  return pdfDoc.save();
};
