import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ResumeData } from './aiService';

const normalizeForWinAnsi = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, 'l').replace(/Ł/g, 'L');
};

export const compileATSFriendlyPDF = async (visualCvBytes: Uint8Array, resumeData: ResumeData): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  // Embed the visual CV image
  let cvImage;
  try {
    cvImage = await pdfDoc.embedPng(visualCvBytes);
  } catch (e) {
    cvImage = await pdfDoc.embedJpg(visualCvBytes);
  }

  page.drawImage(cvImage, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });

  // Add invisible text for ATS (WinAnsi compatible)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const rawText = `
    Name: ${resumeData.name}
    Title: ${resumeData.title}
    Contact: ${resumeData.contact}
    Summary: ${resumeData.summary}
    Experience:
    ${resumeData.experience_bullets.join('\n')}
    Skills:
    ${resumeData.skills_list.join(', ')}
  `;

  const textContent = normalizeForWinAnsi(rawText);

  page.drawText(textContent, {
    x: 50,
    y: page.getHeight() - 50,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
    opacity: 0, // Invisible!
    lineHeight: 12,
  });

  return await pdfDoc.save();
};
