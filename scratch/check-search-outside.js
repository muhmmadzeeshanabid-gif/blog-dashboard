const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  if (code.includes('isSearchOpen')) {
    // Check if there is click outside or ref check for search
    const hasSearchRef = code.includes('searchRef');
    const hasSearchOutside = code.includes('setIsSearchOpen(false)');
    console.log(`${filePath}: hasSearchRef=${hasSearchRef}, hasSearchOutside=${hasSearchOutside}`);
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
