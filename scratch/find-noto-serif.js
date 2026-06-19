const fs = require('fs');
const lines = fs.readFileSync('src/app/globals.css', 'utf8').split('\n');

lines.forEach((line, idx) => {
  if (line.includes('var(--font-noto-serif), serif')) {
    console.log(`Line ${idx + 1}:`);
    for (let i = Math.max(0, idx - 5); i < Math.min(lines.length, idx + 6); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
    console.log('---');
  }
});
