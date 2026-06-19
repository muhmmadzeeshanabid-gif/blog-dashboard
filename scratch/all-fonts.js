const fs = require('fs');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

// Find all rule blocks containing font-family and print the selectors and the font-family value
const regex = /([^{]+)\{([^}]+)\}/g;
let match;
console.log('=== All rules with font-family in globals.css ===');
while ((match = regex.exec(css)) !== null) {
  const selectors = match[1].trim();
  const body = match[2].trim();
  if (body.includes('font-family')) {
    const fontLine = body.split('\n').find(line => line.includes('font-family')).trim();
    console.log(`${selectors} => ${fontLine}`);
  }
}
