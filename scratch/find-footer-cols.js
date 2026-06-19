const fs = require('fs');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

const regex = /\.bwp-footer-widgets-col[^{]*\{([^}]+)\}/g;
let match;
while ((match = regex.exec(css)) !== null) {
  console.log(match[0]);
  console.log('---');
}
