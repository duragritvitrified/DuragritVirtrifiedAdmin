import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bzvmsuctrdlqnfccejtr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Wwxgg5w8vuh6L7QnO6sCA_56L5Ccou';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PROTECTED_KEYS = new Set([
  'VND-101', 'VND-102', 'VND-103', 'VND-104', 'VND-105',
  '8826021114', '9876543210', '9811223344', '9833445566', '9899001122',
  '9820144521', '9898012345'
]);

global.__DURAGRIT_VENDORS_REGISTRY__ = global.__DURAGRIT_VENDORS_REGISTRY__ || new Map();
global.__DURAGRIT_ORDERS_REGISTRY__ = global.__DURAGRIT_ORDERS_REGISTRY__ || new Map();
global.__DURAGRIT_SYNC_CACHE__ = global.__DURAGRIT_SYNC_CACHE__ || { data: null, ts: 0 };

// Strip oversized base64 blobs (>45KB) and huge unscanned token arrays to keep sync payload < 30KB
function slimSyncPayload(val) {
  if (!val) return val;
  if (typeof val === 'string') {
    if (val.startsWith('data:') && val.length > 45000) return '';
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(slimSyncPayload);
  }
  if (typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if ((k === 'tokens' || k === 'codes') && Array.isArray(v) && v.length > 25) {
        const scanned = v.filter((t) => t && t.isScanned);
        out[k] = scanned.length > 0 ? scanned : v.slice(0, 10);
      } else {
        out[k] = slimSyncPayload(v);
      }
    }
    return out;
  }
  return val;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'POST') {
      // Invalidate GET cache immediately on any write
      global.__DURAGRIT_SYNC_CACHE__ = { data: null, ts: 0 };
      const payload = req.body || {};
      const inserts = [];

      if (Array.isArray(payload.skus)) {
        const slimSkus = slimSyncPayload(payload.skus);
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `SYNC_SKUS_EVENT_${Date.now()}`,
            qr_serial: 'DURAGRIT_SKUS_REGISTRY',
            claim_value: slimSkus.length,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(slimSkus)
          })
        );
      }

      if (Array.isArray(payload.batches)) {
        const slimBatches = slimSyncPayload(payload.batches);
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `SYNC_BATCHES_EVENT_${Date.now()}`,
            qr_serial: 'DURAGRIT_BATCHES_REGISTRY',
            claim_value: slimBatches.length,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(slimBatches)
          })
        );
      }

      if (Array.isArray(payload.vendors)) {
        const slimVendors = slimSyncPayload(payload.vendors);
        global.__DURAGRIT_VENDORS_REGISTRY__ = global.__DURAGRIT_VENDORS_REGISTRY__ || new Map();
        slimVendors.forEach((v) => {
          const vId = String(v?.vendorId || v?.id || '').toUpperCase();
          if (vId) {
            global.__DURAGRIT_VENDORS_REGISTRY__.set(vId, {
              ...(global.__DURAGRIT_VENDORS_REGISTRY__.get(vId) || {}),
              ...v,
              updatedAt: v.updatedAt || Date.now()
            });
          }
        });

        const nowIso = new Date().toISOString();
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `SYNC_VENDORS_EVENT_${Date.now()}`.slice(0, 50),
            qr_serial: 'DURAGRIT_VENDORS_STORE_V1',
            claim_value: slimVendors.length,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(slimVendors),
            timestamp: nowIso,
          })
        );
      }

      if (Array.isArray(payload.deletedKeys)) {
        payload.deletedKeys.forEach((k) => {
          const up = String(k || '').toUpperCase();
          if (global.__DURAGRIT_VENDORS_REGISTRY__) {
            global.__DURAGRIT_VENDORS_REGISTRY__.delete(up);
          }
        });
        const safeDeleted = payload.deletedKeys.filter(
          (k) => !PROTECTED_KEYS.has(String(k).toUpperCase())
        );
        if (safeDeleted.length > 0) {
          inserts.push(
            supabase.from('cashback_requests').insert({
              request_id: `SYNC_DELETED_EVENT_${Date.now()}`,
              qr_serial: 'DURAGRIT_DELETED_KEYS',
              claim_value: safeDeleted.length,
              status: 'Approved',
              payout_method: 'UPI',
              flag_reason: JSON.stringify(safeDeleted),
              timestamp: new Date().toISOString(),
            })
          );
        }
      }

      if (payload.smtpConfig && typeof payload.smtpConfig === 'object') {
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `SYNC_SMTP_EVENT_${Date.now()}`,
            qr_serial: 'DURAGRIT_SMTP_CONFIG',
            claim_value: 1,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(payload.smtpConfig),
            timestamp: new Date().toISOString(),
          })
        );
      }

      if (payload.order && typeof payload.order === 'object') {
        const o = payload.order;
        const oId = o.id || `ORD-${Date.now().toString().slice(-6)}`;
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `ORD_EVT_${oId}_${Date.now()}`.slice(0, 50),
            qr_serial: 'DURAGRIT_VENDOR_ORDERS',
            claim_value: o.totalQuantity || o.totalItems || 1,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(o),
            timestamp: new Date().toISOString(),
          })
        );
      }

      if (payload.orderUpdate && typeof payload.orderUpdate === 'object') {
        const u = payload.orderUpdate;
        const oId = u.id || u.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `ORD_ST_${oId}_${Date.now()}`.slice(0, 50),
            qr_serial: 'DURAGRIT_VENDOR_ORDERS',
            claim_value: 1,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(u),
            timestamp: new Date().toISOString(),
          })
        );
      }

      if (Array.isArray(payload.orders)) {
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `ORD_REG_${Date.now()}`.slice(0, 50),
            qr_serial: 'DURAGRIT_VENDOR_ORDERS_REGISTRY',
            claim_value: payload.orders.length,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(payload.orders),
            timestamp: new Date().toISOString(),
          })
        );
      }

      if (payload.claimAction && typeof payload.claimAction === 'object') {
        const act = payload.claimAction;
        const cId = act.claimId || act.requestId || act.id || 'CLAIM';
        const isDisbursed = act.status === 'Disbursed';
        const disbursedAmt = Number(act.disbursedAmount || act.amount || 0);
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `CLAIM_ACTION_EVENT_${cId}_${Date.now()}`.slice(0, 50),
            qr_serial: 'DURAGRIT_CLAIM_ACTION',
            claim_value: disbursedAmt || 1,
            net_disbursed: isDisbursed ? disbursedAmt : 0,
            npci_rrn: act.transactionId || act.utr || act.npciRrn || null,
            disbursed_at: isDisbursed ? (act.disbursedAt || new Date().toISOString()) : null,
            status: act.status || 'Approved',
            payout_method: act.paymentMode || 'UPI',
            flag_reason: JSON.stringify(act),
            timestamp: new Date().toISOString(),
          })
        );
      }

      await Promise.allSettled(inserts);
      return res.status(200).json({ success: true, count: inserts.length });
    }

    // GET: Return cached response if fresh (<12s) and not forced
    if (
      !req.query?.force &&
      global.__DURAGRIT_SYNC_CACHE__?.data &&
      Date.now() - global.__DURAGRIT_SYNC_CACHE__.ts < 12000
    ) {
      return res.status(200).json(global.__DURAGRIT_SYNC_CACHE__.data);
    }

    // GET: Comprehensive ultra-fast live sync across Supabase database tables & events
    const [
      prodRes,
      vendRes,
      profRes,
      batchRes,
      claimRes,
      batchEventRes,
      orderEventRes,
      deletedEventRes,
      skuEvtRes,
      vendorEvtRes,
      claimActRes,
      verifyActRes,
      smtpRes
    ] = await Promise.allSettled([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('vendors').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').neq('role', 'Admin').order('created_at', { ascending: false }),
      supabase.from('qr_batches').select('*, products(name, sku_code, pack_weight, base_mrp, cashback_reward)').order('created_at', { ascending: false }),
      supabase.from('cashback_requests')
        .select('*')
        .not('qr_serial', 'ilike', 'DURAGRIT_%')
        .not('request_id', 'ilike', 'SYNC_%')
        .not('request_id', 'ilike', 'CLAIM_ACTION_%')
        .not('request_id', 'ilike', 'VERIFY_EVENT_%')
        .not('request_id', 'ilike', 'DURAGRIT_VENDOR_%')
        .order('timestamp', { ascending: false })
        .limit(100),
      supabase.from('cashback_requests')
        .select('request_id, qr_serial, flag_reason, timestamp')
        .or('qr_serial.eq.DURAGRIT_BATCHES_REGISTRY,request_id.ilike.SYNC_BATCHES_%')
        .order('timestamp', { ascending: false })
        .limit(2),
      supabase.from('cashback_requests')
        .select('request_id, qr_serial, flag_reason, timestamp')
        .or('qr_serial.eq.DURAGRIT_VENDOR_ORDERS,qr_serial.eq.DURAGRIT_VENDOR_ORDERS_REGISTRY,request_id.ilike.ORDER_%,request_id.ilike.ORD_%')
        .order('timestamp', { ascending: false })
        .limit(200),
      supabase.from('cashback_requests')
        .select('request_id, qr_serial, flag_reason, timestamp')
        .or('qr_serial.eq.DURAGRIT_DELETED_KEYS,request_id.ilike.SYNC_DELETED_%')
        .order('timestamp', { ascending: false })
        .limit(2),
      supabase.from('cashback_requests')
        .select('request_id, qr_serial, flag_reason, timestamp')
        .or('qr_serial.eq.DURAGRIT_SKUS_REGISTRY,request_id.ilike.SYNC_SKUS_%')
        .order('timestamp', { ascending: false })
        .limit(2),
      supabase.from('cashback_requests')
        .select('request_id, qr_serial, flag_reason, timestamp')
        .or('qr_serial.eq.DURAGRIT_VENDORS_STORE_V1,request_id.ilike.SYNC_VENDORS_%,qr_serial.eq.DURAGRIT_VENDOR_EVENT,request_id.ilike.DURAGRIT_VENDOR_%')
        .order('timestamp', { ascending: false })
        .limit(15),
      supabase.from('cashback_requests')
        .select('request_id, qr_serial, flag_reason, timestamp')
        .like('request_id', 'CLAIM_ACTION_EVENT_%')
        .order('timestamp', { ascending: false })
        .limit(300),
      supabase.from('cashback_requests')
        .select('request_id, qr_serial, flag_reason, timestamp')
        .like('request_id', 'VERIFY_EVENT_%')
        .order('timestamp', { ascending: false })
        .limit(10),
      supabase.from('cashback_requests')
        .select('flag_reason')
        .or('qr_serial.eq.DURAGRIT_SMTP_CONFIG,request_id.ilike.SYNC_SMTP_%')
        .order('timestamp', { ascending: false })
        .limit(1)
    ]);

    const rawBatchEvents = batchEventRes.status === 'fulfilled' && !batchEventRes.value.error ? (batchEventRes.value.data || []) : [];
    const rawOrderEvents = orderEventRes.status === 'fulfilled' && !orderEventRes.value.error ? (orderEventRes.value.data || []) : [];
    const rawDeletedEvents = deletedEventRes.status === 'fulfilled' && !deletedEventRes.value.error ? (deletedEventRes.value.data || []) : [];
    const rawSkuEvents = skuEvtRes.status === 'fulfilled' && !skuEvtRes.value.error ? (skuEvtRes.value.data || []) : [];
    const rawVendorEvents = vendorEvtRes.status === 'fulfilled' && !vendorEvtRes.value.error ? (vendorEvtRes.value.data || []) : [];
    const rawClaimActs = claimActRes.status === 'fulfilled' && !claimActRes.value.error ? (claimActRes.value.data || []) : [];
    const rawVerifyActs = verifyActRes.status === 'fulfilled' && !verifyActRes.value.error ? (verifyActRes.value.data || []) : [];

    const eventRows = [
      ...rawDeletedEvents,
      ...rawBatchEvents,
      ...rawOrderEvents,
      ...rawSkuEvents,
      ...rawVendorEvents,
      ...rawClaimActs,
      ...rawVerifyActs
    ];

    const responseData = {
      skus: [],
      batches: [],
      vendors: [],
      users: [],
      orders: [],
      claims: [],
      deletedKeys: [],
      smtpConfig: null
    };

    // 1. Process Deleted Keys
    const deletedKeysSet = new Set();
    eventRows.forEach((r) => {
      if (r.qr_serial === 'DURAGRIT_DELETED_KEYS' || (r.request_id && String(r.request_id).startsWith('SYNC_DELETED_'))) {
        try {
          const keys = JSON.parse(r.flag_reason || '[]');
          if (Array.isArray(keys)) {
            keys.forEach((k) => {
              const u = String(k).toUpperCase();
              if (!PROTECTED_KEYS.has(u)) deletedKeysSet.add(u);
            });
          }
        } catch (_) {}
      }
    });
    responseData.deletedKeys = Array.from(deletedKeysSet);

    // 2. SKUs
    const skuMap = new Map();
    if (prodRes.status === 'fulfilled' && !prodRes.value.error) {
      (prodRes.value.data || []).forEach((p) => {
        const code = String(p.sku_code || p.id || '').toUpperCase();
        if (code && !deletedKeysSet.has(code)) {
          skuMap.set(code, {
            id: p.id || `SKU-${code}`,
            skuCode: p.sku_code,
            name: p.name,
            category: p.category || 'Adhesives',
            subCategory: p.sub_category || 'High-Polymer Vitrified',
            packSize: p.pack_weight || '20 kg',
            packWeight: p.pack_weight || '20 kg',
            mrp: Number(p.base_mrp || 650),
            baseMrp: Number(p.base_mrp || 650),
            cashbackAmount: Number(p.cashback_reward || 150),
            cashbackReward: Number(p.cashback_reward || 150),
            rewardPoints: Number(p.cashback_reward || 150) * 4,
            status: p.is_active ? 'Active' : 'Inactive',
            isActive: Boolean(p.is_active),
            description: p.description || ''
          });
        }
      });
    }

    eventRows.forEach((r) => {
      if (r.qr_serial === 'DURAGRIT_SKUS_REGISTRY' || (r.request_id && String(r.request_id).startsWith('SYNC_SKUS_'))) {
        try {
          const list = JSON.parse(r.flag_reason);
          if (Array.isArray(list)) {
            list.forEach((s) => {
              const code = String(s.skuCode || s.id || '').toUpperCase();
              if (code && !deletedKeysSet.has(code)) {
                skuMap.set(code, { ...(skuMap.get(code) || {}), ...s });
              }
            });
          }
        } catch (_) {}
      }
    });
    responseData.skus = Array.from(skuMap.values());

    // 2b. Batches
    const batchMap = new Map();
    if (batchRes.status === 'fulfilled' && !batchRes.value.error) {
      (batchRes.value.data || []).forEach((b) => {
        const bId = String(b.batch_identifier || b.id || '').toUpperCase();
        if (bId && !deletedKeysSet.has(bId)) {
          batchMap.set(bId, {
            id: b.batch_identifier || b.id,
            batchId: b.batch_identifier || b.id,
            skuCode: b.products?.sku_code || '',
            productName: b.products?.name || 'DuraGrit Product',
            lotNumber: b.lot_number,
            quantity: Number(b.quantity || 100),
            cashbackAmount: Number(b.products?.cashback_reward || 150),
            expDate: b.expiry_date || '',
            mfgDate: (b.created_at || '').slice(0, 10),
            status: b.status || 'Active',
            createdAt: b.created_at,
            tokens: []
          });
        }
      });
    }

    eventRows.forEach((r) => {
      if (r.qr_serial === 'DURAGRIT_BATCHES_REGISTRY' || (r.request_id && String(r.request_id).startsWith('SYNC_BATCHES_'))) {
        try {
          const list = JSON.parse(r.flag_reason);
          if (Array.isArray(list)) {
            list.forEach((b) => {
              const bId = String(b.batchId || b.id || '').toUpperCase();
              if (bId && !deletedKeysSet.has(bId) && bId !== 'DG-BATCH-DA777') {
                const existing = batchMap.get(bId) || {};
                const qty = Number(b.quantity || existing.quantity || 10);
                const tokens = (b.tokens?.length ? b.tokens : b.codes) || existing.tokens || [];
                batchMap.set(bId, {
                  ...existing,
                  ...b,
                  id: b.batchId || b.id || bId,
                  batchId: b.batchId || b.id || bId,
                  quantity: qty,
                  tokens
                });
              }
            });
          }
        } catch (_) {}
      }
    });
    responseData.batches = Array.from(batchMap.values()).sort(
      (a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
    );

    // 3. Vendors
    const vendorMap = new Map();
    const BASE_VENDORS = [
      {
        id: 'VND-101', vendorId: 'VND-101', companyName: 'Ecreation IT Solution',
        category: 'Chemicals', gstin: '24AAACD1011M1Z5', gstinVerified: true,
        location: 'Morbi Central Hub, Gujarat', state: 'Gujarat',
        contactPerson: 'Vendor Partner', phone: '8826021114', mobile: '8826021114',
        email: 'duragrit07@gmail.com', status: 'ACTIVE', accountStatus: 'Active',
        passkey: 'Dura#4905', active: true
      },
      {
        id: 'VND-102', vendorId: 'VND-102', companyName: 'JEEE Toure',
        category: 'Chemicals', gstin: '24AAACD1022M1Z6', gstinVerified: true,
        location: 'Morbi Central Hub, Gujarat', state: 'Gujarat',
        contactPerson: 'Sunaj Sahoo', phone: '9876543210', mobile: '9876543210',
        email: 'sahoo.sunaj@gmail.com', status: 'ACTIVE', accountStatus: 'Active',
        passkey: '1234', active: true
      },
      {
        id: 'VND-103', vendorId: 'VND-103', companyName: 'RR Agency',
        category: 'Packaging', gstin: '24AAACD1033M1Z7', gstinVerified: true,
        location: 'Morbi Central Hub, Gujarat', state: 'Gujarat',
        contactPerson: 'Rohit Verma', phone: '9811223344', mobile: '9811223344',
        email: 'rohit.agency@gmail.com', status: 'ACTIVE', accountStatus: 'Active',
        passkey: '1234', active: true
      }
    ];
    BASE_VENDORS.forEach((v) => vendorMap.set(v.vendorId, v));

    if (vendRes.status === 'fulfilled' && !vendRes.value.error) {
      (vendRes.value.data || []).forEach((v) => {
        const vId = String(v.vendor_id || v.id || '').toUpperCase();
        if (vId && !deletedKeysSet.has(vId)) {
          vendorMap.set(vId, {
            id: v.vendor_id || v.id,
            vendorId: v.vendor_id || v.id,
            companyName: v.company_name,
            name: v.company_name,
            category: v.category,
            gstin: v.gstin,
            gstinVerified: Boolean(v.gstin_verified),
            location: v.location || 'Morbi, Gujarat',
            city: v.location ? v.location.split(',')[0].trim() : 'Morbi',
            state: v.state || 'Gujarat',
            contactPerson: v.contact_person,
            phone: v.phone,
            mobile: v.phone,
            email: v.email,
            status: (v.account_status || 'Active').toUpperCase(),
            accountStatus: v.account_status || 'Active',
            passkey: v.vendor_id === 'VND-101' ? 'Dura#4905' : '1234',
            active: v.account_status !== 'Inactive' && v.account_status !== 'Suspended'
          });
        }
      });
    }

    eventRows.forEach((r) => {
      try {
        if (r.qr_serial === 'DURAGRIT_VENDOR_EVENT' || (r.request_id && String(r.request_id).startsWith('DURAGRIT_VENDOR_'))) {
          const ev = JSON.parse(r.flag_reason || '{}');
          const vId = String(ev.vendorId || ev.vendor?.vendorId || ev.vendor?.id || '').toUpperCase();
          if (vId && !deletedKeysSet.has(vId)) {
            if (ev.action === 'DELETE') {
              vendorMap.delete(vId);
            } else if (ev.vendor) {
              const existing = vendorMap.get(vId) || {};
              vendorMap.set(vId, { ...existing, ...ev.vendor });
            }
          }
        } else if (r.qr_serial === 'DURAGRIT_VENDORS_STORE_V1' || (r.request_id && String(r.request_id).startsWith('SYNC_VENDORS_'))) {
          const list = JSON.parse(r.flag_reason || '[]');
          if (Array.isArray(list)) {
            list.forEach((v) => {
              const vId = String(v.vendorId || v.id || '').toUpperCase();
              if (vId && !deletedKeysSet.has(vId)) {
                vendorMap.set(vId, { ...(vendorMap.get(vId) || {}), ...v });
              }
            });
          }
        }
      } catch (_) {}
    });

    if (global.__DURAGRIT_VENDORS_REGISTRY__) {
      for (const [vId, v] of global.__DURAGRIT_VENDORS_REGISTRY__.entries()) {
        if (!deletedKeysSet.has(vId)) {
          const existing = vendorMap.get(vId) || {};
          vendorMap.set(vId, { ...existing, ...v });
        }
      }
    }

    responseData.vendors = Array.from(vendorMap.values());

    // 4. Profiles / Users
    if (profRes.status === 'fulfilled' && !profRes.value.error) {
      responseData.users = (profRes.value.data || []).map((u) => ({
        id: u.id,
        userId: u.id,
        name: u.full_name,
        fullLegalName: u.full_name,
        mobile: u.mobile,
        phone: u.mobile,
        email: u.email,
        role: u.role || 'Contractor',
        tierLevel: u.tier_level || 'Gold Applicator (Tier 2)',
        upi: u.upi_id,
        bankName: u.bank_name,
        accountNumber: u.account_number,
        ifsc: u.ifsc_code,
        location: u.location || 'Morbi, Gujarat',
        status: u.account_status || 'Active'
      }));
    }

    // 5. Orders (Aggregated & Deduped)
    const orderMap = new Map();
    const DEFAULT_ORDERS = [
      {
        id: 'ORD-882101',
        orderNumber: 'ORD-882101',
        vendorId: 'VND-101',
        vendorName: 'Ecreation IT Solution',
        vendorPhone: '8826021114',
        vendorEmail: 'duragrit07@gmail.com',
        vendorLocation: 'Morbi Industrial Hub, Gujarat',
        items: [
          { skuCode: 'DA-777', name: 'DuraGrit DA 777 High Polymer Tile Adhesive', quantity: 300, unit: 'Bags', packSize: '20 kg Kraft Bag', mrp: 650 },
          { skuCode: 'EG-200', name: 'DuraGrit Premium Epoxy Grout 2K', quantity: 100, unit: 'Buckets', packSize: '5 kg Plastic Bucket', mrp: 1200 }
        ],
        totalItems: 2,
        totalQuantity: 400,
        status: 'Delivered',
        deliveryAddress: 'Plot No. 42, GIDC Phase II, Morbi - 363642',
        deliveryHub: 'Yard Hub 04 - Morbi GIDC',
        notes: 'Please dispatch via morning batch truck.',
        createdAt: '2026-11-10T14:30:00.000Z',
        updatedAt: '2026-11-11T06:49:16.774Z'
      },
      {
        id: 'ORD-882102',
        orderNumber: 'ORD-882102',
        vendorId: 'VND-102',
        vendorName: 'JEEE Toure',
        vendorPhone: '9876543210',
        vendorEmail: 'sahoo.sunaj@gmail.com',
        vendorLocation: 'Morbi Central Hub, Gujarat',
        items: [
          { skuCode: 'WP-SBR', name: 'DuraGrit SBR LatexFibre Waterproofing Primer', quantity: 150, unit: 'Cans', packSize: '20 Liter Drum', mrp: 2800 }
        ],
        totalItems: 1,
        totalQuantity: 150,
        status: 'Confirmed',
        deliveryAddress: 'Morbi Industrial Area, Near Express Highway',
        deliveryHub: 'Morbi Central Hub',
        notes: 'Dispatch via Gujarat Fast Logistics.',
        createdAt: '2026-11-09T11:15:00.000Z',
        updatedAt: '2026-11-11T06:48:50.391Z'
      }
    ];
    DEFAULT_ORDERS.forEach((o) => {
      orderMap.set(String(o.id).toUpperCase(), { ...o });
    });

    const getOrderTs = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const ms = new Date(val).getTime();
      return isNaN(ms) ? (Number(val) || 0) : ms;
    };

    // Filter and sort chronologically ascending (oldest to newest) so latest status decisions win
    const orderRows = eventRows
      .filter((r) =>
        r.qr_serial === 'DURAGRIT_VENDOR_ORDERS' ||
        r.qr_serial === 'DURAGRIT_VENDOR_ORDERS_REGISTRY' ||
        (r.request_id && (String(r.request_id).startsWith('ORD_') || String(r.request_id).startsWith('ORDER_')))
      )
      .sort((a, b) => getOrderTs(a.timestamp) - getOrderTs(b.timestamp));

    orderRows.forEach((r) => {
      try {
        const parsed = JSON.parse(r.flag_reason || '{}');
        const processOrderObj = (o) => {
          const oId = String(o?.id || o?.orderNumber || '').toUpperCase();
          if (!oId) return;
          const existing = orderMap.get(oId) || {};
          const rowTs = getOrderTs(o.updatedAt || r.timestamp);
          const existTs = getOrderTs(existing.updatedAt);
          if (rowTs >= existTs || !existing.status) {
            const merged = {
              ...existing,
              ...o,
              id: o.id || existing.id || oId,
              orderNumber: o.orderNumber || existing.orderNumber || oId,
              status: o.status || existing.status || 'Pending',
              adminNotes: o.adminNotes !== undefined ? o.adminNotes : (existing.adminNotes || ''),
              updatedAt: o.updatedAt || r.timestamp || new Date().toISOString()
            };
            orderMap.set(oId, merged);
            if (o.id && o.id !== oId) orderMap.set(String(o.id), merged);
          }
        };

        if (Array.isArray(parsed)) {
          parsed.forEach(processOrderObj);
        } else if (parsed && typeof parsed === 'object') {
          processOrderObj(parsed);
        }
      } catch (_) {}
    });
    responseData.orders = Array.from(orderMap.values()).sort(
      (a, b) => getOrderTs(b.createdAt || b.timestamp) - getOrderTs(a.createdAt || a.timestamp)
    );

    // 6. Cashback Claims
    if (claimRes.status === 'fulfilled' && !claimRes.value.error) {
      const claimsMap = new Map();
      (claimRes.value.data || []).forEach((row) => {
        let meta = {};
        if (row.flag_reason && row.flag_reason.startsWith('{')) {
          try { meta = JSON.parse(row.flag_reason); } catch (_) {}
        }
        const status = row.status || 'Pending';
        let payoutStatus = meta.payoutStatus || 'Awaiting Approval';
        if (status === 'Approved') payoutStatus = 'Pending Release';
        else if (status === 'Disbursed') payoutStatus = 'Disbursed';
        else if (status === 'Rejected' || status === 'Flagged') payoutStatus = 'Rejected';

        const gross = Number(row.claim_value ?? meta.amount ?? 150);
        const net = Number(row.net_disbursed || meta.disbursedAmount || meta.netDisbursed || gross);
        const points = Number(meta.points ?? meta.rewardPoints ?? (gross * 10));

        const claimObj = {
          ...meta,
          id: row.request_id || row.id,
          requestId: row.request_id,
          claimNumber: row.request_id,
          supabaseId: row.id,
          userId: meta.userId || (meta.userMobile ? `USR-${String(meta.userMobile).slice(-4)}` : ''),
          userName: meta.userName || meta.vendorName || 'Registered Partner',
          userMobile: meta.userMobile || row.mobile || '',
          amount: gross,
          claimValue: gross,
          points,
          rewardPoints: points,
          disbursedAmount: status === 'Disbursed' ? net : 0,
          netDisbursed: status === 'Disbursed' ? net : 0,
          status,
          payoutStatus,
          transactionId: row.npci_rrn || meta.transactionId || meta.utr || null,
          npciRrn: row.npci_rrn || meta.npciRrn || meta.transactionId || meta.utr || null,
          utr: row.npci_rrn || meta.utr || meta.transactionId || null,
          qrSerial: row.qr_serial,
          serialKey: row.qr_serial,
          vendorName: meta.vendorName || meta.companyName || 'DuraGrit Partner',
          vendorId: meta.vendorId || 'VND-101',
          submittedAt: row.timestamp || row.created_at || new Date().toISOString(),
          date: row.timestamp || row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : new Date(row.timestamp || 0).getTime()
        };
        const key = String(claimObj.id).toUpperCase();
        claimsMap.set(key, claimObj);
        if (claimObj.requestId) claimsMap.set(String(claimObj.requestId).toUpperCase(), claimObj);
        if (claimObj.supabaseId) claimsMap.set(String(claimObj.supabaseId).toUpperCase(), claimObj);
      });

      // Apply claim actions chronologically (oldest to newest) so latest decision wins
      const sortedClaimActs = [...rawClaimActs].sort(
        (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
      );
      sortedClaimActs.forEach((row) => {
        try {
          const act = JSON.parse(row.flag_reason || '{}');
          const targetId = String(act.claimId || act.requestId || '').toUpperCase();
          if (targetId && claimsMap.has(targetId)) {
            const target = claimsMap.get(targetId);
            if (act.status) target.status = act.status;
            if (act.payoutStatus) target.payoutStatus = act.payoutStatus;
            if (act.transactionId) target.transactionId = act.transactionId;
            if (act.npciRrn) target.npciRrn = act.npciRrn;
            if (act.utr) target.utr = act.utr;
            if (act.disbursedAmount !== undefined && act.disbursedAmount !== null) target.disbursedAmount = Number(act.disbursedAmount);
            if (act.disbursedAt) target.disbursedAt = act.disbursedAt;
            if (act.approvedAt) target.approvedAt = act.approvedAt;
            if (act.rejectedAt) target.rejectedAt = act.rejectedAt;
            if (act.flagReason) target.flagReason = act.flagReason;
            if (act.remarks) target.remarks = act.remarks;
            target.updatedAt = Math.max(Number(target.updatedAt || 0), new Date(row.timestamp || 0).getTime());
          }
        } catch (_) {}
      });

      // Deduplicate by canonical id
      const uniqueClaims = new Map();
      claimsMap.forEach((claim) => {
        uniqueClaims.set(String(claim.id).toUpperCase(), claim);
      });
      responseData.claims = Array.from(uniqueClaims.values());
    }

    // 7. SMTP Config
    if (smtpRes.status === 'fulfilled' && !smtpRes.value.error && smtpRes.value.data?.[0]?.flag_reason) {
      try {
        responseData.smtpConfig = JSON.parse(smtpRes.value.data[0].flag_reason);
      } catch (_) {}
    }

    const slimmedResponse = slimSyncPayload(responseData);
    global.__DURAGRIT_SYNC_CACHE__ = { data: slimmedResponse, ts: Date.now() };
    return res.status(200).json(slimmedResponse);
  } catch (err) {
    console.error('api/sync error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
