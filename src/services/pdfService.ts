import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ResumeData } from './aiService';

export const compileATSFriendlyPDF = async (visualCvBase64: string, resumeData: ResumeData): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  // Embed the visual CV image
  let cvImage;
  try {
    cvImage = await pdfDoc.embedPng(visualCvBase64);
  } catch (e) {
    cvImage = await pdfDoc.embedJpg(visualCvBase64);
  }

  page.drawImage(cvImage, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });

  // Add invisible text for ATS
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const textContent = `
    Name: ${resumeData.name}
    Title: ${resumeData.title}
    Contact: ${resumeData.contact}
    Summary: ${resumeData.summary}
    Experience:
    ${resumeData.experience_bullets.join('\n')}
    Skills:
    ${resumeData.skills_list.join(', ')}
  `;

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
