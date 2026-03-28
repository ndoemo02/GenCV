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
  sidebar: rgb(0.98, 0.98, 0.99),
  text: rgb(0.08, 0.1, 0.15),          // Deep dark blue-grey
  secondaryText: rgb(0.45, 0.48, 0.52),
  accent: rgb(0.05, 0.2, 0.5),         // Deep professional blue
  border: rgb(0.94, 0.95, 0.97),
};

const wrapText = (text: string, maxWidth: number, font: any, fontSize: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(next, fontSize);
    if (width > maxWidth) {
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

  const sidebarWidth = 180;
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
  page.drawText(fullName.toUpperCase(), { x: contentX, y: cursorY, size: 24, font: boldFont, color: colors.text });
  cursorY -= 20;
  if (title) {
    page.drawText(title.toUpperCase(), { x: contentX, y: cursorY, size: 9, font: boldFont, color: colors.accent });
    cursorY -= 15;
  }
  
  // Header border
  page.drawLine({
    start: { x: contentX, y: cursorY - 5 },
    end: { x: contentX + contentWidth, y: cursorY - 5 },
    thickness: 2,
    color: colors.text
  });
  
  cursorY -= 45;

  // Sidebar Items
  let sidebarY = 780;
  
  // Contact info in sidebar
  page.drawText("KONTAKT", { x: horizontalMargin, y: sidebarY, size: 9, font: boldFont, color: colors.accent });
  sidebarY -= 18;
  
  const contactParts = contactLine.split(' | ');
  for (const part of contactParts) {
    const lines = wrapText(part, sidebarWidth - 1.8 * horizontalMargin, regularFont, 8.5);
    for (const line of lines) {
      if (sidebarY < 40) break;
      page.drawText(line, { x: horizontalMargin, y: sidebarY, size: 8.5, font: regularFont, color: colors.text });
      sidebarY -= 12;
    }
    sidebarY -= 4;
  }

  sidebarY -= 20;

  // Skills in sidebar
  if (document.skills?.length) {
    page.drawText("KOMPETENCJE", { x: horizontalMargin, y: sidebarY, size: 9, font: boldFont, color: colors.accent });
    sidebarY -= 18;
    for (const skill of document.skills) {
      const lines = wrapText(skill, sidebarWidth - 1.8 * horizontalMargin - 10, regularFont, 8.5);
      for (const [index, line] of lines.entries()) {
        if (sidebarY < 30) break;
        const prefix = index === 0 ? '• ' : '  ';
        page.drawText(`${prefix}${line}`, { x: horizontalMargin, y: sidebarY, size: 8.5, font: regularFont, color: colors.text });
        sidebarY -= 12;
      }
      sidebarY -= 3;
    }
  }

  // Main Content - Sections
  for (const section of displaySections) {
    if (cursorY < 120) {
      page = pdfDoc.addPage([595.28, 841.89]);
      drawLayout(page);
      cursorY = 800;
    }

    const sectionTitle = section.title.toUpperCase();
    page.drawText(sectionTitle, { x: contentX, y: cursorY, size: 11, font: boldFont, color: colors.secondaryText });
    page.drawLine({
      start: { x: contentX, y: cursorY - 4 },
      end: { x: contentX + contentWidth, y: cursorY - 4 },
      thickness: 1,
      color: colors.border
    });
    cursorY -= 24;

    for (const item of section.items) {
      const isHeader = item.includes(' | ');
      const isDate = !isHeader && (item.includes(' - ') || /^\w{3} \d{4}/.test(item));
      const isBullet = !isHeader && !isDate && section.title.toLowerCase().includes('doświadczenie');
      
      const fontSize = isHeader ? 11 : 9.5;
      const font = isHeader ? boldFont : regularFont;
      const color = isDate ? colors.accent : colors.text;
      const indent = isBullet ? 14 : 0;
      const maxWidth = contentWidth - indent;
      
      const textToRender = isDate ? item.toUpperCase() : item;
      const lines = wrapText(textToRender, maxWidth, font, fontSize);
      
      if (cursorY - (lines.length * 15) < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        drawLayout(page);
        cursorY = 800;
      }

      for (const [index, line] of lines.entries()) {
        const prefix = (isBullet && index === 0) ? '• ' : '';
        page.drawText(`${prefix}${line}`, { 
          x: contentX + (isBullet && index > 0 ? 8 : indent), 
          y: cursorY, 
          size: fontSize, 
          font: font, 
          color: color 
        });
        cursorY -= 14.5;
      }
      cursorY -= isHeader ? 2 : (isDate ? 6 : 8);
    }
    cursorY -= 20;
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

