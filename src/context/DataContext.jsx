import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  subscribeToAllRealtimeTables,
} from '../services/supabaseClient';
import { QREngineV24 } from '../services/qrEngine';
import { NPCIGateway } from '../services/npciGateway';
import {
  sendCashbackReceiptEmail,
  sendKycApprovalEmail,
  getSmtpConfig,
  saveSmtpConfig,
  resolveSmtpConfig,
  persistSmtpConfigLocal,
  DEFAULT_SMTP_CONFIG,
} from '../services/emailService';

// =====================================================================
// DuraGrit Vitrified — Unified Live Data Layer (Zero Sample Data)
// Simultaneously synchronizes:
//   1. Supabase PostgreSQL + Realtime (products, profiles, vendors, qr_batches, qr_tokens, cashback_requests)
//   2. Cross-Port Sync Bridge (:3000 <-> :3001 via /api/dev-sync)
//   3. Browser localStorage v7 Clean-Slate Cache
// =====================================================================

const DataContext = createContext();

const SB_ONLINE = isSupabaseConfigured();

const LIVE_VERCEL_SYNC_URL = 'https://duragrit-virtrified-admin.vercel.app/api/sync';

// Pure Live Architecture — always connect to live Vercel & Supabase
// Under NO circumstances should mobile devices (Capacitor/WebView) attempt to connect to localhost:3000!
const DEV_SYNC_URL =
  typeof window !== 'undefined' &&
  window.location.hostname === 'duragrit-virtrified-admin.vercel.app'
    ? '/api/sync'
    : LIVE_VERCEL_SYNC_URL;

const STORAGE_KEYS = {
  CLEAN_FLAG: 'duragrit_clean_slate_v7',
  SKUS: 'duragrit_skus_v7',
  USERS: 'duragrit_users_v7',
  VENDORS: 'duragrit_vendors_v7',
  BATCHES: 'duragrit_batches_v7',
  CLAIMS: 'duragrit_claims_v7',
  DELETED: 'duragrit_deleted_keys_v7',
  ORDERS: 'duragrit_vendor_orders_v7',
};

// Legacy seed filters disabled — all Supabase records are preserved and synchronized
const LEGACY_SEED_SKUS = new Set();
const LEGACY_SEED_VENDORS = new Set();
const LEGACY_SEED_MOBILES = new Set();

export const PROTECTED_KEYS = new Set([
  'VND-101', 'VND-102', 'VND-103', 'VND-104', 'VND-105',
  '8826021114', '9876543210', '9811223344', '9825100000', '9825200000', '9820144521', '9898012345',
  'SKU-DA-777', 'DA-777', 'DA 777', 'ORD-882101', 'ORD-882102', 'ORD-882103'
]);

// One-time cleanup of all older seeded localStorage keys
try {
  const legacyKeys = [
    'duragrit_skus_v2', 'duragrit_skus_v3', 'duragrit_skus_v4', 'duragrit_skus_v5', 'duragrit_skus_v6',
    'duragrit_users_v2', 'duragrit_users_directory_v2', 'duragrit_users_v5', 'duragrit_users_v6',
    'duragrit_vendors_v2', 'duragrit_vendors_v3', 'duragrit_vendors_v4', 'duragrit_vendor_dir_v1', 'duragrit_vendor_dir_v3', 'duragrit_vendors_v6',
    'duragrit_batches_v2', 'duragrit_batches_v3', 'duragrit_batches_v6',
    'duragrit_claims_v2', 'duragrit_claims_v3', 'duragrit_claims_v6',
    'duragrit_email_dispatches_v1', 'duragrit_app_installs_v1',
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(STORAGE_KEYS.CLEAN_FLAG, 'true');
} catch (_) {}

const loadStorage = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
};

export const BASE_REGISTERED_VENDORS = [
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
    active: true,
  },
  {
    id: 'VND-102',
    vendorId: 'VND-102',
    companyName: 'JEEE Toure',
    contactPerson: 'Sunaj Sahoo',
    phone: '9876543210',
    mobile: '9876543210',
    email: 'sahoo.sunaj@gmail.com',
    passkey: '1234',
    tempPassword: '1234',
    password: '1234',
    pass: '1234',
    status: 'ACTIVE',
    accountStatus: 'Active',
    category: 'Tile Contractor / Applicator',
    location: 'Morbi Central Hub, Gujarat',
    active: true,
  },
  {
    id: 'VND-103',
    vendorId: 'VND-103',
    companyName: 'RR Agency',
    contactPerson: 'Rohit Verma',
    phone: '9811223344',
    mobile: '9811223344',
    email: 'rohit.agency@gmail.com',
    passkey: '1234',
    tempPassword: '1234',
    password: '1234',
    pass: '1234',
    status: 'ACTIVE',
    accountStatus: 'Active',
    category: 'Tile Contractor / Applicator',
    location: 'Morbi Central Hub, Gujarat',
    active: true,
  }
];

const normalizeMobile = (m) => String(m || '').replace(/\D/g, '').slice(-10);

const toDbProductCategory = (cat) => {
  const s = String(cat || '').toLowerCase();
  if (s.includes('grout') || s.includes('epoxy')) return 'Grouts';
  if (s.includes('primer') || s.includes('bond') || s.includes('latex') || s.includes('sbr')) return 'Primers';
  if (s.includes('water') || s.includes('hydro') || s.includes('seal')) return 'Waterproofing';
  return 'Adhesives';
};

const toDbVendorCategory = (cat) => {
  const s = String(cat || '').toLowerCase();
  if (s.includes('chem') || s.includes('polymer') || s.includes('epoxy')) return 'Chemicals';
  if (s.includes('pack') || s.includes('print') || s.includes('foil') || s.includes('bag')) return 'Packaging';
  if (s.includes('logis') || s.includes('trans') || s.includes('fleet')) return 'Logistics';
  if (s.includes('mach') || s.includes('kiln') || s.includes('plant')) return 'Machinery';
  return 'Raw materials';
};

const toDbRole = (role) => {
  const r = String(role || 'Contractor').trim();
  if (['Contractor', 'Dealer', 'Admin', 'Mason', 'Vendor'].includes(r)) return r;
  if (r.toLowerCase().includes('deal') || r.toLowerCase().includes('dist')) return 'Dealer';
  if (r.toLowerCase().includes('mason')) return 'Mason';
  if (r.toLowerCase().includes('vend')) return 'Vendor';
  return 'Contractor';
};

const toDbPayoutMethod = (mode) => {
  const m = String(mode || 'UPI').toUpperCase();
  if (m.includes('IMPS')) return 'IMPS';
  if (m.includes('NEFT') || m.includes('BANK') || m.includes('RTGS')) return 'NEFT';
  return 'UPI';
};

// Map Supabase rows -> UI objects
const mapProductFromDb = (row) => {
  const uiMeta = row.metadata || row.pricing_tiers?._ui || {};
  const mrp = Number(uiMeta.mrp ?? row.base_mrp ?? 0);
  const cashback = Number(uiMeta.cashbackAmount ?? row.cashback_reward ?? 0);
  return {
    ...uiMeta,
    id: uiMeta.id || row.id,
    supabaseId: row.id,
    skuCode: row.sku_code,
    name: row.name,
    category: uiMeta.category || row.category || 'Adhesives',
    subCategory: uiMeta.subCategory || row.category || 'Standard Grade',
    packSize: uiMeta.packSize || row.pack_weight || '20 kg',
    packWeight: row.pack_weight || uiMeta.packSize || '20 kg',
    mrp,
    baseMrp: mrp,
    dealerPrice: Number(uiMeta.dealerPrice ?? row.pricing_tiers?.dealer ?? Math.round(mrp * 0.75)),
    contractorPrice: Number(uiMeta.contractorPrice ?? row.pricing_tiers?.contractor ?? Math.round(mrp * 0.82)),
    cashbackAmount: cashback,
    cashbackReward: cashback,
    rewardPoints: Number(uiMeta.rewardPoints ?? cashback * 4),
    gstPercent: Number(uiMeta.gstPercent ?? 18),
    hsnCode: uiMeta.hsnCode || '38245090',
    minBatchQty: Number(row.initial_batch_qty ?? uiMeta.minBatchQty ?? 100),
    batchesCount: Number(row.active_batches_count ?? uiMeta.batchesCount ?? 0),
    activeBatchesCount: Number(row.active_batches_count ?? uiMeta.batchesCount ?? 0),
    securitySpec: row.security_spec || uiMeta.securitySpec || 'TF-256-UV Foil Dual-Stage',
    description: row.description || uiMeta.description || '',
    status: row.is_active === false ? 'Discontinued' : (uiMeta.status || 'Active'),
    isActive: row.is_active !== false,
    createdAt: row.created_at || uiMeta.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : (uiMeta.updatedAt || 0),
  };
};

const mapProfileFromDb = (row) => {
  const meta = row.metadata || {};
  const displayId = meta.displayId || meta.id || `USR-${String(row.mobile || '').slice(-4) || '1001'}`;
  const isActive = row.account_status === 'Active' || row.account_status === 'ACTIVE';
  const locParts = String(row.location || '').split(',').map((s) => s.trim());
  const passkey = meta.passkey || row.terminal_key || `Dura#${String(row.mobile || '').slice(-4) || '1234'}`;
  return {
    ...meta,
    id: String(displayId).replace(/^USR-/i, ''),
    userId: String(displayId).startsWith('USR-') ? displayId : `USR-${displayId}`,
    supabaseId: row.id,
    name: row.full_name,
    fullLegalName: row.full_name,
    firmName: meta.firmName || row.hub_depot || '',
    role: meta.uiRole || row.role || 'Contractor',
    mobile: row.mobile,
    mobileLoginId: row.mobile,
    email: row.email || '',
    city: meta.city || locParts[0] || '',
    state: row.state || meta.state || locParts[1] || 'Gujarat',
    location: row.location || `${meta.city || ''}${row.state ? ', ' + row.state : ''}`,
    kycStatus: row.kyc_status || 'Pending',
    emailVerified: meta.emailVerified || (row.kyc_status === 'Verified' ? 'Verified' : 'Pending'),
    active: isActive,
    accountStatus: isActive ? 'Active' : 'Suspended',
    tierLevel: row.tier_level || meta.tierLevel || 'Registered Partner',
    panNumber: row.pan_number || meta.panNumber || '',
    aadhaarNo: meta.aadhaarNo || '',
    upi: row.vpa_upi_id || meta.upi || '',
    vpaOrIfsc: row.vpa_upi_id || meta.upi || meta.ifsc || '',
    bankName: meta.bankName || '',
    accountNo: meta.accountNo || '',
    ifsc: meta.ifsc || '',
    passkey,
    tempPassword: passkey,
    password: passkey,
    rewardBalance: Number(row.reward_balance ?? 0),
    escrowBalance: Number(row.escrow_balance ?? 0),
    scansCount: Number(row.scans_count ?? 0),
    hub: row.hub_depot || 'Morbi Central Hub',
    registeredDate: (row.created_at || new Date().toISOString()).slice(0, 10),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : (meta.updatedAt || 0),
  };
};

const mapVendorFromDb = (row) => {
  const meta = row.metadata || {};
  const isActive = row.account_status === 'Active' || row.account_status === 'ACTIVE';
  const poVal = Number(meta.poValueLakhs ?? meta.totalPayoutLakhs ?? 0);
  const relVal = Number(meta.releasedPayoutLakhs ?? meta.paidLakhs ?? 0);
  const passkey = meta.passkey || meta.tempPassword || row.passkey || '1234';
  return {
    ...meta,
    id: row.vendor_id,
    vendorId: row.vendor_id,
    supabaseId: row.id,
    companyName: row.company_name,
    name: row.company_name,
    category: meta.uiCategory || row.category || 'Raw materials',
    gstin: row.gstin || meta.gstin || '',
    gstinVerified: row.gstin_verified !== false,
    contactPerson: row.contact_person || meta.contactPerson || '',
    phone: row.phone || meta.phone || '',
    mobile: row.phone || meta.phone || '',
    email: row.email || meta.email || '',
    location: row.location || meta.location || '',
    avatarUrl: row.avatar_url || meta.avatarUrl || meta.profileImage || meta.logoUrl || '',
    profileImage: row.avatar_url || meta.avatarUrl || meta.profileImage || meta.logoUrl || '',
    city: meta.city || String(row.location || '').split(',')[0]?.trim() || '',
    state: row.state || meta.state || 'Gujarat',
    status: isActive ? 'ACTIVE' : 'INACTIVE',
    accountStatus: row.account_status || 'Active',
    active: isActive,
    complianceScore: Number(row.compliance_score ?? 98),
    activePurchaseOrders: Number(row.active_purchase_orders ?? 0),
    poValueLakhs: poVal,
    totalPayoutLakhs: poVal,
    releasedPayoutLakhs: relVal,
    pendingPayoutLakhs: Math.max(0, Number((poVal - relVal).toFixed(2))),
    payoutHistory: meta.payoutHistory || [],
    passkey,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : (meta.updatedAt || 0),
  };
};

const mapBatchFromDb = (row, tokensRows = []) => {
  const meta = row.metadata || {};
  const batchTokens = tokensRows
    .filter((t) => t.batch_id === row.id)
    .map((t) => ({
      id: t.id,
      serialKey: t.serial_key,
      serial: t.serial_key,
      dualSha128: t.dual_sha128_hash,
      cashbackAmount: Number(t.cashback_amount ?? 0),
      qrPayloadUrl: `https://verify.duragritvitrified.com/qr/${t.serial_key}`,
      isScanned: Boolean(t.is_scanned),
      scannedBy: t.scanned_by,
      scannedAt: t.scanned_at,
    }));

  let finalTokens = batchTokens.length > 0 ? batchTokens : (meta.tokens || []);
  const qty = Number(row.quantity ?? finalTokens.length ?? 0);

  if (qty > 0 && finalTokens.length < qty) {
    const cleanSku = String(row.products?.sku_code || meta.skuCode || 'SKU').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const lotNum = String(row.lot_number || meta.lotNumber || '1001');
    const dateMatch = String(meta.prefix || row.batch_identifier || '').match(/(20\d{2})[-_]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i);
    const yyyymmm = dateMatch ? `${dateMatch[1]}${dateMatch[2].toUpperCase()}` : '2026NOV';
    const reward = Number(meta.cashbackAmount ?? row.products?.cashback_reward ?? 50);
    const filled = [];
    for (let i = 0; i < qty; i++) {
      const existingTok = finalTokens[i];
      if (existingTok && (existingTok.serialKey || existingTok.serial)) {
        filled.push(existingTok);
      } else {
        const seq = String(i + 1).padStart(6, '0');
        const serial = `DG-${cleanSku}-${yyyymmm}-${seq}`;
        filled.push({
          serialKey: serial,
          serial: serial,
          serial_token_id: serial,
          verification_url: `https://verify.duragritvitrified.com/qr/${serial}`,
          qrPayloadUrl: `https://verify.duragritvitrified.com/qr/${serial}`,
          sku_code: cleanSku,
          cashback_inr: reward,
          cashbackAmount: reward,
          lotNumber: lotNum,
          isScanned: false,
        });
      }
    }
    finalTokens = filled;
  }

  const scannedCount = finalTokens.filter((t) => t.isScanned).length;

  return {
    ...meta,
    id: row.batch_identifier,
    batchId: row.batch_identifier,
    supabaseId: row.id,
    skuId: meta.skuId || row.product_id || '',
    skuCode: meta.skuCode || row.products?.sku_code || '',
    productName: meta.productName || row.products?.name || 'DuraGrit Product',
    packSize: meta.packSize || row.products?.pack_weight || '20 kg',
    mrp: Number(meta.mrp ?? row.products?.base_mrp ?? 0),
    lotNumber: row.lot_number,
    quantity: qty,
    scannedCount,
    cashbackAmount: Number(meta.cashbackAmount ?? finalTokens[0]?.cashbackAmount ?? row.products?.cashback_reward ?? 0),
    discountTier: row.discount_tier || 'Standard Master Tier',
    expDate: row.expiry_date || meta.expDate || '',
    mfgDate: meta.mfgDate || (row.created_at || '').slice(0, 10),
    plantLine: meta.plantLine || 'Morbi Line 01',
    status: row.status || 'Active',
    createdAt: row.created_at || new Date().toISOString(),
    tokens: finalTokens,
    codes: finalTokens,
    updatedAt: meta.updatedAt || new Date(row.created_at || Date.now()).getTime(),
  };
};

const mapClaimFromDb = (row) => {
  let meta = row.metadata || {};
  if (row.flag_reason && typeof row.flag_reason === 'string' && row.flag_reason.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(row.flag_reason);
      meta = { ...meta, ...parsed };
    } catch (_) {}
  }
  const status = row.status || 'Pending';
  let payoutStatus = meta.payoutStatus || 'Awaiting Approval';
  if (status === 'Approved') payoutStatus = 'Pending Release';
  else if (status === 'Disbursed') payoutStatus = 'Disbursed';
  else if (status === 'Rejected' || status === 'Flagged') payoutStatus = 'Rejected';

  const gross = Number(row.claim_value ?? meta.amount ?? 0);
  const net = Number(row.net_disbursed || meta.disbursedAmount || gross);
  const cleanFlagReason = (row.flag_reason && !row.flag_reason.trim().startsWith('{')) ? row.flag_reason : (meta.remarks || meta.flagReason || '');

  return {
    ...meta,
    id: row.request_id || row.id,
    requestId: row.request_id,
    claimNumber: row.request_id,
    supabaseId: row.id,
    userId: meta.userId || (row.profiles?.mobile ? `USR-${String(row.profiles.mobile).slice(-4)}` : ''),
    userSupabaseId: row.user_id,
    userName: meta.userName || row.profiles?.full_name || 'Registered Partner',
    userMobile: meta.userMobile || meta.mobile || row.profiles?.mobile || '',
    mobile: meta.mobile || meta.userMobile || row.profiles?.mobile || '',
    userRole: meta.userRole || row.profiles?.role || 'Contractor',
    vendorName: meta.vendorName || meta.vendor || meta.companyName || '',
    vendorId: meta.vendorId || meta.vendor_id || '',
    location: meta.location || row.profiles?.location || 'Morbi, GJ',
    productName: meta.productName || 'DuraGrit Verified Pack',
    skuCode: meta.skuCode || '',
    serialKey: row.qr_serial,
    qrSerial: row.qr_serial,
    batchCode: row.qr_serial,
    amount: gross,
    claimValue: gross,
    tdsDeducted: Number(row.tds_deducted ?? 0),
    netDisbursed: net,
    disbursedAmount: status === 'Disbursed' ? net : Number(meta.disbursedAmount || 0),
    payoutMethod: meta.paymentMode || row.payout_method || 'UPI',
    paymentMode: meta.paymentMode || row.payout_method || 'UPI',
    upiId: row.vpa_or_ifsc || meta.upiId || '',
    vpaOrIfsc: row.vpa_or_ifsc || meta.upiId || '',
    bankAccount: meta.bankAccount || '',
    ifsc: meta.ifsc || '',
    status,
    payoutStatus,
    proofUrl: row.proof_url || meta.proofUrl || null,
    proofImageUrl: row.proof_url || meta.proofUrl || null,
    paymentProofUrl: meta.paymentProofUrl || null,
    npciRrn: row.npci_rrn || meta.transactionId || '',
    transactionId: row.npci_rrn || meta.transactionId || '',
    utr: row.npci_rrn || meta.transactionId || '',
    remarks: meta.remarks || cleanFlagReason,
    flagReason: cleanFlagReason,
    disbursedAt: row.disbursed_at || meta.disbursedAt || (status === 'Disbursed' ? (row.updated_at || null) : null),
    approvedAt: meta.approvedAt || row.approved_at || (status === 'Approved' || status === 'Disbursed' ? (row.updated_at || row.timestamp) : null),
    rejectedAt: meta.rejectedAt || row.rejected_at || (status === 'Rejected' || status === 'Flagged' ? (row.updated_at || row.timestamp) : null),
    decisionAt: meta.approvedAt || meta.rejectedAt || row.approved_at || row.rejected_at || (status !== 'Pending' ? (row.updated_at || row.timestamp) : null),
    submittedAt: row.timestamp || meta.submittedAt || new Date().toISOString(),
    date: meta.date || new Date(row.timestamp || Date.now()).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : (meta.updatedAt || 0),
  };
};

// Merge helper: combines Supabase rows + Dev-Sync rows using newer timestamp
function mergeCollections(sbList, syncList, getKey, deletedSet) {
  const map = new Map();

  (syncList || []).forEach((item) => {
    const key = getKey(item);
    if (!key || (deletedSet.has(key) && !PROTECTED_KEYS.has(key))) return;
    map.set(key, item);
  });

  (sbList || []).forEach((sbItem) => {
    const key = getKey(sbItem);
    if (!key || (deletedSet.has(key) && !PROTECTED_KEYS.has(key))) return;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, sbItem);
    } else {
      const sbTime = Number(sbItem.updatedAt || 0);
      const localTime = Number(existing.updatedAt || 0);
      if (sbTime >= localTime) {
        map.set(key, {
          ...existing,
          ...sbItem,
          passkey: existing.passkey || existing.tempPassword || sbItem.passkey || '1234',
          tempPassword: existing.tempPassword || existing.passkey || sbItem.tempPassword || '1234',
          supabaseId: sbItem.supabaseId || existing.supabaseId,
          tokens: sbItem.tokens?.length ? sbItem.tokens : (existing.tokens || []),
          codes: sbItem.codes?.length ? sbItem.codes : (existing.codes || []),
          paymentProofUrl: sbItem.paymentProofUrl || existing.paymentProofUrl || null,
        });
      } else {
        map.set(key, {
          ...sbItem,
          ...existing,
          passkey: existing.passkey || existing.tempPassword || sbItem.passkey || '1234',
          tempPassword: existing.tempPassword || existing.passkey || sbItem.tempPassword || '1234',
          supabaseId: sbItem.supabaseId || existing.supabaseId,
        });
      }
    }
  });

  return Array.from(map.values());
}

const DEFAULT_DELETED_SEEDS = [
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

export const isTestOrInternalClaim = (c, deletedSet = new Set()) => {
  if (!c) return true;
  const reqId = String(c.request_id || c.requestId || c.claimNumber || c.id || '').toUpperCase();
  const qr = String(c.qr_serial || c.qrSerial || c.serialKey || '').toUpperCase();
  if (
    reqId.startsWith('SYNC') ||
    reqId.startsWith('VERIFY_EVENT') ||
    reqId.startsWith('CLAIM_ACTION_EVENT') ||
    reqId.startsWith('DURAGRIT_VENDOR') ||
    reqId.startsWith('TEST') ||
    reqId.startsWith('CB-TEST') ||
    reqId.startsWith('CB-VERIFY') ||
    qr.startsWith('DURAGRIT') ||
    qr.startsWith('TEST') ||
    qr.startsWith('SYNC') ||
    qr.startsWith('DG-TEST')
  ) {
    return true;
  }
  if (deletedSet.has(reqId) || deletedSet.has(qr)) {
    return true;
  }
  return false;
};

const DEFAULT_LIVE_SKUS = [
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
    description: 'DuraGrit DA 777 High Polymer Polymer-Modified Adhesive for Vitrified & Large Format Tiles.',
    createdAt: '2026-11-09T10:19:23.951Z',
    updatedAt: 1794219563952,
  }
];

export const DEFAULT_INITIAL_ORDERS = [
  {
    id: 'ORD-882101',
    orderNumber: 'ORD-882101',
    vendorId: 'VND-101',
    vendorName: 'Morbi Cerachem Tiles & Adhesives',
    vendorPhone: '8826021114',
    vendorEmail: 'duragrit07@gmail.com',
    vendorLocation: 'Morbi Industrial Hub, Gujarat',
    items: [
      {
        skuCode: 'DA-777',
        name: 'DuraGrit DA 777 High Polymer Tile Adhesive',
        category: 'Adhesives',
        quantity: 300,
        unit: 'Bags',
        packSize: '20 kg Kraft Bag',
      },
      {
        skuCode: 'EG-200',
        name: 'DuraGrit Premium Epoxy Grout 2K',
        category: 'Grouts',
        quantity: 100,
        unit: 'Buckets',
        packSize: '5 kg Plastic Bucket',
      }
    ],
    totalItems: 2,
    totalQuantity: 400,
    status: 'Confirmed',
    deliveryAddress: 'Plot No. 42, GIDC Phase II, Morbi - 363642',
    deliveryHub: 'Yard Hub 04 - Morbi GIDC',
    notes: 'Please dispatch via morning batch truck. Contact godown manager before loading.',
    createdAt: '2026-11-10T14:30:00.000Z',
    updatedAt: '2026-11-10T16:00:00.000Z',
  },
  {
    id: 'ORD-882102',
    orderNumber: 'ORD-882102',
    vendorId: 'VND-102',
    vendorName: 'Gujarat Vitrified & Chemical Supplies',
    vendorPhone: '9825100000',
    vendorEmail: 'gujarat.vitrified@gmail.com',
    vendorLocation: 'Ahmedabad Ring Road, Gujarat',
    items: [
      {
        skuCode: 'WP-SBR',
        name: 'DuraGrit SBR LatexFibre Waterproofing Primer',
        category: 'Waterproofing',
        quantity: 150,
        unit: 'Cans',
        packSize: '20 Liter Drum',
      }
    ],
    totalItems: 1,
    totalQuantity: 150,
    status: 'Dispatched',
    deliveryAddress: 'Ring Road Depot, Near Express Highway, Ahmedabad',
    deliveryHub: 'Ahmedabad Ring Road Depot',
    notes: 'Transport LR attached. Dispatch via Gujarat Fast Logistics.',
    createdAt: '2026-11-09T11:15:00.000Z',
    updatedAt: '2026-11-10T09:20:00.000Z',
  },
  {
    id: 'ORD-882103',
    orderNumber: 'ORD-882103',
    vendorId: 'VND-103',
    vendorName: 'Royal Vitrified Applicators & Tiles',
    vendorPhone: '9825200000',
    vendorEmail: 'royal.tiles@gmail.com',
    vendorLocation: 'Surat Industrial Estate, Gujarat',
    items: [
      {
        skuCode: 'DA-555',
        name: 'DuraGrit DA 555 Premium Tile Adhesive',
        category: 'Adhesives',
        quantity: 250,
        unit: 'Bags',
        packSize: '20 kg Bag',
      },
      {
        skuCode: 'WP-100',
        name: 'DuraGrit Liquid Acrylic Waterproofing',
        category: 'Waterproofing',
        quantity: 80,
        unit: 'Cans',
        packSize: '10 Liter Can',
      }
    ],
    totalItems: 2,
    totalQuantity: 330,
    status: 'Pending',
    deliveryAddress: 'Gate 3, Surat Central Logistics Park, Surat',
    deliveryHub: 'Surat Industrial Depot Hub',
    notes: 'Urgent material requirement for township project. Earliest dispatch requested.',
    createdAt: '2026-11-11T09:10:00.000Z',
    updatedAt: '2026-11-11T09:10:00.000Z',
  }
];

export const DataProvider = ({ children }) => {
  const deletedKeysRef = useRef(new Set(
    [
      ...DEFAULT_DELETED_SEEDS,
      ...loadStorage(STORAGE_KEYS.DELETED, DEFAULT_DELETED_SEEDS)
    ].filter((k) => !PROTECTED_KEYS.has(String(k).toUpperCase()))
  ));

  const [orders, setOrders] = useState(() => {
    const loaded = loadStorage(STORAGE_KEYS.ORDERS, DEFAULT_INITIAL_ORDERS);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : DEFAULT_INITIAL_ORDERS;
  });
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const [skus, setSkus] = useState(() => {
    const raw = loadStorage(STORAGE_KEYS.SKUS, DEFAULT_LIVE_SKUS);
    const filtered = (raw || []).filter((s) => !deletedKeysRef.current.has(String(s.skuCode || s.id || '').toUpperCase()));
    return filtered.length > 0 ? filtered : DEFAULT_LIVE_SKUS;
  });
  const skusRef = useRef(skus);
  useEffect(() => {
    skusRef.current = skus;
  }, [skus]);

  const [users, setUsers] = useState(() => loadStorage(STORAGE_KEYS.USERS, []));
  const [vendors, setVendors] = useState(() => {
    const list = loadStorage(STORAGE_KEYS.VENDORS, BASE_REGISTERED_VENDORS);
    const has101 = list.some((v) => String(v.phone || v.mobile || '').includes('8826021114'));
    if (!has101) return [...BASE_REGISTERED_VENDORS, ...list];
    return list;
  });
  const vendorsRef = useRef(vendors);
  useEffect(() => {
    vendorsRef.current = vendors;
  }, [vendors]);

  const [batches, setBatches] = useState(() => loadStorage(STORAGE_KEYS.BATCHES, []));
  const batchesRef = useRef(batches);
  useEffect(() => {
    batchesRef.current = batches;
  }, [batches]);

  const [claims, setClaims] = useState(() =>
    (loadStorage(STORAGE_KEYS.CLAIMS, []) || []).filter((c) => !isTestOrInternalClaim(c, deletedKeysRef.current))
  );
  const claimsRef = useRef(claims);
  useEffect(() => {
    claimsRef.current = claims;
  }, [claims]);
  const [smtpConfig, setSmtpConfig] = useState(() => getSmtpConfig());

  const [dbStatus, setDbStatus] = useState({
    connected: SB_ONLINE,
    online: SB_ONLINE,
    loading: false,
    lastSynced: new Date().toLocaleTimeString(),
    rlsLocked: false,
    error: null,
  });

  const realtimeChannelRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Push partial state to /api/sync so all clients stay mirrored
  const pushDevSync = useCallback(async (patch) => {
    try {
      await fetch(DEV_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch (_) {}
  }, []);

  // Universal Supabase Realtime Event Broadcasters (Works under all RLS policies via cashback_requests)
  const pushSkusToSupabase = useCallback(async (skusList) => {
    if (!SB_ONLINE || !Array.isArray(skusList)) return;
    try {
      await supabase.from('cashback_requests').insert({
        request_id: `SYNC_SKUS_EVENT_${Date.now()}`,
        qr_serial: 'DURAGRIT_SKUS_REGISTRY',
        claim_value: skusList.length,
        status: 'Approved',
        payout_method: 'UPI',
        flag_reason: JSON.stringify(skusList),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('pushSkusToSupabase failed:', e);
    }
  }, []);

  const pushBatchesToSupabase = useCallback(async (batchesList) => {
    if (!SB_ONLINE || !Array.isArray(batchesList)) return;
    try {
      await supabase.from('cashback_requests').insert({
        request_id: `SYNC_BATCHES_EVENT_${Date.now()}`,
        qr_serial: 'DURAGRIT_BATCHES_REGISTRY',
        claim_value: batchesList.length,
        status: 'Approved',
        payout_method: 'UPI',
        flag_reason: JSON.stringify(batchesList),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('pushBatchesToSupabase failed:', e);
    }
  }, []);

  const pushDeletedKeysToSupabase = useCallback(async () => {
    if (!SB_ONLINE || deletedKeysRef.current.size === 0) return;
    try {
      await supabase.from('cashback_requests').insert({
        request_id: `SYNC_DELETED_EVENT_${Date.now()}`,
        qr_serial: 'DURAGRIT_DELETED_KEYS',
        claim_value: deletedKeysRef.current.size,
        status: 'Approved',
        payout_method: 'UPI',
        flag_reason: JSON.stringify(Array.from(deletedKeysRef.current)),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('pushDeletedKeysToSupabase failed:', e);
    }
  }, []);

  const updateSmtpConfig = useCallback(async (newConfig, options = {}) => {
    const merged = resolveSmtpConfig(newConfig, options);
    setSmtpConfig(merged);
    saveSmtpConfig(merged, options);
    pushDevSync({ smtpConfig: merged });

    if (SB_ONLINE) {
      try {
        await supabase.from('cashback_requests').insert({
          request_id: `SYNC_SMTP_EVENT_${Date.now()}`,
          qr_serial: 'DURAGRIT_SMTP_CONFIG',
          claim_value: 1,
          status: 'Approved',
          payout_method: 'UPI',
          flag_reason: JSON.stringify(merged),
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('updateSmtpConfig Supabase push failed:', e);
      }
    }
    return merged;
  }, [pushDevSync]);

  const pushClaimActionToSupabase = useCallback(async (action) => {
    if (!SB_ONLINE || !action?.claimId) return;
    try {
      const disbursedAmt = Number(action.disbursedAmount || action.amount || 0);
      const isDisbursed = action.status === 'Disbursed';
      await supabase.from('cashback_requests').insert({
        request_id: `CLAIM_ACTION_EVENT_${action.claimId}_${Date.now()}`,
        qr_serial: 'DURAGRIT_CLAIM_ACTION',
        claim_value: disbursedAmt || 1,
        // net_disbursed: always set to actual amount when Disbursed, so mapClaimFromDb reads it correctly
        net_disbursed: isDisbursed ? disbursedAmt : 0,
        npci_rrn: action.transactionId || action.utr || action.npciRrn || null,
        disbursed_at: isDisbursed ? (action.disbursedAt || new Date().toISOString()) : null,
        status: action.status || 'Approved',
        payout_method: action.paymentMode || 'UPI',
        flag_reason: JSON.stringify(action),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('pushClaimActionToSupabase failed:', e);
    }
  }, []);

  const markDeletedKey = useCallback((key) => {
    if (!key || PROTECTED_KEYS.has(String(key).toUpperCase())) return;
    deletedKeysRef.current.add(String(key).toUpperCase());
    const arr = Array.from(deletedKeysRef.current);
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED, JSON.stringify(arr));
    } catch (_) {}
    pushDevSync({ deletedKeys: arr });
    pushDeletedKeysToSupabase();
  }, [pushDevSync, pushDeletedKeysToSupabase]);

  // Preserve all Supabase records — never delete production vendors, skus or profiles
  const purgeLegacySeedsFromSupabase = useCallback(async () => {
    return;
  }, []);

  // Master bidirectional sync loader (Supabase + Cross-Port Sync Bridge)
  const refreshAllData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // 1. Read shared cross-port bridge (:3000 <-> :3001) or /api/sync
      let bridge = null;
      try {
        const res = await fetch(DEV_SYNC_URL);
        if (res.ok) bridge = await res.json();
      } catch (_) {}

      // Immediate authoritative hydration from bridge so mobile apps show live data in < 1 second!
      if (bridge && (bridge.claims?.length || bridge.batches?.length || bridge.vendors?.length || bridge.skus?.length)) {
        if (Array.isArray(bridge.skus) && bridge.skus.length > 0) {
          skusRef.current = bridge.skus;
          setSkus(bridge.skus);
          try { localStorage.setItem(STORAGE_KEYS.SKUS, JSON.stringify(bridge.skus)); } catch (_) {}
        }
        if (Array.isArray(bridge.batches) && bridge.batches.length > 0) {
          batchesRef.current = bridge.batches;
          setBatches(bridge.batches);
          try { localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(bridge.batches)); } catch (_) {}
        }
        if (Array.isArray(bridge.vendors) && bridge.vendors.length > 0) {
          vendorsRef.current = bridge.vendors;
          setVendors(bridge.vendors);
          try { localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(bridge.vendors)); } catch (_) {}
        }
        if (Array.isArray(bridge.users) && bridge.users.length > 0) {
          setUsers(bridge.users);
          try { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(bridge.users)); } catch (_) {}
        }
        if (Array.isArray(bridge.orders) && bridge.orders.length > 0) {
          ordersRef.current = bridge.orders;
          setOrders(bridge.orders);
          try { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(bridge.orders)); } catch (_) {}
        }
        if (Array.isArray(bridge.claims) && bridge.claims.length > 0) {
          claimsRef.current = bridge.claims;
          setClaims(bridge.claims);
          try { localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(bridge.claims)); } catch (_) {}
        }
        setDbStatus((prev) => ({
          ...prev,
          connected: true,
          online: true,
          loading: false,
          lastSynced: new Date().toLocaleTimeString(),
        }));
      }

      if (Array.isArray(bridge?.deletedKeys)) {
        bridge.deletedKeys.forEach((k) => {
          const uk = String(k).toUpperCase();
          if (!PROTECTED_KEYS.has(uk)) {
            deletedKeysRef.current.add(uk);
          }
        });
      }
      const deletedSet = deletedKeysRef.current;

      const userCreatedSkus = new Set((bridge?.skus || []).map((s) => String(s.skuCode || '').toUpperCase()));
      const userCreatedVendors = new Set((bridge?.vendors || []).map((v) => String(v.vendorId || v.id || '').toUpperCase()));
      const userCreatedMobiles = new Set((bridge?.users || []).map((u) => normalizeMobile(u.mobile)));

      // 2. Read live Supabase tables
      let sbSkus = [];
      let sbUsers = [];
      let sbVendors = [];
      let sbBatches = [];
      let sbClaims = [];
      let sbConnected = false;
      let registrySkus = [];
      let registryBatches = [];

      if (SB_ONLINE) {
        const [
          prodRes,
          profRes,
          vendRes,
          batchRes,
          tokRes,
          realClaimRes,
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
          supabase.from('profiles').select('*').neq('role', 'Admin').order('created_at', { ascending: false }),
          supabase.from('vendors').select('*').order('created_at', { ascending: false }),
          supabase.from('qr_batches').select('*, products(name, sku_code, pack_weight, base_mrp, cashback_reward)').order('created_at', { ascending: false }),
          supabase.from('qr_tokens').select('*').order('created_at', { ascending: true }),
          // 1. Authoritative real cashback claims (isolated from internal event streams)
          supabase.from('cashback_requests')
            .select('*, profiles(full_name, mobile, role, location)')
            .not('qr_serial', 'ilike', 'DURAGRIT_%')
            .not('request_id', 'ilike', 'SYNC_%')
            .not('request_id', 'ilike', 'CLAIM_ACTION_%')
            .not('request_id', 'ilike', 'VERIFY_EVENT_%')
            .not('request_id', 'ilike', 'DURAGRIT_VENDOR_%')
            .order('timestamp', { ascending: false })
            .limit(100),
          // 2. High-speed targeted event streams
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
          // 3. Latest SMTP config snapshot
          supabase.from('cashback_requests')
            .select('*')
            .or('qr_serial.eq.DURAGRIT_SMTP_CONFIG,request_id.ilike.SYNC_SMTP_%')
            .order('timestamp', { ascending: false })
            .limit(1),
        ]);

        const rawRealClaims = realClaimRes.status === 'fulfilled' && !realClaimRes.value.error ? (realClaimRes.value.data || []) : [];
        const rawBatchEvents = batchEventRes.status === 'fulfilled' && !batchEventRes.value.error ? (batchEventRes.value.data || []) : [];
        const rawOrderEvents = orderEventRes.status === 'fulfilled' && !orderEventRes.value.error ? (orderEventRes.value.data || []) : [];
        const rawDeletedEvents = deletedEventRes.status === 'fulfilled' && !deletedEventRes.value.error ? (deletedEventRes.value.data || []) : [];
        const rawSkuEvents = skuEvtRes.status === 'fulfilled' && !skuEvtRes.value.error ? (skuEvtRes.value.data || []) : [];
        const rawVendorEvents = vendorEvtRes.status === 'fulfilled' && !vendorEvtRes.value.error ? (vendorEvtRes.value.data || []) : [];
        const rawClaimActs = claimActRes.status === 'fulfilled' && !claimActRes.value.error ? (claimActRes.value.data || []) : [];
        const rawVerifyActs = verifyActRes.status === 'fulfilled' && !verifyActRes.value.error ? (verifyActRes.value.data || []) : [];
        const rawEvents = [
          ...rawDeletedEvents,
          ...rawBatchEvents,
          ...rawOrderEvents,
          ...rawSkuEvents,
          ...rawVendorEvents,
          ...rawClaimActs,
          ...rawVerifyActs
        ];
        const rawSmtp = smtpRes.status === 'fulfilled' && !smtpRes.value.error ? (smtpRes.value.data || []) : [];
        const allClaimsRows = [...rawRealClaims, ...rawEvents, ...rawSmtp];

        // A. Process Deleted Keys from Supabase
        allClaimsRows.forEach((row) => {
          if (row.qr_serial === 'DURAGRIT_DELETED_KEYS' || (row.request_id && String(row.request_id).startsWith('SYNC_DELETED_'))) {
            try {
              const keys = JSON.parse(row.flag_reason || '[]');
              if (Array.isArray(keys)) {
                keys.forEach((k) => {
                  const uk = String(k).toUpperCase();
                  if (!PROTECTED_KEYS.has(uk)) {
                    deletedKeysRef.current.add(uk);
                  }
                });
              }
            } catch (_) {}
          }
        });

        // B. Process Authoritative SKUs Registry from Supabase (Merge all chronological snapshots + in-memory ref)
        const skuMap = new Map();
        if (prodRes.status === 'fulfilled' && !prodRes.value.error) {
          sbConnected = true;
          (prodRes.value.data || []).map(mapProductFromDb).forEach((s) => {
            const sCode = String(s.skuCode || s.id || '').toUpperCase();
            if (sCode && !deletedSet.has(sCode)) skuMap.set(sCode, s);
          });
        }

        const skuRows = allClaimsRows
          .filter((c) => c.qr_serial === 'DURAGRIT_SKUS_REGISTRY' || (c.request_id && String(c.request_id).startsWith('SYNC_SKUS_')))
          .sort((a, b) => new Date(a.timestamp || a.created_at || 0) - new Date(b.timestamp || b.created_at || 0));

        skuRows.forEach((row) => {
          if (row?.flag_reason) {
            try {
              const parsed = JSON.parse(row.flag_reason);
              if (Array.isArray(parsed) && parsed.length > 0) {
                sbConnected = true;
                parsed.forEach((s) => {
                  const sCode = String(s.skuCode || s.id || '').toUpperCase();
                  if (sCode && s.name && !deletedSet.has(sCode) && !deletedSet.has(String(s.id || '').toUpperCase())) {
                    const existing = skuMap.get(sCode) || {};
                    skuMap.set(sCode, { ...existing, ...s });
                  }
                });
              }
            } catch (_) {}
          }
        });

        skusRef.current.forEach((s) => {
          const sCode = String(s.skuCode || s.id || '').toUpperCase();
          if (sCode && s.name && !deletedSet.has(sCode) && !skuMap.has(sCode)) {
            skuMap.set(sCode, s);
          }
        });

        registrySkus = Array.from(skuMap.values());
        if (registrySkus.length > 0) {
          sbConnected = true;
          sbSkus = registrySkus;
        }

        // C. Process Authoritative Batches Registry from Supabase (Merge all valid chronological snapshots + in-memory ref)
        const batchMap = new Map();
        const tokenRows = tokRes.status === 'fulfilled' && !tokRes.value.error ? (tokRes.value.data || []) : [];
        if (batchRes.status === 'fulfilled' && !batchRes.value.error) {
          sbConnected = true;
          (batchRes.value.data || []).map((b) => mapBatchFromDb(b, tokenRows)).forEach((b) => {
            const bId = String(b.batchId || b.id || '').toUpperCase();
            if (bId && !deletedSet.has(bId)) batchMap.set(bId, b);
          });
        }

        const batchRows = allClaimsRows
          .filter((c) => {
            const isBatchEvent = c.qr_serial === 'DURAGRIT_BATCHES_REGISTRY' || (c.request_id && String(c.request_id).startsWith('SYNC_BATCHES_'));
            if (!isBatchEvent) return false;
            const ts = String(c.timestamp || c.created_at || '');
            return !ts || ts >= '2026-11-10';
          })
          .sort((a, b) => new Date(a.timestamp || a.created_at || 0) - new Date(b.timestamp || b.created_at || 0));

        batchRows.forEach((row) => {
          if (row?.flag_reason) {
            try {
              const parsed = JSON.parse(row.flag_reason);
              if (Array.isArray(parsed) && parsed.length > 0) {
                sbConnected = true;
                parsed.forEach((b) => {
                  const bId = String(b.batchId || b.id || '').toUpperCase();
                  const qty = Number(b.quantity || 0);
                  if (bId && bId !== 'DG-BATCH-DA777' && qty > 0 && !deletedSet.has(bId)) {
                    const existing = batchMap.get(bId) || {};
                    const existingTokens = existing.tokens || existing.codes || [];
                    const incomingTokens = b.tokens || b.codes || [];
                    let mergedTokens = incomingTokens.length >= existingTokens.length ? incomingTokens : existingTokens;

                    if (mergedTokens.length < qty) {
                      const cleanSku = String(b.skuCode || existing.skuCode || 'SKU').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                      const lotNum = String(b.lotNumber || existing.lotNumber || (bId.split('-').pop()) || '1001');
                      const dateMatch = String(b.prefix || existing.prefix || bId).match(/(20\d{2})[-_]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i);
                      const yyyymmm = dateMatch ? `${dateMatch[1]}${dateMatch[2].toUpperCase()}` : '2026NOV';
                      const reward = Number(b.cashbackAmount ?? existing.cashbackAmount ?? 50);
                      const filled = [];
                      for (let i = 0; i < qty; i++) {
                        const existingTok = mergedTokens[i];
                        if (existingTok && (existingTok.serialKey || existingTok.serial)) {
                          filled.push(existingTok);
                        } else {
                          const seq = String(i + 1).padStart(6, '0');
                          const serial = `DG-${cleanSku}-${yyyymmm}-${seq}`;
                          filled.push({
                            serialKey: serial,
                            serial: serial,
                            serial_token_id: serial,
                            verification_url: `https://verify.duragritvitrified.com/qr/${serial}`,
                            qrPayloadUrl: `https://verify.duragritvitrified.com/qr/${serial}`,
                            sku_code: b.skuCode || cleanSku,
                            cashback_inr: reward,
                            cashbackAmount: reward,
                            lotNumber: lotNum,
                            isScanned: false,
                          });
                        }
                      }
                      mergedTokens = filled;
                    }

                    batchMap.set(bId, {
                      ...existing,
                      ...b,
                      tokens: mergedTokens,
                      codes: mergedTokens,
                    });
                  }
                });
              }
            } catch (_) {}
          }
        });

        batchesRef.current.forEach((b) => {
          const bId = String(b.batchId || b.id || '').toUpperCase();
          const qty = Number(b.quantity || 0);
          if (bId && bId !== 'DG-BATCH-DA777' && qty > 0 && !deletedSet.has(bId) && !batchMap.has(bId)) {
            batchMap.set(bId, b);
          }
        });

        registryBatches = Array.from(batchMap.values()).sort((a, b) => {
          const tA = new Date(a.createdAt || a.date || a.timestamp || 0).getTime() || Number(a.updatedAt || 0);
          const tB = new Date(b.createdAt || b.date || b.timestamp || 0).getTime() || Number(b.updatedAt || 0);
          return tB - tA;
        });

        if (registryBatches.length > 0) {
          sbConnected = true;
          sbBatches = registryBatches;
        }

        // D. Process Profiles / Users
        if (profRes.status === 'fulfilled' && !profRes.value.error) {
          sbConnected = true;
          sbUsers = (profRes.value.data || [])
            .filter((r) => r.role !== 'Admin')
            .map(mapProfileFromDb);
        }

        // E. Process Vendors Registry from Supabase (Event-Sourced + Snapshots)
        if (vendRes.status === 'fulfilled' && !vendRes.value.error) {
          sbConnected = true;
          sbVendors = (vendRes.value.data || []).map(mapVendorFromDb);
        }

        const vendorMap = new Map();

        // 1. Seed base vendors
        BASE_REGISTERED_VENDORS.forEach((v) => {
          vendorMap.set(String(v.vendorId || v.id).toUpperCase(), { ...v });
        });

        // 2. Add database table vendors
        sbVendors.forEach((v) => {
          vendorMap.set(String(v.vendorId || v.id).toUpperCase(), { ...v });
        });

        // 3. Collect all vendor rows from Supabase, sort chronologically
        const vendorRows = allClaimsRows
          .filter((c) =>
            c.qr_serial === 'DURAGRIT_VENDOR_EVENT' ||
            c.qr_serial === 'DURAGRIT_VENDORS_STORE_V1' ||
            c.request_id === 'SYNC_VENDORS_REGISTRY' ||
            (c.request_id && String(c.request_id).startsWith('SYNC_VENDORS_')) ||
            (c.request_id && String(c.request_id).startsWith('DURAGRIT_VENDOR_'))
          )
          .sort((a, b) => new Date(a.timestamp || a.created_at || 0) - new Date(b.timestamp || b.created_at || 0));

        vendorRows.forEach((r) => {
          try {
            if (r.qr_serial === 'DURAGRIT_VENDOR_EVENT' || (r.request_id && String(r.request_id).startsWith('DURAGRIT_VENDOR_'))) {
              const event = JSON.parse(r.flag_reason || '{}');
              const vId = String(event.vendorId || event.vendor?.vendorId || event.vendor?.id || '').toUpperCase();
              if (vId) {
                if (event.action === 'DELETE') {
                  vendorMap.delete(vId);
                } else if (event.vendor) {
                  const existing = vendorMap.get(vId) || {};
                  const eventTime = new Date(r.timestamp || r.created_at || Date.now()).getTime();
                  vendorMap.set(vId, {
                    ...existing,
                    ...event.vendor,
                    companyName: event.vendor.companyName || event.vendor.name || existing.companyName,
                    name: event.vendor.companyName || event.vendor.name || existing.name,
                    updatedAt: Math.max(Number(event.vendor.updatedAt || 0), eventTime)
                  });
                }
              }
            } else if (r.flag_reason) {
              const parsed = JSON.parse(r.flag_reason);
              if (Array.isArray(parsed)) {
                parsed.forEach((v) => {
                  const vId = String(v.vendorId || v.id || '').toUpperCase();
                  if (vId) {
                    const existing = vendorMap.get(vId) || {};
                    const eventTime = new Date(r.timestamp || r.created_at || Date.now()).getTime();
                    vendorMap.set(vId, {
                      ...existing,
                      ...v,
                      companyName: v.companyName || v.name || existing.companyName,
                      name: v.companyName || v.name || existing.name,
                      updatedAt: Math.max(Number(v.updatedAt || 0), eventTime)
                    });
                  }
                });
              }
            }
          } catch (_) {}
        });

        // 4. Apply live verification events from Supabase
        allClaimsRows.forEach((row) => {
          if (row.request_id && String(row.request_id).startsWith('VERIFY_EVENT_')) {
            try {
              const audit = JSON.parse(row.flag_reason || '{}');
              const targetId = String(audit.vendorId || '').toUpperCase();
              const targetMobile = String(audit.mobile || '').replace(/\D/g, '').slice(-10);
              for (const [key, v] of vendorMap.entries()) {
                const vid = String(v.vendorId || v.id || '').toUpperCase();
                const vDigits = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
                if ((targetId && vid === targetId) || (targetMobile && vDigits === targetMobile)) {
                  vendorMap.set(key, {
                    ...v,
                    emailVerified: 'Verified',
                    emailVerifiedAt: audit.verifiedAt || row.timestamp,
                    verifiedWithCode: audit.code || audit.verifiedByCode || v.verificationCode,
                    status: 'ACTIVE',
                    accountStatus: 'Active',
                  });
                  break;
                }
              }
            } catch (_) {}
          }
        });

        // 5. Preserve any freshly added in-memory vendors from vendorsRef that aren't indexed yet
        vendorsRef.current.forEach((v) => {
          const vId = String(v.vendorId || v.id || '').toUpperCase();
          if (vId && !deletedSet.has(vId) && !vendorMap.has(vId)) {
            vendorMap.set(vId, v);
          }
        });

        sbVendors = Array.from(vendorMap.values()).filter(
          (v) => !deletedSet.has(String(v.vendorId || v.id || '').toUpperCase())
        );

        // F. Process Real Claims & Claim Actions
        if (
          (realClaimRes.status === 'fulfilled' && !realClaimRes.value.error) ||
          (eventRes.status === 'fulfilled' && !eventRes.value.error)
        ) {
          sbConnected = true;
          const realClaimRows = allClaimsRows.filter(
            (c) => !isTestOrInternalClaim(c, deletedSet)
          );
          sbClaims = realClaimRows.map(mapClaimFromDb);

          // Apply claim action events (Approvals, Rejections, Payouts)
          // Sort chronologically ascending (oldest to newest) so newer decisions (e.g. Disbursed)
          // always take precedence over earlier steps (e.g. Approved/Pending)
          const claimActionRows = allClaimsRows
            .filter((row) => row.request_id && String(row.request_id).startsWith('CLAIM_ACTION_EVENT_'))
            .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

          claimActionRows.forEach((row) => {
            try {
              const action = JSON.parse(row.flag_reason || '{}');
              const target = sbClaims.find((c) => c.id === action.claimId || c.requestId === action.claimId || c.supabaseId === action.claimId);
              if (target) {
                if (action.status) target.status = action.status;
                if (action.payoutStatus) target.payoutStatus = action.payoutStatus;
                if (action.transactionId) {
                  target.transactionId = action.transactionId;
                  target.utr = action.transactionId;
                  target.npciRrn = action.transactionId;
                }
                if (action.utr) {
                  target.utr = action.utr;
                  target.transactionId = target.transactionId || action.utr;
                }
                if (action.disbursedAmount !== undefined && action.disbursedAmount !== null) {
                  target.disbursedAmount = Number(action.disbursedAmount);
                  target.netDisbursed = Number(action.disbursedAmount);
                }
                if (action.vendorId) target.vendorId = action.vendorId;
                if (action.vendorName) target.vendorName = action.vendorName;
                if (action.disbursedAt) target.disbursedAt = action.disbursedAt;
                if (action.approvedAt) target.approvedAt = action.approvedAt;
                if (action.rejectedAt) target.rejectedAt = action.rejectedAt;
                if (action.paymentProofUrl) target.paymentProofUrl = action.paymentProofUrl;
                if (action.paymentMode) target.paymentMode = action.paymentMode;
                if (action.flagReason) target.flagReason = action.flagReason;
                if (action.remarks) target.remarks = action.remarks;
                target.updatedAt = Math.max(Number(target.updatedAt || 0), new Date(row.timestamp || 0).getTime());
              }
            } catch (_) {}
          });

          // Cross-reference scanned serials from sbClaims against sbBatches so scanned counts & token states stay 100% synced
          if (sbBatches.length > 0 && sbClaims.length > 0) {
            const claimedSerialMap = new Map();
            sbClaims.forEach((c) => {
              const sKey = QREngineV24.extractSerialKey(c.serialKey || c.qrSerial || c.batchCode);
              if (sKey) claimedSerialMap.set(sKey, c);
            });
            sbBatches = sbBatches.map((b) => {
              const rawTokens = b.tokens || b.codes || [];
              let changed = false;
              const syncedTokens = rawTokens.map((t) => {
                const tKey = QREngineV24.extractSerialKey(t.serialKey || t.serial || t.code);
                const matchedClaim = tKey ? claimedSerialMap.get(tKey) : null;
                if (matchedClaim && !t.isScanned) {
                  changed = true;
                  return {
                    ...t,
                    isScanned: true,
                    scannedBy: matchedClaim.userName || matchedClaim.vendorName || 'Partner',
                    scannedAt: matchedClaim.submittedAt || matchedClaim.date || new Date().toISOString(),
                  };
                }
                return t;
              });
              const scannedCount = syncedTokens.filter((t) => t.isScanned).length;
              if (changed || b.scannedCount !== scannedCount) {
                return {
                  ...b,
                  tokens: syncedTokens,
                  codes: syncedTokens,
                  scannedCount,
                };
              }
              return b;
            });
          }
        }

        // G. Process OTA Release Events from Supabase
        const otaRows = allClaimsRows.filter(
          (c) => c.qr_serial === 'DURAGRIT_OTA_RELEASE' || (c.request_id && String(c.request_id).startsWith('SYNC_RELEASE_EVENT_'))
        );
        otaRows.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        const latestOtaRow = otaRows[0];
        if (latestOtaRow?.flag_reason) {
          try {
            const relInfo = JSON.parse(latestOtaRow.flag_reason);
            if (relInfo?.version && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('duragrit:ota-release-pushed', { detail: relInfo }));
              window.dispatchEvent(new CustomEvent('duragrit:admin-ota-release-pushed', { detail: relInfo }));
            }
          } catch (_) {}
        }

        // H. Process Authoritative SMTP Config from Supabase
        const latestSmtpRow = allClaimsRows.find(
          (c) => c.qr_serial === 'DURAGRIT_SMTP_CONFIG' || (c.request_id && String(c.request_id).startsWith('SYNC_SMTP_'))
        );
        if (latestSmtpRow?.flag_reason) {
          try {
            const parsedSmtp = JSON.parse(latestSmtpRow.flag_reason);
            if (parsedSmtp && typeof parsedSmtp === 'object') {
              // Hydrate locally only — do NOT re-push to cloud on every load
              const mergedSmtp = persistSmtpConfigLocal(parsedSmtp);
              setSmtpConfig((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(mergedSmtp)) return prev;
                return mergedSmtp;
              });
            }
          } catch (_) {}
        } else if (bridge?.smtpConfig) {
          const mergedSmtp = persistSmtpConfigLocal(bridge.smtpConfig);
          setSmtpConfig((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(mergedSmtp)) return prev;
            return mergedSmtp;
          });
        }
      }

      // 3. Merge Collections with Authoritative Priority
      const nextSkus = registrySkus.length > 0
        ? sbSkus
        : mergeCollections(
            sbSkus,
            bridge?.skus ?? loadStorage(STORAGE_KEYS.SKUS, []),
            (s) => String(s.skuCode || s.id || '').toUpperCase(),
            deletedSet
          );
      const nextUsers = mergeCollections(
        sbUsers,
        bridge?.users ?? loadStorage(STORAGE_KEYS.USERS, []),
        (u) => normalizeMobile(u.mobile) || String(u.id || '').toUpperCase(),
        deletedSet
      );
      const bridgeVendors = Array.isArray(bridge?.vendors) && bridge.vendors.length > 0
        ? bridge.vendors
        : loadStorage(STORAGE_KEYS.VENDORS, BASE_REGISTERED_VENDORS);
      const nextVendors = mergeCollections(
        sbVendors,
        bridgeVendors,
        (v) => String(v.vendorId || v.id || '').toUpperCase(),
        deletedSet
      );
      // Guarantee registered vendors are never dropped
      BASE_REGISTERED_VENDORS.forEach((bv) => {
        const bvId = String(bv.vendorId || bv.id).toUpperCase();
        if (!nextVendors.some((v) => String(v.vendorId || v.id).toUpperCase() === bvId)) {
          nextVendors.push({ ...bv });
        }
      });
      vendorsRef.current = nextVendors;
      setVendors(nextVendors);
      const nextBatches = registryBatches.length > 0
        ? sbBatches
        : mergeCollections(
            sbBatches,
            bridge?.batches ?? loadStorage(STORAGE_KEYS.BATCHES, []),
            (b) => String(b.batchId || b.id || '').toUpperCase(),
            deletedSet
          );
      const bridgeClaims = Array.isArray(bridge?.claims)
        ? bridge.claims
        : loadStorage(STORAGE_KEYS.CLAIMS, []);
      const nextClaims = mergeCollections(
        sbClaims,
        bridgeClaims.filter((c) => !isTestOrInternalClaim(c, deletedSet)),
        (c) => String(c.requestId || c.claimNumber || c.id || '').toUpperCase(),
        deletedSet
      ).filter((c) => !isTestOrInternalClaim(c, deletedSet));

      skusRef.current = nextSkus;
      vendorsRef.current = nextVendors;
      batchesRef.current = nextBatches;
      claimsRef.current = nextClaims;

      // C. Vendor Orders Synchronization
      const orderRows = allClaimsRows
        .filter((c) => c.qr_serial === 'DURAGRIT_VENDOR_ORDERS' || (c.request_id && (String(c.request_id).startsWith('ORDER_') || String(c.request_id).startsWith('ORD_'))))
        .sort((a, b) => new Date(a.timestamp || a.created_at || 0) - new Date(b.timestamp || b.created_at || 0));

      const orderMap = new Map();
      DEFAULT_INITIAL_ORDERS.forEach((o) => orderMap.set(o.id, o));
      (loadStorage(STORAGE_KEYS.ORDERS, DEFAULT_INITIAL_ORDERS) || []).forEach((o) => {
        if (o?.id) orderMap.set(o.id, { ...(orderMap.get(o.id) || {}), ...o });
      });
      if (Array.isArray(bridge?.orders)) {
        bridge.orders.forEach((o) => {
          if (o?.id) orderMap.set(o.id, { ...(orderMap.get(o.id) || {}), ...o });
        });
      }

      orderRows.forEach((row) => {
        if (row?.flag_reason) {
          try {
            const parsed = JSON.parse(row.flag_reason);
            if (parsed?.id) {
              const existing = orderMap.get(parsed.id) || {};
              orderMap.set(parsed.id, {
                ...existing,
                ...parsed,
                status: parsed.status || existing.status || 'Pending',
                adminNotes: parsed.adminNotes !== undefined ? parsed.adminNotes : (existing.adminNotes || ''),
                updatedAt: parsed.updatedAt || row.timestamp || row.created_at || new Date().toISOString(),
              });
            }
          } catch (_) {}
        }
      });

      ordersRef.current.forEach((localOrder) => {
        if (localOrder?.id && !orderMap.has(localOrder.id)) {
          orderMap.set(localOrder.id, localOrder);
        }
      });

      const bridgeOrders = Array.isArray(bridge?.orders) && bridge.orders.length > 0
        ? bridge.orders
        : loadStorage(STORAGE_KEYS.ORDERS, DEFAULT_INITIAL_ORDERS);
      const nextOrders = mergeCollections(
        Array.from(orderMap.values()),
        bridgeOrders,
        (o) => String(o.id || o.orderNumber || '').toUpperCase(),
        deletedSet
      ).sort(
        (a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0)
      );
      ordersRef.current = nextOrders;
      setOrders(nextOrders);
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(nextOrders));
      } catch (_) {}

      setSkus(nextSkus);
      setUsers(nextUsers);
      setVendors(nextVendors);
      setBatches(nextBatches);
      setClaims(nextClaims);

      setDbStatus((prev) => ({
        ...prev,
        connected: sbConnected,
        online: sbConnected,
        loading: false,
        lastSynced: new Date().toLocaleTimeString(),
      }));
    } catch (err) {
      setDbStatus((prev) => ({ ...prev, loading: false, error: err.message }));
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Persist to localStorage whenever collections change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.SKUS, JSON.stringify(skus)); } catch (_) {}
  }, [skus]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); } catch (_) {}
  }, [users]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors)); } catch (_) {}
  }, [vendors]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches)); } catch (_) {}
  }, [batches]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims)); } catch (_) {}
  }, [claims]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); } catch (_) {}
  }, [orders]);

  // Initial load + Realtime Supabase subscriptions + Cross-Port Polling
  useEffect(() => {
    purgeLegacySeedsFromSupabase().then(() => refreshAllData());

    if (SB_ONLINE) {
      realtimeChannelRef.current = subscribeToAllRealtimeTables(() => {
        refreshAllData();
      });
    }

    const pollInterval = setInterval(() => {
      refreshAllData();
    }, 3000);

    const onFocus = () => refreshAllData();
    const onOrdersUpdated = () => refreshAllData();
    const onStorageChange = (e) => {
      if (e?.key === STORAGE_KEYS.ORDERS || e?.key === STORAGE_KEYS.VENDORS || e?.key === STORAGE_KEYS.CLAIMS) {
        refreshAllData();
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('duragrit:orders-updated', onOrdersUpdated);
    window.addEventListener('storage', onStorageChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('duragrit:orders-updated', onOrdersUpdated);
      window.removeEventListener('storage', onStorageChange);
      realtimeChannelRef.current?.unsubscribe?.();
    };
  }, [purgeLegacySeedsFromSupabase, refreshAllData]);

  const handleSbError = useCallback((context, error) => {
    if (!error) return;
    console.warn(`[Supabase:${context}]`, error.message);
    if (error.code === '42501' || String(error.message || '').toLowerCase().includes('row-level security')) {
      setDbStatus((prev) => ({ ...prev, rlsLocked: true, error: error.message }));
    }
  }, []);

  // ==================================================================
  // 1. PRODUCT CATALOG (SKUs) CRUD — Admin <-> App <-> Supabase
  // ==================================================================
  const addSKU = useCallback(async (skuData) => {
    const skuCode = String(skuData.skuCode || `DG-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
    const mrp = Number(skuData.mrp ?? skuData.baseMrp ?? 0);
    const cashbackAmount = Number(skuData.cashbackAmount ?? skuData.cashbackReward ?? 0);
    const dealerPrice = Number(skuData.dealerPrice ?? Math.round(mrp * 0.75));
    const contractorPrice = Number(skuData.contractorPrice ?? Math.round(mrp * 0.82));
    const nowTs = Date.now();

    deletedKeysRef.current.delete(skuCode);

    const newSku = {
      ...skuData,
      id: skuData.id || `SKU-${nowTs.toString().slice(-5)}`,
      skuCode,
      name: String(skuData.name || '').trim(),
      category: skuData.category || 'Adhesives',
      subCategory: skuData.subCategory || skuData.category || 'Standard Grade',
      packSize: skuData.packSize || skuData.packWeight || '20 kg',
      packWeight: skuData.packWeight || skuData.packSize || '20 kg',
      mrp,
      baseMrp: mrp,
      dealerPrice,
      contractorPrice,
      cashbackAmount,
      cashbackReward: cashbackAmount,
      rewardPoints: Number(skuData.rewardPoints ?? cashbackAmount * 4),
      gstPercent: Number(skuData.gstPercent ?? 18),
      hsnCode: skuData.hsnCode || '38245090',
      minBatchQty: Number(skuData.minBatchQty ?? skuData.initialBatchQuantity ?? 100),
      batchesCount: 0,
      activeBatchesCount: 0,
      status: skuData.status || 'Active',
      isActive: skuData.status !== 'Discontinued',
      createdAt: new Date().toISOString(),
      updatedAt: nowTs,
    };

    if (SB_ONLINE) {
      const basePayload = {
        sku_code: skuCode,
        name: newSku.name,
        category: newSku.category,
        pack_weight: newSku.packSize,
        base_mrp: Math.max(1, mrp),
        cashback_reward: cashbackAmount,
        initial_batch_qty: newSku.minBatchQty,
        description: newSku.description || '',
        is_active: newSku.isActive,
        pricing_tiers: {
          dealer: dealerPrice,
          contractor: contractorPrice,
          retail: mrp,
          _ui: newSku,
        },
      };

      let { data, error } = await supabase.from('products').upsert(basePayload, { onConflict: 'sku_code' }).select().single();

      // Fallback if unmigrated CHECK constraints reject custom category or cashback range
      if (error && (error.code === '23514' || String(error.message).includes('check'))) {
        const compatPayload = {
          ...basePayload,
          category: toDbProductCategory(newSku.category),
          cashback_reward: Math.min(500, Math.max(10, cashbackAmount || 10)),
        };
        const retry = await supabase.from('products').upsert(compatPayload, { onConflict: 'sku_code' }).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) handleSbError('addSKU', error);
      if (data?.id) newSku.supabaseId = data.id;
    }

    const filteredSkus = skusRef.current.filter((s) => String(s.skuCode).toUpperCase() !== skuCode);
    const updatedSkus = [newSku, ...filteredSkus];
    skusRef.current = updatedSkus;
    setSkus(updatedSkus);
    pushDevSync({ skus: updatedSkus, deletedKeys: Array.from(deletedKeysRef.current) });
    await pushSkusToSupabase(updatedSkus);

    return newSku;
  }, [handleSbError, pushDevSync, pushSkusToSupabase]);

  const updateSKU = useCallback(async (skuIdOrCode, updates) => {
    const nowTs = Date.now();
    let targetSku = null;

    const updatedSkus = skusRef.current.map((s) => {
      if (s.id === skuIdOrCode || s.skuCode === skuIdOrCode || s.supabaseId === skuIdOrCode) {
        const mrp = Number(updates.mrp ?? s.mrp ?? 0);
        const cashbackAmount = Number(updates.cashbackAmount ?? updates.cashbackReward ?? s.cashbackAmount ?? 0);
        targetSku = {
          ...s,
          ...updates,
          mrp,
          baseMrp: mrp,
          cashbackAmount,
          cashbackReward: cashbackAmount,
          rewardPoints: Number(updates.rewardPoints ?? cashbackAmount * 4),
          packSize: updates.packSize || updates.packWeight || s.packSize,
          packWeight: updates.packWeight || updates.packSize || s.packWeight,
          isActive: (updates.status || s.status) !== 'Discontinued',
          updatedAt: nowTs,
        };
        return targetSku;
      }
      return s;
    });
    skusRef.current = updatedSkus;
    setSkus(updatedSkus);
    pushDevSync({ skus: updatedSkus });
    await pushSkusToSupabase(updatedSkus);

    if (SB_ONLINE && targetSku) {
      const dbUpdate = {
        name: targetSku.name,
        category: toDbProductCategory(targetSku.category),
        pack_weight: targetSku.packSize,
        base_mrp: Math.max(1, Number(targetSku.mrp || 1)),
        cashback_reward: Math.min(500, Math.max(10, Number(targetSku.cashbackAmount || 10))),
        is_active: targetSku.isActive,
        description: targetSku.description || '',
        pricing_tiers: {
          dealer: Number(targetSku.dealerPrice || 0),
          contractor: Number(targetSku.contractorPrice || 0),
          retail: Number(targetSku.mrp || 0),
          _ui: targetSku,
        },
        updated_at: new Date().toISOString(),
      };
      const query = targetSku.supabaseId
        ? supabase.from('products').update(dbUpdate).eq('id', targetSku.supabaseId)
        : supabase.from('products').update(dbUpdate).eq('sku_code', targetSku.skuCode);
      const { error } = await query;
      if (error) handleSbError('updateSKU', error);
    }

    return { success: true, sku: targetSku };
  }, [handleSbError, pushDevSync, pushSkusToSupabase]);

  const deleteSKU = useCallback(async (skuIdOrCode) => {
    const target = skusRef.current.find((s) => s.id === skuIdOrCode || s.skuCode === skuIdOrCode || s.supabaseId === skuIdOrCode);
    if (target?.skuCode) markDeletedKey(target.skuCode);
    if (target?.id) markDeletedKey(target.id);
    if (skuIdOrCode) markDeletedKey(skuIdOrCode);

    const updatedSkus = skusRef.current.filter((s) => s.id !== skuIdOrCode && s.skuCode !== skuIdOrCode && s.supabaseId !== skuIdOrCode);
    skusRef.current = updatedSkus;
    setSkus(updatedSkus);
    pushDevSync({ skus: updatedSkus });
    await pushSkusToSupabase(updatedSkus);

    if (SB_ONLINE && target) {
      const { error } = await supabase.from('products').delete().eq('sku_code', target.skuCode);
      if (error) handleSbError('deleteSKU', error);
    }
    return { success: true };
  }, [markDeletedKey, pushDevSync, pushSkusToSupabase, handleSbError]);

  // ==================================================================
  // 2. QR BATCHES & CRYPTOGRAPHIC TOKENS — Admin <-> App <-> Supabase
  // ==================================================================
  const createBatch = useCallback(async (batchInput) => {
    const nowTs = Date.now();
    let finalBatch;

    // Supports both pre-built batch objects (from QRBatchGeneratorMaster) and param objects
    if (Array.isArray(batchInput?.tokens) || Array.isArray(batchInput?.codes)) {
      const rawCodes = batchInput.tokens || batchInput.codes || [];
      const normalizedTokens = rawCodes.map((c, idx) => {
        const serialKey = QREngineV24.extractSerialKey(c.serialKey || c.serial || c.code);
        const generated = QREngineV24.generateToken(batchInput.lotNumber || '10001', idx + 1, 'DG', serialKey);
        return {
          ...c,
          serialKey,
          serial: serialKey,
          dualSha128: c.dualSha128 || generated.dualSha128,
          cashbackAmount: Number(c.cashbackAmount ?? batchInput.cashbackAmount ?? 0),
          qrPayloadUrl: c.qrPayloadUrl || c.url || `https://verify.duragritvitrified.com/qr/${serialKey}`,
          isScanned: Boolean(c.isScanned || c.status === 'Redeemed'),
          scannedBy: c.scannedBy || null,
          scannedAt: c.scannedAt || null,
        };
      });

      finalBatch = {
        ...batchInput,
        id: batchInput.batchId || batchInput.id || `BCH-${nowTs.toString().slice(-6)}`,
        batchId: batchInput.batchId || batchInput.id || `BCH-${nowTs.toString().slice(-6)}`,
        quantity: normalizedTokens.length,
        scannedCount: normalizedTokens.filter((t) => t.isScanned).length,
        cashbackAmount: Number(batchInput.cashbackAmount ?? 0),
        status: batchInput.status || 'Active',
        createdAt: batchInput.createdAt || new Date().toISOString(),
        updatedAt: nowTs,
        tokens: normalizedTokens,
        codes: normalizedTokens,
      };
    } else {
      const targetSku = skus.find((s) => s.id === batchInput.skuId || s.skuCode === batchInput.skuCode) || skus[0];
      if (!targetSku) throw new Error('Please add a Product SKU in Catalog before generating QR batches.');

      const generated = QREngineV24.generateBatch({
        skuId: targetSku.id,
        skuCode: targetSku.skuCode,
        productName: targetSku.name,
        prefix: batchInput.prefix || 'DG',
        lotNumber: batchInput.lotNumber || '10001',
        quantity: Number(batchInput.quantity || 50),
        cashbackAmount: Number(targetSku.cashbackAmount ?? targetSku.cashbackReward ?? 0),
        discountTier: batchInput.discountTier || 'Standard Master Tier',
      });

      finalBatch = {
        ...generated,
        id: generated.batchId,
        packSize: targetSku.packSize || '20 kg',
        mrp: targetSku.mrp || 0,
        scannedCount: 0,
        status: 'Active',
        codes: generated.tokens,
        updatedAt: nowTs,
      };
    }

    deletedKeysRef.current.delete(String(finalBatch.batchId).toUpperCase());

    if (SB_ONLINE) {
      // Resolve Supabase product UUID if available
      let sbProductId = null;
      const matchedSku = skus.find((s) => s.skuCode === finalBatch.skuCode || s.id === finalBatch.skuId);
      if (matchedSku?.supabaseId) {
        sbProductId = matchedSku.supabaseId;
      } else if (finalBatch.skuCode) {
        const { data: prodLookup } = await supabase
          .from('products')
          .select('id')
          .eq('sku_code', finalBatch.skuCode)
          .maybeSingle();
        if (prodLookup?.id) sbProductId = prodLookup.id;
      }

      const expDate =
        finalBatch.expDate && /^\d{4}-\d{2}-\d{2}$/.test(finalBatch.expDate)
          ? finalBatch.expDate
          : new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const batchInsert = {
        batch_prefix: 'DG',
        batch_identifier: finalBatch.batchId,
        product_id: sbProductId,
        lot_number: String(finalBatch.lotNumber || finalBatch.batchId).slice(0, 20),
        quantity: Number(finalBatch.quantity || finalBatch.tokens.length),
        discount_tier: finalBatch.discountTier || 'Standard Master Tier',
        expiry_date: expDate,
        cryptographic_hash: finalBatch.tokens[0]?.dualSha128 || `SHA-${nowTs}`,
        status: 'Active',
      };

      const { data: batchRow, error: batchErr } = await supabase
        .from('qr_batches')
        .upsert(batchInsert, { onConflict: 'batch_identifier' })
        .select()
        .single();

      if (batchErr) {
        handleSbError('createBatch', batchErr);
      } else if (batchRow?.id) {
        finalBatch.supabaseId = batchRow.id;
        // Insert QR serial tokens in chunks of 250
        const allTokenRows = finalBatch.tokens.map((t) => ({
          batch_id: batchRow.id,
          product_id: sbProductId,
          serial_key: t.serialKey,
          dual_sha128_hash: t.dualSha128,
          cashback_amount: Number(t.cashbackAmount ?? finalBatch.cashbackAmount ?? 0),
          is_scanned: Boolean(t.isScanned),
        }));

        for (let i = 0; i < allTokenRows.length; i += 250) {
          const chunk = allTokenRows.slice(i, i + 250);
          const { error: tokErr } = await supabase.from('qr_tokens').upsert(chunk, { onConflict: 'serial_key' });
          if (tokErr) {
            handleSbError('insertTokens', tokErr);
            break;
          }
        }
      }
    }

    const filteredBatches = batchesRef.current.filter((b) => b.batchId !== finalBatch.batchId);
    const updatedBatches = [finalBatch, ...filteredBatches];
    batchesRef.current = updatedBatches;
    setBatches(updatedBatches);
    pushDevSync({ batches: updatedBatches, deletedKeys: Array.from(deletedKeysRef.current) });

    const updatedSkus = skusRef.current.map((s) =>
      s.skuCode === finalBatch.skuCode || s.id === finalBatch.skuId
        ? { ...s, batchesCount: (s.batchesCount || 0) + 1, activeBatchesCount: (s.activeBatchesCount || 0) + 1, updatedAt: nowTs }
        : s
    );
    skusRef.current = updatedSkus;
    setSkus(updatedSkus);
    pushDevSync({ skus: updatedSkus });

    await Promise.allSettled([
      pushBatchesToSupabase(updatedBatches),
      pushSkusToSupabase(updatedSkus),
    ]);

    return finalBatch;
  }, [skus, handleSbError, pushDevSync, pushBatchesToSupabase, pushSkusToSupabase]);

  const deleteBatch = useCallback(async (batchId) => {
    markDeletedKey(batchId);
    const target = batchesRef.current.find((b) => b.batchId === batchId || b.id === batchId);

    const updatedBatches = batchesRef.current.filter((b) => b.batchId !== batchId && b.id !== batchId);
    batchesRef.current = updatedBatches;
    setBatches(updatedBatches);
    pushDevSync({ batches: updatedBatches });
    await pushBatchesToSupabase(updatedBatches);

    if (SB_ONLINE && target) {
      const { error } = await supabase.from('qr_batches').delete().eq('batch_identifier', target.batchId);
      if (error) handleSbError('deleteBatch', error);
    }
    return { success: true };
  }, [markDeletedKey, pushDevSync, pushBatchesToSupabase, handleSbError]);

  // ==================================================================
  // 3. USER DIRECTORY CRUD — Admin <-> Mobile Sign-In <-> Supabase
  // ==================================================================
  const registerUser = useCallback(async (userData) => {
    const nowTs = Date.now();
    const cleanPhone = normalizeMobile(userData.mobile || userData.mobileLoginId);
    const nextNum = 1001 + users.length;
    const rawId = String(userData.id || nextNum).replace(/^USR-/i, '');
    const passkey = userData.passkey || userData.tempPassword || userData.password || `Dura#${cleanPhone.slice(-4) || rawId}`;

    if (cleanPhone) deletedKeysRef.current.delete(cleanPhone);

    const newUser = {
      ...userData,
      id: rawId,
      userId: `USR-${rawId}`,
      name: String(userData.name || userData.fullLegalName || '').trim(),
      fullLegalName: String(userData.name || userData.fullLegalName || '').trim(),
      firmName: userData.firmName || '',
      role: userData.role || 'Contractor',
      mobile: userData.mobile || cleanPhone,
      mobileLoginId: cleanPhone || userData.mobile,
      email: (userData.email || '').trim(),
      city: userData.city || '',
      state: userData.state || 'Gujarat',
      location: userData.location || `${userData.city || 'Morbi'}, ${userData.state || 'Gujarat'}`,
      kycStatus: userData.kycStatus || 'Verified',
      emailVerified: userData.emailVerified || 'Verified',
      active: userData.active !== false,
      accountStatus: userData.active === false ? 'Suspended' : 'Active',
      tierLevel: userData.tierLevel || `${userData.role || 'Contractor'} Partner`,
      upi: userData.upi || userData.vpaOrIfsc || '',
      vpaOrIfsc: userData.upi || userData.vpaOrIfsc || '',
      bankName: userData.bankName || '',
      accountNo: userData.accountNo || '',
      ifsc: userData.ifsc || '',
      panNumber: (userData.panNumber || userData.pan || '').toUpperCase(),
      aadhaarNo: userData.aadhaarNo || userData.aadhaar || '',
      passkey,
      tempPassword: passkey,
      password: passkey,
      rewardBalance: Number(userData.rewardBalance ?? 0),
      escrowBalance: Number(userData.escrowBalance ?? 0),
      scansCount: Number(userData.scansCount ?? 0),
      registeredDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: nowTs,
    };

    if (SB_ONLINE) {
      const dbProfile = {
        full_name: newUser.name,
        email: newUser.email || null,
        mobile: cleanPhone || newUser.mobile,
        role: toDbRole(newUser.role),
        location: newUser.location,
        state: newUser.state || 'Gujarat',
        kyc_status: ['Pending', 'Verified', 'Rejected'].includes(newUser.kycStatus) ? newUser.kycStatus : 'Verified',
        account_status: newUser.active ? 'Active' : 'Suspended',
        tier_level: newUser.tierLevel,
        pan_number: newUser.panNumber ? newUser.panNumber.slice(0, 10) : null,
        vpa_upi_id: newUser.upi || null,
        reward_balance: newUser.rewardBalance,
        escrow_balance: newUser.escrowBalance,
        scans_count: newUser.scansCount,
        terminal_key: passkey,
        hub_depot: newUser.firmName || 'Morbi Central Hub',
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(dbProfile, { onConflict: 'mobile' })
        .select()
        .single();

      if (error) handleSbError('registerUser', error);
      if (data?.id) newUser.supabaseId = data.id;
    }

    setUsers((prev) => {
      const filtered = prev.filter((u) => normalizeMobile(u.mobile) !== cleanPhone && String(u.id) !== String(rawId));
      const updated = [newUser, ...filtered];
      pushDevSync({ users: updated, deletedKeys: Array.from(deletedKeysRef.current) });
      return updated;
    });

    return newUser;
  }, [users.length, handleSbError, pushDevSync]);

  const updateUser = useCallback(async (userId, updates) => {
    const nowTs = Date.now();
    let updatedUser = null;

    setUsers((prev) => {
      const list = prev.map((u) => {
        if (String(u.id) === String(userId).replace(/^USR-/i, '') || u.supabaseId === userId || u.userId === userId) {
          updatedUser = {
            ...u,
            ...updates,
            accountStatus: (updates.active ?? u.active) === false ? 'Suspended' : 'Active',
            updatedAt: nowTs,
          };
          if (updates.passkey) {
            updatedUser.tempPassword = updates.passkey;
            updatedUser.password = updates.passkey;
          }
          return updatedUser;
        }
        return u;
      });
      pushDevSync({ users: list });
      return list;
    });

    if (SB_ONLINE && updatedUser) {
      const dbPatch = {
        full_name: updatedUser.name,
        email: updatedUser.email || null,
        role: toDbRole(updatedUser.role),
        location: updatedUser.location,
        state: updatedUser.state || 'Gujarat',
        kyc_status: ['Pending', 'Verified', 'Rejected'].includes(updatedUser.kycStatus) ? updatedUser.kycStatus : 'Verified',
        account_status: updatedUser.active === false ? 'Suspended' : 'Active',
        vpa_upi_id: updatedUser.upi || updatedUser.vpaOrIfsc || null,
        terminal_key: updatedUser.passkey || updatedUser.tempPassword || null,
        reward_balance: Number(updatedUser.rewardBalance ?? 0),
        escrow_balance: Number(updatedUser.escrowBalance ?? 0),
        scans_count: Number(updatedUser.scansCount ?? 0),
        updated_at: new Date().toISOString(),
      };
      const q = updatedUser.supabaseId
        ? supabase.from('profiles').update(dbPatch).eq('id', updatedUser.supabaseId)
        : supabase.from('profiles').update(dbPatch).eq('mobile', normalizeMobile(updatedUser.mobile));
      const { error } = await q;
      if (error) handleSbError('updateUser', error);
    }

    return { success: true, user: updatedUser };
  }, [handleSbError, pushDevSync]);

  const toggleUserActive = useCallback(async (userId) => {
    const target = users.find(
      (u) => String(u.id) === String(userId).replace(/^USR-/i, '') || u.supabaseId === userId || u.userId === userId
    );
    if (!target) return { success: false };
    const nextActive = target.active === false;
    return updateUser(userId, { active: nextActive, accountStatus: nextActive ? 'Active' : 'Suspended' });
  }, [users, updateUser]);

  const approveKYC = useCallback(async (userId) => {
    const res = await updateUser(userId, { kycStatus: 'Verified', active: true, accountStatus: 'Active' });
    const target = users.find(
      (u) => String(u.id) === String(userId).replace(/^USR-/i, '') || u.supabaseId === userId || u.userId === userId
    );
    if (target?.email) {
      sendKycApprovalEmail({
        recipientName: target.name || 'Valued Partner',
        recipientEmail: target.email,
        userId: target.userId || (String(target.id).startsWith('USR-') ? target.id : `USR-${target.id}`),
        aadhaarMasked: target.aadhaarNo ? `XXXX-XXXX-${target.aadhaarNo.slice(-4)}` : 'Verified UIDAI Token',
        panMasked: target.panNumber ? `${target.panNumber.slice(0, 5)}XXXX${target.panNumber.slice(-1)}` : 'Verified ITD PAN',
        tierName: target.tierLevel || `${target.role || 'Contractor'} Partner`,
        dailyLimit: '₹50,000 / day',
      }).catch((err) => console.warn('KYC approval auto email failed:', err));
    }
    return res;
  }, [updateUser, users]);

  const deleteUser = useCallback(async (userId) => {
    const cleanId = String(userId).replace(/^USR-/i, '');
    const target = users.find((u) => String(u.id) === cleanId || u.supabaseId === userId || u.userId === userId);
    if (target) {
      markDeletedKey(normalizeMobile(target.mobile) || cleanId);
    }

    setUsers((prev) => {
      const updated = prev.filter((u) => String(u.id) !== cleanId && u.supabaseId !== userId && u.userId !== userId);
      pushDevSync({ users: updated });
      return updated;
    });

    if (SB_ONLINE && target) {
      const q = target.supabaseId
        ? supabase.from('profiles').delete().eq('id', target.supabaseId)
        : supabase.from('profiles').delete().eq('mobile', normalizeMobile(target.mobile));
      const { error } = await q;
      if (error) handleSbError('deleteUser', error);
    }

    return { success: true };
  }, [users, markDeletedKey, pushDevSync, handleSbError]);

  // ==================================================================
  // 4. VENDOR DIRECTORY CRUD — Admin <-> Vendor Portal <-> Supabase
  // ==================================================================
  const syncVendorEventToSupabase = useCallback(async (action, vendorData, fullList) => {
    if (!SB_ONLINE) return;
    const nowIso = new Date().toISOString();
    const vendorId = String(vendorData?.vendorId || vendorData?.id || '').toUpperCase();
    const ops = [];

    // 1. Atomic event for this specific vendor
    ops.push(
      supabase.from('cashback_requests').insert({
        request_id: `DURAGRIT_VENDOR_${action}_${vendorId}_${Date.now()}`,
        qr_serial: 'DURAGRIT_VENDOR_EVENT',
        claim_value: action === 'DELETE' ? 0 : 1,
        status: action === 'DELETE' ? 'Rejected' : 'Approved',
        payout_method: 'UPI',
        flag_reason: JSON.stringify({
          action,
          vendorId,
          vendor: action === 'DELETE' ? null : vendorData,
          timestamp: Date.now(),
        }),
        timestamp: nowIso,
      })
    );

    // 2. Full snapshot registry
    if (Array.isArray(fullList) && fullList.length > 0) {
      ops.push(
        supabase.from('cashback_requests').insert({
          request_id: `SYNC_VENDORS_EVENT_${Date.now()}`,
          qr_serial: 'DURAGRIT_VENDORS_STORE_V1',
          claim_value: fullList.length,
          status: 'Approved',
          payout_method: 'UPI',
          flag_reason: JSON.stringify(fullList),
          timestamp: nowIso,
        })
      );
    }

    try {
      await Promise.allSettled(ops);
    } catch (e) {
      console.warn('Sync vendor event to Supabase failed:', e);
    }
  }, []);

  const addVendor = useCallback(async (vendorData) => {
    const nowTs = Date.now();
    const phoneClean = normalizeMobile(vendorData.phone || vendorData.mobile);
    const emailClean = String(vendorData.email || '').trim().toLowerCase();

    // Guard: Prevent duplicate mobile number in DataContext
    if (phoneClean && phoneClean.length === 10) {
      const dupPhone = vendorsRef.current.find((v) => {
        const vPhone = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
        return vPhone === phoneClean;
      });
      if (dupPhone) {
        throw new Error(`Already registered! Yeh mobile number (+91 ${phoneClean}) pehle se registered hai (${dupPhone.companyName || dupPhone.id}). New mobile number enter karna hoga.`);
      }
    }

    // Guard: Prevent duplicate email in DataContext
    if (emailClean) {
      const dupEmail = vendorsRef.current.find((v) => {
        const vEmail = String(v.email || '').trim().toLowerCase();
        return vEmail && vEmail === emailClean;
      });
      if (dupEmail) {
        throw new Error(`Already registered! Yeh email ID (${emailClean}) pehle se registered hai (${dupEmail.companyName || dupEmail.id}). New email ID enter karni hogi.`);
      }
    }

    // Determine next unique vendor ID (e.g. VND-102, VND-103...)
    let nextNum = 101;
    const existingNums = vendorsRef.current
      .map((v) => {
        const m = String(v.vendorId || v.id || '').match(/VND-(\d+)/i);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => typeof n === 'number' && !isNaN(n));
    if (existingNums.length > 0) {
      nextNum = Math.max(...existingNums) + 1;
    }
    const vendorId = String(vendorData.vendorId || vendorData.id || `VND-${String(nextNum).padStart(3, '0')}`).toUpperCase();
    const poVal = Number(vendorData.poValueLakhs ?? vendorData.totalPayoutLakhs ?? 0);
    const relVal = Number(vendorData.releasedPayoutLakhs ?? 0);
    const passkey = vendorData.passkey || `Vend#${phoneClean.slice(-4) || '2026'}`;

    deletedKeysRef.current.delete(vendorId);

    const newVendor = {
      ...vendorData,
      id: vendorId,
      vendorId,
      companyName: String(vendorData.companyName || vendorData.vendorName || vendorData.name || '').trim(),
      name: String(vendorData.companyName || vendorData.vendorName || vendorData.name || '').trim(),
      category: vendorData.category || 'Raw materials',
      gstin: String(vendorData.gstin || '').trim().toUpperCase(),
      gstinVerified: true,
      contactPerson: vendorData.contactPerson || '',
      phone: vendorData.phone || vendorData.mobile || '',
      mobile: vendorData.phone || vendorData.mobile || '',
      email: vendorData.email || '',
      city: vendorData.city || '',
      state: vendorData.state || 'Gujarat',
      location: vendorData.location || `${vendorData.city || 'Morbi'}, ${vendorData.state || 'Gujarat'}`,
      status: vendorData.status || 'ACTIVE',
      accountStatus: vendorData.accountStatus || 'Active',
      active: true,
      complianceScore: Number(vendorData.complianceScore ?? 98),
      activePurchaseOrders: Number(vendorData.activePurchaseOrders ?? (poVal > 0 ? 1 : 0)),
      poValueLakhs: poVal,
      totalPayoutLakhs: poVal,
      releasedPayoutLakhs: relVal,
      pendingPayoutLakhs: Math.max(0, Number((poVal - relVal).toFixed(2))),
      payoutHistory: vendorData.payoutHistory || [],
      passkey,
      createdAt: new Date().toISOString(),
      updatedAt: nowTs,
    };

    // Update in-memory ref immediately so consecutive updates have complete state
    const currentList = vendorsRef.current.filter((v) => v.vendorId !== vendorId && v.id !== vendorId);
    const updated = [newVendor, ...currentList];
    vendorsRef.current = updated;
    setVendors(updated);
    pushDevSync({ vendors: updated, deletedKeys: Array.from(deletedKeysRef.current) });
    syncVendorEventToSupabase('UPSERT', newVendor, updated);

    // Also attempt direct DB upsert
    if (SB_ONLINE) {
      try {
        const dbVendor = {
          vendor_id: vendorId,
          company_name: newVendor.companyName,
          category: toDbVendorCategory(newVendor.category),
          gstin: newVendor.gstin ? newVendor.gstin.slice(0, 15) : `24TEMP${nowTs.toString().slice(-8)}Z`,
          location: newVendor.location,
          state: newVendor.state || 'Gujarat',
          contact_person: newVendor.contactPerson,
          phone: newVendor.phone,
          email: newVendor.email || null,
          account_status: 'Active',
          compliance_score: newVendor.complianceScore,
          active_purchase_orders: newVendor.activePurchaseOrders,
        };
        const { data, error } = await supabase.from('vendors').upsert(dbVendor, { onConflict: 'vendor_id' }).select().single();
        if (error) handleSbError('addVendor', error);
        if (data?.id) newVendor.supabaseId = data.id;
      } catch (_) {}
    }

    return newVendor;
  }, [handleSbError, pushDevSync, syncVendorEventToSupabase]);

  const updateVendor = useCallback(async (vendorId, updates) => {
    const nowTs = Date.now();
    const cleanId = String(vendorId).toUpperCase();
    let targetVendor = null;

    // Check duplicate mobile or email if changed
    if (updates.phone || updates.mobile) {
      const phoneClean = normalizeMobile(updates.phone || updates.mobile);
      if (phoneClean && phoneClean.length === 10) {
        const dup = vendorsRef.current.find((v) => {
          if (String(v.id).toUpperCase() === cleanId || String(v.vendorId).toUpperCase() === cleanId) return false;
          const vPhone = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
          return vPhone === phoneClean;
        });
        if (dup) {
          throw new Error(`Already registered! Yeh mobile number (+91 ${phoneClean}) pehle se registered hai (${dup.companyName || dup.id}). New mobile number enter karna hoga.`);
        }
      }
    }
    if (updates.email) {
      const emailClean = String(updates.email).trim().toLowerCase();
      if (emailClean) {
        const dup = vendorsRef.current.find((v) => {
          if (String(v.id).toUpperCase() === cleanId || String(v.vendorId).toUpperCase() === cleanId) return false;
          const vEmail = String(v.email || '').trim().toLowerCase();
          return vEmail === emailClean;
        });
        if (dup) {
          throw new Error(`Already registered! Yeh email ID (${emailClean}) pehle se registered hai (${dup.companyName || dup.id}). New email ID enter karni hogi.`);
        }
      }
    }

    const updated = vendorsRef.current.map((v) => {
      if (String(v.id).toUpperCase() === cleanId || String(v.vendorId).toUpperCase() === cleanId) {
        const poVal = Number(updates.poValueLakhs ?? updates.totalPayoutLakhs ?? v.poValueLakhs ?? 0);
        const relVal = Number(updates.releasedPayoutLakhs ?? v.releasedPayoutLakhs ?? 0);
        targetVendor = {
          ...v,
          ...updates,
          companyName: updates.companyName || updates.name || v.companyName,
          name: updates.companyName || updates.name || v.companyName,
          poValueLakhs: poVal,
          totalPayoutLakhs: poVal,
          releasedPayoutLakhs: relVal,
          pendingPayoutLakhs: Math.max(0, Number((poVal - relVal).toFixed(2))),
          updatedAt: nowTs,
        };
        return targetVendor;
      }
      return v;
    });

    if (targetVendor) {
      vendorsRef.current = updated;
      setVendors(updated);
      pushDevSync({ vendors: updated });
      syncVendorEventToSupabase('UPSERT', targetVendor, updated);

      if (SB_ONLINE) {
        try {
          await supabase
            .from('vendors')
            .upsert({
              vendor_id: targetVendor.vendorId || targetVendor.id,
              company_name: targetVendor.companyName,
              category: toDbVendorCategory(targetVendor.category),
              location: targetVendor.location,
              contact_person: targetVendor.contactPerson,
              phone: targetVendor.phone,
              email: targetVendor.email || null,
              account_status: targetVendor.status === 'INACTIVE' || targetVendor.active === false ? 'Suspended' : 'Active',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'vendor_id' });
        } catch (_) {}
      }
    }

    return { success: true, vendor: targetVendor };
  }, [pushDevSync, syncVendorEventToSupabase]);

  const toggleVendorStatus = useCallback(async (vendorId) => {
    const target = vendorsRef.current.find((v) => v.id === vendorId || v.vendorId === vendorId);
    if (!target) return { success: false };
    const nextIsActive = target.status === 'INACTIVE' || target.active === false;
    return updateVendor(vendorId, {
      status: nextIsActive ? 'ACTIVE' : 'INACTIVE',
      accountStatus: nextIsActive ? 'Active' : 'Suspended',
      active: nextIsActive,
    });
  }, [updateVendor]);

  const deleteVendor = useCallback(async (vendorId) => {
    const cleanId = String(vendorId).toUpperCase();
    markDeletedKey(cleanId);

    const updated = vendorsRef.current.filter((v) => String(v.id).toUpperCase() !== cleanId && String(v.vendorId).toUpperCase() !== cleanId);
    vendorsRef.current = updated;
    setVendors(updated);
    pushDevSync({ vendors: updated, deletedKeys: Array.from(deletedKeysRef.current) });
    syncVendorEventToSupabase('DELETE', { id: cleanId, vendorId: cleanId }, updated);

    if (SB_ONLINE) {
      try {
        await supabase.from('vendors').delete().eq('vendor_id', cleanId);
      } catch (_) {}
    }
    return { success: true };
  }, [markDeletedKey, pushDevSync, syncVendorEventToSupabase]);

  const releaseVendorPayout = useCallback(async (vendorId, releaseAmountLakhs, releaseNote = '', paymentMode = 'NPCI RTGS Escrow', customUtr = '') => {
    const amount = parseFloat(releaseAmountLakhs);
    if (!amount || amount <= 0) return { success: false, message: 'Invalid release amount' };

    const target = vendors.find((v) => v.id === vendorId || v.vendorId === vendorId);
    if (!target) return { success: false, message: 'Vendor not found' };

    const currentTotal = parseFloat(target.totalPayoutLakhs ?? target.poValueLakhs ?? 0);
    const currentReleased = parseFloat(target.releasedPayoutLakhs || 0);
    const newReleased = parseFloat((currentReleased + amount).toFixed(2));
    const newPending = Math.max(0, parseFloat((currentTotal - newReleased).toFixed(2)));
    const newRecord = {
      id: `TR-${Date.now().toString().slice(-4)}`,
      amountLakhs: amount,
      releasedAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      utr: customUtr || `NPCI-RTGS-${Math.floor(10000000 + Math.random() * 90000000)}`,
      mode: paymentMode,
      note: releaseNote || 'PO milestone payout released',
    };

    return updateVendor(vendorId, {
      poValueLakhs: currentTotal,
      totalPayoutLakhs: currentTotal,
      releasedPayoutLakhs: newReleased,
      pendingPayoutLakhs: newPending,
      payoutHistory: [newRecord, ...(target.payoutHistory || [])],
    });
  }, [vendors, updateVendor]);

  // ==================================================================
  // 4B. VENDOR MATERIAL ORDERS (Indents, Statuses & Supabase Sync)
  // ==================================================================
  const createVendorOrder = useCallback(async (orderData) => {
    const orderId = orderData.id || `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      ...orderData,
      id: orderId,
      orderNumber: orderData.orderNumber || orderId,
      status: orderData.status || 'Pending',
      createdAt: orderData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newOrder, ...ordersRef.current.filter((o) => o.id !== orderId)];
    ordersRef.current = updated;
    setOrders(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    } catch (_) {}

    pushDevSync({ order: newOrder, orders: updated });
    try {
      window.dispatchEvent(new CustomEvent('duragrit:orders-updated', { detail: newOrder }));
    } catch (_) {}

    if (SB_ONLINE) {
      try {
        const reqId = `ORD_EVT_${orderId}_${Date.now()}`.slice(0, 50);
        await supabase.from('cashback_requests').insert({
          request_id: reqId,
          qr_serial: 'DURAGRIT_VENDOR_ORDERS',
          claim_value: newOrder.totalQuantity || newOrder.totalItems || 1,
          status: 'Approved',
          payout_method: 'UPI',
          flag_reason: JSON.stringify(newOrder),
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to push order to Supabase:', err);
      }
    }

    return newOrder;
  }, [pushDevSync]);

  const updateOrderStatus = useCallback(async (orderId, newStatus, adminNotes = '') => {
    let updatedOrder = null;
    const updated = ordersRef.current.map((o) => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          status: newStatus,
          adminNotes: adminNotes !== undefined && adminNotes !== '' ? adminNotes : (o.adminNotes || ''),
          updatedAt: new Date().toISOString(),
        };
        return updatedOrder;
      }
      return o;
    });

    if (updatedOrder) {
      ordersRef.current = updated;
      setOrders(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      } catch (_) {}

      pushDevSync({ orderUpdate: updatedOrder, orders: updated });
      try {
        window.dispatchEvent(new CustomEvent('duragrit:orders-updated', { detail: updatedOrder }));
      } catch (_) {}

      if (SB_ONLINE) {
        try {
          const reqId = `ORD_ST_${orderId}_${Date.now()}`.slice(0, 50);
          await supabase.from('cashback_requests').insert({
            request_id: reqId,
            qr_serial: 'DURAGRIT_VENDOR_ORDERS',
            claim_value: 1,
            status: 'Approved',
            payout_method: 'UPI',
            flag_reason: JSON.stringify(updatedOrder),
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Failed to push order status update to Supabase:', err);
        }
      }
    }

    return updatedOrder;
  }, [pushDevSync]);

  // ==================================================================
  // 5. QR SCAN & 2-STEP CASHBACK LIFECYCLE (Pending -> Approved -> Disbursed)
  // ==================================================================
  const submitScannedCode = useCallback(async ({ serialKey, user, proofImage, geoLat, geoLng }) => {
    const cleanKey = QREngineV24.extractSerialKey(serialKey);
    const nowTs = Date.now();

    if (!cleanKey || !QREngineV24.validateSerialFormat(cleanKey)) {
      return {
        success: false,
        message: 'Invalid QR code format. Scan or enter a valid DuraGrit batch serial code (e.g. DG-SKU-2026NOV-000001).',
      };
    }

    // 1. Duplicate Claim Guard
    const alreadyClaimed = claims.find(
      (c) => QREngineV24.extractSerialKey(c.serialKey || c.qrSerial || c.batchCode) === cleanKey
    );
    if (alreadyClaimed) {
      return {
        success: false,
        message: `QR serial ${cleanKey} has already been scanned and claimed (${alreadyClaimed.requestId || alreadyClaimed.id}).`,
      };
    }

    // 2. Verify against generated QR Batches (or Supabase qr_tokens)
    let matchedBatch = null;
    let matchedToken = null;

    for (const batch of batches) {
      const list = batch.tokens || batch.codes || [];
      const found = list.find((t) => QREngineV24.extractSerialKey(t.serialKey || t.serial) === cleanKey);
      if (found) {
        matchedBatch = batch;
        matchedToken = found;
        break;
      }
    }

    let sbTokenRow = null;
    if (!matchedToken && SB_ONLINE) {
      const { data: tokData } = await supabase
        .from('qr_tokens')
        .select('*, products(name, sku_code, cashback_reward)')
        .ilike('serial_key', cleanKey)
        .maybeSingle();
      if (tokData) {
        sbTokenRow = tokData;
      }
    }

    if (!matchedToken && !sbTokenRow) {
      // Automatic SKU-level fallback:
      // If the QR serial format is valid (e.g. DG-DA777-NOV2026-000001, DG-DA777-4473-000001, etc.),
      // resolve it to the matching catalog SKU so vendor app can scan preview stickers or pre-printed batches seamlessly.
      const upperKey = cleanKey.toUpperCase();
      const availableSkus = (skus && skus.length > 0) ? skus : DEFAULT_LIVE_SKUS;
      const matchedSkuFallback = availableSkus.find((s) => {
        const cleanSkuCode = String(s.skuCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return (
          cleanSkuCode &&
          (upperKey.includes(cleanSkuCode) ||
           upperKey.startsWith(`DG-${cleanSkuCode}-`) ||
           (cleanSkuCode.length >= 4 && upperKey.includes(cleanSkuCode.slice(0, 5))))
        );
      }) || availableSkus[0];

      if (matchedSkuFallback && QREngineV24.validateSerialFormat(cleanKey)) {
        const reward = Number(matchedSkuFallback.cashbackReward || matchedSkuFallback.cashbackAmount || 150);
        matchedToken = {
          serialKey: cleanKey,
          dualSha128: QREngineV24.generateToken('10001', 1, 'DG', cleanKey).dualSha128,
          cashbackAmount: reward,
          skuId: matchedSkuFallback.id,
          skuCode: matchedSkuFallback.skuCode,
          productName: matchedSkuFallback.name,
          isScanned: false,
        };
        matchedBatch = {
          batchId: `DG-BATCH-${(matchedSkuFallback.skuCode || 'DA777').replace(/[^a-zA-Z0-9]/g, '')}`,
          skuCode: matchedSkuFallback.skuCode,
          productName: matchedSkuFallback.name,
          cashbackAmount: reward,
        };
      } else {
        return {
          success: false,
          message: `Unregistered QR code "${cleanKey}". Generate a QR batch in Admin Panel first, then scan a serial from that batch.`,
        };
      }
    }

    if (matchedToken?.isScanned || sbTokenRow?.is_scanned) {
      return {
        success: false,
        message: `QR serial "${cleanKey}" has already been redeemed.`,
      };
    }

    const matchedSku = skus.find(
      (s) => s.skuCode === (matchedBatch?.skuCode || sbTokenRow?.products?.sku_code) || s.id === matchedBatch?.skuId
    );

    const claimAmount = Number(
      matchedToken?.cashbackAmount ??
      matchedBatch?.cashbackAmount ??
      sbTokenRow?.cashback_amount ??
      matchedSku?.cashbackAmount ??
      matchedSku?.cashbackReward ??
      0
    );

    const productName = matchedBatch?.productName || sbTokenRow?.products?.name || matchedSku?.name || 'DuraGrit Verified Pack';
    const skuCode = matchedBatch?.skuCode || sbTokenRow?.products?.sku_code || matchedSku?.skuCode || '';

    // Resolve live registered user profile
    const cleanUserMobile = normalizeMobile(user?.mobile);
    const liveUser = users.find(
      (u) =>
        (cleanUserMobile && normalizeMobile(u.mobile) === cleanUserMobile) ||
        String(u.userId || '') === String(user?.userId || '') ||
        String(u.id || '') === String(user?.id || '').replace(/^USR-/i, '')
    );

    // Resolve Vendor partner
    const matchedVendor = vendors.find((v) => {
      const vid = String(v.vendorId || v.id || '').toUpperCase();
      const uVid = String(user?.vendorId || user?.id || liveUser?.vendorId || '').toUpperCase();
      const vPhone = normalizeMobile(v.phone || v.mobile);
      return (
        (uVid && vid === uVid) ||
        (cleanUserMobile && vPhone === cleanUserMobile) ||
        String(v.companyName || '').toLowerCase() === String(user?.name || '').toLowerCase()
      );
    });

    const vendorName =
      (user?.companyName && user.companyName !== 'DuraGrit Authorized Partner' ? user.companyName : '') ||
      (user?.vendorName && user.vendorName !== 'DuraGrit Authorized Partner' ? user.vendorName : '') ||
      (matchedVendor?.companyName && matchedVendor.companyName !== 'DuraGrit Authorized Partner' ? matchedVendor.companyName : '') ||
      (user?.role === 'Vendor' ? (user?.name || user?.companyName) : '') ||
      (liveUser?.companyName && liveUser.companyName !== 'DuraGrit Authorized Partner' ? liveUser.companyName : '') ||
      (liveUser?.vendorName && liveUser.vendorName !== 'DuraGrit Authorized Partner' ? liveUser.vendorName : '') ||
      user?.name ||
      liveUser?.name ||
      'Trade Partner';

    const vendorId =
      user?.vendorId ||
      matchedVendor?.vendorId ||
      matchedVendor?.id ||
      (user?.role === 'Vendor' ? user?.id : '') ||
      liveUser?.vendorId ||
      'VND-101';

    const requestId = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
    const tdsInfo = QREngineV24.calculateTDS(claimAmount, Boolean(liveUser?.panNumber || user?.panNumber));
    const formattedDate = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newClaim = {
      id: requestId,
      requestId,
      claimNumber: requestId,
      userId: liveUser?.userId || user?.userId || `USR-${liveUser?.id || '1001'}`,
      userSupabaseId: liveUser?.supabaseId || user?.supabaseId || null,
      userName: liveUser?.name || user?.name || 'Registered Partner',
      vendorName,
      vendorId,
      userMobile: liveUser?.mobile || user?.mobile || '',
      mobile: liveUser?.mobile || user?.mobile || '',
      userRole: liveUser?.role || user?.role || 'Contractor',
      location: liveUser?.location || user?.location || 'Morbi, GJ',
      productName,
      skuCode,
      serialKey: cleanKey,
      qrSerial: cleanKey,
      batchCode: cleanKey,
      amount: claimAmount,
      claimValue: claimAmount,
      tdsDeducted: tdsInfo.tdsAmount,
      netDisbursed: tdsInfo.netAmount,
      disbursedAmount: 0,
      payoutMethod: liveUser?.upi || user?.upi ? 'UPI' : 'NEFT',
      paymentMode: liveUser?.upi || user?.upi ? 'UPI' : 'NEFT',
      upiId: liveUser?.upi || user?.upi || user?.vpaOrIfsc || '',
      vpaOrIfsc: liveUser?.upi || user?.upi || liveUser?.ifsc || '',
      bankAccount: liveUser?.accountNo || user?.accountNo || '',
      ifsc: liveUser?.ifsc || user?.ifsc || '',
      status: 'Pending',
      payoutStatus: 'Awaiting Approval',
      proofUrl: proofImage || null,
      proofImageUrl: proofImage || null,
      paymentProofUrl: null,
      transactionId: '',
      npciRrn: '',
      remarks: '',
      submittedAt: new Date().toISOString(),
      date: formattedDate,
      updatedAt: nowTs,
    };

    // Sync to Supabase cashback_requests + qr_tokens + profiles
    if (SB_ONLINE) {
      let sbUserId = liveUser?.supabaseId || user?.supabaseId || null;
      if (!sbUserId && cleanUserMobile) {
        const { data: profLookup } = await supabase
          .from('profiles')
          .select('id')
          .eq('mobile', cleanUserMobile)
          .maybeSingle();
        if (profLookup?.id) sbUserId = profLookup.id;
      }

      const claimMeta = {
        vendorName: newClaim.vendorName,
        vendorId: newClaim.vendorId,
        userName: newClaim.userName,
        userMobile: newClaim.userMobile,
        userRole: newClaim.userRole,
        productName: newClaim.productName,
        skuCode: newClaim.skuCode,
        packSize: matchedSku?.packSize || matchedSku?.packWeight || '20 kg',
        category: matchedSku?.category || 'Adhesives',
        subCategory: matchedSku?.subCategory || 'High-Polymer Vitrified',
        mrp: Number(matchedSku?.baseMrp || matchedSku?.mrp || 650),
        claimValue: claimAmount,
        serialKey: cleanKey
      };

      const dbClaim = {
        request_id: requestId,
        user_id: sbUserId,
        qr_token_id: sbTokenRow?.id || matchedToken?.id || null,
        qr_serial: cleanKey,
        claim_value: Math.max(1, claimAmount),
        payout_method: toDbPayoutMethod(newClaim.payoutMethod),
        vpa_or_ifsc: newClaim.vpaOrIfsc || 'pending@upi',
        status: 'Pending',
        proof_url: proofImage || null,
        tds_deducted: tdsInfo.tdsAmount,
        net_disbursed: tdsInfo.netAmount,
        flag_reason: JSON.stringify(claimMeta),
        geo_lat: geoLat || null,
        geo_lng: geoLng || null,
      };

      const { data: claimRow, error: claimErr } = await supabase
        .from('cashback_requests')
        .insert(dbClaim)
        .select()
        .single();

      if (claimErr) handleSbError('submitScannedCode', claimErr);
      if (claimRow?.id) newClaim.supabaseId = claimRow.id;

      await supabase
        .from('qr_tokens')
        .update({
          is_scanned: true,
          scanned_by: sbUserId,
          scanned_at: new Date().toISOString(),
          stage_1_verified: true,
          stage_2_unlocked: true,
        })
        .eq('serial_key', cleanKey);

      if (sbUserId) {
        await supabase
          .from('profiles')
          .update({
            escrow_balance: Number(liveUser?.escrowBalance || 0) + claimAmount,
            scans_count: Number(liveUser?.scansCount || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sbUserId);
      }
    }

    // Update local + dev-sync + Supabase Batches (mark token scanned)
    const prevBatches = batchesRef.current;
    const hasBatch = prevBatches.some((b) => matchedBatch && b.batchId === matchedBatch.batchId);
    let updatedBatches = prevBatches;
    if (!hasBatch && matchedBatch && Number(matchedBatch.quantity || 0) > 0) {
      const newBatchWithToken = {
        ...matchedBatch,
        tokens: [{ ...matchedToken, isScanned: true, scannedBy: newClaim.userName, scannedAt: new Date().toISOString() }],
        codes: [{ ...matchedToken, isScanned: true, scannedBy: newClaim.userName, scannedAt: new Date().toISOString() }],
        quantity: matchedBatch.quantity,
        scannedCount: 1,
        updatedAt: nowTs,
      };
      updatedBatches = [newBatchWithToken, ...prevBatches];
    } else if (hasBatch) {
      updatedBatches = prevBatches.map((b) => {
        if (matchedBatch && b.batchId === matchedBatch.batchId) {
          const nextTokens = (b.tokens || b.codes || []).map((t) =>
            QREngineV24.extractSerialKey(t.serialKey || t.serial) === cleanKey
              ? { ...t, isScanned: true, scannedBy: newClaim.userName, scannedAt: new Date().toISOString() }
              : t
          );
          return {
            ...b,
            tokens: nextTokens,
            codes: nextTokens,
            scannedCount: nextTokens.filter((t) => t.isScanned).length,
            updatedAt: nowTs,
          };
        }
        return b;
      });
    }
    batchesRef.current = updatedBatches;
    setBatches(updatedBatches);
    pushDevSync({ batches: updatedBatches });
    pushBatchesToSupabase(updatedBatches);

    // Update Claims
    const updatedClaims = [newClaim, ...claimsRef.current];
    claimsRef.current = updatedClaims;
    setClaims(updatedClaims);
    pushDevSync({ claims: updatedClaims });

    // Update User Escrow & Scan Count
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (
          (cleanUserMobile && normalizeMobile(u.mobile) === cleanUserMobile) ||
          u.userId === newClaim.userId ||
          String(u.id) === String(liveUser?.id || '')
        ) {
          return {
            ...u,
            escrowBalance: Number(u.escrowBalance || 0) + claimAmount,
            scansCount: Number(u.scansCount || 0) + 1,
            updatedAt: nowTs,
          };
        }
        return u;
      });
      pushDevSync({ users: updated });
      return updated;
    });

    return {
      success: true,
      claim: newClaim,
      productName,
      cashbackAmount: claimAmount,
      claimCode: requestId,
    };
  }, [claims, batches, skus, users, vendors, handleSbError, pushDevSync, pushBatchesToSupabase]);

  // Step 1 Approval (Pending -> Approved / Completed Tab awaiting Release)
  const approveClaimStep1 = useCallback(async (claimId) => {
    const nowTs = Date.now();
    const approvedIso = new Date().toISOString();
    let targetClaim = null;

    const updatedClaims = claimsRef.current.map((c) => {
      if (c.id === claimId || c.requestId === claimId || c.supabaseId === claimId) {
        targetClaim = {
          ...c,
          status: 'Approved',
          payoutStatus: 'Pending Release',
          approvedAt: approvedIso,
          decisionAt: approvedIso,
          updatedAt: nowTs,
        };
        return targetClaim;
      }
      return c;
    });
    claimsRef.current = updatedClaims;
    setClaims(updatedClaims);
    pushDevSync({ claims: updatedClaims });

    if (SB_ONLINE && targetClaim) {
      await pushClaimActionToSupabase({
        claimId: targetClaim.id,
        requestId: targetClaim.requestId,
        status: 'Approved',
        payoutStatus: 'Pending Release',
        approvedAt: approvedIso,
        decisionAt: approvedIso,
      });

      const q = targetClaim.supabaseId
        ? supabase.from('cashback_requests').update({ status: 'Approved', updated_at: approvedIso }).eq('id', targetClaim.supabaseId)
        : supabase.from('cashback_requests').update({ status: 'Approved', updated_at: approvedIso }).eq('request_id', targetClaim.requestId || targetClaim.id);
      const { error } = await q;
      if (error) handleSbError('approveClaimStep1', error);
    }

    return { success: true, claim: targetClaim };
  }, [handleSbError, pushDevSync, pushClaimActionToSupabase]);

  // Step 2 Payout Release (Approved -> Disbursed with Amount, Screenshot, Transaction ID, Remarks)
  const releaseClaimPayout = useCallback(async (claimId, { disbursedAmount, transactionId, paymentMode = 'UPI', remarks = '', paymentProofUrl = null } = {}) => {
    const nowTs = Date.now();
    const existing = claimsRef.current.find((c) => c.id === claimId || c.requestId === claimId || c.supabaseId === claimId);
    if (!existing) return { success: false, message: 'Claim not found' };

    const finalAmount = Number(disbursedAmount ?? existing.amount ?? 0);
    const finalTxnId = String(transactionId || `UTR${nowTs.toString().slice(-8)}`).trim();
    const disbursedIso = new Date().toISOString();

    let updatedClaim = null;
    const updatedClaims = claimsRef.current.map((c) => {
      if (c.id === claimId || c.requestId === claimId || c.supabaseId === claimId) {
        updatedClaim = {
          ...c,
          status: 'Disbursed',
          payoutStatus: 'Disbursed',
          disbursedAmount: finalAmount,
          netDisbursed: finalAmount,
          paymentMode,
          payoutMethod: paymentMode,
          transactionId: finalTxnId,
          npciRrn: finalTxnId,
          utr: finalTxnId,
          remarks,
          paymentProofUrl: paymentProofUrl || c.paymentProofUrl || null,
          approvedAt: c.approvedAt || c.decisionAt || new Date(nowTs - 60000).toISOString(),
          disbursedAt: disbursedIso,
          updatedAt: nowTs,
        };
        return updatedClaim;
      }
      return c;
    });
    claimsRef.current = updatedClaims;
    setClaims(updatedClaims);
    pushDevSync({ claims: updatedClaims });

    // Move User Wallet: Escrow -> Approved Reward Balance
    const cleanMobile = normalizeMobile(existing.mobile || existing.userMobile);
    let updatedUser = null;
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (
          (cleanMobile && normalizeMobile(u.mobile) === cleanMobile) ||
          u.userId === existing.userId ||
          (existing.userSupabaseId && u.supabaseId === existing.userSupabaseId)
        ) {
          updatedUser = {
            ...u,
            escrowBalance: Math.max(0, Number(u.escrowBalance || 0) - Number(existing.amount || finalAmount)),
            rewardBalance: Number(u.rewardBalance || 0) + finalAmount,
            updatedAt: nowTs,
          };
          return updatedUser;
        }
        return u;
      });
      pushDevSync({ users: updated });
      return updated;
    });

    if (SB_ONLINE) {
      await pushClaimActionToSupabase({
        claimId: existing.id,
        requestId: existing.requestId,
        status: 'Disbursed',
        payoutStatus: 'Disbursed',
        disbursedAmount: finalAmount,
        transactionId: finalTxnId,
        disbursedAt: disbursedIso,
        remarks,
      });

      // Preserve JSON metadata in flag_reason
      let updatedFlagReason = remarks || null;
      try {
        const metaPayload = {
          vendorName: existing.vendorName,
          vendorId: existing.vendorId,
          userName: existing.userName,
          userMobile: existing.userMobile,
          userRole: existing.userRole,
          productName: existing.productName,
          skuCode: existing.skuCode,
          packSize: existing.packSize || '20 kg',
          category: existing.category || 'Adhesives',
          subCategory: existing.subCategory || 'High-Polymer Vitrified',
          mrp: existing.mrp || 650,
          claimValue: existing.amount || finalAmount,
          serialKey: existing.serialKey || existing.qrSerial,
          remarks: remarks || 'Disbursed via Admin Escrow Release.',
          paymentMode,
          transactionId: finalTxnId,
          disbursedAmount: finalAmount,
          disbursedAt: disbursedIso,
          payoutStatus: 'Disbursed'
        };
        updatedFlagReason = JSON.stringify(metaPayload);
      } catch (_) {}

      const dbClaimPatch = {
        status: 'Disbursed',
        payout_method: toDbPayoutMethod(paymentMode),
        npci_rrn: finalTxnId,
        net_disbursed: finalAmount,
        flag_reason: updatedFlagReason,
        disbursed_at: disbursedIso,
        updated_at: disbursedIso,
      };
      const cq = existing.supabaseId
        ? supabase.from('cashback_requests').update(dbClaimPatch).eq('id', existing.supabaseId)
        : supabase.from('cashback_requests').update(dbClaimPatch).eq('request_id', existing.requestId || existing.id);
      const { error: cErr } = await cq;
      if (cErr) handleSbError('releaseClaimPayout', cErr);

      if (updatedUser) {
        const uq = updatedUser.supabaseId
          ? supabase.from('profiles').update({
              escrow_balance: updatedUser.escrowBalance,
              reward_balance: updatedUser.rewardBalance,
              updated_at: disbursedIso,
            }).eq('id', updatedUser.supabaseId)
          : supabase.from('profiles').update({
              escrow_balance: updatedUser.escrowBalance,
              reward_balance: updatedUser.rewardBalance,
              updated_at: disbursedIso,
            }).eq('mobile', normalizeMobile(updatedUser.mobile));
        await uq;
      }
    }

    // Auto-dispatch Template 3: Instant Cashback Credit & UPI Payout Receipt
    const recipientEmail = updatedUser?.email || existing?.userEmail || existing?.email;
    if (recipientEmail) {
      sendCashbackReceiptEmail({
        recipientName: existing.userName || updatedUser?.name || 'Valued Partner',
        recipientEmail,
        userId: existing.userId || (updatedUser ? `USR-${updatedUser.id}` : 'USR-1001'),
        amount: finalAmount,
        utrNumber: finalTxnId,
        upiId: existing.upiId || existing.vpaOrIfsc || 'partner@upi',
        cartonSerial: existing.qrSerial || existing.serialKey || 'DG-BATCH-SERIAL',
        skuName: existing.productName || 'DuraGrit Verified Pack',
        scanTimestamp: new Date().toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
      }).catch((err) => console.warn('Cashback receipt auto email failed:', err));
    }

    return { success: true, claim: updatedClaim };
  }, [claims, handleSbError, pushDevSync, pushClaimActionToSupabase]);

  // Legacy single-step approveClaim compatibility wrapper
  const approveClaim = useCallback(async (claimId) => {
    const existing = claims.find((c) => c.id === claimId || c.requestId === claimId || c.supabaseId === claimId);
    if (!existing) return { success: false };
    if (existing.status === 'Pending') {
      return approveClaimStep1(claimId);
    }
    const npciResult = await NPCIGateway.disburseEscrowPayout({
      claimId,
      userMobile: existing.mobile,
      amount: existing.amount,
      vpa: existing.upiId || existing.vpaOrIfsc,
      skuCode: existing.skuCode,
    });
    return releaseClaimPayout(claimId, {
      disbursedAmount: npciResult.netCredit || existing.amount,
      transactionId: npciResult.rrn,
      paymentMode: existing.payoutMethod || 'UPI',
      remarks: 'NPCI Settlement Released',
    });
  }, [claims, approveClaimStep1, releaseClaimPayout]);

  const flagClaim = useCallback(async (claimId, reason = 'Manual review flagged by Admin') => {
    const nowTs = Date.now();
    let target = null;
    const updatedClaims = claimsRef.current.map((c) => {
      if (c.id === claimId || c.requestId === claimId || c.supabaseId === claimId) {
        target = { ...c, status: 'Flagged', payoutStatus: 'Flagged', flagReason: reason, remarks: reason, updatedAt: nowTs };
        return target;
      }
      return c;
    });
    claimsRef.current = updatedClaims;
    setClaims(updatedClaims);
    pushDevSync({ claims: updatedClaims });

    if (SB_ONLINE && target) {
      await pushClaimActionToSupabase({
        claimId: target.id,
        requestId: target.requestId,
        status: 'Flagged',
        payoutStatus: 'Flagged',
        flagReason: reason,
        remarks: reason,
      });

      const q = target.supabaseId
        ? supabase.from('cashback_requests').update({ status: 'Flagged', flag_reason: reason, updated_at: new Date().toISOString() }).eq('id', target.supabaseId)
        : supabase.from('cashback_requests').update({ status: 'Flagged', flag_reason: reason, updated_at: new Date().toISOString() }).eq('request_id', target.requestId || target.id);
      await q;
    }
    return { success: true };
  }, [pushDevSync, pushClaimActionToSupabase]);

  const rejectClaim = useCallback(async (claimId, reason = 'Rejected during Admin Verification') => {
    const nowTs = Date.now();
    const rejectedIso = new Date().toISOString();
    const existing = claims.find((c) => c.id === claimId || c.requestId === claimId || c.supabaseId === claimId);

    setClaims((prev) => {
      const updated = prev.map((c) =>
        c.id === claimId || c.requestId === claimId || c.supabaseId === claimId
          ? {
              ...c,
              status: 'Rejected',
              payoutStatus: 'Rejected',
              flagReason: reason,
              remarks: reason,
              rejectedAt: rejectedIso,
              decisionAt: rejectedIso,
              updatedAt: nowTs,
            }
          : c
      );
      pushDevSync({ claims: updated });
      return updated;
    });

    // Release held escrow back if rejected before disbursement
    if (existing && existing.status !== 'Disbursed') {
      const cleanMobile = normalizeMobile(existing.mobile || existing.userMobile);
      setUsers((prev) => {
        const updated = prev.map((u) => {
          if ((cleanMobile && normalizeMobile(u.mobile) === cleanMobile) || u.userId === existing.userId) {
            return {
              ...u,
              escrowBalance: Math.max(0, Number(u.escrowBalance || 0) - Number(existing.amount || 0)),
              updatedAt: nowTs,
            };
          }
          return u;
        });
        pushDevSync({ users: updated });
        return updated;
      });
    }

    if (SB_ONLINE && existing) {
      pushClaimActionToSupabase({
        claimId: existing.id,
        requestId: existing.requestId,
        status: 'Rejected',
        payoutStatus: 'Rejected',
        flagReason: reason,
        remarks: reason,
        rejectedAt: rejectedIso,
      });

      const q = existing.supabaseId
        ? supabase.from('cashback_requests').update({ status: 'Rejected', flag_reason: reason, updated_at: new Date().toISOString() }).eq('id', existing.supabaseId)
        : supabase.from('cashback_requests').update({ status: 'Rejected', flag_reason: reason, updated_at: new Date().toISOString() }).eq('request_id', existing.requestId || existing.id);
      await q;
    }
    return { success: true };
  }, [claims, pushDevSync, pushClaimActionToSupabase]);

  const lockSettlement = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysDisbursed = claims.filter((c) => c.status === 'Disbursed' && String(c.disbursedAt || '').startsWith(today));
    const totalDisbursed = todaysDisbursed.reduce((sum, c) => sum + parseFloat(c.disbursedAmount || c.amount || 0), 0);

    return {
      success: true,
      settlement: {
        settlementId: `EOD-${today.replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`,
        date: today,
        totalDisbursed,
        claimCount: todaysDisbursed.length,
        lockedAt: new Date().toISOString(),
      },
    };
  }, [claims]);

  // Complete clean reset across React state, localStorage, cross-port bridge, and Supabase
  const clearAllSampleData = useCallback(async () => {
    setSkus([]);
    setUsers([]);
    setVendors([]);
    setBatches([]);
    setClaims([]);
    setOrders(DEFAULT_INITIAL_ORDERS);
    deletedKeysRef.current = new Set();

    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(STORAGE_KEYS.CLEAN_FLAG, 'true');
    } catch (_) {}

    try {
      await fetch(DEV_SYNC_URL, { method: 'DELETE' });
    } catch (_) {}

    if (SB_ONLINE) {
      await Promise.allSettled([
        supabase.from('cashback_requests').delete().neq('request_id', '__NONE__'),
        supabase.from('qr_tokens').delete().neq('serial_key', '__NONE__'),
        supabase.from('qr_batches').delete().neq('batch_identifier', '__NONE__'),
        supabase.from('vendors').delete().neq('vendor_id', '__NONE__'),
        supabase.from('products').delete().neq('sku_code', '__NONE__'),
        supabase.from('profiles').delete().neq('role', 'Admin'),
      ]);
    }

    return { success: true };
  }, []);

  return (
    <DataContext.Provider
      value={{
        skus,
        users,
        vendors,
        batches,
        claims,
        orders,
        smtpConfig,
        updateSmtpConfig,
        dbStatus,
        supabaseOnline: SB_ONLINE,
        refreshAllData,
        clearAllSampleData,
        resetToFactoryData: clearAllSampleData,
        addSKU,
        updateSKU,
        deleteSKU,
        createBatch,
        deleteBatch,
        registerUser,
        updateUser,
        toggleUserActive,
        approveKYC,
        deleteUser,
        addVendor,
        updateVendor,
        toggleVendorStatus,
        deleteVendor,
        releaseVendorPayout,
        createVendorOrder,
        updateOrderStatus,
        submitScannedCode,
        approveClaimStep1,
        releaseClaimPayout,
        approveClaim,
        flagClaim,
        rejectClaim,
        lockSettlement,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
