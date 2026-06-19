const fs = require('fs');
const code = fs.readFileSync('src/app/dashboard/media/MediaClient.jsx', 'utf8');

const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('addEventListener') || line.includes('mousedown')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
