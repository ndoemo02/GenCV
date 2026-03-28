const apiKey = "AIzaSyDZF6sGK_0JaZAXnRdQ0zTMeKSY1HQSQbU";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Say OK' }] }]
  })
}).then(res => res.json().then(data => {
  console.log('Status:', res.status);
  console.log(JSON.stringify(data, null, 2));
})).catch(err => console.error(err));
