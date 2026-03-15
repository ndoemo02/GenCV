
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('No GEMINI_API_KEY found');
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const models = await genAI.models.list();
    console.log('Available models:');
    models.models.forEach(m => {
      console.log(`- ${m.name} (methods: ${m.supportedMethods.join(', ')})`);
    });
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

run();
