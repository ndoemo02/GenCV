
import fs from 'fs';
const content = fs.readFileSync('src/lib/ingestion/segmenter.ts', 'utf8');
console.log(content);
