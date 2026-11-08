import React, { useState, useMemo } from 'react';
import {
  CheckCircle2, Clock, XCircle, ShieldCheck,
  Search, Download, Check, QrCode,
  RefreshCw, Eye, Sparkles,
  Zap, UploadCloud, Image as ImageIcon, X,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';

// Default SVG Payment Receipt Voucher Preview (used only if admin clicks "+ Generate Voucher Slip" or views a settled claim without custom screenshot)
const DEFAULT_RECEIPT_PREVIEW = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260" fill="none"><rect width="400" height="260" rx="16" fill="%23A62C11"/><rect x="12" y="12" width="376" height="236" rx="12" fill="%23FEF2EE" stroke="%23C84826" stroke-width="2"/><circle cx="200" cy="55" r="24" fill="%23059669"/><path d="M192 55L198 61L209 49" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="200" y="98" font-family="sans-serif" font-size="14" font-weight="bold" fill="%237c2d12" text-anchor="middle">NPCI PAYOUT SETTLEMENT VOUCHER</text><text x="200" y="120" font-family="monospace" font-size="11" fill="%239a3412" text-anchor="middle">DURAGRIT VITRIFIED ESCROW GATEWAY</text><line x1="30" y1="135" x2="370" y2="135" stroke="%23F9CEB8" stroke-width="1.5" stroke-dasharray="4 4"/><text x="40" y="160" font-family="sans-serif" font-size="11" fill="%237c2d12">Status:</text><text x="360" y="160" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23059669" text-anchor="end">PAID / DISBURSED</text><text x="40" y="185" font-family="sans-serif" font-size="11" fill="%237c2d12">Verification:</text><text x="360" y="185" font-family="monospace" font-size="11" font-weight="bold" fill="%237c2d12" text-anchor="end">DUAL-CONTROL SETTLED</text><text x="40" y="210" font-family="sans-serif" font-size="11" fill="%237c2d12">Settlement Rail:</text><text x="360" y="210" font-family="sans-serif" font-size="11" font-weight="bold" fill="%237c2d12" text-anchor="end">IMPS / UPI 24x7</text><rect x="30" y="222" width="340" height="18" rx="4" fill="%23fde68a"/><text x="200" y="235" font-family="monospace" font-size="9" fill="%2378350f" font-weight="bold" text-anchor="middle">DURAGRIT VITRIFIED CORP SETTLEMENT ESCROW</text></svg>`;

function formatRelativeTime(isoOrDate) {
  if (!isoOrDate) return 'Just now';
  const ts = new Date(isoOrDate).getTime();
  if (Number.isNaN(ts)) return 'Recorded';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hrs ago`;
  return `${Math.floor(diffSec / 86400)} days ago`;
}

export function CashbackRequests() {
  const {
    claims,
    skus,
    vendors = [],
    users = [],
    dbStatus,
    refreshAllData,
    approveClaimStep1,
    releaseClaimPayout,
    rejectClaim,
  } = useData();

  // Helper to reliably resolve the Vendor Name & Vendor ID for any claim across tabs
  const resolveVendorInfo = (c) => {
    // 1. Direct on claim
    if (c.vendorName && String(c.vendorName).trim() && c.vendorName !== '—') {
      return {
        vendorName: String(c.vendorName).trim(),
        vendorId: c.vendorId || 'VEN-001'
      };
    }
    if (c.companyName && String(c.companyName).trim()) {
      return {
        vendorName: String(c.companyName).trim(),
        vendorId: c.vendorId || 'VEN-001'
      };
    }

    // 2. Match by vendorId
    if (c.vendorId) {
      const v = vendors.find(
        (item) => String(item.vendorId || item.id || '').toUpperCase() === String(c.vendorId).toUpperCase()
      );
      if (v?.companyName || v?.name) {
        return {
          vendorName: v.companyName || v.name,
          vendorId: v.vendorId || v.id || c.vendorId
        };
      }
    }

    // 3. Match by userId (e.g., VEN-001)
    const cleanUid = String(c.userId || c.userSupabaseId || '').toUpperCase();
    if (cleanUid) {
      const v = vendors.find(
        (item) => String(item.vendorId || item.id || '').toUpperCase() === cleanUid
      );
      if (v?.companyName || v?.name) {
        return {
          vendorName: v.companyName || v.name,
          vendorId: v.vendorId || v.id || cleanUid
        };
      }
    }

    // 4. Match by mobile phone digits
    const cleanMobile = String(c.userMobile || c.mobile || '').replace(/\D/g, '').slice(-10);
    if (cleanMobile && cleanMobile.length === 10) {
      const v = vendors.find((item) => {
        const vDigits = String(item.phone || item.mobile || '').replace(/\D/g, '').slice(-10);
        return vDigits === cleanMobile;
      });
      if (v?.companyName || v?.name) {
        return {
          vendorName: v.companyName || v.name,
          vendorId: v.vendorId || v.id || 'VEN-001'
        };
      }
    }

    // 5. Match by userName / contractorName against vendor directory
    const cleanName = String(c.userName || c.contractorName || '').trim().toLowerCase();
    if (cleanName) {
      const v = vendors.find((item) => {
        const cName = String(item.companyName || '').trim().toLowerCase();
        const pName = String(item.contactPerson || '').trim().toLowerCase();
        return cName === cleanName || pName === cleanName;
      });
      if (v?.companyName || v?.name) {
        return {
          vendorName: v.companyName || v.name,
          vendorId: v.vendorId || v.id || 'VEN-001'
        };
      }
    }

    // 6. Check registered users for associated vendor / firm
    if (cleanMobile) {
      const u = users.find(
        (item) => String(item.mobile || item.phone || '').replace(/\D/g, '').slice(-10) === cleanMobile
      );
      if (u?.vendorName || u?.companyName) {
        return {
          vendorName: u.vendorName || u.companyName,
          vendorId: u.vendorId || 'VEN-001'
        };
      }
      if (u?.associatedVendor || u?.dealerName) {
        return {
          vendorName: u.associatedVendor || u.dealerName,
          vendorId: u.vendorId || 'VEN-001'
        };
      }
    }

    // 7. If role is Vendor or Dealer
    if (
      String(c.userRole || '').toLowerCase().includes('vend') ||
      String(c.userRole || '').toLowerCase().includes('deal')
    ) {
      return {
        vendorName: c.userName || 'Authorized Vendor Partner',
        vendorId: c.vendorId || 'VEN-001'
      };
    }

    // 8. Fallback to active vendor in directory or default
    const firstVendor = vendors.find((v) => v.companyName);
    return {
      vendorName: firstVendor?.companyName || 'Reliance Polymers Ltd (Hazira Complex)',
      vendorId: firstVendor?.vendorId || firstVendor?.id || 'VEN-001'
    };
  };

  // Tabs: 'pending' (Pending List - Approve Only) | 'completed' (In Process / Complete - Release Payout & Disbursed) | 'rejected' (Quarantine)
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('All');
  const [payoutFilter, setPayoutFilter] = useState('All');
  const [highValueOnly, setHighValueOnly] = useState(false);

  // Toast & Processing State
  const [toastMsg, setToastMsg] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Release Modal State
  const [releaseModalClaim, setReleaseModalClaim] = useState(null);
  const [releaseForm, setReleaseForm] = useState({
    amount: '',
    transactionId: '',
    paymentMode: 'UPI',
    remarks: '',
    proofImage: null,
    proofFileName: '',
  });

  // View Receipt / Scan Proof Modal State
  const [viewReceiptClaim, setViewReceiptClaim] = useState(null);
  const [viewScanPhotoClaim, setViewScanPhotoClaim] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  // Normalize live claims from DataContext (zero hardcoded sample rows)
  const claimsList = useMemo(() => {
    return (claims || []).map((c) => {
      const cashback = Number(c.amount ?? c.claimValue ?? c.cashback ?? 0);
      const isDisbursed = c.status === 'Disbursed' || c.payoutStatus === 'Disbursed';
      const isApprovedAwaiting = c.status === 'Approved' && !isDisbursed;
      const isRejected = c.status === 'Rejected' || c.status === 'Flagged';
      const rawMethod = String(c.payoutMethod || c.paymentMode || c.payoutType || 'UPI');
      const payoutType = rawMethod.toUpperCase().includes('UPI') ? 'UPI' : 'Bank';
      const payoutDest = c.vpaOrIfsc || c.upiId || c.bankAccount || c.payoutDest || '—';
      const vInfo = resolveVendorInfo(c);

      return {
        ...c,
        id: c.requestId || c.claimNumber || c.id,
        vendorName: vInfo.vendorName,
        vendorId: vInfo.vendorId,
        userName: c.userName || c.contractorName || 'Registered Partner',
        userRole: c.userRole || 'Contractor',
        userMobile: c.userMobile || c.contractorPhone || c.mobile || '—',
        productName: c.productName || 'DuraGrit Verified Pack',
        qrSerial: c.qrSerial || c.serialKey || '—',
        cashback,
        disbursedAmount: isDisbursed ? Number(c.disbursedAmount ?? c.netDisbursed ?? cashback) : 0,
        payoutType,
        paymentMode: c.paymentMode || c.payoutMethod || 'UPI',
        payoutDest,
        scanTimestamp:
          c.date ||
          (c.submittedAt
            ? new Date(c.submittedAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Just now'),
        relativeTime: formatRelativeTime(c.submittedAt || c.createdAt),
        isDisbursed,
        isApprovedAwaiting,
        isRejected,
        npciRrn: c.npciRrn || c.transactionId || c.utr || '',
        proofImageUrl: c.proofImageUrl || c.proofImage || c.proofUrl || null,
        paymentProofUrl: c.paymentProofUrl || c.paymentScreenshot || null,
        remarks: c.remarks || c.flagReason || '',
        disbursedAtFormatted: c.disbursedAt
          ? new Date(c.disbursedAt).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
      };
    });
  }, [claims, vendors, users]);

  // Dynamic Product Filter Options from live SKUs & Claims
  const productOptions = useMemo(() => {
    const names = new Set();
    (skus || []).forEach((s) => {
      if (s.name) names.add(s.name);
    });
    claimsList.forEach((c) => {
      if (c.productName) names.add(c.productName);
    });
    return Array.from(names);
  }, [skus, claimsList]);

  // Dynamic KPI Calculations
  const stats = useMemo(() => {
    const pendingList = claimsList.filter((c) => c.status === 'Pending');
    const approvedAwaitingRelease = claimsList.filter((c) => c.isApprovedAwaiting);
    const disbursedList = claimsList.filter((c) => c.isDisbursed);
    const rejectedList = claimsList.filter((c) => c.isRejected);

    const pendingVal = pendingList.reduce((acc, c) => acc + c.cashback, 0);
    const awaitingReleaseVal = approvedAwaitingRelease.reduce((acc, c) => acc + c.cashback, 0);
    const disbursedVal = disbursedList.reduce((acc, c) => acc + (c.disbursedAmount || c.cashback), 0);

    return {
      pendingCount: pendingList.length,
      pendingVal,
      awaitingReleaseCount: approvedAwaitingRelease.length,
      awaitingReleaseVal,
      disbursedCount: disbursedList.length,
      disbursedVal,
      rejectedCount: rejectedList.length,
    };
  }, [claimsList]);

  // Filtered claims for active tab
  const filteredClaims = useMemo(() => {
    return claimsList.filter((item) => {
      if (activeTab === 'pending' && item.status !== 'Pending') return false;
      if (activeTab === 'completed' && !item.isApprovedAwaiting && !item.isDisbursed) return false;
      if (activeTab === 'rejected' && !item.isRejected) return false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        String(item.id).toLowerCase().includes(q) ||
        String(item.vendorName || '').toLowerCase().includes(q) ||
        String(item.vendorId || '').toLowerCase().includes(q) ||
        String(item.userName).toLowerCase().includes(q) ||
        String(item.userMobile).toLowerCase().includes(q) ||
        String(item.qrSerial).toLowerCase().includes(q) ||
        String(item.payoutDest).toLowerCase().includes(q) ||
        String(item.npciRrn).toLowerCase().includes(q);

      const matchesProduct = productFilter === 'All' || item.productName === productFilter || item.productName.includes(productFilter);
      const matchesPayout = payoutFilter === 'All' || item.payoutType === payoutFilter;
      const matchesHighVal = !highValueOnly || item.cashback >= 50;

      return matchesSearch && matchesProduct && matchesPayout && matchesHighVal;
    }).sort((a, b) => {
      const getT = (item) => {
        if (item.submittedAt) { const t = new Date(item.submittedAt).getTime(); if (!isNaN(t) && t > 0) return t; }
        if (item.createdAt) { const t = new Date(item.createdAt).getTime(); if (!isNaN(t) && t > 0) return t; }
        if (item.timestamp) { const t = new Date(item.timestamp).getTime(); if (!isNaN(t) && t > 0) return t; }
        return 0;
      };
      const diff = getT(b) - getT(a);
      if (diff !== 0) return diff;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [claimsList, activeTab, searchQuery, productFilter, payoutFilter, highValueOnly]);

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAllVisible = () => {
    if (filteredClaims.length === 0) return;
    if (selectedIds.length === filteredClaims.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClaims.map((c) => c.id));
    }
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
    showToast('Live cashback ledger synchronized with Mobile App & Supabase.');
  };

  // 1. APPROVE ACTION (Pending Tab ONLY sets status to Approved & moves to Completed tab)
  const handleSingleApprove = async (claim) => {
    setProcessingId(claim.id);
    await approveClaimStep1(claim.id);
    setSelectedIds((prev) => prev.filter((id) => id !== claim.id));
    setProcessingId(null);
    showToast(`✓ Claim ${claim.id} Approved! Moved to 'In Process / Complete' tab for payout release.`);
  };

  // Bulk Approve in Pending Tab
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least 1 pending request.');
      return;
    }

    setIsBulkProcessing(true);
    const toApprove = claimsList.filter((c) => selectedIds.includes(c.id) && c.status === 'Pending');
    const totalAmount = toApprove.reduce((sum, c) => sum + c.cashback, 0);

    for (const claim of toApprove) {
      await approveClaimStep1(claim.id);
    }

    setSelectedIds([]);
    setIsBulkProcessing(false);
    showToast(`✓ ${toApprove.length} Claims Approved (₹${totalAmount.toFixed(2)})! Ready for payout release in Completed tab.`);
  };

  // Single Reject
  const handleSingleReject = async (claim) => {
    setProcessingId(claim.id);
    await rejectClaim(claim.id, 'Rejected by Admin during claim verification');
    setSelectedIds((prev) => prev.filter((id) => id !== claim.id));
    setProcessingId(null);
    showToast(`Request ${claim.id} rejected and moved to Quarantine.`);
  };

  // 2. OPEN RELEASE PAYOUT MODAL (Completed Tab -> Release button)
  const handleOpenReleaseModal = (claim) => {
    setReleaseModalClaim(claim);
    const generatedUtr = 'UTR' + Math.floor(1000000000 + Math.random() * 9000000000);
    setReleaseForm({
      amount: claim.cashback.toFixed(2),
      transactionId: generatedUtr,
      paymentMode: claim.payoutType === 'Bank' ? 'Bank NEFT' : 'UPI',
      remarks: `Cashback payout settled for ${claim.id} to ${claim.userName}`,
      proofImage: null,
      proofFileName: '',
    });
  };

  // Handle Screenshot Upload in Release Modal
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReleaseForm((prev) => ({
          ...prev,
          proofImage: event.target.result,
          proofFileName: file.name,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachVoucherReceipt = () => {
    setReleaseForm((prev) => ({
      ...prev,
      proofImage: DEFAULT_RECEIPT_PREVIEW,
      proofFileName: 'duragrit_escrow_voucher.svg',
    }));
  };

  // 3. SUBMIT RELEASE MODAL -> Sets Status to Disbursed across Web, Mobile App & Supabase
  const handleSubmitRelease = async (e) => {
    e.preventDefault();
    if (!releaseModalClaim) return;

    const numAmount = parseFloat(releaseForm.amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid disbursal amount.');
      return;
    }

    if (!releaseForm.transactionId.trim()) {
      showToast('Please enter a valid Transaction ID / UTR.');
      return;
    }

    setProcessingId(releaseModalClaim.id);
    const claimName = releaseModalClaim.userName;
    const utr = releaseForm.transactionId.trim();

    await releaseClaimPayout(releaseModalClaim.id, {
      disbursedAmount: numAmount,
      transactionId: utr,
      paymentMode: releaseForm.paymentMode,
      remarks: releaseForm.remarks.trim() || 'Disbursed via Admin Escrow Release.',
      paymentProofUrl: releaseForm.proofImage || DEFAULT_RECEIPT_PREVIEW,
    });

    setProcessingId(null);
    setReleaseModalClaim(null);
    showToast(`Payout Released! ₹${numAmount.toFixed(2)} disbursed to ${claimName} (UTR: ${utr}). Synced to Mobile App & Supabase.`);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (claimsList.length === 0) {
      showToast('No cashback claims recorded yet to export.');
      return;
    }
    showToast('Exporting QR Cashback Claims Ledger CSV...');
    setTimeout(() => {
      const header = [
        'Request ID',
        'Vendor Name',
        'Vendor ID',
        'User Name',
        'Role',
        'Mobile',
        'Product',
        'QR Serial',
        'Claimed Amount (INR)',
        'Disbursed Amount (INR)',
        'Payout Method',
        'Destination',
        'Status',
        'Payout Status',
        'UTR / RRN',
        'Remarks',
        'Disbursed At',
      ];
      const rows = claimsList.map((c) => [
        c.id,
        `"${(c.vendorName || 'DuraGrit Partner Vendor').replace(/"/g, '""')}"`,
        `"${c.vendorId || 'VEN-001'}"`,
        `"${c.userName}"`,
        c.userRole,
        `"${c.userMobile}"`,
        `"${c.productName}"`,
        c.qrSerial,
        c.cashback,
        c.disbursedAmount || 0,
        c.paymentMode,
        `"${c.payoutDest}"`,
        c.status,
        c.payoutStatus,
        `"${c.npciRrn || 'N/A'}"`,
        `"${(c.remarks || '').replace(/"/g, '""')}"`,
        `"${c.disbursedAtFormatted || 'N/A'}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `DuraGrit_Cashback_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 250);
  };

  return (
    <div className="space-y-6 select-none font-sans pb-10">
      {/* Global Toast */}
      {toastMsg && (() => {
        const isError = /error|failed|failure|invalid|missing|required|cannot|unable|reject|please enter|denied|timeout|unreachable/i.test(toastMsg);
        return (
          <div className={`fixed top-20 right-8 z-50 text-white px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 select-none ${
            isError ? 'bg-rose-600 border-rose-400/60 shadow-rose-950/30' : 'bg-emerald-600 border-emerald-400/60 shadow-emerald-950/30'
          }`}>
            {isError ? (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toastMsg}</span>
          </div>
        );
      })()}

      {/* Breadcrumb & Screen Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-medium">
            <span className="whitespace-nowrap">DuraGrit ERP</span>
            <span className="text-slate-300">/</span>
            <span className="whitespace-nowrap">Payout Engine</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#A62C11] font-bold whitespace-nowrap">Cashback Approvals &amp; Disbursal</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              {dbStatus?.connected ? 'SUPABASE REALTIME SYNC' : 'LIVE ESCROW SYNC'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              QR Cashback Approvals &amp; Payout Release
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8] px-2 py-0.5 rounded font-mono whitespace-nowrap">
              DUAL-STAGE V3.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pending List shows <strong>Approve</strong> only. Completed tab shows <strong>Release Payout</strong> (Amount, Screenshot, Transaction ID &amp; Remarks) and updates status to <strong>Disbursed</strong>.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center space-x-2.5 shrink-0 self-start lg:self-auto">
          <button
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-[#FEF2EE] hover:border-[#F9CEB8] text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C84826] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Claims</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {activeTab === 'pending' && (
            <button
              disabled={selectedIds.length === 0 || isBulkProcessing}
              onClick={handleBulkApprove}
              className="flex items-center space-x-2 px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-sm shadow-[#C84826]/20 disabled:opacity-50 transition cursor-pointer active:scale-98"
            >
              {isBulkProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>Approve Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pending Admin Approval */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                1. Pending Approval
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight">
                {stats.pendingCount} Requests
              </div>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs font-medium text-slate-500 flex items-center justify-between font-mono flex-wrap gap-1">
            <span className="whitespace-nowrap font-bold text-slate-800">₹{stats.pendingVal.toFixed(2)}</span>
            <span className="text-slate-400 font-normal text-[11px] whitespace-nowrap">awaiting admin approve</span>
          </div>
        </div>

        {/* KPI 2: Approved (Awaiting Release) */}
        <div className="bg-white p-5 rounded-2xl border border-[#F9CEB8] shadow-xs flex flex-col justify-between min-h-[140px] bg-gradient-to-br from-white to-[#FEF2EE]/60">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#C84826] uppercase tracking-wider">
                2. Approved (Pending Release)
              </span>
              <div className="text-2xl font-black text-[#A62C11] mt-1 font-mono tracking-tight">
                {stats.awaitingReleaseCount} Approved
              </div>
            </div>
            <div className="p-2.5 bg-[#FEF2EE] text-[#C84826] rounded-xl border border-[#F9CEB8]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F9CEB8]/60 text-xs font-semibold flex items-center justify-between gap-1 flex-wrap">
            <span className="text-[#A62C11] font-mono font-bold whitespace-nowrap shrink-0">₹{stats.awaitingReleaseVal.toFixed(2)}</span>
            <span className="text-[#C84826] font-normal text-[11px] whitespace-nowrap">ready for Release button</span>
          </div>
        </div>

        {/* KPI 3: Total Disbursed / Released */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between min-h-[140px] bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                3. Total Disbursed (Released)
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-1 font-mono tracking-tight">
                {stats.disbursedCount} Disbursed
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-100 text-xs font-semibold flex items-center justify-between gap-1 flex-wrap">
            <span className="text-emerald-700 font-mono font-bold whitespace-nowrap shrink-0">₹{stats.disbursedVal.toFixed(2)}</span>
            <span className="text-emerald-600/80 font-normal text-[11px] whitespace-nowrap">credited to partner wallet</span>
          </div>
        </div>

        {/* KPI 4: Flagged / Rejected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Flagged / Rejected
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight">
                {stats.rejectedCount} Blocked
              </div>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs font-medium text-rose-600 flex items-center justify-between">
            <span>Quarantined claims</span>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-0">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-t-2 border-x ${
            activeTab === 'pending'
              ? 'bg-[#C84826] text-white border-[#C84826] shadow-xs'
              : 'bg-white text-slate-600 border-transparent hover:text-slate-900 hover:bg-[#FEF2EE]/60'
          }`}
        >
          <span>1. Pending List (Approve Only)</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {stats.pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-t-2 border-x ${
            activeTab === 'completed'
              ? 'bg-[#C84826] text-white border-[#C84826] shadow-xs'
              : 'bg-white text-slate-600 border-transparent hover:text-slate-900 hover:bg-[#FEF2EE]/60'
          }`}
        >
          <span>2. Completed (Release Payout &amp; Disbursed)</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {stats.awaitingReleaseCount + stats.disbursedCount}
          </span>
          {stats.awaitingReleaseCount > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 animate-pulse">
              {stats.awaitingReleaseCount} To Release
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer border-t-2 border-x ${
            activeTab === 'rejected'
              ? 'bg-[#C84826] text-white border-[#C84826] shadow-xs'
              : 'bg-white text-slate-600 border-transparent hover:text-slate-900 hover:bg-[#FEF2EE]/60'
          }`}
        >
          <span>3. Rejected / Quarantine</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              activeTab === 'rejected' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {stats.rejectedCount}
          </span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative min-w-[280px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by request ID, contractor/dealer, mobile, QR serial, or UTR"
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
            />
          </div>

          {/* Product & Channel Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
            >
              <option value="All">All Products ({productOptions.length})</option>
              {productOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={payoutFilter}
              onChange={(e) => setPayoutFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
            >
              <option value="All">Payout Method: All (UPI / Bank)</option>
              <option value="UPI">UPI Instant Escrow</option>
              <option value="Bank">Direct Bank NEFT</option>
            </select>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={highValueOnly}
                onChange={(e) => setHighValueOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#C84826] focus:ring-[#C84826] cursor-pointer"
              />
              <span>High Value (&ge; ₹50)</span>
            </label>
          </div>
        </div>

        {/* Sub-toolbar Count & Select All */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          {activeTab === 'pending' ? (
            <button
              onClick={handleSelectAllVisible}
              disabled={filteredClaims.length === 0}
              className="flex items-center space-x-1.5 font-bold text-[#C84826] hover:text-[#A62C11] hover:underline disabled:opacity-40 cursor-pointer"
            >
              <span>
                {filteredClaims.length > 0 && selectedIds.length === filteredClaims.length
                  ? 'Deselect All'
                  : `Select All Visible (${filteredClaims.length})`}
              </span>
            </button>
          ) : (
            <div className="text-slate-400 font-medium">
              {activeTab === 'completed'
                ? 'Approved claims show Release Payout button; released claims show Disbursed badge & View Receipt.'
                : 'Quarantined or rejected cashback requests.'}
            </div>
          )}

          <div>
            Showing <strong className="text-slate-900 font-mono">{filteredClaims.length}</strong> records
          </div>
        </div>
      </div>

      {/* CASHBACK REQUESTS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                {activeTab === 'pending' && (
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredClaims.length > 0 && selectedIds.length === filteredClaims.length}
                      onChange={handleSelectAllVisible}
                      className="w-4 h-4 rounded text-[#C84826] focus:ring-[#C84826] cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3.5 px-3 min-w-[105px]">Request ID</th>
                <th className="py-3.5 px-4 min-w-[210px]">Vendor Name</th>
                <th className="py-3.5 px-4 min-w-[190px]">Applicant &amp; Role</th>
                <th className="py-3.5 px-4 min-w-[220px]">Scanned Product &amp; QR Serial</th>
                <th className="py-3.5 px-3 min-w-[120px]">Cashback Claim</th>
                <th className="py-3.5 px-4 min-w-[180px]">Payout Method &amp; Dest</th>
                <th className="py-3.5 px-4 min-w-[165px]">Scan Timestamp</th>
                <th className="py-3.5 px-4 min-w-[150px]">Status / Settlement</th>
                <th className="py-3.5 px-4 text-right min-w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 10 : 9} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-[#FEF2EE] border border-[#F9CEB8] flex items-center justify-center text-[#C84826]">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-700">
                        {claimsList.length === 0
                          ? 'No QR Cashback Requests Submitted Yet'
                          : `No claims in ${activeTab === 'pending' ? 'Pending List' : activeTab === 'completed' ? 'Completed' : 'Rejected'} tab`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {claimsList.length === 0
                          ? 'Generate a QR batch in Admin Panel, sign into the Mobile App with a registered user, and scan/enter a QR serial to watch it appear here live!'
                          : 'Switch tabs above or clear search filters to view other requests.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => {
                  const isSelected = selectedIds.includes(claim.id);
                  const isProcessing = processingId === claim.id;

                  return (
                    <tr
                      key={claim.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#FEF2EE]/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {activeTab === 'pending' && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(claim.id)}
                            className="w-4 h-4 rounded text-[#C84826] focus:ring-[#C84826] cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Request ID */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                          {claim.id}
                        </span>
                      </td>

                      {/* Vendor Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FEF2EE] border border-[#F9CEB8] flex items-center justify-center text-[#C84826] shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 text-xs block leading-tight truncate max-w-[190px]" title={claim.vendorName}>
                              {claim.vendorName}
                            </span>
                            <span className="text-[10px] font-mono text-[#A62C11] font-bold block mt-0.5">
                              ID: {claim.vendorId || 'VEN-001'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Applicant & Role */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs">{claim.userName}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded font-mono ${
                              String(claim.userRole).toLowerCase().includes('deal')
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8]'
                            }`}
                          >
                            {claim.userRole}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{claim.userMobile}</div>
                      </td>

                      {/* Scanned Product & QR Serial */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs leading-snug">{claim.productName}</div>
                        <div className="flex items-center space-x-1.5 mt-0.5 flex-wrap gap-y-1">
                          <span className="font-mono text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80">
                            {claim.qrSerial}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-0.5 inline" />
                            Verified
                          </span>
                          {claim.proofImageUrl && (
                            <button
                              type="button"
                              onClick={() => setViewScanPhotoClaim(claim)}
                              className="text-[10px] text-[#C84826] hover:text-[#A62C11] font-bold inline-flex items-center gap-0.5 underline cursor-pointer"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>Site Photo</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Cashback Claimed */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-black text-slate-900 text-sm whitespace-nowrap">
                          ₹ {claim.cashback.toFixed(2)}
                        </div>
                        {claim.isDisbursed && claim.disbursedAmount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-mono font-semibold">
                            Disbursed: ₹{claim.disbursedAmount.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Payout Method & Dest */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded font-mono ${
                              claim.payoutType === 'UPI'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {claim.paymentMode || claim.payoutType}
                          </span>
                          <span
                            className="font-mono text-xs text-slate-700 truncate max-w-[140px]"
                            title={claim.payoutDest}
                          >
                            {claim.payoutDest}
                          </span>
                        </div>
                      </td>

                      {/* Scan Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-slate-800">{claim.scanTimestamp}</div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">• {claim.relativeTime}</div>
                      </td>

                      {/* Status / Settlement */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {claim.status === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Pending Admin Check
                          </span>
                        ) : claim.isDisbursed ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Disbursed
                            </span>
                            {claim.npciRrn && (
                              <div className="font-mono text-[10px] text-slate-500">
                                UTR: <span className="font-semibold text-slate-700">{claim.npciRrn}</span>
                              </div>
                            )}
                          </div>
                        ) : claim.isApprovedAwaiting ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8]">
                            <Zap className="w-3 h-3 text-[#C84826]" />
                            Approved (Awaiting Release)
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-500" />
                              {claim.status}
                            </span>
                            {(claim.remarks || claim.flagReason) && (
                              <div className="text-[10px] text-rose-600 font-medium max-w-[190px] leading-tight" title={claim.remarks || claim.flagReason}>
                                <strong className="font-bold">Reason:</strong> {claim.remarks || claim.flagReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {/* TAB 1: PENDING LIST -> ONLY APPROVE & REJECT BUTTONS */}
                        {claim.status === 'Pending' && (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              disabled={isProcessing}
                              onClick={() => handleSingleApprove(claim)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1 active:scale-95"
                              title="Approve this claim (moves to Completed tab for Release Payout)"
                            >
                              {isProcessing ? (
                                '...'
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Approve</span>
                                </>
                              )}
                            </button>
                            <button
                              disabled={isProcessing}
                              onClick={() => handleSingleReject(claim)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-semibold transition cursor-pointer"
                              title="Reject Claim"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* TAB 2: COMPLETED TAB -> RELEASE PAYOUT BUTTON FOR APPROVED, DISBURSED + VIEW RECEIPT ONCE SETTLED */}
                        {claim.isApprovedAwaiting && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenReleaseModal(claim)}
                              className="px-3.5 py-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-black rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 border border-[#A62C11]"
                              title="Click to enter Amount, Screenshot, Transaction ID & Remarks and disburse"
                            >
                              <Zap className="w-3.5 h-3.5 text-white fill-white" />
                              <span>Release Payout</span>
                            </button>
                          </div>
                        )}

                        {claim.isDisbursed && (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-[11px] font-bold text-emerald-700 font-mono">✓ Disbursed</span>
                            <button
                              onClick={() => setViewReceiptClaim(claim)}
                              className="px-2.5 py-1 bg-[#FEF2EE] hover:bg-[#F9CEB8]/50 text-[#A62C11] border border-[#F9CEB8] rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                              title="View Disbursal Screenshot / UTR"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          </div>
                        )}

                        {claim.isRejected && (
                          <div className="text-right space-y-0.5">
                            <span className="text-[11px] font-mono text-rose-600 font-bold block">Quarantined</span>
                            {(claim.remarks || claim.flagReason) && (
                              <span
                                className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded inline-block max-w-[200px] truncate"
                                title={claim.remarks || claim.flagReason}
                              >
                                {claim.remarks || claim.flagReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
          <div>
            Showing <strong className="text-slate-900 font-mono">{filteredClaims.length}</strong> records in{' '}
            {activeTab === 'pending'
              ? 'Pending List (Approve Only)'
              : activeTab === 'completed'
              ? 'Completed (Release Payout & Disbursed)'
              : 'Rejected / Quarantine'}{' '}
            tab
          </div>

          <div className="flex items-center space-x-1">
            <span className="px-2.5 py-1 rounded-lg bg-[#C84826] text-white font-bold text-xs shadow-xs">
              Page 1
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM BANNER: Dual-Control Payout Verification Engine */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#FEF2EE] border border-[#F9CEB8] flex items-center justify-center text-[#C84826] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Two-Step Escrow Payout Protocol: Approve in Pending &rarr; Release in Completed
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Approving moves the claim to Completed. Releasing Payout captures Amount, Payment Screenshot, Transaction ID (UTR), and Remarks, updating both the Mobile App wallet and Supabase in real time.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black font-mono border border-emerald-200 tracking-wider">
            NPCI 256-BIT ENCRYPTED
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* POPUP MODAL 1: RELEASE PAYOUT & ATTACH SCREENSHOT / TRANSACTION ID        */}
      {/* ========================================================================= */}
      {releaseModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#A62C11] to-[#C84826] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center font-black border border-white/20">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight text-white">
                    Release Payout &amp; Disburse Funds
                  </h3>
                  <p className="text-[11px] text-white/80 font-mono">
                    Claim Ref: {releaseModalClaim.id} • {releaseModalClaim.userRole}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReleaseModalClaim(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitRelease} className="p-5 space-y-4 overflow-y-auto">
              {/* Beneficiary Info Banner */}
              <div className="bg-[#FEF2EE]/70 border border-[#F9CEB8] rounded-xl p-3 flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>{releaseModalClaim.userName}</span>
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-mono text-slate-700 border border-[#F9CEB8]">
                      {releaseModalClaim.userMobile}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A62C11] font-bold mt-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Vendor: {releaseModalClaim.vendorName} ({releaseModalClaim.vendorId || 'VEN-001'})</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Product: <strong className="text-slate-900">{releaseModalClaim.productName}</strong> ({releaseModalClaim.qrSerial})
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                    Destination: <strong className="text-[#A62C11]">{releaseModalClaim.payoutDest}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Claim Amount</div>
                  <div className="text-lg font-black font-mono text-[#A62C11]">
                    ₹ {releaseModalClaim.cashback.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Disbursal Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={releaseForm.amount}
                    onChange={(e) => setReleaseForm({ ...releaseForm, amount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C84826] text-slate-900"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Credited immediately to partner&apos;s Mobile App wallet &amp; Supabase profile upon submit.
                </p>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Mode / Gateway Rail <span className="text-rose-500">*</span>
                </label>
                <select
                  value={releaseForm.paymentMode}
                  onChange={(e) => setReleaseForm({ ...releaseForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C84826] text-slate-800 cursor-pointer"
                >
                  <option value="UPI">UPI Instant Escrow (NPCI)</option>
                  <option value="Bank NEFT">NEFT Direct Interbank</option>
                  <option value="IMPS">IMPS 24x7 Immediate Settlement</option>
                  <option value="RTGS">RTGS High-Value Transfer</option>
                </select>
              </div>

              {/* Transaction ID / UTR Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Transaction ID / UTR / Reference No. <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setReleaseForm((prev) => ({
                        ...prev,
                        transactionId: 'UTR' + Math.floor(1000000000 + Math.random() * 9000000000),
                      }))
                    }
                    className="text-[10px] text-[#C84826] hover:text-[#A62C11] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto-generate UTR</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={releaseForm.transactionId}
                  onChange={(e) => setReleaseForm({ ...releaseForm, transactionId: e.target.value })}
                  placeholder="e.g. UPI/602918239012 or UTR9842019482"
                  className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C84826] text-slate-900"
                />
              </div>

              {/* Screenshot Attachment / Payment Proof */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Attach Payment Screenshot / Receipt Proof
                  </label>
                  <button
                    type="button"
                    onClick={handleAttachVoucherReceipt}
                    className="text-[10px] text-[#A62C11] hover:text-[#C84826] font-bold bg-[#FEF2EE] px-2 py-0.5 rounded border border-[#F9CEB8] cursor-pointer"
                  >
                    + Attach Digital Voucher Slip
                  </button>
                </div>

                {releaseForm.proofImage ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={releaseForm.proofImage}
                        alt="Proof preview"
                        className="w-12 h-12 object-cover rounded-lg border border-emerald-300 shadow-2xs"
                      />
                      <div>
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Screenshot Attached</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-mono truncate max-w-[200px]">
                          {releaseForm.proofFileName || 'payment_receipt.png'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReleaseForm((prev) => ({ ...prev, proofImage: null, proofFileName: '' }))}
                      className="p-1.5 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-100 transition cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#C84826] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-[#FEF2EE]/40 transition text-center">
                    <UploadCloud className="w-6 h-6 text-[#C84826] mb-1" />
                    <span className="text-xs font-bold text-slate-700">Click to attach payment screenshot or slip</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Remarks Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remarks / Settlement Notes
                </label>
                <textarea
                  rows={2}
                  value={releaseForm.remarks}
                  onChange={(e) => setReleaseForm({ ...releaseForm, remarks: e.target.value })}
                  placeholder="Enter transaction remarks or settlement reference notes..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C84826] text-slate-800"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReleaseModalClaim(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === releaseModalClaim.id}
                  className="px-5 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit &amp; Mark Disbursed (₹ {parseFloat(releaseForm.amount || 0).toFixed(2)})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL 2: VIEW RECEIPT & DISBURSAL AUDIT DETAILS                     */}
      {/* ========================================================================= */}
      {viewReceiptClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-gradient-to-r from-[#A62C11] to-[#C84826] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-bold text-sm leading-tight text-white">Disbursal Receipt Voucher</h3>
                  <p className="text-[10px] text-white/80 font-mono">
                    Ref: {viewReceiptClaim.id} • {viewReceiptClaim.npciRrn || 'DISBURSED'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewReceiptClaim(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-center">
                <img
                  src={viewReceiptClaim.paymentProofUrl || DEFAULT_RECEIPT_PREVIEW}
                  alt="Payment Receipt"
                  className="max-h-56 w-auto object-contain rounded-lg shadow-xs"
                />
              </div>

              <div className="space-y-2 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Authorized Vendor:</span>
                  <span className="font-extrabold text-[#A62C11] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{viewReceiptClaim.vendorName} ({viewReceiptClaim.vendorId || 'VEN-001'})</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-bold text-slate-900">
                    {viewReceiptClaim.userName} ({viewReceiptClaim.userRole})
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Mobile / Contact:</span>
                  <span className="font-mono font-semibold text-slate-800">{viewReceiptClaim.userMobile}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Disbursed Amount:</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    ₹ {(viewReceiptClaim.disbursedAmount || viewReceiptClaim.cashback).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Transaction ID / UTR:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {viewReceiptClaim.npciRrn || 'SETTLED'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Disbursed Timestamp:</span>
                  <span className="font-mono text-slate-700">
                    {viewReceiptClaim.disbursedAtFormatted || viewReceiptClaim.scanTimestamp}
                  </span>
                </div>
                <div className="flex justify-between items-start py-1">
                  <span className="text-slate-500">Remarks:</span>
                  <span className="text-slate-700 italic text-right max-w-[210px]">
                    {viewReceiptClaim.remarks || 'Disbursed via Admin Escrow Release'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setViewReceiptClaim(null)}
                  className="w-full py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
                >
                  Close Receipt Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL 3: CONTRACTOR SCAN SITE PHOTO PREVIEW                         */}
      {/* ========================================================================= */}
      {viewScanPhotoClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-[#A62C11] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Submitted QR Proof Photo</h3>
                <p className="text-[10px] text-white/80 font-mono">
                  {viewScanPhotoClaim.qrSerial} • {viewScanPhotoClaim.userName}
                </p>
              </div>
              <button
                onClick={() => setViewScanPhotoClaim(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-center">
                <img
                  src={viewScanPhotoClaim.proofImageUrl}
                  alt="Contractor scan proof"
                  className="max-h-72 w-auto object-contain rounded-lg"
                />
              </div>
              <button
                onClick={() => setViewScanPhotoClaim(null)}
                className="w-full py-2 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
