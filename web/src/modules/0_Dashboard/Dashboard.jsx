import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  TrendingUp,
  Users,
  QrCode,
  Store,
  HardHat,
  ShieldCheck,
  IndianRupee,
  Calendar,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  ArrowRight,
  Sparkles,
  Eye,
  Receipt,
  Check,
  Activity,
  Factory,
  Cpu,
  X,
  Package,
  Wallet,
  Database,
  AlertCircle
} from 'lucide-react';

function formatINRCompact(val) {
  const n = Number(val || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: n % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function Dashboard({ onNavigateTab }) {
  const { currentUser } = useAuth();
  const {
    skus,
    users,
    vendors,
    batches,
    claims,
    dbStatus,
    refreshAllData,
  } = useData();

  const [dateRange, setDateRange] = useState('month'); // 'today' | 'week' | 'month' | 'year' | 'all'
  const [chartMetric, setChartMetric] = useState('gross'); // 'gross' | 'pending' | 'batches'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [tableSearch, setTableSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [receiptTxn, setReceiptTxn] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
    showToast('Live telemetry synchronized across Admin Web, Mobile App & Supabase.');
  };

  // Filter claims by selected date range
  const rangeClaims = useMemo(() => {
    const now = Date.now();
    return (claims || []).filter((c) => {
      if (dateRange === 'all') return true;
      const ts = new Date(c.submittedAt || c.createdAt || now).getTime();
      if (Number.isNaN(ts)) return true;
      const diffMs = now - ts;
      if (dateRange === 'today') return diffMs <= 86400 * 1000;
      if (dateRange === 'week') return diffMs <= 7 * 86400 * 1000;
      if (dateRange === 'month') return diffMs <= 31 * 86400 * 1000;
      if (dateRange === 'year') return diffMs <= 366 * 86400 * 1000;
      return true;
    });
  }, [claims, dateRange]);

  // Core Live Metrics (Zero hardcoded sample numbers)
  const metrics = useMemo(() => {
    const totalUsers = (users || []).length;
    const totalVendors = (vendors || []).length;
    const totalPartners = totalUsers + totalVendors;

    const dealersCount = (users || []).filter(
      (u) =>
        String(u.role || '').toLowerCase().includes('deal') ||
        String(u.role || '').toLowerCase().includes('dist')
    ).length;

    const contractorsCount = (users || []).filter(
      (u) =>
        !String(u.role || '').toLowerCase().includes('deal') &&
        !String(u.role || '').toLowerCase().includes('dist')
    ).length;

    const activeScannerMobiles = new Set(
      rangeClaims.map((c) => String(c.userMobile || c.mobile || '').replace(/\D/g, '').slice(-10)).filter(Boolean)
    );
    const activeScanners = Math.max(
      activeScannerMobiles.size,
      (users || []).filter((u) => Number(u.scansCount || 0) > 0).length
    );

    const totalSerializedTokens = (batches || []).reduce((s, b) => s + Number(b.quantity || b.tokens?.length || 0), 0);
    const totalScans = rangeClaims.length;

    const disbursedClaims = rangeClaims.filter((c) => c.status === 'Disbursed' || c.payoutStatus === 'Disbursed');
    const pendingClaims = rangeClaims.filter((c) => c.status === 'Pending');
    const awaitingReleaseClaims = rangeClaims.filter(
      (c) => c.status === 'Approved' && c.payoutStatus !== 'Disbursed'
    );
    const pendingKYCUsers = (users || []).filter((u) => u.kycStatus !== 'Verified');

    const grossDisbursed = disbursedClaims.reduce(
      (sum, c) => sum + Number(c.disbursedAmount || c.netDisbursed || c.amount || 0),
      0
    );
    const pendingEscrowVal = [...pendingClaims, ...awaitingReleaseClaims].reduce(
      (sum, c) => sum + Number(c.amount || c.claimValue || 0),
      0
    );
    const tdsEstimated = Number((grossDisbursed * 0.1).toFixed(2));
    const batchPoolValue = (batches || []).reduce(
      (sum, b) => sum + Number(b.quantity || 0) * Number(b.cashbackAmount || 0),
      0
    );

    const pendingActionsTotal = pendingKYCUsers.length + pendingClaims.length + awaitingReleaseClaims.length;

    // Module Activity Share
    const uOps = totalUsers;
    const pOps = (skus || []).length + (batches || []).length;
    const cOps = (claims || []).length;
    const vOps = totalVendors;
    const totalOps = uOps + pOps + cOps + vOps;

    const share = {
      usersPct: totalOps > 0 ? Math.round((uOps / totalOps) * 100) : 0,
      catalogPct: totalOps > 0 ? Math.round((pOps / totalOps) * 100) : 0,
      cashbackPct: totalOps > 0 ? Math.round((cOps / totalOps) * 100) : 0,
      vendorsPct: totalOps > 0 ? Math.max(0, 100 - Math.round((uOps / totalOps) * 100) - Math.round((pOps / totalOps) * 100) - Math.round((cOps / totalOps) * 100)) : 0,
      uOps,
      pOps,
      cOps,
      vOps,
      totalOps,
    };

    // Category Breakdown from live SKUs & Claims
    const catMap = {};
    (skus || []).forEach((s) => {
      const cat = s.category || 'Adhesives';
      if (!catMap[cat]) catMap[cat] = { name: cat, skuCount: 0, claimVal: 0 };
      catMap[cat].skuCount += 1;
    });
    (claims || []).forEach((c) => {
      const matchedSku = (skus || []).find(
        (s) => s.skuCode === c.skuCode || s.name === c.productName
      );
      const cat = matchedSku?.category || 'Vitrified & Adhesives';
      if (!catMap[cat]) catMap[cat] = { name: cat, skuCount: 0, claimVal: 0 };
      catMap[cat].claimVal += Number(c.disbursedAmount || c.amount || 0);
    });
    const categories = Object.values(catMap).slice(0, 4);

    return {
      totalUsers,
      totalVendors,
      totalPartners,
      dealersCount,
      contractorsCount,
      activeScanners,
      totalSerializedTokens,
      totalScans,
      disbursedCount: disbursedClaims.length,
      pendingClaimsCount: pendingClaims.length,
      awaitingReleaseCount: awaitingReleaseClaims.length,
      pendingKYCCount: pendingKYCUsers.length,
      grossDisbursed,
      pendingEscrowVal,
      tdsEstimated,
      batchPoolValue,
      pendingActionsTotal,
      share,
      categories,
      activeUsersCount: (users || []).filter((u) => u.active !== false).length,
      activeSkusCount: (skus || []).filter((s) => s.isActive !== false && s.status !== 'Discontinued').length,
    };
  }, [users, vendors, skus, batches, claims, rangeClaims]);

  // Live Transactions built from real claims + vendor payouts
  const transactions = useMemo(() => {
    const claimRows = (claims || []).map((c) => {
      const isDisbursed = c.status === 'Disbursed' || c.payoutStatus === 'Disbursed';
      const isApproved = c.status === 'Approved' && !isDisbursed;
      const isRejected = c.status === 'Rejected' || c.status === 'Flagged';
      const amt = Number(isDisbursed ? c.disbursedAmount || c.amount : c.amount || 0);

      return {
        id: c.requestId || c.id,
        beneficiary: c.userName || 'Registered Partner',
        role: `${c.userRole || 'Contractor'} (${c.userMobile || c.mobile || '—'})`,
        category: c.productName || 'QR Cashback Claim',
        batch: c.qrSerial || c.serialKey || '—',
        time:
          c.date ||
          new Date(c.submittedAt || Date.now()).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        timestamp: new Date(c.updatedAt || c.submittedAt || Date.now()).getTime(),
        amount: `₹${amt.toFixed(2)}`,
        numericAmount: amt,
        status: isDisbursed ? 'DISBURSED' : isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING',
        statusColor: isDisbursed ? 'emerald' : isApproved ? 'red' : isRejected ? 'rose' : 'amber',
        utr: c.npciRrn || c.transactionId || 'Awaiting Release',
        bank: `${c.paymentMode || c.payoutMethod || 'UPI'} (${c.vpaOrIfsc || c.upiId || '—'})`,
      };
    });

    const vendorRows = [];
    (vendors || []).forEach((v) => {
      (v.payoutHistory || []).forEach((p, idx) => {
        vendorRows.push({
          id: p.id || `${v.vendorId}-PAY-${idx + 1}`,
          beneficiary: v.companyName || v.name,
          role: `Vendor (${v.vendorId})`,
          category: v.category || 'Vendor PO Settlement',
          batch: p.mode || 'Bank NEFT',
          time: p.date || 'Recorded',
          timestamp: Date.now() - idx * 1000,
          amount: `₹${Number(p.amountLakhs || 0).toFixed(2)} L`,
          numericAmount: Number(p.amountLakhs || 0) * 100000,
          status: 'DISBURSED',
          statusColor: 'emerald',
          utr: p.utr || 'SETTLED',
          bank: p.remarks || 'Vendor Payout Ledger',
        });
      });
    });

    return [...claimRows, ...vendorRows].sort((a, b) => b.timestamp - a.timestamp);
  }, [claims, vendors]);

  const filteredTransactions = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        String(t.id).toLowerCase().includes(q) ||
        String(t.beneficiary).toLowerCase().includes(q) ||
        String(t.role).toLowerCase().includes(q) ||
        String(t.category).toLowerCase().includes(q) ||
        String(t.status).toLowerCase().includes(q)
    );
  }, [transactions, tableSearch]);

  // Recent Activity Feed built from real records
  const activityFeed = useMemo(() => {
    const items = [];
    (claims || []).slice(0, 4).forEach((c) => {
      items.push({
        id: `act-claim-${c.id}`,
        tone: c.status === 'Disbursed' ? 'emerald' : 'red',
        title:
          c.status === 'Disbursed'
            ? `Disbursed ₹${Number(c.disbursedAmount || c.amount || 0).toFixed(2)} to ${c.userName}`
            : `${c.userName} scanned QR ${c.qrSerial || c.serialKey} (₹${Number(c.amount || 0).toFixed(2)})`,
        sub: `${c.productName || 'DuraGrit Pack'} • Status: ${c.status}`,
        time: c.date || 'Live',
      });
    });
    (batches || []).slice(0, 2).forEach((b) => {
      items.push({
        id: `act-batch-${b.id}`,
        tone: 'indigo',
        title: `Generated QR Batch ${b.batchId || b.id} (${b.quantity} serials)`,
        sub: `${b.productName} • Cashback ₹${b.cashbackAmount}/pack`,
        time: (b.createdAt || '').slice(0, 10) || 'Live',
      });
    });
    (users || []).slice(0, 2).forEach((u) => {
      items.push({
        id: `act-user-${u.userId || u.id}`,
        tone: 'amber',
        title: `Registered ${u.role}: ${u.name}`,
        sub: `${u.userId || `USR-${u.id}`} • Mobile: ${u.mobile}`,
        time: u.registeredDate || 'Live',
      });
    });
    return items.slice(0, 5);
  }, [claims, batches, users]);

  const handleExportReport = () => {
    showToast('Exporting live Executive Telemetry CSV...');
    setTimeout(() => {
      const csvData = [
        ['DuraGrit Vitrified - Live Executive Telemetry Report'],
        ['Generated Date', new Date().toLocaleString()],
        ['Supabase Sync', dbStatus?.connected ? 'Connected' : 'Local / Bridge Sync'],
        [],
        ['Metric', 'Live Value'],
        ['Total Users & Vendors', metrics.totalPartners],
        ['Active Scanners', metrics.activeScanners],
        ['Verified Dealers & Vendors', metrics.dealersCount + metrics.totalVendors],
        ['Contractors & Masons', metrics.contractorsCount],
        ['QR Code Redemptions', metrics.totalScans],
        ['Total Serialized QR Tokens', metrics.totalSerializedTokens],
        ['Gross Payout Disbursed (INR)', metrics.grossDisbursed.toFixed(2)],
        ['Pending Escrow Queue (INR)', metrics.pendingEscrowVal.toFixed(2)],
        [],
        ['Record ID', 'Beneficiary', 'Category', 'Time', 'Amount', 'Status', 'UTR'],
      ];
      transactions.forEach((t) => {
        csvData.push([t.id, `"${t.beneficiary}"`, `"${t.category}"`, `"${t.time}"`, `"${t.amount}"`, t.status, `"${t.utr}"`]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + csvData.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `DuraGrit_Live_Dashboard_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 250);
  };

  // Monthly chart bars (last 6 months dynamically from real claims)
  const monthlyChartBars = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      months.push({ key, label, scans: 0, disbursed: 0, isCurrent: i === 0 });
    }
    (claims || []).forEach((c) => {
      const d = new Date(c.submittedAt || c.createdAt || Date.now());
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) {
        bucket.scans += 1;
        if (c.status === 'Disbursed' || c.payoutStatus === 'Disbursed') {
          bucket.disbursed += Number(c.disbursedAmount || c.amount || 0);
        }
      }
    });
    const maxScans = Math.max(1, ...months.map((m) => m.scans));
    const maxDisb = Math.max(1, ...months.map((m) => m.disbursed));
    return months.map((m) => ({
      ...m,
      scanPct: m.scans > 0 ? Math.max(14, Math.round((m.scans / maxScans) * 100)) : 4,
      disbPct: m.disbursed > 0 ? Math.max(14, Math.round((m.disbursed / maxDisb) * 100)) : 4,
    }));
  }, [claims]);

  return (
    <div className="space-y-6 select-none font-sans pb-10">
      {/* Toast Alert */}
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

      {/* SECTION 1: WELCOME & GLOBAL CONTROLS BAR */}
      <section className="bg-gradient-to-r from-[#231512] via-[#3B1810] to-[#A62C11] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#A62C11]/40 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#C84826]/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome Back, {currentUser?.name || 'Super Admin'}!
            </h1>
            <span className="text-xs bg-white/15 text-[#F9CEB8] border border-white/20 font-bold px-2.5 py-0.5 rounded-full font-mono">
              Clean Live Ledger
            </span>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{dbStatus?.connected ? 'Supabase Realtime Connected' : 'Cross-Port Sync Active'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/80 mt-1.5 max-w-2xl font-normal leading-relaxed">
            Zero sample data loaded. Every KPI, chart, and ledger row below reflects real records created across your Admin Panel, Mobile Field App, and Supabase PostgreSQL database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10 max-w-full">
          <div className="bg-black/30 p-1 rounded-xl flex items-center space-x-1 text-xs font-semibold text-white/80 border border-white/15 max-w-full overflow-x-auto no-scrollbar">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  dateRange === tab.id ? 'bg-[#C84826] text-white shadow-sm font-bold' : 'text-white/70 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#F9CEB8]' : ''}`} />
            <span>Sync Live</span>
          </button>

          <button
            onClick={handleExportReport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-bold rounded-xl shadow-md border border-white/20 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </section>

      {/* SECTION 2: TOP 8 KPI SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users & Partners */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('users')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users &amp; Partners</div>
            <div className="p-1.5 bg-[#FEF2EE] text-[#C84826] rounded-lg ring-1 ring-[#F9CEB8] group-hover:bg-[#C84826] group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {metrics.totalPartners.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] font-bold text-[#A62C11] bg-[#FEF2EE] px-2 py-0.5 rounded-full border border-[#F9CEB8]">
              {metrics.totalUsers} Users • {metrics.totalVendors} Vendors
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Registered across Web &amp; App</div>
        </div>

        {/* Card 2: Active Scanners */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('cashback')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active QR Scanners</div>
            <div className="p-1.5 bg-[#FEF2EE] text-[#C84826] rounded-lg ring-1 ring-[#F9CEB8] group-hover:bg-[#C84826] group-hover:text-white transition-colors">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {metrics.activeScanners.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live App Users
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Unique partners with verified scans</div>
        </div>

        {/* Card 3: Dealers & Vendors */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('vendors')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dealers &amp; Vendors</div>
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg ring-1 ring-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {(metrics.dealersCount + metrics.totalVendors).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              {metrics.dealersCount} Dealers • {metrics.totalVendors} Vendors
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Authorized commercial partners</div>
        </div>

        {/* Card 4: Contractors & Masons */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('users')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contractors &amp; Masons</div>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg ring-1 ring-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {metrics.contractorsCount.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Field Loyalty
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Direct QR cashback beneficiaries</div>
        </div>

        {/* Card 5: QR Code Redemptions */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('qr-batch')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">QR Code Redemptions</div>
            <div className="p-1.5 bg-[#FEF2EE] text-[#C84826] rounded-lg ring-1 ring-[#F9CEB8] group-hover:bg-[#C84826] group-hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {metrics.totalScans.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
              of {metrics.totalSerializedTokens.toLocaleString('en-IN')} QRs
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {(batches || []).length} QR batches minted in catalog
          </div>
        </div>

        {/* Card 6: Gross Payout Disbursed */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('cashback')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Payout Disbursed</div>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg ring-1 ring-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {formatINRCompact(metrics.grossDisbursed)}
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {metrics.disbursedCount} Settled
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Released with UTR &amp; receipt proof</div>
        </div>

        {/* Card 7: Pending Approvals */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('cashback')}
          className="bg-white p-4 rounded-xl border-l-4 border-l-[#C84826] border-y border-r border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pending Approvals</div>
            <span className="text-[10px] bg-[#FEF2EE] text-[#A62C11] font-bold px-2 py-0.5 rounded-full border border-[#F9CEB8] font-mono">
              {metrics.pendingActionsTotal > 0 ? 'Action Req.' : 'All Clear'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-[#C84826] tracking-tight font-mono">
              {metrics.pendingActionsTotal} Items
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {metrics.pendingKYCCount} KYC • {metrics.pendingClaimsCount} Approve • {metrics.awaitingReleaseCount} Release
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#A62C11] font-bold pt-1 border-t border-slate-100">
            <span>Open Approval Queue</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 8: Escrow Queue & Batch Pool */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('reports')}
          className="bg-white p-4 rounded-xl border-l-4 border-l-emerald-600 border-y border-r border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active QR Reward Pool</div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
              Escrow Live
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
              {formatINRCompact(metrics.batchPoolValue)}
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-mono">
              ₹{metrics.pendingEscrowVal.toFixed(0)} Queued
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Total serialized QR cashback value</div>
        </div>
      </section>

      {/* SECTION 3: PRIMARY ANALYTICS CHARTS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Monthly Scan & Disbursement Bar Chart */}
        <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <div className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <span>Live Cashback &amp; QR Scan Cashflow</span>
                  <span className="text-xs px-2.5 py-0.5 bg-[#FEF2EE] text-[#A62C11] rounded-full font-bold border border-[#F9CEB8]">
                    6-Month Live Window
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  Computed directly from real QR scans and Admin payout releases
                </p>
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-medium border border-slate-200/60">
                <button
                  onClick={() => setChartMetric('gross')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    chartMetric === 'gross' ? 'bg-white text-[#C84826] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Disbursed (₹)
                </button>
                <button
                  onClick={() => setChartMetric('pending')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    chartMetric === 'pending' ? 'bg-white text-[#C84826] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Escrow Queue
                </button>
                <button
                  onClick={() => setChartMetric('batches')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    chartMetric === 'batches' ? 'bg-white text-[#C84826] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Batch Pool
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <div className="bg-slate-50/90 border border-slate-100 p-3 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400">Total Net Disbursed</div>
                <div className="text-lg font-black text-slate-900 tracking-tight font-mono">
                  ₹{metrics.grossDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-50/90 border border-slate-100 p-3 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400">Pending &amp; Approved Queue</div>
                <div className="text-lg font-black text-[#C84826] tracking-tight font-mono">
                  ₹{metrics.pendingEscrowVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-slate-50/90 border border-slate-100 p-3 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400">Est. Sec 194R TDS (10%)</div>
                <div className="text-lg font-black text-slate-900 tracking-tight font-mono">
                  ₹{metrics.tdsEstimated.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* 6-Month Dual Bar Chart */}
            <div className="h-52 pt-6 pb-2 px-4 flex items-end justify-around border-b border-slate-100 bg-slate-50/40 rounded-xl">
              {monthlyChartBars.map((bar) => (
                <div key={bar.key} className="flex flex-col items-center h-full justify-end flex-1 max-w-[80px]">
                  <div className="text-[10px] font-mono font-bold text-slate-500 mb-1.5">
                    {bar.disbursed > 0 ? `₹${bar.disbursed}` : `${bar.scans} scans`}
                  </div>
                  <div className="flex items-end space-x-1.5 h-32 w-full justify-center">
                    <div
                      style={{ height: `${bar.scanPct}%` }}
                      className="w-4 bg-[#C84826] rounded-t-md transition-all"
                      title={`${bar.label}: ${bar.scans} QR Scans`}
                    />
                    <div
                      style={{ height: `${bar.disbPct}%` }}
                      className="w-4 bg-emerald-500 rounded-t-md transition-all"
                      title={`${bar.label}: ₹${bar.disbursed.toFixed(2)} Disbursed`}
                    />
                  </div>
                  <span
                    className={`text-[11px] pt-2 font-mono ${
                      bar.isCurrent ? 'text-[#A62C11] font-black' : 'text-slate-400 font-semibold'
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 font-medium">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#C84826]"></span>
                <span>QR Scans Submitted</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>Cashback Disbursed (₹)</span>
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">Real-Time Aggregation</span>
          </div>
        </div>

        {/* Right: Module Activity Share */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#FEF2EE] rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-extrabold text-slate-900 flex items-center space-x-1.5">
                  <PieChart className="w-4 h-4 text-[#C84826]" />
                  <span>Live Entity Distribution</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Active database records split</p>
              </div>
              <span className="p-2 rounded-xl bg-[#FEF2EE] text-[#C84826]">
                <Database className="w-4 h-4" />
              </span>
            </div>

            <div className="flex items-center justify-center my-5 relative">
              <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="38" stroke="#f1f5f9" strokeWidth="11" />
                {metrics.share.totalOps > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    r="38"
                    stroke="#C84826"
                    strokeDasharray="238 238"
                    strokeLinecap="round"
                    strokeWidth="11"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {metrics.share.totalOps}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Records</span>
                <span className="text-[10px] text-emerald-600 font-extrabold flex items-center mt-0.5 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                  Synced
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-1 relative z-10">
            <div
              onClick={() => onNavigateTab && onNavigateTab('users')}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-[#FEF2EE]/60 transition cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C84826]"></span>
                <span className="text-slate-700 font-semibold">Users Directory</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {metrics.share.usersPct}% ({metrics.share.uOps})
              </span>
            </div>

            <div
              onClick={() => onNavigateTab && onNavigateTab('catalog')}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-[#FEF2EE]/60 transition cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A62C11]"></span>
                <span className="text-slate-700 font-semibold">Products &amp; QR Batches</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {metrics.share.catalogPct}% ({metrics.share.pOps})
              </span>
            </div>

            <div
              onClick={() => onNavigateTab && onNavigateTab('cashback')}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-[#FEF2EE]/60 transition cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-slate-700 font-semibold">Cashback Claims</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {metrics.share.cashbackPct}% ({metrics.share.cOps})
              </span>
            </div>

            <div
              onClick={() => onNavigateTab && onNavigateTab('vendors')}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-[#FEF2EE]/60 transition cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                <span className="text-slate-700 font-semibold">Vendor Directory</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {metrics.share.vendorsPct}% ({metrics.share.vOps})
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CORE PLATFORM SYSTEMS (4 Live Cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Module Overview — Core Platform Systems</h3>
            <p className="text-xs text-slate-500">Live operational counts across your 4 primary DuraGrit modules</p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('master-workflow')}
            className="text-xs font-bold text-[#C84826] hover:text-[#A62C11] flex items-center space-x-1 cursor-pointer"
          >
            <span>View 14-Step Pipeline Schema</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateTab && onNavigateTab('users')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">1. User Management</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                Live
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1 text-center py-2 bg-slate-50/90 rounded-lg border border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Total</div>
                <div className="text-xs font-black text-slate-800 font-mono">{metrics.totalUsers}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Active</div>
                <div className="text-xs font-black text-emerald-600 font-mono">{metrics.activeUsersCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">KYC Pend.</div>
                <div className="text-xs font-black text-amber-600 font-mono">{metrics.pendingKYCCount}</div>
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab('catalog')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">2. Product &amp; QR Laser</span>
              <span className="text-[10px] bg-[#FEF2EE] text-[#A62C11] font-bold px-2 py-0.5 rounded-full border border-[#F9CEB8] font-mono">
                Synced
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1 text-center py-2 bg-slate-50/90 rounded-lg border border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">SKUs</div>
                <div className="text-xs font-black text-slate-800 font-mono">{(skus || []).length}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Batches</div>
                <div className="text-xs font-black text-[#C84826] font-mono">{(batches || []).length}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Serials</div>
                <div className="text-xs font-black text-slate-700 font-mono">{metrics.totalSerializedTokens}</div>
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab('cashback')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">3. Cashback Requests</span>
              <span className="text-[10px] bg-[#FEF2EE] text-[#A62C11] font-bold px-2 py-0.5 rounded-full border border-[#F9CEB8] font-mono">
                2-Step
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1 text-center py-2 bg-slate-50/90 rounded-lg border border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Pending</div>
                <div className="text-xs font-black text-amber-600 font-mono">{metrics.pendingClaimsCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">To Release</div>
                <div className="text-xs font-black text-[#C84826] font-mono">{metrics.awaitingReleaseCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Disbursed</div>
                <div className="text-xs font-black text-emerald-600 font-mono">{metrics.disbursedCount}</div>
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab('vendors')}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">4. Vendor Directory</span>
              <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-200 font-mono">
                B2B Ledger
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1 text-center py-2 bg-slate-50/90 rounded-lg border border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Vendors</div>
                <div className="text-xs font-black text-slate-800 font-mono">{metrics.totalVendors}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Active</div>
                <div className="text-xs font-black text-emerald-600 font-mono">
                  {(vendors || []).filter((v) => v.status !== 'INACTIVE').length}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold">Active POs</div>
                <div className="text-xs font-black text-slate-800 font-mono">
                  {(vendors || []).reduce((s, v) => s + Number(v.activePurchaseOrders || 0), 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: RECENT ACTIVITIES & ATTENTION REQUIRED */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Live Telemetry Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#C84826]" />
                <span>Recent Live Telemetry</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Realtime Stream</span>
            </div>

            {activityFeed.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-xs font-bold text-slate-600">No operational events recorded yet.</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Start by adding a Product in <strong>Product Catalog</strong>, generating a <strong>QR Batch</strong>, or onboarding a partner in <strong>User Management</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 mt-3">
                {activityFeed.map((ev) => (
                  <div key={ev.id} className="flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-full bg-[#FEF2EE] text-[#C84826] flex items-center justify-center shrink-0 border border-[#F9CEB8]">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-800 font-semibold truncate">{ev.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{ev.sub}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono shrink-0">{ev.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-[#FEF2EE] text-slate-700 hover:text-[#A62C11] text-xs font-bold rounded-xl transition text-center border border-slate-200/60 cursor-pointer"
          >
            Open Monthly Audit Report
          </button>
        </div>

        {/* Right: Attention Required */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#C84826]" />
                <span>Action Queue &amp; Sync Health</span>
              </div>
              <span className="text-xs font-black text-[#A62C11] bg-[#FEF2EE] border border-[#F9CEB8] px-2.5 py-0.5 rounded-full font-mono">
                {metrics.pendingActionsTotal} Open
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {metrics.pendingClaimsCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <QrCode className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {metrics.pendingClaimsCount} Cashback Request(s) awaiting Step 1 Approval
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Review and click Approve in Pending List</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('cashback')}
                    className="px-3 py-1 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs rounded-lg shrink-0 cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              )}

              {metrics.awaitingReleaseCount > 0 && (
                <div className="p-3 rounded-xl bg-[#FEF2EE] border border-[#F9CEB8] flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <Wallet className="w-4 h-4 text-[#C84826] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {metrics.awaitingReleaseCount} Approved Claim(s) awaiting Payout Release
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Open Completed tab to attach UTR &amp; screenshot and mark Disbursed
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('cashback')}
                    className="px-3 py-1 bg-[#A62C11] hover:bg-[#C84826] text-white font-bold text-xs rounded-lg shrink-0 cursor-pointer"
                  >
                    Release
                  </button>
                </div>
              )}

              {metrics.pendingKYCCount > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {metrics.pendingKYCCount} Partner profile(s) pending KYC verification
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Verify Aadhaar/PAN in User Management</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('users')}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shrink-0 cursor-pointer"
                  >
                    Review KYC
                  </button>
                </div>
              )}

              {metrics.pendingActionsTotal === 0 && (
                <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-200/70 text-center space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <div className="text-xs font-bold text-emerald-950">All Queues Clear — Zero Pending Approvals</div>
                  <div className="text-[11px] text-emerald-700">
                    New QR claims submitted from the Mobile App will appear here instantaneously.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Database Sync Engine: Active</span>
            <span className="font-bold text-emerald-600">Web &harr; Mobile App &harr; Supabase</span>
          </div>
        </div>
      </section>

      {/* SECTION 6: RECENT TRANSACTIONS & VERIFICATION AUDIT TABLE */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Recent Transactions &amp; Verification Audit</h3>
            <p className="text-xs text-slate-400">Live ledger of cashback claims and vendor settlements</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Filter records..."
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-[#C84826] focus:border-[#C84826] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Record ID</th>
                <th className="px-5 py-3">Beneficiary / Partner</th>
                <th className="px-5 py-3">Product / Category</th>
                <th className="px-5 py-3">Date &amp; Time</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-slate-600">No transactions recorded yet</p>
                      <p className="text-[11px] text-slate-400">
                        Scan a QR batch serial in the Mobile App or release a vendor payout to populate the live audit ledger.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 15).map((txn, idx) => (
                  <tr
                    key={txn.id}
                    className={`hover:bg-slate-50/80 transition ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{txn.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{txn.beneficiary}</div>
                      <div className="text-[11px] text-slate-400">{txn.role}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 font-medium">{txn.category}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{txn.batch}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{txn.time}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">{txn.amount}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono ${
                          txn.statusColor === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : txn.statusColor === 'red'
                            ? 'bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8]'
                            : txn.statusColor === 'rose'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedTxn(txn)}
                        title="View Details"
                        className="p-1 text-slate-400 hover:text-[#C84826] hover:bg-[#FEF2EE] rounded-md transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setReceiptTxn(txn)}
                        title="View Receipt"
                        className="p-1 text-slate-400 hover:text-[#C84826] hover:bg-[#FEF2EE] rounded-md transition cursor-pointer"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 font-semibold border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900 font-mono">{Math.min(filteredTransactions.length, 15)}</strong> of{' '}
            <strong className="text-slate-900 font-mono">{filteredTransactions.length}</strong> live transactions
          </div>
          <span className="px-2.5 py-1 bg-[#C84826] text-white rounded-lg font-bold shadow-xs">Live Feed</span>
        </div>
      </section>

      {/* MODAL: TRANSACTION DETAILS */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#A62C11] to-[#C84826] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Receipt className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Transaction Ledger Record</h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-mono text-slate-500 font-bold">{selectedTxn.id}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8]">
                  {selectedTxn.status}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Beneficiary Partner</span>
                  <span className="text-sm font-bold text-slate-900 block">{selectedTxn.beneficiary}</span>
                  <span className="text-slate-500 text-[11px]">{selectedTxn.role}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                    <span className="font-semibold text-slate-800">{selectedTxn.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount</span>
                    <span className="font-black text-slate-900 font-mono text-sm">{selectedTxn.amount}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">UTR / Reference</span>
                  <span className="font-mono text-slate-800 font-bold block">{selectedTxn.utr}</span>
                  <span className="text-slate-500 text-[10.5px] block">{selectedTxn.bank}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedTxn(null);
                    setReceiptTxn(selectedTxn);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Open Receipt
                </button>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL PAYMENT RECEIPT */}
      {receiptTxn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden p-6 text-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center border-b border-slate-200 pb-3">
              <span className="font-black text-sm text-[#A62C11] block tracking-tight">DURAGRIT VITRIFIED PVT LTD</span>
              <span className="text-[10px] text-slate-400 block">National Highway 8-A, Morbi Kiln Cluster, Gujarat</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                Verified Escrow Settlement Record
              </span>
            </div>

            <div className="text-center py-2">
              <span className="text-xs text-slate-400 block">Amount</span>
              <span className="text-2xl font-black text-slate-900 font-mono">{receiptTxn.amount}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-[11px] font-mono border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Record ID:</span>
                <span className="font-bold">{receiptTxn.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-bold">{receiptTxn.beneficiary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UTR:</span>
                <span className="font-bold">{receiptTxn.utr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time:</span>
                <span>{receiptTxn.time}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setReceiptTxn(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
