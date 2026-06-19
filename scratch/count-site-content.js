const fs = require('fs');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

const regex = /\.site-content/g;
let count = 0;
while (regex.exec(css) !== null) {
  count++;
}
console.log('Number of occurrences of .site-content:', count);
