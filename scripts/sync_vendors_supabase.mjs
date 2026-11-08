import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fykxjzvdslvxablmjlfw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5a3hqenZkc2x2eGFibG1qbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NDczMTcsImV4cCI6MjEwOTAyMzMxN30.bmMUQ6vcRZorX_b2YOuvgrtfWCWYwRxxlaQTj5QhQxY';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const vendorRecord = [
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
    status: 'ACTIVE',
    accountStatus: 'Active',
    category: 'Tile Contractor / Applicator',
    location: 'Morbi Central Hub, Gujarat',
    active: true
  }
];

async function syncVendorsToSupabase() {
  // Check if existing record exists
  const { data: existing } = await sb
    .from('cashback_requests')
    .select('id')
    .eq('request_id', 'SYNC_VENDORS_REGISTRY')
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await sb
      .from('cashback_requests')
      .update({
        flag_reason: JSON.stringify(vendorRecord),
        timestamp: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select();
    console.log('Updated existing sync record:', { data, error });
  } else {
    const { data, error } = await sb
      .from('cashback_requests')
      .insert({
        request_id: 'SYNC_VENDORS_REGISTRY',
        qr_serial: 'DURAGRIT_VENDORS_STORE_V1',
        claim_value: 1,
        status: 'Approved',
        flag_reason: JSON.stringify(vendorRecord),
        payout_method: 'UPI'
      })
      .select();
    console.log('Inserted new sync record:', { data, error });
  }
}

syncVendorsToSupabase();
