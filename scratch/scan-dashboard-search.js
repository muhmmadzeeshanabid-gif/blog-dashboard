const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const hasSearch = code.includes('isSearchOpen') || code.includes('searchQuery');
  const hasTopbar = code.includes('topbar') || code.includes('topIcons');
  if (hasTopbar) {
    console.log(`${filePath}: hasTopbar=${hasTopbar}, hasSearch=${hasSearch}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      checkFile(fullPath);
    }
  });
}

traverse('src/app/dashboard');
