import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// ============================================================================
// DuraGrit Vitrified — Monthly Cashback Ledger & Audited Reconciliation Export
// Target: Step 14 (Monthly Cashback Application Report)
// ============================================================================

export interface LedgerFilterContext {
  selectedYear: string;
  selectedMonth: string;
  roleFilter: string;
  channelFilter: string;
  kpiSummary: {
    uniqueUsers: number;
    contractorsCount: number;
    dealersCount: number;
    totalScans: number;
    disbursedTotal: number;
    upiTotal: number;
    bankTotal: number;
    avgScans: string | number;
  };
  monthlyRows: any[];
  matchingClaims: any[];
}

/**
 * Step B.1 (a): Audited PDF Ledger
 * Header: FINANCIAL RECONCILIATION AUDITED • LEDGER CADENCE: MONTHLY
 * Summary KPIs: Total Unique Users Applied, Total QR Scans Submitted, Total Cashback Disbursed
 * Monthly Breakdown Table
 * Statutory Footer: Statutory GST & Direct Payout Compliance: Sec 194C TDS & NPCI ISO 27001
 */
export function exportAuditedMonthlyLedgerPdf(ctx: LedgerFilterContext): string {
  const {
    selectedYear = '2026',
    selectedMonth = 'All',
    roleFilter = 'All',
    channelFilter = 'All',
    kpiSummary,
    monthlyRows = [],
  } = ctx;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  }) as any;

  // 1. Top Corporate Audited Header Banner
  doc.setFillColor(166, 44, 17); // #A62C11
  doc.rect(0, 0, 297, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('DURAGRIT VITRIFIED — MONTHLY CASHBACK APPLICATION LEDGER', 14, 11);

  doc.setFontSize(8.5);
  doc.setTextColor(254, 215, 170);
  doc.text('FINANCIAL RECONCILIATION AUDITED • LEDGER CADENCE: MONTHLY', 14, 17.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `FILTERS: YEAR=${selectedYear} | MONTH=${selectedMonth} | ROLE=${roleFilter} | CHANNEL=${channelFilter}`,
    14,
    23.5
  );

  doc.text(
    `GENERATED: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
    283,
    17.5,
    { align: 'right' }
  );

  // 2. Summary KPIs Block (Total Unique Users Applied, Total QR Scans Submitted, Total Cashback Disbursed)
  const kpiY = 33;
  doc.setFillColor(250, 249, 246);
  doc.setDrawColor(231, 229, 224);
  doc.roundedRect(14, kpiY, 86, 20, 2, 2, 'FD');
  doc.roundedRect(105, kpiY, 86, 20, 2, 2, 'FD');
  doc.roundedRect(197, kpiY, 86, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text('TOTAL UNIQUE USERS APPLIED', 18, kpiY + 6);
  doc.text('TOTAL QR SCANS SUBMITTED', 109, kpiY + 6);
  doc.text('TOTAL CASHBACK DISBURSED', 201, kpiY + 6);

  doc.setFontSize(12);
  doc.setTextColor(28, 25, 23);
  doc.text(
    `${Number(kpiSummary?.uniqueUsers || 0).toLocaleString('en-IN')} Users (${kpiSummary?.contractorsCount || 0} Contr / ${kpiSummary?.dealersCount || 0} Dealers)`,
    18,
    kpiY + 14.5
  );
  doc.text(
    `${Number(kpiSummary?.totalScans || 0).toLocaleString('en-IN')} Verified Scans (Avg ${kpiSummary?.avgScans || '0.0'})`,
    109,
    kpiY + 14.5
  );
  doc.setTextColor(166, 44, 17);
  doc.text(
    `INR ${Number(kpiSummary?.disbursedTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    201,
    kpiY + 14.5
  );

  // 3. Monthly Breakdown Table
  const tableRows = monthlyRows.map((m) => [
    m.month,
    m.batchId,
    m.uniqueUsers,
    m.contractorsCount,
    m.dealersCount,
    m.approvedApps,
    m.pendingApps,
    m.rejectedApps,
    `INR ${Number(m.totalAmountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    `${m.successRate}%`,
  ]);

  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY: 58,
      head: [
        [
          'Month/Period',
          'Batch Ref',
          'Unique Users',
          'Contractors',
          'Dealers',
          'Approved Apps',
          'Pending',
          'Rejected/Flagged',
          'Total Amount Paid',
          'Success Rate',
        ],
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [28, 25, 23],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [28, 25, 23],
      },
      alternateRowStyles: {
        fillColor: [250, 249, 246],
      },
      margin: { left: 14, right: 14, bottom: 22 },
    });
  }

  // 4. Statutory Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(214, 211, 209);
    doc.line(14, 196, 283, 196);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    doc.text(
      'Statutory GST & Direct Payout Compliance: Sec 194C TDS & NPCI ISO 27001',
      14,
      202
    );
    doc.setFont('helvetica', 'normal');
    doc.text(
      `DuraGrit Vitrified ERP • Page ${i} of ${pageCount}`,
      283,
      202,
      { align: 'right' }
    );
  }

  const fileName = `DuraGrit_Audited_Monthly_Ledger_${selectedYear}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Step B.1 (b): Reconciliation CSV (Full row-level and monthly summary export)
 */
export function exportReconciliationLedgerCsv(ctx: LedgerFilterContext): string {
  const {
    selectedYear = '2026',
    selectedMonth = 'All',
    roleFilter = 'All',
    channelFilter = 'All',
    kpiSummary,
    monthlyRows = [],
    matchingClaims = [],
  } = ctx;

  const lines: string[] = [];

  // Section 1: Audit Metadata & KPI Summary
  lines.push('"FINANCIAL RECONCILIATION AUDITED • LEDGER CADENCE: MONTHLY"');
  lines.push(
    `"Filter Year","${selectedYear}","Filter Month","${selectedMonth}","Role Filter","${roleFilter}","Disbursement Channel","${channelFilter}"`
  );
  lines.push(
    `"Total Unique Users Applied","${kpiSummary?.uniqueUsers || 0}","Total QR Scans Submitted","${kpiSummary?.totalScans || 0}","Total Cashback Disbursed (INR)","${kpiSummary?.disbursedTotal || 0}"`
  );
  lines.push('');

  // Section 2: Monthly Summary Table
  lines.push('"--- MONTHLY ACTIVITY BREAKDOWN SUMMARY ---"');
  lines.push(
    [
      'Month/Period',
      'Batch Ref',
      'Unique Users',
      'Contractors',
      'Dealers',
      'Approved Apps',
      'Pending',
      'Rejected/Flagged',
      'Total Amount Paid',
      'Success Rate',
    ].join(',')
  );

  monthlyRows.forEach((m) => {
    lines.push(
      [
        `"${m.month}"`,
        `"${m.batchId}"`,
        m.uniqueUsers,
        m.contractorsCount,
        m.dealersCount,
        m.approvedApps,
        m.pendingApps,
        m.rejectedApps,
        m.totalAmountPaid,
        `"${m.successRate}%"`,
      ].join(',')
    );
  });

  lines.push('');

  // Section 3: Row-Level Individual Transactions
  lines.push('"--- ROW-LEVEL INDIVIDUAL CLAIM & QR SCAN LEDGER ---"');
  lines.push(
    [
      'Claim ID',
      'User ID',
      'Partner Name',
      'Mobile',
      'Role',
      'SKU Scanned',
      'QR Serial',
      'Payout Channel',
      'Gross Claim (INR)',
      'TDS Deducted (INR)',
      'Net Disbursed (INR)',
      'UTR / RRN',
      'Status',
      'Timestamp',
    ].join(',')
  );

  matchingClaims.forEach((c) => {
    const gross = Number(c.amount || c.claimValue || 0);
    const tds = Number(c.tdsDeducted || 0);
    const net =
      c.status === 'Disbursed' || c.payoutStatus === 'Disbursed'
        ? Number(c.disbursedAmount || c.netDisbursed || gross)
        : 0;
    const channel = c.paymentMode || c.payoutMethod || 'UPI';
    const userId = c.userId || c.vendorId || `USR-${String(c.userMobile || c.mobile || '0000').slice(-4)}`;
    lines.push(
      [
        `"${c.id || c.requestId || ''}"`,
        `"${userId}"`,
        `"${String(c.userName || c.vendorName || 'Registered Partner').replace(/"/g, '""')}"`,
        `"${c.userMobile || c.mobile || ''}"`,
        `"${c.userRole || 'Contractor'}"`,
        `"${c.skuCode || c.productName || 'DA-777'}"`,
        `"${c.qrSerial || c.serialKey || ''}"`,
        `"${channel}"`,
        gross,
        tds,
        net,
        `"${c.transactionId || c.utr || c.npciRrn || ''}"`,
        `"${c.status || 'Pending'}"`,
        `"${c.submittedAt || c.date || ''}"`,
      ].join(',')
    );
  });

  lines.push('');
  lines.push('"Statutory GST & Direct Payout Compliance: Sec 194C TDS & NPCI ISO 27001"');

  const fileName = `DuraGrit_Reconciliation_Ledger_${selectedYear}.csv`;
  triggerCsvDownload(lines.join('\n'), fileName);
  return fileName;
}

/**
 * Step B.2 ([ ↓ Export Table CSV ] — Middle Table Header Right Button)
 * Downloads Monthly Activity Breakdown table rows as DuraGrit_Monthly_Breakdown_2026.csv
 */
export function exportMonthlyBreakdownTableCsv(monthlyRows: any[], selectedYear = '2026'): string {
  const headers = [
    'Month/Period',
    'Batch Ref',
    'Unique Users',
    'Contractors',
    'Dealers',
    'Approved Apps',
    'Pending',
    'Rejected/Flagged',
    'Total Amount Paid',
    'Success Rate',
  ];

  const rows = (monthlyRows || []).map((m) => [
    `"${m.month}"`,
    `"${m.batchId}"`,
    m.uniqueUsers,
    m.contractorsCount,
    m.dealersCount,
    m.approvedApps,
    m.pendingApps,
    m.rejectedApps,
    m.totalAmountPaid,
    `"${m.successRate}%"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const fileName = `DuraGrit_Monthly_Breakdown_${selectedYear}.csv`;
  triggerCsvDownload(csvContent, fileName);
  return fileName;
}

/**
 * Step B.4: Single-Click CSV Export for a Specific Month Drill-Down Drawer
 * Columns: User ID, Name, Role, SKU Scanned, QR Serial, Payout Channel, TDS Deducted, Status, Timestamp
 */
export function exportMonthDetailedScansCsv(monthLabel: string, batchRef: string, scanRows: any[]): string {
  const headers = [
    'User ID',
    'Name',
    'Role',
    'SKU Scanned',
    'QR Serial',
    'Payout Channel',
    'TDS Deducted',
    'Status',
    'Timestamp',
  ];

  const rows = (scanRows || []).map((r) => [
    `"${String(r.userId || '').replace(/"/g, '""')}"`,
    `"${String(r.userName || '').replace(/"/g, '""')}"`,
    `"${String(r.userRole || 'Contractor').replace(/"/g, '""')}"`,
    `"${String(r.skuScanned || 'DA-777').replace(/"/g, '""')}"`,
    `"${String(r.qrSerial || '').replace(/"/g, '""')}"`,
    `"${String(r.payoutChannel || 'UPI Escrow').replace(/"/g, '""')}"`,
    Number(r.tdsDeducted ?? 0).toFixed(2),
    `"${String(r.status || 'Approved')}"`,
    `"${String(r.timestamp || '')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const safeMonth = String(monthLabel || 'Month').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `DuraGrit_Detailed_Scans_${safeMonth}_${batchRef || 'MREG'}.csv`;
  triggerCsvDownload(csvContent, fileName);
  return fileName;
}

function triggerCsvDownload(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

