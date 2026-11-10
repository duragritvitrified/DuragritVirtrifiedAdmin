import CryptoJS from 'crypto-js';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

// ============================================================================
// DuraGrit Vitrified — 300 DPI Thermal Foil Label & Serialized Batch Exporter
// Target Spec: 40x40mm (1.5" x 1.5") @ 300 DPI (12 dots/mm = 472px x 472px)
// Printer Queue Server: PRN-PORT-08 (Online) — Godex / Zebra ZPL II & EZPL
// ============================================================================

export const THERMAL_PRINTER_SPEC = {
  port: 'PRN-PORT-08',
  status: 'Online',
  model: 'Godex / Zebra Industrial Thermal Foil (1.5"×1.5")',
  dpi: 300,
  dotsPerMm: 12,
  widthMm: 40,
  heightMm: 40,
  widthPx: 472,
  heightPx: 472,
  verificationBaseUrl: 'https://verify.duragritvitrified.com/qr',
  salt: 'DURAGRIT_VITRIFIED_IND_2026_PROD',
};

export interface SerializedTokenRecord {
  serialKey: string;
  serial_token_id: string;
  verification_url: string;
  qrPayloadUrl: string;
  sku_code: string;
  batch_prefix: string;
  cashback_inr: number;
  cashbackAmount: number;
  dealer_discount_pct: number;
  expiry_date: string;
  sha256_checksum: string;
  dualSha128: string;
  lotNumber: string;
  isScanned: boolean;
}

export interface BatchExportInput {
  batchId?: string;
  skuCode: string;
  productName?: string;
  batchPrefix: string;
  quantity: number;
  cashbackInr: number;
  dealerDiscountPct?: number | string;
  validityPeriod?: string;
  expiryDate?: string;
  lotNumber?: string;
  tokens?: any[];
}

/**
 * Computes a deterministic 128-bit SHA-256 salted signature hash
 */
export function computeSaltedSha256(serialId: string, skuCode: string, cashbackInr: number): string {
  const raw = `${serialId}|${skuCode}|${cashbackInr}|${THERMAL_PRINTER_SPEC.salt}`;
  const fullHash = CryptoJS.SHA256(raw).toString(CryptoJS.enc.Hex).toUpperCase();
  return fullHash.slice(0, 32); // 128-bit (32 hex chars) cryptographic signature
}

/**
 * Computes expiry date string (YYYY-MM-DD) from validity period description
 */
export function resolveExpiryDate(validityPeriod?: string, explicitExpiry?: string): string {
  if (explicitExpiry && /^\d{4}-\d{2}-\d{2}/.test(explicitExpiry)) {
    return explicitExpiry.slice(0, 10);
  }
  const monthsMatch = String(validityPeriod || '12 Months').match(/(\d+)/);
  const monthsToAdd = monthsMatch ? parseInt(monthsMatch[1], 10) : 12;
  const d = new Date();
  d.setMonth(d.getMonth() + monthsToAdd);
  return d.toISOString().slice(0, 10);
}

/**
 * Extracts YYYYMMM token stamp (e.g. 2026OCT or 2026NOV) from batch prefix or current date
 */
export function extractYearMonthStamp(batchPrefix?: string): string {
  const upper = String(batchPrefix || '').toUpperCase();
  const match = upper.match(/(20\d{2})[-_]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/);
  if (match) {
    return `${match[1]}${match[2]}`;
  }
  const now = new Date();
  const yr = now.getFullYear();
  const mon = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${yr}${mon}`;
}

/**
 * Step A.2: Deterministic Token Serialization
 * Format: DG-{SKU_CLEAN}-{YYYYMMM}-{6_DIGIT_SEQ}
 */
export function generateSerializedBatchTokens(input: BatchExportInput): SerializedTokenRecord[] {
  const cleanSku = String(input.skuCode || 'DTA999')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  const yyyymmm = extractYearMonthStamp(input.batchPrefix);
  const qty = Math.min(5000, Math.max(1, Number(input.quantity) || 10));
  const cashback = Number(input.cashbackInr ?? 50);
  const discountNum =
    typeof input.dealerDiscountPct === 'number'
      ? input.dealerDiscountPct
      : parseFloat(String(input.dealerDiscountPct || '15').replace(/[^0-9.]/g, '')) || 15;
  const expiryDate = resolveExpiryDate(input.validityPeriod, input.expiryDate);
  const lotNum = String(input.lotNumber || Math.floor(1000 + Math.random() * 9000));

  const list: SerializedTokenRecord[] = [];
  for (let i = 0; i < qty; i++) {
    const seq = String(i + 1).padStart(6, '0');
    const serialId = `DG-${cleanSku}-${yyyymmm}-${seq}`;
    const verifyUrl = `${THERMAL_PRINTER_SPEC.verificationBaseUrl}/${serialId}`;
    const checksum = computeSaltedSha256(serialId, input.skuCode, cashback);

    list.push({
      serialKey: serialId,
      serial_token_id: serialId,
      verification_url: verifyUrl,
      qrPayloadUrl: verifyUrl,
      sku_code: input.skuCode,
      batch_prefix: input.batchPrefix || `BATCH-${cleanSku}-${yyyymmm}`,
      cashback_inr: cashback,
      cashbackAmount: cashback,
      dealer_discount_pct: discountNum,
      expiry_date: expiryDate,
      sha256_checksum: checksum,
      dualSha128: `SHA128-${checksum.slice(0, 16)}`,
      lotNumber: lotNum,
      isScanned: false,
    });
  }
  return list;
}

/**
 * Normalizes existing batch tokens into full SerializedTokenRecord objects
 */
export function normalizeBatchTokensForExport(batch: any): SerializedTokenRecord[] {
  const rawTokens = Array.isArray(batch?.tokens)
    ? batch.tokens
    : Array.isArray(batch?.codes)
    ? batch.codes
    : [];

  const skuCode = batch?.skuCode || 'DTA-999';
  const batchPrefix = batch?.prefix || batch?.batchId || 'BATCH-2026-OCT';
  const cashback = Number(batch?.cashbackAmount ?? batch?.cashbackReward ?? 50);
  const discountNum = parseFloat(String(batch?.discountTier || '15').replace(/[^0-9.]/g, '')) || 15;
  const expiryDate = resolveExpiryDate(batch?.validityPeriod, batch?.expDate);

  if (rawTokens.length === 0) {
    return generateSerializedBatchTokens({
      batchId: batch?.batchId,
      skuCode,
      batchPrefix,
      quantity: Number(batch?.quantity || 10),
      cashbackInr: cashback,
      dealerDiscountPct: discountNum,
      validityPeriod: batch?.validityPeriod,
      expiryDate,
    });
  }

  return rawTokens.map((t: any, idx: number) => {
    const serialId =
      t.serial_token_id ||
      t.serialKey ||
      t.serial ||
      `DG-${skuCode.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-${extractYearMonthStamp(batchPrefix)}-${String(idx + 1).padStart(6, '0')}`;
    const verifyUrl = t.verification_url || t.qrPayloadUrl || `${THERMAL_PRINTER_SPEC.verificationBaseUrl}/${serialId}`;
    const tokenCashback = Number(t.cashback_inr ?? t.cashbackAmount ?? cashback);
    const checksum = t.sha256_checksum || computeSaltedSha256(serialId, skuCode, tokenCashback);

    return {
      serialKey: serialId,
      serial_token_id: serialId,
      verification_url: verifyUrl,
      qrPayloadUrl: verifyUrl,
      sku_code: t.sku_code || skuCode,
      batch_prefix: t.batch_prefix || batchPrefix,
      cashback_inr: tokenCashback,
      cashbackAmount: tokenCashback,
      dealer_discount_pct: Number(t.dealer_discount_pct ?? discountNum),
      expiry_date: t.expiry_date || expiryDate,
      sha256_checksum: checksum,
      dualSha128: t.dualSha128 || `SHA128-${checksum.slice(0, 16)}`,
      lotNumber: String(t.lotNumber || batch?.lotNumber || '1001'),
      isScanned: Boolean(t.isScanned),
    };
  });
}

/**
 * Step A.3 (a1): 300 DPI 40x40mm (1.5"x1.5") High-Contrast Vector PDF Label Roll Export
 */
export async function exportThermal40x40Pdf(batch: any): Promise<string> {
  const tokens = normalizeBatchTokensForExport(batch);
  const batchId = batch?.batchId || batch?.prefix || 'BATCH-EXPORT';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [40, 40],
  });

  const qrLib = (QRCode as any)?.default || QRCode;

  for (let i = 0; i < tokens.length; i++) {
    if (i > 0) {
      doc.addPage([40, 40], 'portrait');
    }
    const tok = tokens[i];

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 40, 40, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.45);
    doc.rect(1.2, 1.2, 37.6, 37.6, 'S');

    doc.setFillColor(0, 0, 0);
    doc.rect(1.2, 1.2, 37.6, 4.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.4);
    doc.setTextColor(255, 255, 255);
    doc.text('DURAGRIT VITRIFIED • 300 DPI', 20, 4.3, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFont('courier', 'bold');
    doc.setFontSize(5.5);
    doc.text(`SKU: ${tok.sku_code}  |  INR ${tok.cashback_inr}`, 20, 8.2, { align: 'center' });

    try {
      if (qrLib && typeof qrLib.toDataURL === 'function') {
        const qrDataUrl = await qrLib.toDataURL(tok.verification_url, {
          width: 300,
          margin: 0,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        doc.addImage(qrDataUrl, 'PNG', 9.5, 9.2, 21, 21);
      }
    } catch (_) {
      doc.setDrawColor(0, 0, 0);
      doc.rect(9.5, 9.2, 21, 21, 'S');
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(5.2);
    doc.text(tok.serial_token_id, 20, 32.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.5);
    doc.text(`EXP: ${tok.expiry_date} • DISC: ${tok.dealer_discount_pct}%`, 20, 35.2, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(3.8);
    doc.text(`SHA:${tok.sha256_checksum.slice(0, 12)} • ${THERMAL_PRINTER_SPEC.port}`, 20, 37.6, {
      align: 'center',
    });
  }

  const fileName = `DuraGrit_40x40mm_300DPI_${batchId}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Step A.3 (a2): 300 DPI 40x40mm (472px x 472px) Printable SVG Vector Roll Sheet Export
 */
export async function exportThermal40x40SvgSheet(batch: any): Promise<string> {
  const tokens = normalizeBatchTokensForExport(batch);
  const batchId = batch?.batchId || batch?.prefix || 'BATCH-EXPORT';
  const qrLib = (QRCode as any)?.default || QRCode;

  const cols = 4;
  const cardPx = 472;
  const gapPx = 28;
  const rows = Math.ceil(tokens.length / cols);
  const sheetWidth = cols * cardPx + (cols + 1) * gapPx;
  const sheetHeight = rows * cardPx + (rows + 1) * gapPx + 90;

  const cardElements: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gapPx + col * (cardPx + gapPx);
    const y = 90 + gapPx + row * (cardPx + gapPx);

    let qrSvgPath = '';
    try {
      if (qrLib && typeof qrLib.toString === 'function') {
        const rawSvg = await qrLib.toString(tok.verification_url, {
          type: 'svg',
          margin: 0,
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        const pathMatch = rawSvg.match(/<path[^>]*d="([^"]+)"[^>]*stroke="#000000"[^>]*\/>/i) ||
                          rawSvg.match(/<path[^>]*stroke="#000000"[^>]*d="([^"]+)"[^>]*\/>/i);
        const viewBoxMatch = rawSvg.match(/viewBox="([^"]+)"/i);
        const vb = viewBoxMatch ? viewBoxMatch[1] : '0 0 33 33';
        if (pathMatch) {
          qrSvgPath = `<svg x="116" y="106" width="240" height="240" viewBox="${vb}"><rect width="100%" height="100%" fill="#FFFFFF"/><path d="${pathMatch[1]}" stroke="#000000" stroke-width="1" fill="none"/></svg>`;
        }
      }
    } catch (_) {}

    cardElements.push(`
      <g transform="translate(${x}, ${y})">
        <rect x="0" y="0" width="472" height="472" rx="12" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
        <rect x="0" y="0" width="472" height="58" rx="10" fill="#000000"/>
        <text x="236" y="37" font-family="monospace" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="middle">DURAGRIT VITRIFIED • 300 DPI</text>
        <text x="236" y="86" font-family="monospace" font-size="20" font-weight="bold" fill="#000000" text-anchor="middle">SKU: ${tok.sku_code} | CASHBACK: INR ${tok.cashback_inr}</text>
        ${qrSvgPath || `<rect x="116" y="106" width="240" height="240" fill="none" stroke="#000000" stroke-width="3"/>`}
        <text x="236" y="382" font-family="monospace" font-size="21" font-weight="bold" fill="#000000" text-anchor="middle">${tok.serial_token_id}</text>
        <text x="236" y="416" font-family="monospace" font-size="17" font-weight="bold" fill="#000000" text-anchor="middle">EXP: ${tok.expiry_date} • DISC: ${tok.dealer_discount_pct}%</text>
        <text x="236" y="448" font-family="monospace" font-size="14" fill="#000000" text-anchor="middle">SHA256: ${tok.sha256_checksum.slice(0, 16)} • ${THERMAL_PRINTER_SPEC.port}</text>
      </g>
    `);
  }

  const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}" height="${sheetHeight}" viewBox="0 0 ${sheetWidth} ${sheetHeight}">
  <rect width="100%" height="100%" fill="#F5F5F4"/>
  <rect x="0" y="0" width="${sheetWidth}" height="72" fill="#1C1917"/>
  <text x="32" y="44" font-family="monospace" font-size="26" font-weight="bold" fill="#FFFFFF">DURAGRIT 40x40mm (1.5"x1.5") 300 DPI THERMAL FOIL ROLL • ${batchId} (${tokens.length} LABELS) • QUEUE: ${THERMAL_PRINTER_SPEC.port} (ONLINE)</text>
  ${cardElements.join('\n')}
</svg>`;

  const fileName = `DuraGrit_40x40mm_Vector_${batchId}.svg`;
  triggerBrowserDownload(fullSvg, fileName, 'image/svg+xml;charset=utf-8');
  return fileName;
}

/**
 * Step A.3 (b): Godex / Zebra Raw Thermal Stream (.zpl / .ezpl) at 12 dots/mm (300 DPI)
 */
export function exportThermalZplStream(batch: any, format: 'zpl' | 'ezpl' = 'zpl'): {
  fileName: string;
  port: string;
  status: string;
  labelCount: number;
} {
  const tokens = normalizeBatchTokensForExport(batch);
  const batchId = batch?.batchId || batch?.prefix || 'BATCH-EXPORT';

  let content = '';
  if (format === 'ezpl') {
    const blocks = tokens.map((tok) => {
      return [
        '^Q40,3',
        '^W40',
        '^H12',
        '^P1',
        '^S3',
        '^AT',
        '^C1',
        '^L',
        `AE,24,16,1,1,0,0,DURAGRIT VITRIFIED (${tok.sku_code})`,
        `W136,64,5,2,M,8,6,${tok.verification_url.length},0`,
        tok.verification_url,
        `AD,24,332,1,1,0,0,${tok.serial_token_id}`,
        `AC,24,368,1,1,0,0,INR ${tok.cashback_inr} | DISC ${tok.dealer_discount_pct}% | EXP ${tok.expiry_date}`,
        `AC,24,404,1,1,0,0,SHA:${tok.sha256_checksum.slice(0, 16)} ${THERMAL_PRINTER_SPEC.port}`,
        'E',
      ].join('\n');
    });
    content = blocks.join('\n\n');
  } else {
    const blocks = tokens.map((tok) => {
      return [
        '^XA',
        '~SD22',
        '^PW472',
        '^LL472',
        '^LH0,0',
        '^CI28',
        `^FX DuraGrit 40x40mm 300DPI Label | Queue: ${THERMAL_PRINTER_SPEC.port} (Online)`,
        '^FO12,12^GB448,448,3^FS',
        '^FO12,12^GB448,46,46^FS',
        '^FO26,24^A0N,22,22^FR^FDDURAGRIT VITRIFIED^FS',
        `^FO310,24^A0N,20,20^FR^FD${tok.sku_code}^FS`,
        `^FO132,72^BQN,2,6^FDQA,${tok.verification_url}^FS`,
        `^FO24,338^A0N,22,22^FD${tok.serial_token_id}^FS`,
        `^FO24,370^A0N,18,18^FDCASHBACK: INR ${tok.cashback_inr} | DISC: ${tok.dealer_discount_pct}%^FS`,
        `^FO24,398^A0N,16,16^FDEXP: ${tok.expiry_date} | ${THERMAL_PRINTER_SPEC.port} (ONLINE)^FS`,
        `^FO24,424^A0N,15,15^FDSHA256: ${tok.sha256_checksum.slice(0, 20)}^FS`,
        '^XZ',
      ].join('\n');
    });
    content = blocks.join('\n\n');
  }

  const fileName = `DuraGrit_Thermal_${batchId}_${THERMAL_PRINTER_SPEC.port}.${format}`;
  triggerBrowserDownload(content, fileName, 'text/plain;charset=utf-8');

  return {
    fileName,
    port: THERMAL_PRINTER_SPEC.port,
    status: THERMAL_PRINTER_SPEC.status,
    labelCount: tokens.length,
  };
}

/**
 * Step A.3 (c): Serialized Batch Manifest (.csv)
 * Columns: serial_token_id, verification_url, sku_code, batch_prefix, cashback_inr, dealer_discount_pct, expiry_date, sha256_checksum
 */
export function exportSerializedBatchManifestCsv(batch: any): string {
  const tokens = normalizeBatchTokensForExport(batch);
  const batchId = batch?.batchId || batch?.prefix || 'BATCH-EXPORT';

  const headers = [
    'serial_token_id',
    'verification_url',
    'sku_code',
    'batch_prefix',
    'cashback_inr',
    'dealer_discount_pct',
    'expiry_date',
    'sha256_checksum',
  ];

  const rows = tokens.map((t) => [
    t.serial_token_id,
    t.verification_url,
    `"${String(t.sku_code || '').replace(/"/g, '""')}"`,
    `"${String(t.batch_prefix || '').replace(/"/g, '""')}"`,
    t.cashback_inr,
    t.dealer_discount_pct,
    t.expiry_date,
    t.sha256_checksum,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const fileName = `DuraGrit_Serialized_Manifest_${batchId}.csv`;
  triggerBrowserDownload(csvContent, fileName, 'text/csv;charset=utf-8');
  return fileName;
}

/**
 * Step 02 Header Action: Export Filtered Product Catalog as CSV
 */
export function exportFilteredCatalogCsv(skus: any[], batches: any[] = []): string {
  const headers = [
    'sku_code',
    'product_name',
    'category',
    'specification',
    'pack_weight',
    'dealer_base_inr',
    'retail_mrp_inr',
    'cashback_reward_inr',
    'reward_tier',
    'active_batches',
    'circulation_tokens',
    'status',
  ];

  const rows = (skus || []).map((s) => {
    const skuBatches = (batches || []).filter((b) => b.skuCode === s.skuCode);
    const tokenCount = skuBatches.reduce(
      (sum, b) => sum + Number(b.quantity || (b.tokens || []).length || 0),
      0
    );
    const basePrice = s.base || s.dealerPrice || Math.round((Number(s.mrp) || 0) * 0.75);
    return [
      `"${String(s.skuCode || '').replace(/"/g, '""')}"`,
      `"${String(s.name || '').replace(/"/g, '""')}"`,
      `"${String(s.category || 'Adhesives').replace(/"/g, '""')}"`,
      `"${String(s.spec || 'Type 4 Vitrified').replace(/"/g, '""')}"`,
      `"${String(s.packWeight || s.packSize || '20 kg').replace(/"/g, '""')}"`,
      basePrice,
      Number(s.mrp || 0),
      Number(s.cashbackReward ?? s.cashbackAmount ?? 0),
      `"${String(s.rewardNote || 'Tier 1 Mason direct').replace(/"/g, '""')}"`,
      skuBatches.length,
      tokenCount,
      `"${String(s.status || 'Active')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const fileName = `DuraGrit_Product_Catalog_${new Date().toISOString().slice(0, 10)}.csv`;
  triggerBrowserDownload(csvContent, fileName, 'text/csv;charset=utf-8');
  return fileName;
}

function triggerBrowserDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

