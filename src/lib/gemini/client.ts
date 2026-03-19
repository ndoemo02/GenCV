import { GoogleGenAI } from '@google/genai';

export const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') : undefined);
};

export const hasGeminiKey = () => {
  const key = getApiKey();
  return Boolean(key && key.length > 10 && key !== 'MY_GEMINI_API_KEY');
};

export const getGeminiClient = () => {
  const apiKey = getApiKey();
  
  // Debug log to verify if the key is loading
  console.log('[GEMINI] API Key exists:', !!apiKey, 'length:', apiKey?.length);

  if (!apiKey) {
    throw new Error('Brak VITE_GEMINI_API_KEY. Skonfiguruj klucz w pliku .env.local lub ustawieniach.');
  }

  // Wymuszamy platformę 'gemini', aby uniknąć błędnego użycia endpointów Vertex AI
  return new GoogleGenAI({ 
    apiKey,
    //@ts-ignore - platform is needed for Gemini Developer API in the new SDK
    platform: 'gemini' 
  } as any);
};
