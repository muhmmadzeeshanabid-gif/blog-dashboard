const fs = require('fs');
const code = fs.readFileSync('src/app/dashboard/settings/SettingsClient.jsx', 'utf8');

const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('fa-globe') || line.includes('fa-bell') || line.includes('fa-search')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
