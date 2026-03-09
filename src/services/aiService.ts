import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

// We need to create a new instance of GoogleGenAI right before making an API call
// to ensure it uses the most up-to-date API key from the dialog.
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
};

export interface ResumeData {
  name: string;
  title: string;
  contact: string;
  summary: string;
  experience_bullets: string[];
  skills_list: string[];
}

export const generateResumeData = async (text: string): Promise<ResumeData> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Summarize this experience into very brief, impactful bullet points suitable for a minimalist infographic resume. Output strictly as JSON with keys: name, title, contact, summary, experience_bullets, skills_list.\n\n${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          title: { type: Type.STRING },
          contact: { type: Type.STRING },
          summary: { type: Type.STRING },
          experience_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          skills_list: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["name", "title", "contact", "summary", "experience_bullets", "skills_list"],
      },
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    },
  });

  const jsonStr = response.text?.trim() || "{}";
  return JSON.parse(jsonStr) as ResumeData;
};

export const generateHeadshot = async (photoBase64: string, mimeType: string): Promise<string | null> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: {
      parts: [
        { inlineData: { data: photoBase64, mimeType } },
        { text: "Transform this photo into a professional corporate headshot, wearing business attire, against a clean studio background. Maintain exact facial features (character consistency)." }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data; // Base64 string
    }
  }
  return null;
};

export const generateVisualCV = async (resumeData: ResumeData, headshotBase64: string | null): Promise<string | null> => {
  const ai = getAiClient();
  const parts: any[] = [];
  
  if (headshotBase64) {
    parts.push({ inlineData: { data: headshotBase64, mimeType: "image/png" } });
  }
  
  const jsonText = JSON.stringify(resumeData, null, 2);
  parts.push({ text: `Design a clean, modern, minimalist A4 visual resume. Use a navy-blue and white palette. Perfectly render this text: ${jsonText}. Place the headshot in the top left. Output as high-res PNG.` });

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: "2K" // 2K for high-res A4
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return part.inlineData.data; // Base64 string
    }
  }
  return null;
};
