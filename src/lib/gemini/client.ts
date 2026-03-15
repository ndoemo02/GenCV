import { GoogleGenAI } from '@google/genai';

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') : undefined);
};

export const hasGeminiKey = () => {
  const key = getApiKey();
  return Boolean(key && key.length > 10 && key !== 'MY_GEMINI_API_KEY');
};

export const getGeminiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Brak VITE_GEMINI_API_KEY. Skonfiguruj klucz w pliku .env.local lub ustawieniach.');
  }

  return new GoogleGenAI({ apiKey });
};
