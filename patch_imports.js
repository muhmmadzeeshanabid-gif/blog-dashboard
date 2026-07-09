const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.jsx')) results.push(file);
  });
  return results;
}
const files = walk('src/app/(dashboard)/dashboard');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  if (content.includes('from "../layout"')) {
    content = content.replace(/from "\.\.\/layout"/g, 'from "../ClientLayout"');
    changed = true;
  }
  if (content.includes('from "../../layout"')) {
    content = content.replace(/from "\.\.\/\.\.\/layout"/g, 'from "../../ClientLayout"');
    changed = true;
  }
  if (content.includes('from "./layout"')) {
    content = content.replace(/from "\.\/layout"/g, 'from "./ClientLayout"');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, content);
    count++;
  }
});
console.log('Updated ' + count + ' files');
