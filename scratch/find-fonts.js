const fs = require('fs');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

// Find all occurrences of .bwp-serif-fonts and get their rules block
const regex = /\.bwp-serif-fonts[^{]*\{([^}]+)\}/g;
let match;
const results = [];
while ((match = regex.exec(css)) !== null) {
  const rule = match[0];
  if (rule.includes('font-family')) {
    results.push(rule);
  }
}

console.log('Matches with font-family:');
console.log(results.join('\n\n'));
