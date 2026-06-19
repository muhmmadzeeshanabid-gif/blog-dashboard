const fs = require('fs');
const code = fs.readFileSync('src/app/dashboard/settings/SettingsClient.jsx', 'utf8');

const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('searchQuery') || line.includes('isSearchOpen')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
