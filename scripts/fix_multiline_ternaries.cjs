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

  // Multiline ternary: line starting with optional whitespace and '• '
  // e.g.
  //   activeTab === 'users'
  //     • 'bg-[#092b63]/10...'
  //     : 'text-slate-600...'
  content = content.replace(/^(\s*)•(\s+[\'\"`\w\(\{\<])/gm, '$1?$2');

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed multiline ternary in:', path.relative(rootDir, f));
  }
}
console.log('Done fixing multiline ternaries!');

