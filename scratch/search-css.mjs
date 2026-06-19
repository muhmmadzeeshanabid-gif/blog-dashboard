import fs from 'node:fs';
import path from 'node:path';

const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');

function run() {
  const content = fs.readFileSync(cssPath, 'utf-8');
  const lines = content.split('\n');

  console.log("\n--- Searching for 'user-font' in globals.css ---");
  let found = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('user-font')) {
      console.log(`Line ${i + 1}: ${lines[i].trim()}`);
      found++;
    }
  }
  console.log(`Found ${found} occurrences.`);
}

run();
