import { getApiKey } from './src/lib/gemini/client';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock import.meta.env
(global as any).import = { meta: { env: { VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY } } };

const apiKey = getApiKey();
console.log('API KEY EXTRACTED:', apiKey ? apiKey.substring(0, 10) + '...' : 'NULL');

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

const req = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{
      parts: [
        { text: 'Jesteś ekspertem HR. Zwróć obiekt JSON z danymi kandydata: Imię "Jan", umiejetnosci "A, B".' },
        { text: 'Oto wymagany schemat JSON: { fullName: string, skills: string[] }.' }
      ]
    }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  })
};

fetch(url, req)
  .then(r => r.json())
  .then(data => {
    console.log('SUCCESS:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
