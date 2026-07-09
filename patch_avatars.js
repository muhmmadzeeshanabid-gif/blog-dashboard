const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('Client.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/app/(dashboard)/dashboard');
let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add loading to useAuth if not there
  if (content.includes('useAuth();') && !content.includes('loading')) {
    content = content.replace(/const\s+\{\s*user\s*,([^}]*)\}\s*=\s*useAuth\(\);/, (match, rest) => {
      changed = true;
      return `const { user, loading, ${rest.trim()} } = useAuth();`;
    });
  }

  // Hide the profile overlay during loading
  const target = '<div className={styles.topOverlay} ref={profileRef}>';
  const replacement = '<div className={styles.topOverlay} ref={profileRef} style={{ visibility: loading ? "hidden" : "visible" }}>';
  
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log('Updated', file);
  }
});
console.log('Total updated:', updatedCount);
