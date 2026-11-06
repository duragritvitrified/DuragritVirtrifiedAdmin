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
console.log(`Processing ${files.length} files...`);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Restore optional chaining: •. -> ?. , •[ -> ?[ , •( -> ?(
  content = content.replace(/•\./g, '?.');
  content = content.replace(/•\[/g, '?[');
  content = content.replace(/•\(/g, '?(');

  // 2. Restore commas from erroneous ₹: ₹ not followed by digits is a comma
  // Example: useContext₹ useState -> useContext, useState
  // Example: [a₹ b] -> [a, b]
  content = content.replace(/₹(?!\s*\d)/g, ', ');

  // 3. Clean up double commas or comma-space combos if any
  content = content.replace(/,\s*,/g, ',');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Repaired syntax in:', path.relative(rootDir, file));
  }
}

console.log('Syntax repair complete!');

