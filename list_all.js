const apiKey = "AIzaSyDZF6sGK_0JaZAXnRdQ0zTMeKSY1HQSQbU";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log(data.models.map(m => ({
      name: m.name,
      supportedMethods: m.supportedGenerationMethods
    })));
  })
  .catch(err => console.error(err));
