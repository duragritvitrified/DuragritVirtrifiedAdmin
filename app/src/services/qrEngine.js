import CryptoJS from 'crypto-js';

/**
 * DuraGrit QR Code Cryptographic Engine V2.4
 * - Dual 128-bit SHA cryptographic hashing (FIPS-compliant derivation)
 * - Supports both Lot Serial Format (DG-12345-000001) and SKU Batch Serial Format (DG-SKU-2026NOV-000001)
 * - Extracts serial keys cleanly from full QR verification URLs
 * - Geo-fence validation (Haversine distance)
 * - TDS calculation under Section 194C
 */
export const QREngineV24 = {
  version: '2.4.0-SECURE',
  salt: import.meta.env.VITE_QR_SALT || 'DURAGRIT_VITRIFIED_IND_2026_PROD',

  extractSerialKey(rawInput) {
    if (!rawInput) return '';
    let cleaned = String(rawInput).trim();
    try {
      if (cleaned.includes('/qr/')) {
        cleaned = cleaned.split('/qr/').pop().split(/[?#]/)[0];
      } else if (/^https?:\/\//i.test(cleaned)) {
        const parts = cleaned.replace(/\/+$/, '').split('/');
        cleaned = parts[parts.length - 1] || cleaned;
      }
    } catch (_) {}
    return cleaned.replace(/^#+/, '').trim().toUpperCase();
  },

  generateToken(lotNumber, unitIndex, prefix = 'DG', customSerialKey = null) {
    const paddedLot = String(lotNumber || '10001').padStart(5, '0');
    const paddedUnit = String(unitIndex || 1).padStart(6, '0');
    const serialKey = customSerialKey
      ? String(customSerialKey).trim().toUpperCase()
      : `${prefix}-${paddedLot}-${paddedUnit}`;

    const stage1Raw = CryptoJS.SHA256(`${serialKey}::${this.salt}`).toString();
    const stage1_128 = stage1Raw.substring(0, 32);

    const stage2Raw = CryptoJS.SHA256(`${stage1_128}::LOT_${paddedLot}::STAGE2`).toString();
    const stage2_128 = stage2Raw.substring(0, 32);

    const dualSha128 = `${stage1_128}-${stage2_128}`;

    return {
      serialKey,
      dualSha128,
      lotNumber: paddedLot,
      unitIdentifier: paddedUnit,
      securitySpec: 'TF-256-UV Thermal Foil Embedded',
      generatedAt: new Date().toISOString(),
    };
  },

  generateBatch({ skuId, skuCode, productName, prefix = 'DG', lotNumber, quantity = 100, cashbackAmount = 0, discountTier = 'Standard Master Tier' }) {
    const tokens = [];
    const seenHashes = new Set();

    for (let i = 1; i <= quantity; i++) {
      const token = this.generateToken(lotNumber, i, prefix);
      if (seenHashes.has(token.dualSha128)) {
        throw new Error(`[QREngine] Cryptographic collision detected at unit ${i}. Aborting batch.`);
      }
      seenHashes.add(token.dualSha128);

      tokens.push({
        ...token,
        skuId,
        skuCode,
        productName,
        cashbackAmount: Number(cashbackAmount || 0),
        discountTier,
        qrPayloadUrl: `https://verify.duragritvitrified.com/qr/${token.serialKey}`,
        isScanned: false,
        scannedAt: null,
        scannedBy: null,
        stage1Verified: false,
        stage2Unlocked: false,
      });
    }

    return {
      batchId: `BCH-${String(lotNumber || '1001').toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      skuId,
      skuCode,
      productName,
      lotNumber: String(lotNumber || '10001').padStart(5, '0'),
      quantity: Number(quantity),
      cashbackAmount: Number(cashbackAmount || 0),
      discountTier,
      engineVersion: this.version,
      createdAt: new Date().toISOString(),
      tokens,
    };
  },

  validateSerialFormat(rawKey) {
    const key = this.extractSerialKey(rawKey);
    if (!key) return false;
    return /^[A-Z0-9]{2,8}(-[A-Z0-9]{2,20}){2,4}$/.test(key);
  },

  verifyTokenAuthenticity(serialKey, tokenHash) {
    const clean = this.extractSerialKey(serialKey);
    if (!clean || !tokenHash) return false;
    const parts = clean.split('-');
    if (parts.length === 3 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])) {
      const [prefix, lot, unit] = parts;
      const recalculated = this.generateToken(parseInt(lot, 10), parseInt(unit, 10), prefix);
      return recalculated.dualSha128 === tokenHash;
    }
    const recalculated = this.generateToken('10001', 1, 'DG', clean);
    return recalculated.dualSha128 === tokenHash;
  },

  validateGeoFence(userLat, userLng, maxRadiusKm = 2500) {
    const HQ_LAT = parseFloat(import.meta.env.VITE_HQ_LAT || '22.8173');
    const HQ_LNG = parseFloat(import.meta.env.VITE_HQ_LNG || '70.8317');

    if (userLat == null || userLng == null) {
      return { valid: true, distanceKm: null, flagged: false, reason: null };
    }

    const R = 6371;
    const dLat = ((userLat - HQ_LAT) * Math.PI) / 180;
    const dLng = ((userLng - HQ_LNG) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((HQ_LAT * Math.PI) / 180) * Math.cos((userLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return {
      valid: distanceKm <= maxRadiusKm,
      distanceKm: distanceKm.toFixed(1),
      flagged: distanceKm > maxRadiusKm,
      reason: distanceKm > maxRadiusKm ? `Geo-fence notice: ${distanceKm.toFixed(0)}km from Morbi HQ` : null,
    };
  },

  calculateTDS(grossAmount, hasPAN = true) {
    const amount = Number(grossAmount || 0);
    if (amount <= 500) {
      return { grossAmount: amount, tdsRate: 0, tdsAmount: 0, netAmount: amount, section: 'Sec 194C (Exempt <= ₹500)' };
    }
    const tdsRate = hasPAN ? 0.01 : 0.20;
    const tdsAmount = Math.round(amount * tdsRate * 100) / 100;
    return {
      grossAmount: amount,
      tdsRate,
      tdsAmount,
      netAmount: Math.round((amount - tdsAmount) * 100) / 100,
      section: hasPAN ? 'Section 194C (1% — Individual Contractor)' : 'Section 206AA (20% — PAN Absent)',
    };
  },
};
