const fs = require('fs');

const path = 'web/src/modules/1_UserManagement/UserManagement.jsx';
let content = fs.readFileSync(path, 'utf8');

const rows = [
  { name: 'Amit Gupta', mobile: '+91 98112 40591' },
  { name: 'Rajesh Sharma', mobile: '+91 98450 19284' },
  { name: 'Suresh Kumar', mobile: '+91 97120 33819' },
  { name: 'K. Balaji', mobile: '+91 94440 88219' },
  { name: 'Mohan Lal Prajapat', mobile: '+91 96500 77142' },
  { name: 'Vikas Mehta', mobile: '+91 98250 99401' },
  { name: 'Deepak Yadav', mobile: '+91 98200 66311' },
  { name: 'Pooja Verma', mobile: '+91 99100 44520' },
  { name: 'Rameshwar Bind', mobile: '+91 97190 22134' },
  { name: 'Harish Patel', mobile: '+91 98250 11982' }
];

for (const r of rows) {
  const target = `<button onClick={() => handleOpenKyc('${r.name}')} className="text-xs text-[#092b63] hover:text-[#061d43] font-semibold hover:underline">View / Edit</button>`;
  const replacement = `<div className="flex items-center justify-end space-x-2">
  <button onClick={() => handleSendUserEmail('${r.name}', '${r.mobile}')} className="text-[11px] font-bold text-[#092b63] hover:text-[#061d43] bg-[#092b63]/10 hover:bg-[#092b63]/20 px-2 py-0.5 rounded transition shadow-xs flex items-center space-x-1" title="Email credentials dossier, setup guide & APK">
    <span>Email Dossier</span>
  </button>
  <button onClick={() => handleOpenKyc('${r.name}')} className="text-xs text-slate-500 hover:text-slate-800 font-semibold hover:underline">View / Edit</button>
</div>`;
  content = content.replace(target, replacement);
}

fs.writeFileSync(path, content, 'utf8');
fs.writeFileSync('src/modules/1_UserManagement/UserManagement.jsx', content, 'utf8');
console.log('UserManagement updated with Email Dossier buttons!');

