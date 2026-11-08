const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0];
  const v = parts.slice(1).join('=');
  if (k && v) {
    env[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const FULL_VENDORS = [
  {
    id: 'VND-101',
    vendorId: 'VND-101',
    companyName: 'DuraGrit Authorized Partner',
    contactPerson: 'Vendor Partner',
    phone: '8826021114',
    mobile: '8826021114',
    email: 'duragrit07@gmail.com',
    passkey: 'Dura#4905',
    tempPassword: 'Dura#4905',
    password: 'Dura#4905',
    pass: 'Dura#4905',
    status: 'ACTIVE',
    accountStatus: 'Active',
    category: 'Tile Contractor / Applicator',
    location: 'Morbi Central Hub, Gujarat',
    active: true
  },
  {
    id: 'VEN-001',
    vendorId: 'VEN-001',
    companyName: 'Reliance Polymers Ltd (Hazira Complex)',
    contactPerson: 'Suresh Mehta',
    phone: '9825011223',
    mobile: '9825011223',
    email: 'hazira.dispatch@reliance.com',
    passkey: '1234',
    tempPassword: '1234',
    password: '1234',
    pass: '1234',
    status: 'ACTIVE',
    accountStatus: 'Active',
    category: 'Raw materials',
    location: 'Hazira, Surat, Gujarat',
    active: true
  },
  {
    id: 'VEN-002',
    vendorId: 'VEN-002',
    companyName: 'Gujarat Silicates & Additives Pvt Ltd',
    contactPerson: 'Ketan Patel',
    phone: '9909944556',
    mobile: '9909944556',
    email: 'dispatch@gujaratsilicates.in',
    passkey: '1234',
    tempPassword: '1234',
    password: '1234',
    pass: '1234',
    status: 'ACTIVE',
    accountStatus: 'Active',
    category: 'Chemicals',
    location: 'Morbi Industrial Estate, Gujarat',
    active: true
  },
  {
    id: 'VEN-003',
    vendorId: 'VEN-003',
    companyName: 'Morbi Multi-Wall Bags & Packaging LLP',
    contactPerson: 'Pravin Bhai',
    phone: '9824288990',
    mobile: '9824288990',
    email: 'orders@morbibags.com',
    passkey: '1234',
    tempPassword: '1234',
    password: '1234',
    pass: '1234',
    status: 'ACTIVE',
    accountStatus: 'Active',
    category: 'Packaging',
    location: 'Morbi-Wankaner Highway, Gujarat',
    active: true
  }
];

async function updateSyncVendors() {
  const { data: existing, error: eErr } = await supabase
    .from('cashback_requests')
    .select('id')
    .eq('request_id', 'SYNC_VENDORS_REGISTRY')
    .maybeSingle();

  console.log('Existing sync row:', existing, eErr || '');

  if (existing?.id) {
    const { data, error } = await supabase
      .from('cashback_requests')
      .update({
        flag_reason: JSON.stringify(FULL_VENDORS),
        timestamp: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select();
    console.log('Update result:', data ? 'SUCCESS' : 'FAILED', error || '');
  } else {
    const { data, error } = await supabase
      .from('cashback_requests')
      .insert({
        request_id: 'SYNC_VENDORS_REGISTRY',
        qr_serial: 'DURAGRIT_VENDORS_STORE_V1',
        claim_value: 1,
        status: 'Approved',
        flag_reason: JSON.stringify(FULL_VENDORS),
        payout_method: 'UPI'
      })
      .select();
    console.log('Insert result:', data ? 'SUCCESS' : 'FAILED', error || '');
  }
}

updateSyncVendors();

