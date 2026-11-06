const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full, fileList);
    else if (file.endsWith('.jsx') || file.endsWith('.js')) fileList.push(full);
  }
  return fileList;
}

const rootDir = path.join(__dirname, '..');
const targetDirs = [
  path.join(rootDir, 'web', 'src'),
  path.join(rootDir, 'src')
];

let files = [];
for (const d of targetDirs) walk(d, files);

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  content = content.replace(/startsWith\('→\)/g, "startsWith('+')");
  content = content.replace(/startsWith\("→\)/g, 'startsWith("+")');
  content = content.replace(/startsWith\('→'\)/g, "startsWith('+')");

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed quotes in:', path.relative(rootDir, f));
  }
}
console.log('Quote fixes done!');

