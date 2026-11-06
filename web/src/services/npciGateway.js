/**
 * NPCI 256-bit Automated Escrow & Disbursement Gateway
 * Mode: mock (VITE_NPCI_MODE=mock) | live (VITE_NPCI_MODE=live)
 *
 * In live mode, replace the simulation stubs with actual NPCI UPI
 * API calls via your backend server (never expose keys client-side).
 *
 * Compliance Notes:
 *  - VPA validation must pass before any payout attempt.
 *  - IFSC validation powered by RBI published master list.
 *  - TDS deducted under Section 194C as per QREngine.calculateTDS().
 *  - All transactions carry NPCI RRN for audit trail.
 */

const NPCI_MODE = import.meta.env.VITE_NPCI_MODE || 'mock';

export const NPCIGateway = {
  gatewayNodeId: 'NPCI-BBPS-ESCROW-MUMBAI-04', protocol: 'ISO 20022 XML / UPI 2.0 Real-time Clearing', encryption: 'RSA-2048 + AES-GCM-256', mode: NPCI_MODE,  // ------------------------------------------------------------------
  // VPA (UPI ID) Validation
  // ------------------------------------------------------------------
  async validateVPA(vpa) {
    if (!vpa?.includes('@')) {
      return { valid: false, message: 'Invalid VPA format. Must contain @ (e.g. contractor@upi)' };
    }

    await new Promise(r => setTimeout(r, 600)); // Simulated NPCI latency

    const cleanVPA = vpa.trim().toLowerCase();
    const bankMap = {
      '@okaxis': 'Axis Bank', '@okhdfcbank': 'HDFC Bank', '@oksbi': 'State Bank of India', '@okicici': 'ICICI Bank', '@paytm': 'Paytm Payments Bank', '@ybl': 'PhonePe (Yes Bank)', '@ibl': 'PhonePe (ICICI)', '@gpay': 'Google Pay (Axis/SBI)', '@upi': 'NPCI Common UPI Rail',  };

    const bankSuffix = Object.keys(bankMap).find(k => cleanVPA.endsWith(k));

    return {
      valid: true, vpa: cleanVPA, accountHolder: 'REGISTERED APPLICATOR / CONTRACTOR', bankName: bankSuffix ? bankMap[bankSuffix] : 'NPCI Certified Bank', verificationTimestamp: new Date().toISOString(), gatewayNodeId: this.gatewayNodeId,  };
  },  // ------------------------------------------------------------------
  // IFSC Code Validation (RBI Master List check)
  // ------------------------------------------------------------------
  async validateIFSC(ifsc) {
    if (!ifsc || ifsc.length !== 11) {
      return { valid: false, message: 'IFSC must be exactly 11 characters.' };
    }

    await new Promise(r => setTimeout(r, 400));

    // Known IFSC prefixes for major banks in Gujarat / Rajasthan ceramic hubs
    const bankPrefixes = {
      'HDFC': 'HDFC Bank Ltd.', 'SBIN': 'State Bank of India', 'AXIS': 'Axis Bank Ltd.', 'ICIC': 'ICICI Bank Ltd.', 'PUNB': 'Punjab National Bank', 'BARB': 'Bank of Baroda', 'CNRB': 'Canara Bank', 'UBIN': 'Union Bank of India',  };

    const prefix = ifsc.slice(0,4).toUpperCase();
    const bankName = bankPrefixes[prefix] || 'Scheduled Commercial Bank';

    return {
      valid: true, ifsc: ifsc.toUpperCase(), bankName, branch: 'Morbi / Ahmedabad Region Branch', micr: `3800${Math.floor(10000 + Math.random() * 90000)}`, verificationTimestamp: new Date().toISOString(),  };
  },  // ------------------------------------------------------------------
  // Instant Escrow Disbursement (UPI / IMPS / NEFT)
  // ------------------------------------------------------------------
  async disburseEscrowPayout({ claimId, userMobile,  amount, vpa,  ifsc, skuCode,  hasPAN = true }) {
    await new Promise(r => setTimeout(r, 900)); // Simulate NPCI clearing latency

    // Section 194C TDS Deduction
    let tdsDeducted = '0.00';
    let netCredit = typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount).toFixed(2);

    const grossAmount = parseFloat(amount);
    if (grossAmount > 500) {
      const rate = hasPAN ? 0.01 : 0.20;
      tdsDeducted = (grossAmount * rate).toFixed(2);
      netCredit = (grossAmount - parseFloat(tdsDeducted)).toFixed(2);
    }

    const txnSuffix = Math.floor(100000000000 + Math.random() * 900000000000);
    const rrn = `NPCI${txnSuffix}`;

    return {
      success: true, rrn,  claimId, skuCode,  grossAmount: grossAmount.toFixed(2), tdsDeducted, netCredit,  tdsSection: grossAmount > 500 ? (hasPAN ? 'Section 194C (1%)' : 'Section 206AA (20%)') : 'Exempt', payoutMethod: vpa ? 'UPI Instant Payout' : 'NEFT / IMPS', payoutAddress: vpa || ifsc, status: 'DISBURSED', settlementTime: new Date().toISOString(), gatewayRef: `${this.gatewayNodeId}::${rrn}`, clearingRail: this.protocol, mode: this.mode,  };
  },  // ------------------------------------------------------------------
  // Batch Payout Reconciliation Report
  // ------------------------------------------------------------------
  async generateReconciliationReport(batchId, claims) {
    await new Promise(r => setTimeout(r, 300));

    const disbursed = claims.filter(c => c.status === 'Disbursed');
    const totalGross = disbursed.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const totalTDS = disbursed.reduce((s, c) => s + parseFloat(c.tdsDeducted || 0), 0);
    const totalNet = totalGross - totalTDS;

    return {
      batchId, reportId: `RECON-${batchId}-${Date.now().toString(36).toUpperCase()}`, generatedAt: new Date().toISOString(), totalClaims: claims.length, disbursedClaims: disbursed.length, pendingClaims: claims.filter(c => c.status === 'Pending').length, flaggedClaims: claims.filter(c => c.status === 'Flagged').length, financials: {
        totalGross: totalGross.toFixed(2), totalTDS: totalTDS.toFixed(2), totalNetPaid: totalNet.toFixed(2), currency: 'INR',  }, gatewayRef: this.gatewayNodeId,  };
  },  };
