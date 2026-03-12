import { GoogleGenAI } from '@google/genai';

export const hasGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key !== 'MY_GEMINI_API_KEY');
};

export const getGeminiClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Brak GEMINI_API_KEY.');
  }

  return new GoogleGenAI({ apiKey });
};
