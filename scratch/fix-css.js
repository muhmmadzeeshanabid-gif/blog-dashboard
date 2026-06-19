const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

// Replace all occurrences of .site-content (specifically with dot) with .bwp-site-content
const updatedCss = css.replace(/\.site-content/g, '.bwp-site-content');

fs.writeFileSync('src/app/globals.css', updatedCss, 'utf8');
console.log('Successfully replaced .site-content with .bwp-site-content in globals.css');
