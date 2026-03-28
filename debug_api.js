const apiKey = "AIzaSyDZF6sGK_0JaZAXnRdQ0zTMeKSY1HQSQbU";
const modelsToTry = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.0-pro'
];

async function test() {
  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      });
      console.log(`Model: ${model}, Status: ${res.status}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.log('Error data:', JSON.stringify(err));
      }
    } catch (e) {
      console.log(`Model: ${model}, Network Error: ${e.message}`);
    }
  }
}

test();
