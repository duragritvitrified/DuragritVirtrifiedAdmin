import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fykxjzvdslvxablmjlfw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5a3hqenZkc2x2eGFibG1qbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NDczMTcsImV4cCI6MjEwOTAyMzMxN30.bmMUQ6vcRZorX_b2YOuvgrtfWCWYwRxxlaQTj5QhQxY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PROTECTED_KEYS = new Set([
  'VND-101', 'VND-102', 'VND-103', 'VND-104', 'VND-105',
  '8826021114', '9876543210', '9811223344', '9833445566', '9899001122',
  '9820144521', '9898012345'
]);

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
      const payload = req.body || {};
      const inserts = [];

      if (Array.isArray(payload.skus)) {
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `SYNC_SKUS_EVENT_${Date.now()}`,
            qr_serial: 'DURAGRIT_SKUS_REGISTRY',
            claim_value: payload.skus.length,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(payload.skus)
          })
        );
      }

      if (Array.isArray(payload.batches)) {
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `SYNC_BATCHES_EVENT_${Date.now()}`,
            qr_serial: 'DURAGRIT_BATCHES_REGISTRY',
            claim_value: payload.batches.length,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(payload.batches)
          })
        );
      }

      if (Array.isArray(payload.vendors)) {
        const nowIso = new Date().toISOString();
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `SYNC_VENDORS_EVENT_${Date.now()}`,
            qr_serial: 'DURAGRIT_VENDORS_STORE_V1',
            claim_value: payload.vendors.length,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(payload.vendors),
            timestamp: nowIso,
          })
        );
        payload.vendors.forEach((v) => {
          const vId = String(v.vendorId || v.id || '').toUpperCase();
          if (vId) {
            inserts.push(
              supabase.from('cashback_requests').insert({
                request_id: `DURAGRIT_VENDOR_POST_${vId}_${Date.now()}`,
                qr_serial: 'DURAGRIT_VENDOR_EVENT',
                claim_value: 1,
                status: 'Approved',
                payout_method: 'UPI',
                flag_reason: JSON.stringify({
                  action: 'UPSERT',
                  vendorId: vId,
                  vendor: v,
                  timestamp: Date.now(),
                }),
                timestamp: nowIso,
              })
            );
          }
        });
      }

      if (Array.isArray(payload.deletedKeys)) {
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
        const oId = u.id || `ORD-${Date.now().toString().slice(-6)}`;
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

      await Promise.allSettled(inserts);
      return res.status(200).json({ success: true, count: inserts.length });
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
        .or('qr_serial.eq.DURAGRIT_VENDOR_ORDERS,request_id.ilike.ORDER_%,request_id.ilike.ORD_%')
        .order('timestamp', { ascending: false })
        .limit(15),
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
        .limit(20),
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
    DEFAULT_ORDERS.forEach((o) => orderMap.set(o.id, o));

    eventRows.forEach((r) => {
      const isOrder = r.qr_serial === 'DURAGRIT_VENDOR_ORDERS' || (r.request_id && (r.request_id.startsWith('ORD_') || r.request_id.startsWith('ORDER_')));
      if (isOrder) {
        try {
          const parsed = JSON.parse(r.flag_reason || '{}');
          if (parsed?.id) {
            const existing = orderMap.get(parsed.id) || {};
            orderMap.set(parsed.id, { ...existing, ...parsed, updatedAt: parsed.updatedAt || r.timestamp });
          }
        } catch (_) {}
      }
    });
    responseData.orders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0)
    );

    // 6. Cashback Claims
    if (claimRes.status === 'fulfilled' && !claimRes.value.error) {
      responseData.claims = (claimRes.value.data || []).map((row) => {
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

        return {
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
          date: row.timestamp || row.created_at || new Date().toISOString()
        };
      });
    }

    // 7. SMTP Config
    if (smtpRes.status === 'fulfilled' && !smtpRes.value.error && smtpRes.value.data?.[0]?.flag_reason) {
      try {
        responseData.smtpConfig = JSON.parse(smtpRes.value.data[0].flag_reason);
      } catch (_) {}
    }

    return res.status(200).json(responseData);
  } catch (err) {
    console.error('api/sync error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
