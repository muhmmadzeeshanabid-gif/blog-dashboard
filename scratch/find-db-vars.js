const fs = require('fs');
const css = fs.readFileSync('src/app/dashboard/dashboard.module.css', 'utf8');

const lines = css.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('--dashboard-') || line.includes(':root')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
