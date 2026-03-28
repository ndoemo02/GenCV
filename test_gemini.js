import fs from 'fs';
const apiKeyMatch = fs.readFileSync('.env.local', 'utf8').match(/VITE_GEMINI_API_KEY="([^"]+)"/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: 'Wypisz z tego Imię w formacie JSON. Tekst: Jan Kowalski' },
          { text: 'Schemat: { fullName: string }' }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  console.log(res.status, await res.text());
}
test();
