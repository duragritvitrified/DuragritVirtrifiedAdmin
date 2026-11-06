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
console.log(`Found ${files.length} files to process.`);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Numbers with corrupted commas: ₹ 1₹ 48₹ 500 -> ₹ 1,48,500
  content = content.replace(/(\d)\s*₹\s*(\d)/g, '$1,$2');
  content = content.replace(/(\d)\s*₹\s*(\d)/g, '$1,$2'); // repeat for 1,48,500

  // 2. Syntax keywords where comma became ₹
  content = content.replace(/React₹\s*/g, 'React, ');
  content = content.replace(/(\b[a-zA-Z0-9_$]+)\s*₹\s*(\b[a-zA-Z0-9_$]+)/g, '$1, $2');
  content = content.replace(/(\b[a-zA-Z0-9_$]+)\s*₹\s*([\{\[\(\'\"`])/g, '$1, $2');
  content = content.replace(/([\}\]\)\'\"`])\s*₹\s*(\b[a-zA-Z0-9_$])/g, '$1, $2');
  content = content.replace(/([\}\]\)\'\"`])\s*₹\s*([\{\[\(\'\"`])/g, '$1, $2');

  // 3. Numbers inside arrays/objects: 1₹ 2 -> 1, 2
  content = content.replace(/(\d+)\s*₹\s*(\d+)/g, '$1, $2');

  // 4. City, State in descriptions: Jaipur₹ RJ -> Jaipur, RJ
  content = content.replace(/(Jaipur|Faridabad|Noida|Agra|Surat|Ahmedabad|Ghaziabad|Gurugram|Chandigarh|New Delhi)₹\s*/g, '$1, ');
  content = content.replace(/Search by Claim ID₹\s*/g, 'Search by Claim ID, ');
  content = content.replace(/Review₹\s*approve₹\s*and disburse/g, 'Review, approve, and disburse');

  // 5. Corrupted QUEUE banner text
  content = content.replace(/QUEUE 2\.4[\s\•\Â\¢\?]+AUDIT ACTIVE/g, 'QUEUE 2.4 • AUDIT ACTIVE');

  // 6. Any trailing semicolon / timeout args: )₹ 1800 -> ), 1800
  content = content.replace(/\)\s*₹\s*(\d+)/g, '), $1');
  content = content.replace(/''\s*₹\s*(\d+)/g, "'', $1");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed syntax & commas in:', path.relative(rootDir, file));
  }
}

console.log('All syntax and comma fixes complete!');
