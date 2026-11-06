import CryptoJS from 'crypto-js';

// =====================================================================
// Phase 3 End-to-End Business Logic Verification Test Suite
// =====================================================================

console.log('==================================================================');
console.log('DURAGRIT VITRIFIED - PHASE 3 BUSINESS LOGIC & WORKFLOW TEST SUITE');
console.log('==================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    failCount++;
  }
}

// ---------------------------------------------------------------------
// 1. Dual 128-bit SHA Cryptographic Token Generation & Format
// ---------------------------------------------------------------------
console.log('--- 1. Testing QR Cryptographic Token Engine (V2.4 Dual 128-bit SHA) ---');

const SALT = 'DURAGRIT_VITRIFIED_IND_2026_PROD';

function generateToken(lotNumber, unitIndex, prefix = 'DG') {
  const paddedLot = String(lotNumber).padStart(5, '0');
  const paddedUnit = String(unitIndex).padStart(6, '0');
  const serialKey = `${prefix}-${paddedLot}-${paddedUnit}`;

  const stage1Raw = CryptoJS.SHA256(`${serialKey}::${SALT}`).toString();
  const stage1_128 = stage1Raw.substring(0, 32);

  const stage2Raw = CryptoJS.SHA256(`${stage1_128}::LOT_${paddedLot}::STAGE2`).toString();
  const stage2_128 = stage2Raw.substring(0, 32);

  return {
    serialKey,
    stage1_128,
    stage2_128,
    dualSha128: `${stage1_128}-${stage2_128}`,
    lotNumber: paddedLot,
    unitIdentifier: paddedUnit
  };
}

const sampleToken = generateToken(50142, 109);
assert(sampleToken.serialKey === 'DG-50142-000109', 'Serial Key Format matches DG-[5-digit Lot]-[Unit Identifier]');
assert(sampleToken.stage1_128.length === 32, 'Stage 1 Hash is 128-bit (32 hex characters)', sampleToken.stage1_128);
assert(sampleToken.stage2_128.length === 32, 'Stage 2 Hash is 128-bit (32 hex characters)', sampleToken.stage2_128);
assert(sampleToken.dualSha128.length === 65, 'Dual SHA composite is 65 characters (32-32)');

// ---------------------------------------------------------------------
// 2. Cryptographic Collision & Duplicate Detection Guard
// ---------------------------------------------------------------------
console.log('\n--- 2. Testing Cryptographic Batch Generation & Collision Guard ---');

const seenHashes = new Set();
const seenSerials = new Set();
let collisionDetected = false;
const BATCH_SIZE = 1000;

for (let i = 1; i <= BATCH_SIZE; i++) {
  const token = generateToken(50142, i);
  if (seenHashes.has(token.dualSha128) || seenSerials.has(token.serialKey)) {
    collisionDetected = true;
    break;
  }
  seenHashes.add(token.dualSha128);
  seenSerials.add(token.serialKey);
}

assert(!collisionDetected, `Collision Guard: 0 collisions across ${BATCH_SIZE} unique generated tokens`);
assert(seenHashes.size === BATCH_SIZE, `Set cardinality matches exact batch size (${BATCH_SIZE})`);

// ---------------------------------------------------------------------
// 3. Single-Use Replay Protection & Duplicate Scan Rejection
// ---------------------------------------------------------------------
console.log('\n--- 3. Testing Single-Use Ingestion & Anti-Replay Guard ---');

const scannedLedger = new Map(); // Simulated ledger / DB table qr_scans

function processClaim(serialKey, userId) {
  if (scannedLedger.has(serialKey)) {
    const prior = scannedLedger.get(serialKey);
    return {
      success: false,
      code: 'DUPLICATE_CLAIM',
      message: `Security Alert: QR Code ${serialKey} was already redeemed on ${prior.scannedAt} by user ${prior.userId}. Anti-fraud lock triggered.`
    };
  }

  scannedLedger.set(serialKey, {
    userId,
    scannedAt: new Date().toISOString(),
    status: 'Ingested'
  });

  return { success: true, message: 'Claim successfully ingested into Escrow Queue' };
}

const firstScan = processClaim('DG-50142-000109', 'user-rameshwar-01');
assert(firstScan.success === true, 'First scan of unredeemed token succeeds');

const duplicateScan = processClaim('DG-50142-000109', 'user-malicious-02');
assert(duplicateScan.success === false, 'Duplicate re-scan of same token is rejected immediately');
assert(duplicateScan.code === 'DUPLICATE_CLAIM', 'Rejection code triggers anti-fraud duplicate alert');

// ---------------------------------------------------------------------
// 4. Geo-Fencing Boundary Verification (Haversine Formula)
// ---------------------------------------------------------------------
console.log('\n--- 4. Testing Geo-Fencing Boundary Verification (Morbi Ceramic Hub) ---');

function validateGeoFence(userLat, userLng, maxRadiusKm = 250) {
  const HQ_LAT = 22.8173; // Morbi HQ
  const HQ_LNG = 70.8317;

  if (userLat == null || userLng == null) {
    return { valid: true, distanceKm: null, flagged: true, reason: 'GPS unavailable' };
  }

  const R = 6371; // Earth radius in km
  const dLat = ((userLat - HQ_LAT) * Math.PI) / 180;
  const dLng = ((userLng - HQ_LNG) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((HQ_LAT * Math.PI) / 180) * Math.cos((userLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return {
    valid: distanceKm <= maxRadiusKm,
    distanceKm: parseFloat(distanceKm.toFixed(1)),
    flagged: distanceKm > maxRadiusKm,
    reason: distanceKm > maxRadiusKm ? `Geo-fence breach: ${distanceKm.toFixed(0)}km from Morbi HQ` : null
  };
}

// Morbi Old GIDC (approx 3km)
const morbiScan = validateGeoFence(22.8250, 70.8400, 250);
assert(morbiScan.valid === true && !morbiScan.flagged, 'Morbi Local Scan is valid', `${morbiScan.distanceKm} km`);

// Ahmedabad (approx 180km - within Gujarat ceramic belt)
const ahmedabadScan = validateGeoFence(23.0225, 72.5714, 250);
assert(ahmedabadScan.valid === true && !ahmedabadScan.flagged, 'Ahmedabad Scan is within 250km limit', `${ahmedabadScan.distanceKm} km`);

// Delhi (approx 950km - outside authorized distribution geo-fence)
const delhiScan = validateGeoFence(28.6139, 77.2090, 250);
assert(delhiScan.valid === false && delhiScan.flagged, 'Delhi Scan triggers Geo-Fence breach flag', `${delhiScan.distanceKm} km`);

// ---------------------------------------------------------------------
// 5. Section 194C Statutory TDS Engine
// ---------------------------------------------------------------------
console.log('\n--- 5. Testing Section 194C / 206AA Statutory TDS Calculations ---');

function calculateTDS(grossAmount, hasPAN = true) {
  if (grossAmount <= 500) {
    return { grossAmount, tdsRate: 0, tdsAmount: 0, netAmount: grossAmount, section: 'Sec 194C (Exempt <=500)' };
  }
  const tdsRate = hasPAN ? 0.01 : 0.20;
  const tdsAmount = Math.round(grossAmount * tdsRate * 100) / 100;
  return {
    grossAmount,
    tdsRate,
    tdsAmount,
    netAmount: Math.round((grossAmount - tdsAmount) * 100) / 100,
    section: hasPAN ? 'Section 194C (1% Individual)' : 'Section 206AA (20% PAN Absent)'
  };
}

// Small scan (<= ₹500 exempt)
const smallScan = calculateTDS(100, true);
assert(smallScan.tdsAmount === 0 && smallScan.netAmount === 100, 'Small scans (<=INR 500) are statutory TDS-exempt');

// Large contractor payout (INR 1500) with PAN (1% Section 194C)
const panPayout = calculateTDS(1500, true);
assert(panPayout.tdsAmount === 15.00 && panPayout.netAmount === 1485.00, 'Payout with PAN deducts 1% Section 194C TDS (INR 15 on INR 1500)');

// Large contractor payout (INR 1500) without PAN (20% Section 206AA penalty)
const noPanPayout = calculateTDS(1500, false);
assert(noPanPayout.tdsAmount === 300.00 && noPanPayout.netAmount === 1200.00, 'Payout without PAN deducts 20% Section 206AA TDS (INR 300 on INR 1500)');

// ---------------------------------------------------------------------
// 6. NPCI UPI Escrow Gateway Simulation & VPA Validation
// ---------------------------------------------------------------------
console.log('\n--- 6. Testing NPCI Escrow Gateway & Instant UPI Validation ---');

function validateVPA(vpa) {
  if (!vpa || typeof vpa !== 'string') return { valid: false };
  const parts = vpa.trim().toLowerCase().split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { valid: false };

  const knownHandles = {
    okaxis: 'Axis Bank NPCI UPI Rail',
    okhdfcbank: 'HDFC Bank NPCI UPI Rail',
    oksbi: 'State Bank of India UPI Switch',
    okicici: 'ICICI Bank NPCI Gateway',
    paytm: 'Paytm Payments Bank',
    ybl: 'YES Bank / PhonePe'
  };

  return {
    valid: true,
    userHandle: parts[0],
    bankSuffix: parts[1],
    bankName: knownHandles[parts[1]] || 'Other Scheduled Commercial Bank (NPCI Enabled)'
  };
}

const validVPA = validateVPA('rameshwar.tile@okaxis');
assert(validVPA.valid === true, 'VPA rameshwar.tile@okaxis is valid');
assert(validVPA.bankName === 'Axis Bank NPCI UPI Rail', 'Identified Axis Bank UPI Rail');

const invalidVPA = validateVPA('invalid-vpa-format');
assert(invalidVPA.valid === false, 'Invalid VPA format rejected');

// Payout disbursement generation
function disbursePayout(claimId, amount, vpa) {
  const npciRrn = `NPCI-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    success: true,
    claimId,
    amount,
    vpa,
    npciRrn,
    disbursedAt: new Date().toISOString(),
    status: 'Disbursed'
  };
}

const disbursement = disbursePayout('CLM-9921', 1485, 'rameshwar.tile@okaxis');
assert(disbursement.success === true, 'Disbursement succeeds via NPCI simulation');
assert(disbursement.npciRrn.startsWith('NPCI-'), 'Valid NPCI Reference Number (RRN) generated', disbursement.npciRrn);

console.log('\n==================================================================');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('==================================================================\n');

if (failCount > 0) process.exit(1);
