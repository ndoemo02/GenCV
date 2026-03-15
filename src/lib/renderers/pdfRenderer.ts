import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import regularFontUrl from '../../assets/fonts/Arial-Regular.ttf';
import boldFontUrl from '../../assets/fonts/Arial-Bold.ttf';
import type { StructuredCV } from '../../types';
import {
  getStructuredCvAtsKeywords,
  getStructuredCvContactLine,
  getStructuredCvDisplayName,
  getStructuredCvDisplaySections,
  getStructuredCvDisplayTitle,
} from '../cv/structured';
import { logPipeline } from '../debug/pipeline';

interface PdfRendererOptions {
  includeAtsLayer?: boolean;
}

const colors = {
  background: rgb(1, 1, 1),
  sidebar: rgb(0.97, 0.98, 1.0),
  text: rgb(0.12, 0.14, 0.18),
  secondaryText: rgb(0.4, 0.45, 0.5),
  accent: rgb(0.0, 0.35, 0.75),
  border: rgb(0.9, 0.92, 0.96),
};

const wrapText = (text: string, maxChars: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
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
  document: StructuredCV,
  options: PdfRendererOptions = {},
): Promise<Uint8Array> => {
  const renderStartedAt = performance.now();
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regularFontBytes, boldFontBytes] = await Promise.all([
    loadFontBytes(regularFontUrl),
    loadFontBytes(boldFontUrl),
  ]);

  const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: true });
  const boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: true });

  const fullName = getStructuredCvDisplayName(document);
  const title = getStructuredCvDisplayTitle(document);
  const contactLine = getStructuredCvContactLine(document) || 'FlowAssist Pro';
  const displaySections = getStructuredCvDisplaySections(document);
  const atsKeywords = getStructuredCvAtsKeywords(document);

  const sidebarWidth = 170;
  const horizontalMargin = 35;
  const contentX = sidebarWidth + horizontalMargin;
  const contentWidth = 595.28 - contentX - horizontalMargin;

  const drawLayout = (page: any) => {
    page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: page.getHeight(), color: colors.background });
    page.drawRectangle({ x: 0, y: 0, width: sidebarWidth, height: page.getHeight(), color: colors.sidebar });
    page.drawLine({
      start: { x: sidebarWidth, y: 0 },
      end: { x: sidebarWidth, y: page.getHeight() },
      thickness: 1,
      color: colors.border
    });
  };

  let page = pdfDoc.addPage([595.28, 841.89]);
  drawLayout(page);

  let cursorY = 780;

  // Header - Name and Title
  page.drawText(fullName.toUpperCase(), { x: contentX, y: cursorY, size: 22, font: boldFont, color: colors.text });
  cursorY -= 26;
  page.drawText(title, { x: contentX, y: cursorY, size: 12, font: regularFont, color: colors.accent });
  cursorY -= 45;

  // Sidebar Items
  let sidebarY = 780;
  
  // Contact info in sidebar
  page.drawText("KONTAKT", { x: horizontalMargin, y: sidebarY, size: 9, font: boldFont, color: colors.accent });
  sidebarY -= 16;
  
  const contactParts = contactLine.split(' | ');
  for (const part of contactParts) {
    const lines = wrapText(part, 22);
    for (const line of lines) {
      page.drawText(line, { x: horizontalMargin, y: sidebarY, size: 8.5, font: regularFont, color: colors.text });
      sidebarY -= 11;
    }
    sidebarY -= 4;
  }

  sidebarY -= 20;

  // Skills in sidebar
  if (document.skills?.length) {
    page.drawText("KOMPETENCJE", { x: horizontalMargin, y: sidebarY, size: 9, font: boldFont, color: colors.accent });
    sidebarY -= 16;
    for (const skill of document.skills) {
      const lines = wrapText(skill, 20);
      for (const line of lines) {
        page.drawText(`• ${line}`, { x: horizontalMargin, y: sidebarY, size: 8.5, font: regularFont, color: colors.secondaryText });
        sidebarY -= 11;
      }
      sidebarY -= 3;
    }
  }

  // Main Content - Summary
  if (document.summary) {
    page.drawText("PROFIL ZAWODOWY", { x: contentX, y: cursorY, size: 10, font: boldFont, color: colors.accent });
    cursorY -= 16;
    const summaryLines = wrapText(document.summary, 65);
    for (const line of summaryLines) {
      page.drawText(line, { x: contentX, y: cursorY, size: 9.5, font: regularFont, color: colors.text });
      cursorY -= 13;
    }
    cursorY -= 20;
  }

  // Main Content - Sections (Experience, Education etc)
  for (const section of displaySections) {
    // Check for space before section title
    if (cursorY < 120) {
      page = pdfDoc.addPage([595.28, 841.89]);
      drawLayout(page);
      cursorY = 800;
    }

    page.drawText(section.title.toUpperCase(), { x: contentX, y: cursorY, size: 10, font: boldFont, color: colors.accent });
    page.drawLine({
      start: { x: contentX, y: cursorY - 3 },
      end: { x: contentX + contentWidth, y: cursorY - 3 },
      thickness: 0.5,
      color: colors.border
    });
    cursorY -= 20;

    for (const item of section.items) {
      const lines = wrapText(item, 62);
      
      // Simple overflow check for current section item
      if (cursorY - (lines.length * 12) < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        drawLayout(page);
        cursorY = 800;
      }

      for (const line of lines) {
        page.drawText(line, { x: contentX, y: cursorY, size: 9.5, font: regularFont, color: colors.text });
        cursorY -= 12.5;
      }
      cursorY -= 6;
    }
    cursorY -= 14;
  }

  // Hidden ATS layer
  if (options.includeAtsLayer && atsKeywords.length) {
    const finalPage = pdfDoc.getPages()[pdfDoc.getPages().length - 1];
    finalPage.drawText(atsKeywords.join(' | '), {
      x: 10,
      y: 10,
      size: 5,
      font: regularFont,
      color: rgb(0, 0, 0),
      opacity: 0,
    });
  }

  const pdfBytes = await pdfDoc.save();
  logPipeline('pdf_render', {
    pdf_render_time: Math.round(performance.now() - renderStartedAt),
    pages: pdfDoc.getPages().length,
  });
  return pdfBytes;
};

