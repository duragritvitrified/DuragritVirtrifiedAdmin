const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.json')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const targetDirs = [
  path.join(__dirname, 'web', 'src'),
  path.join(__dirname, 'src'),
  path.join(__dirname, 'app', 'src')
];

let allFiles = [];
for (const dir of targetDirs) {
  walk(dir, allFiles);
}

console.log(`Checking ${allFiles.length} files...`);

let fixedCount = 0;
for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Rupee symbol corruptions:
  content = content.replace(/\u00E2\u201A\u00B9/g, '₹');
  content = content.replace(/\u00E2\u0082\u00B9/g, '₹');
  content = content.replace(/â,¹/g, '₹');
  content = content.replace(/â‚¹/g, '₹');
  content = content.replace(/\uFFFD,1/g, '₹');
  content = content.replace(/\uFFFD,¹/g, '₹');
  content = content.replace(/\uFFFD,\s*/g, '₹ ');

  // Arrows:
  content = content.replace(/â†‘/g, '↑');
  content = content.replace(/â†’/g, '→');
  content = content.replace(/âœ“/g, '✓');
  content = content.replace(/âœ•/g, '✕');

  // Plus-minus:
  content = content.replace(/Â±/g, '±');

  content = content.replace(/â€¢/g, '•');
  content = content.replace(/Â¢¢/g, '•');
  content = content.replace(/Â¢/g, '•');
  content = content.replace(/Â•/g, '•');
  content = content.replace(/â€“/g, '–');
  content = content.replace(/â€”/g, '—');

  // Temperature / degree:
  content = content.replace(/1,215A°C/g, '1,215°C');
  content = content.replace(/1,215Â°C/g, '1,215°C');
  content = content.replace(/1,215AC/g, '1,215°C');
  content = content.replace(/42\.4Â°C/g, '42.4°C');
  content = content.replace(/42\.4A°C/g, '42.4°C');
  content = content.replace(/42A°C/g, '42°C');
  content = content.replace(/42Â°C/g, '42°C');

  // Specific corruptions:
  content = content.replace(/Phase (\d) \? ([A-Za-z]+)/g, 'Phase $1 • $2');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', path.relative(__dirname, file));
    fixedCount++;
  }
}

console.log(`Cleaned text encoding in ${fixedCount} files.`);
