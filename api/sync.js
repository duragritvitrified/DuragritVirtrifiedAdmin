import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fykxjzvdslvxablmjlfw.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5a3hqenZkc2x2eGFibG1qbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NDczMTcsImV4cCI6MjEwOTAyMzMxN30.bmMUQ6vcRZorX_b2YOuvgrtfWCWYwRxxlaQTj5QhQxY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        // Also persist each vendor individually as an atomic event to prevent overwrites
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
        inserts.push(
          supabase.from('cashback_requests').insert({
            request_id: `SYNC_DELETED_EVENT_${Date.now()}`,
            qr_serial: 'DURAGRIT_DELETED_KEYS',
            claim_value: payload.deletedKeys.length,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(payload.deletedKeys),
            timestamp: new Date().toISOString(),
          })
        );
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

      await Promise.allSettled(inserts);
      return res.status(200).json({ success: true, count: inserts.length });
    }

    // GET: fetch authoritative registries from Supabase cashback_requests
    const { data: rows } = await supabase
      .from('cashback_requests')
      .select('request_id, qr_serial, flag_reason, timestamp')
      .in('qr_serial', [
        'DURAGRIT_SKUS_REGISTRY',
        'DURAGRIT_BATCHES_REGISTRY',
        'DURAGRIT_VENDORS_STORE_V1',
        'DURAGRIT_VENDOR_EVENT',
        'DURAGRIT_DELETED_KEYS',
        'DURAGRIT_SMTP_CONFIG'
      ])
      .order('timestamp', { ascending: false })
      .limit(100);

    const responseData = {
      skus: [],
      batches: [],
      vendors: [],
      deletedKeys: [],
      smtpConfig: null
    };

    const vendorEvents = [];
    (rows || []).forEach((r) => {
      try {
        const parsed = JSON.parse(r.flag_reason || '[]');
        if (r.qr_serial === 'DURAGRIT_SKUS_REGISTRY' && responseData.skus.length === 0 && Array.isArray(parsed)) {
          responseData.skus = parsed;
        } else if (r.qr_serial === 'DURAGRIT_BATCHES_REGISTRY' && responseData.batches.length === 0 && Array.isArray(parsed)) {
          responseData.batches = parsed;
        } else if (r.qr_serial === 'DURAGRIT_VENDORS_STORE_V1' && responseData.vendors.length === 0 && Array.isArray(parsed)) {
          responseData.vendors = parsed;
        } else if (r.qr_serial === 'DURAGRIT_VENDOR_EVENT') {
          vendorEvents.push({ ...parsed, timestamp: r.timestamp });
        } else if (r.qr_serial === 'DURAGRIT_SMTP_CONFIG' && !responseData.smtpConfig && typeof parsed === 'object') {
          responseData.smtpConfig = parsed;
        } else if (r.qr_serial === 'DURAGRIT_DELETED_KEYS' && Array.isArray(parsed)) {
          parsed.forEach((k) => {
            if (!responseData.deletedKeys.includes(k)) responseData.deletedKeys.push(k);
          });
        }
      } catch (_) {}
    });

    // Fold vendor events chronologically into responseData.vendors
    if (vendorEvents.length > 0) {
      const vMap = new Map();
      responseData.vendors.forEach((v) => {
        const id = String(v.vendorId || v.id || '').toUpperCase();
        if (id) vMap.set(id, v);
      });
      vendorEvents.reverse().forEach((ev) => {
        const id = String(ev.vendorId || ev.vendor?.vendorId || ev.vendor?.id || '').toUpperCase();
        if (!id) return;
        if (ev.action === 'DELETE') {
          vMap.delete(id);
        } else if (ev.vendor) {
          const prev = vMap.get(id) || {};
          vMap.set(id, { ...prev, ...ev.vendor });
        }
      });
      responseData.vendors = Array.from(vMap.values());
    }

    const DEFAULT_SEEDS = [
      'DG-ADH-01',
      'DG-ADH-02',
      'DG-PRM-03',
      'DG-WPF-04',
      'VEN-001',
      'VEN-002',
      'VEN-003',
      'CB-TEST-VERIFY-99',
      'DG-TEST-SERIAL-99',
      'CB-VERIFY-ROW-COUNT',
      'DG-TEST-99',
      'SYNC-VENDOR-TEST-1',
      'SYNC-DATA-1',
      'TEST_SYNC_1794219328616',
      'TEST_SERIAL',
      'TEST_CHECK_1794231268339',
      'TEST_CHECK_2_1794231269625',
      'TEST_SERIAL_2',
      'TEST-REQ-99',
      'DURAGRIT_TEST'
    ];
    DEFAULT_SEEDS.forEach((k) => {
      if (!responseData.deletedKeys.includes(k)) responseData.deletedKeys.push(k);
    });

    const deletedUpperSet = new Set(responseData.deletedKeys.map((k) => String(k).toUpperCase()));
    responseData.vendors = responseData.vendors.filter(
      (v) => !deletedUpperSet.has(String(v.vendorId || v.id || '').toUpperCase())
    );

    if (responseData.skus.length === 0) {
      responseData.skus = [
        {
          id: 'SKU-DA-777',
          skuCode: 'DA-777',
          name: 'duragrit DA 777',
          category: 'Adhesives',
          subCategory: 'High-Polymer Vitrified',
          packSize: '20 kg',
          packWeight: '20 kg',
          mrp: 650,
          baseMrp: 650,
          dealerPrice: 480,
          contractorPrice: 530,
          cashbackAmount: 150,
          cashbackReward: 150,
          rewardPoints: 600,
          gstPercent: 18,
          hsnCode: '38245090',
          minBatchQty: 100,
          batchesCount: 1,
          activeBatchesCount: 1,
          status: 'Active',
          isActive: true,
          description: 'DuraGrit DA 777 High Polymer Polymer-Modified Adhesive for Vitrified & Large Format Tiles.'
        }
      ];
    }

    return res.status(200).json(responseData);
  } catch (err) {
    console.error('api/sync error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

