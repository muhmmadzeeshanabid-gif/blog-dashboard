const fs = require('fs');
const lines = fs.readFileSync('src/app/globals.css', 'utf8').split('\n');

lines.forEach((line, idx) => {
  if (line.trim() === 'body {') {
    console.log(`Line ${idx + 1}:`);
    for (let i = Math.max(0, idx - 2); i < Math.min(lines.length, idx + 10); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
    console.log('---');
  }
});
