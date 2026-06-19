const fs = require('fs');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

const regex = /([^a-zA-Z0-9_-]h1[^\{]*\{[^}]+\}|[^a-zA-Z0-9_-]h2[^\{]*\{[^}]+\}|[^a-zA-Z0-9_-]h3[^\{]*\{[^}]+\}|[^a-zA-Z0-9_-]h4[^\{]*\{[^}]+\})/g;
let match;
while ((match = regex.exec(css)) !== null) {
  const block = match[0];
  if (block.includes('font-family')) {
    console.log(block);
    console.log('---');
  }
}
