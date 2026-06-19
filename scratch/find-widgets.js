const fs = require('fs');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

const queries = [
  'widget_bwp_content h4',
  'widget_bwp_meta',
  'widget_bwp_popular_post_num',
  'bwp-widget-title'
];

queries.forEach(query => {
  const regex = new RegExp(`([^\\n]*${query}[^{]*\\{[^}]+\\})`, 'g');
  let match;
  console.log(`=== Matches for: ${query} ===`);
  while ((match = regex.exec(css)) !== null) {
    console.log(match[0]);
    console.log('---');
  }
});
