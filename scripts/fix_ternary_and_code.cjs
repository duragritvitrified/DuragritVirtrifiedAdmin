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
console.log(`Processing ${files.length} files for ternary restoration...`);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. In lines containing ':' outside strings or in JS expressions, replace ' • ' with ' ? '
  // We can process line by line:
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // If the line has ' • ' and ':' and it's not purely a text string like 'Box #09114 • Lot: BATCH'
    // Let's check if it has a ternary pattern:
    // e.g. condition • expr : expr
    // Notice that in text strings like "Step 01 • Phase: X", ':' comes after or before •, but in code:
    // `condition • result : alternative` or `{cond • 'a' : 'b'}`
    
    // Check specific known patterns:
    let l = line;

    // startsWith('+')
    l = l.replace(/startsWith\(\'→\'\)/g, "startsWith('+')");
    l = l.replace(/startsWith\(\"→\"\)/g, 'startsWith("+")');

    // Pattern: `• ` where followed on the same statement by `:`
    // e.g., `saved • JSON.parse(saved) : initialSKUs`
    // e.g., `dbStatus.mode === 'live' • 'Supabase Live' :`
    // e.g., `activeTab === 'users' • 'text-[#092b63]' : 'text-slate-400'`
    // e.g., `eventType === 'INSERT' • prev.pendingCount + 1 :`
    // e.g., `prev • { ...prev } : prev`
    // e.g., `num % 3 === 0 • "Adhesives" :`
    // e.g., `hasPAN • 0.01 : 0.20`
    // e.g., `vpa • 'UPI' : 'NEFT'`
    // e.g., `payoutInProgress • 'Sending...' : 'Execute'`
    // e.g., `roleMode === 'contractor' • ... : ...`
    // e.g., `claim.status === 'Disbursed' • ... : ...`
    // e.g., `typeof amount === 'number' • ... : ...`
    // e.g., `mobile.startsWith('+') • mobile : ...`
    // e.g., `s.id === skuId • ... : s`
    // e.g., `u.id === userId • ... : u`
    // e.g., `c.id === claimId • ... : c`
    // e.g., `matchedSku.cashbackReward > 500 • ... : ...`
    // e.g., `distanceKm > maxRadiusKm • ... : null`

    // General replacement for ternary:
    // Look for: [something] • [something] : [something]
    // where it's not a text like "• Lot: BATCH" or "• Single-Use"
    l = l.replace(/([=!><\w\)\'\"\`\}])\s+•\s+([!$\w\(\'\"\`\{])/g, (match, p1, p2) => {
      // Check if line contains a colon later
      const rest = l.substring(l.indexOf(match) + match.length);
      if (rest.includes(':') && !rest.includes('Lot:') && !rest.includes('Batch:') && !rest.includes('Step:') && !rest.includes('BIS:') && !rest.includes('RRN:')) {
        return `${p1} ? ${p2}`;
      }
      return match;
    });

    // Also handle nested ternaries like:
    // `dbStatus.mode === 'live' ? 'Supabase Live' : dbStatus.mode === 'connecting' • 'Connecting...' : 'Offline Cache'`
    l = l.replace(/:\s*([!$\w\(\'\"\`\{\s=><\.]+)\s+•\s+([!$\w\(\'\"\`\{])/g, (match, p1, p2) => {
      const rest = l.substring(l.indexOf(match) + match.length);
      if (rest.includes(':')) {
        return `: ${p1} ? ${p2}`;
      }
      return match;
    });

    // Also handle specific occurrences:
    l = l.replace(/saved • JSON\.parse/g, 'saved ? JSON.parse');
    l = l.replace(/prev • \{/g, 'prev ? {');
    l = l.replace(/vpa • \'/g, 'vpa ? \'');
    l = l.replace(/hasPAN • 0\.01/g, 'hasPAN ? 0.01');
    l = l.replace(/hasPAN • \'/g, 'hasPAN ? \'');
    l = l.replace(/payoutInProgress •/g, 'payoutInProgress ?');
    l = l.replace(/payoutRunning •/g, 'payoutRunning ?');
    l = l.replace(/payoutComplete •/g, 'payoutComplete ?');
    l = l.replace(/roleMode === 'contractor' •/g, "roleMode === 'contractor' ?");
    l = l.replace(/dbStatus\.lastSync •/g, "dbStatus.lastSync ?");
    l = l.replace(/SB_ONLINE •/g, "SB_ONLINE ?");
    l = l.replace(/bankSuffix •/g, "bankSuffix ?");

    return l;
  });

  content = newLines.join('\n');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Restored ternaries in:', path.relative(rootDir, file));
  }
}

console.log('Ternary restoration complete!');

