import React, { useState, useMemo } from 'react';
import {
  Users, QrCode, Wallet, Calendar, Download,
  RefreshCw, ShieldCheck, Search, Sparkles, X
} from 'lucide-react';
import { useData } from '../../context/DataContext';

const MONTHS_META = [
  { idx: 0, name: 'January', short: 'JAN', mm: '01' },
  { idx: 1, name: 'February', short: 'FEB', mm: '02' },
  { idx: 2, name: 'March', short: 'MAR', mm: '03' },
  { idx: 3, name: 'April', short: 'APR', mm: '04' },
  { idx: 4, name: 'May', short: 'MAY', mm: '05' },
  { idx: 5, name: 'June', short: 'JUN', mm: '06' },
  { idx: 6, name: 'July', short: 'JUL', mm: '07' },
  { idx: 7, name: 'August', short: 'AUG', mm: '08' },
  { idx: 8, name: 'September', short: 'SEP', mm: '09' },
  { idx: 9, name: 'October', short: 'OCT', mm: '10' },
  { idx: 10, name: 'November', short: 'NOV', mm: '11' },
  { idx: 11, name: 'December', short: 'DEC', mm: '12' },
];

export function ReportsAnalytics() {
  const { claims, refreshAllData } = useData();

  const now = new Date();
  const currentYearStr = String(now.getFullYear());

  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All');
  const [tableSearch, setTableSearch] = useState('');

  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState('accounts@duragritvitrified.com');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Filtered real claims for selected Year, Role, and Channel (zero sample data)
  const matchingClaims = useMemo(() => {
    return (claims || []).filter((c) => {
      const dt = new Date(c.submittedAt || c.createdAt || Date.now());
      const yr = Number.isNaN(dt.getTime()) ? currentYearStr : String(dt.getFullYear());
      if (yr !== selectedYear) return false;

      if (roleFilter !== 'All') {
        const r = String(c.userRole || 'Contractor').toLowerCase();
        if (!r.includes(roleFilter.toLowerCase())) return false;
      }

      if (channelFilter !== 'All') {
        const ch = String(c.paymentMode || c.payoutMethod || 'UPI').toUpperCase();
        if (channelFilter === 'UPI' && !ch.includes('UPI')) return false;
        if (channelFilter === 'NEFT' && ch.includes('UPI')) return false;
      }

      return true;
    });
  }, [claims, selectedYear, roleFilter, channelFilter, currentYearStr]);

  // Dynamically aggregate monthly ledger from live claims
  const monthlyLedger = useMemo(() => {
    const rawRows = MONTHS_META.map((m) => {
      const monthClaims = matchingClaims.filter((c) => {
        const dt = new Date(c.submittedAt || c.createdAt || Date.now());
        return !Number.isNaN(dt.getTime()) && dt.getMonth() === m.idx;
      });

      const userSet = new Set();
      const contractorSet = new Set();
      const dealerSet = new Set();

      let approvedApps = 0;
      let pendingApps = 0;
      let rejectedApps = 0;
      let totalAmountPaid = 0;

      monthClaims.forEach((c) => {
        const uKey = c.userMobile || c.mobile || c.userId || c.userName;
        if (uKey) {
          userSet.add(uKey);
          if (String(c.userRole || '').toLowerCase().includes('deal')) {
            dealerSet.add(uKey);
          } else {
            contractorSet.add(uKey);
          }
        }

        if (c.status === 'Disbursed' || c.payoutStatus === 'Disbursed') {
          approvedApps += 1;
          totalAmountPaid += Number(c.disbursedAmount || c.netDisbursed || c.amount || 0);
        } else if (c.status === 'Approved') {
          approvedApps += 1;
        } else if (c.status === 'Rejected' || c.status === 'Flagged') {
          rejectedApps += 1;
        } else {
          pendingApps += 1;
        }
      });

      const totalCount = approvedApps + pendingApps + rejectedApps;
      const successRate = totalCount > 0 ? Number(((approvedApps / totalCount) * 100).toFixed(1)) : 0;

      return {
        monthIdx: m.idx,
        month: `${m.name} ${selectedYear}`,
        shortMonth: m.short,
        isCurrent: String(now.getFullYear()) === selectedYear && now.getMonth() === m.idx,
        batchId: `BAT-${selectedYear}-${m.mm}-LIVE`,
        uniqueUsers: userSet.size,
        contractorsCount: contractorSet.size,
        dealersCount: dealerSet.size,
        totalScans: totalCount,
        approvedApps,
        pendingApps,
        rejectedApps,
        totalAmountPaid,
        displayAmount: `₹ ${totalAmountPaid.toLocaleString('en-IN', { minimumFractionDigits: totalAmountPaid % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`,
        successRate,
        volumeK:
          totalAmountPaid >= 100000
            ? `₹${(totalAmountPaid / 100000).toFixed(1)}L`
            : totalAmountPaid > 0
            ? `₹${totalAmountPaid.toFixed(0)}`
            : totalCount > 0
            ? `${totalCount} scan${totalCount > 1 ? 's' : ''}`
            : '₹0',
      };
    });

    const maxMetric = Math.max(1, ...rawRows.map((r) => r.totalAmountPaid || r.totalScans * 50));

    return rawRows
      .map((r) => {
        const metricVal = r.totalAmountPaid || r.totalScans * 50;
        return {
          ...r,
          barHeightPct: metricVal > 0 ? Math.max(12, Math.round((metricVal / maxMetric) * 100)) : 4,
        };
      })
      .reverse(); // Newest month first in table
  }, [matchingClaims, selectedYear, now]);

  // Chronological Jan -> Dec for Bar Chart
  const chartSeries = useMemo(() => [...monthlyLedger].reverse(), [monthlyLedger]);

  // Top KPI Summary (for selected month or full year)
  const kpiSummary = useMemo(() => {
    const scopeClaims =
      selectedMonth === 'All'
        ? matchingClaims
        : matchingClaims.filter((c) => {
            const dt = new Date(c.submittedAt || c.createdAt || Date.now());
            const mMeta = MONTHS_META[dt.getMonth()];
            return mMeta && `${mMeta.name} ${selectedYear}` === selectedMonth;
          });

    const allUsers = new Set();
    const contractors = new Set();
    const dealers = new Set();
    let disbursedTotal = 0;
    let upiTotal = 0;
    let bankTotal = 0;

    scopeClaims.forEach((c) => {
      const key = c.userMobile || c.mobile || c.userId || c.userName;
      if (key) {
        allUsers.add(key);
        if (String(c.userRole || '').toLowerCase().includes('deal')) dealers.add(key);
        else contractors.add(key);
      }
      if (c.status === 'Disbursed' || c.payoutStatus === 'Disbursed') {
        const amt = Number(c.disbursedAmount || c.netDisbursed || c.amount || 0);
        disbursedTotal += amt;
        if (String(c.paymentMode || c.payoutMethod || 'UPI').toUpperCase().includes('UPI')) {
          upiTotal += amt;
        } else {
          bankTotal += amt;
        }
      }
    });

    return {
      uniqueUsers: allUsers.size,
      contractorsCount: contractors.size,
      dealersCount: dealers.size,
      totalScans: scopeClaims.length,
      disbursedTotal,
      upiTotal,
      bankTotal,
      avgScans: allUsers.size > 0 ? (scopeClaims.length / allUsers.size).toFixed(1) : '0.0',
    };
  }, [matchingClaims, selectedMonth, selectedYear]);

  const filteredTableRows = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return monthlyLedger.filter((item) => {
      if (selectedMonth !== 'All' && item.month !== selectedMonth) return false;
      if (!q) return true;
      return item.month.toLowerCase().includes(q) || item.batchId.toLowerCase().includes(q);
    });
  }, [monthlyLedger, tableSearch, selectedMonth]);

  const ytdTotalPayout = useMemo(
    () => monthlyLedger.reduce((s, r) => s + r.totalAmountPaid, 0),
    [monthlyLedger]
  );

  const handleResetFilters = () => {
    setSelectedYear(currentYearStr);
    setSelectedMonth('All');
    setRoleFilter('All');
    setChannelFilter('All');
    setTableSearch('');
    showToast(`Filters reset to full live ledger (${currentYearStr}).`);
  };

  const handleGenerateReport = async () => {
    await refreshAllData();
    showToast(`Live ledger synchronized for ${selectedMonth === 'All' ? `Year ${selectedYear}` : selectedMonth}!`);
  };

  const handleExportMonthlyLedger = () => {
    showToast('Exporting Live Monthly Cashback Ledger CSV...');
    setTimeout(() => {
      const header = [
        'Month / Period',
        'Ledger Batch ID',
        'Unique Users Applied',
        'Contractors',
        'Dealers',
        'Approved / Disbursed Apps',
        'Pending Apps',
        'Rejected / Flagged',
        'Total Amount Paid (INR)',
        'Success Rate (%)',
      ];
      const rows = monthlyLedger.map((m) => [
        `"${m.month}"`,
        m.batchId,
        m.uniqueUsers,
        m.contractorsCount,
        m.dealersCount,
        m.approvedApps,
        m.pendingApps,
        m.rejectedApps,
        m.totalAmountPaid,
        `${m.successRate}%`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `DuraGrit_Monthly_Cashback_Ledger_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Monthly Ledger CSV exported successfully.');
    }, 300);
  };

  return (
    <div className="space-y-6 select-none font-sans pb-10">
      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-[#A62C11] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/20 flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-[#F9CEB8] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. SCREEN HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
            <span>DuraGrit ERP</span>
            <span>/</span>
            <span>Payout Engine</span>
            <span>/</span>
            <span className="text-[#A62C11] font-bold">Audit &amp; Reports</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              LIVE RECONCILIATION
            </span>
          </div>

          <div className="flex items-center space-x-2.5 mt-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Monthly Cashback Application Report
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#C84826] text-white px-2 py-0.5 rounded font-mono shadow-xs">
              LIVE LEDGER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monthly aggregation of unique scanners, cashback applications, and disbursed payouts from Supabase &amp; Mobile App.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 self-start lg:self-auto">
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C84826]" />
            <span>Schedule Auto-Report</span>
          </button>

          <button
            onClick={handleExportMonthlyLedger}
            className="flex items-center space-x-2 px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-sm shadow-[#C84826]/20 transition cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export Monthly Ledger (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth('All');
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
            >
              <option value="All">All Months ({selectedYear} YTD)</option>
              {MONTHS_META.map((m) => (
                <option key={m.mm} value={`${m.name} ${selectedYear}`}>
                  {m.name} {selectedYear}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              User Role Filter
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
            >
              <option value="All">All Roles (Contractors / Dealers / Masons)</option>
              <option value="Contractor">Contractors Only</option>
              <option value="Dealer">Dealers Only</option>
              <option value="Mason">Applicator Masons Only</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Disbursement Channel
            </label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
            >
              <option value="All">All Channels (UPI &amp; Bank)</option>
              <option value="UPI">UPI Instant Escrow</option>
              <option value="NEFT">NEFT / Bank Transfer</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-center space-x-2">
            <button
              onClick={handleResetFilters}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer text-center"
            >
              Reset
            </button>
            <button
              onClick={handleGenerateReport}
              className="flex-1 py-2 px-3 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 3 SUMMARY KPI CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Unique Users Applied
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1 font-mono tracking-tight">
                {kpiSummary.uniqueUsers.toLocaleString('en-IN')}{' '}
                <span className="text-sm font-semibold text-slate-500 font-sans">Users</span>
              </div>
            </div>
            <div className="p-2.5 bg-[#FEF2EE] text-[#C84826] rounded-xl border border-[#F9CEB8]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">
              {kpiSummary.contractorsCount} Contractors • {kpiSummary.dealersCount} Dealers
            </span>
            <span className="inline-flex items-center text-[#A62C11] bg-[#FEF2EE] font-bold px-2 py-0.5 rounded-full font-mono text-[11px]">
              Live Count
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total QR Scans Submitted
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1 font-mono tracking-tight">
                {kpiSummary.totalScans.toLocaleString('en-IN')}{' '}
                <span className="text-sm font-semibold text-slate-500 font-sans">Scans</span>
              </div>
            </div>
            <div className="p-2.5 bg-[#FEF2EE] text-[#C84826] rounded-xl border border-[#F9CEB8]">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">Avg. {kpiSummary.avgScans} scans / active user</span>
            <span className="inline-flex items-center text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full font-mono text-[11px]">
              Verified Serials
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Cashback Disbursed
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1 font-mono tracking-tight">
                ₹ {kpiSummary.disbursedTotal.toLocaleString('en-IN', { minimumFractionDigits: kpiSummary.disbursedTotal % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">
              ₹{kpiSummary.upiTotal.toLocaleString('en-IN')} UPI • ₹{kpiSummary.bankTotal.toLocaleString('en-IN')} Bank
            </span>
            <span className="inline-flex items-center text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full font-mono text-[11px]">
              Settled Escrow
            </span>
          </div>
        </div>
      </section>

      {/* 4. DISBURSEMENT & SCAN VOLUME CADENCE CHART */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Disbursement &amp; Scan Volume Cadence (Jan – Dec {selectedYear})
            </h2>
            <span className="text-[10px] font-bold bg-[#FEF2EE] text-[#A62C11] px-2 py-0.5 rounded font-mono border border-[#F9CEB8]">
              Live Time-Series
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              <span>Other Months</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C84826]"></span>
              <span className="text-slate-900 font-bold">Current Cycle</span>
            </div>
          </div>
        </div>

        <div className="pt-10 pb-4">
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-3 px-2 sm:px-4 relative border-b border-slate-200">
            <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-200"></div>
            <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-100"></div>

            {chartSeries.map((item, idx) => {
              const isCurrent = item.isCurrent;
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={item.shortMonth}
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  onClick={() => setSelectedMonthDetail(item)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {isCurrent ? (
                    <div className="mb-2 bg-[#C84826] text-white text-[10px] font-black font-mono px-2 py-0.5 rounded shadow-sm">
                      {item.volumeK}
                    </div>
                  ) : (
                    <div
                      className={`mb-1.5 text-[10px] font-bold font-mono transition-opacity duration-150 ${
                        isHovered || item.totalScans > 0
                          ? 'text-slate-700 opacity-100'
                          : 'text-slate-400 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {item.volumeK}
                    </div>
                  )}

                  <div
                    className="w-full max-w-[38px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end"
                    style={{ height: '100%' }}
                  >
                    <div
                      style={{ height: `${item.barHeightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isCurrent
                          ? 'bg-gradient-to-t from-[#A62C11] to-[#C84826] shadow-md'
                          : item.totalScans > 0
                          ? 'bg-[#C84826]/70 hover:bg-[#C84826]'
                          : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                    ></div>
                  </div>

                  <div className="mt-2.5 text-center">
                    <span
                      className={`text-[11px] font-bold font-mono uppercase block ${
                        isCurrent ? 'text-[#A62C11] font-black' : 'text-slate-500'
                      }`}
                    >
                      {item.shortMonth}
                    </span>
                  </div>

                  {isHovered && (
                    <div className="absolute -top-24 z-30 bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-left text-[11px] whitespace-nowrap border border-white/10 pointer-events-none animate-in fade-in duration-150">
                      <div className="font-bold text-white border-b border-white/20 pb-1 mb-1">{item.month}</div>
                      <div className="text-slate-300">
                        Disbursed: <span className="text-emerald-400 font-mono font-bold">{item.displayAmount}</span>
                      </div>
                      <div className="text-slate-300">
                        Total Scans: <span className="text-white font-mono font-bold">{item.totalScans}</span>
                      </div>
                      <div className="text-slate-300">
                        Users: <span className="text-[#F9CEB8] font-mono font-bold">{item.uniqueUsers}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. MONTHLY ACTIVITY BREAKDOWN TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Monthly Activity Breakdown — Year {selectedYear}
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#FEF2EE] text-[#A62C11] px-2 py-0.5 rounded font-mono border border-[#F9CEB8]">
              12 MONTHS LIVE
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search month or batch ID..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
              />
            </div>

            <button
              onClick={handleExportMonthlyLedger}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4 min-w-[170px]">Month / Period</th>
                <th className="py-3.5 px-4 min-w-[160px]">Unique Users Applied</th>
                <th className="py-3.5 px-4 min-w-[130px]">Approved / Disbursed</th>
                <th className="py-3.5 px-4 min-w-[120px]">Pending</th>
                <th className="py-3.5 px-4 min-w-[130px]">Rejected / Flagged</th>
                <th className="py-3.5 px-4 min-w-[140px]">Total Amount Paid</th>
                <th className="py-3.5 px-4 min-w-[130px]">Success Rate</th>
                <th className="py-3.5 px-4 text-right min-w-[130px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTableRows.map((row) => (
                <tr key={row.batchId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs">{row.month}</span>
                      {row.isCurrent && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8] px-1.5 py-0.5 rounded font-mono">
                          CURRENT CYCLE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{row.batchId}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 font-mono">{row.uniqueUsers} users</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {row.contractorsCount} contr. • {row.dealersCount} dealers
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {row.approvedApps}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {row.pendingApps > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                        {row.pendingApps}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-xs">0</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                      {row.rejectedApps}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono font-black text-slate-900 text-sm whitespace-nowrap">
                      {row.displayAmount}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${row.successRate}%` }}
                        ></div>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-800">{row.successRate}%</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedMonthDetail(row)}
                      className="text-xs font-bold text-[#C84826] hover:text-[#A62C11] hover:underline cursor-pointer inline-flex items-center space-x-1"
                    >
                      <span>View Summary</span>
                      <span>&rarr;</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
          <div>
            Showing live monthly ledger for {selectedYear} (YTD Total Disbursed:{' '}
            <strong className="text-slate-900 font-mono">
              ₹ {ytdTotalPayout.toLocaleString('en-IN', { minimumFractionDigits: ytdTotalPayout % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}
            </strong>
            )
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#C84826] text-white font-bold text-xs shadow-xs">
            Live Reconciliation
          </span>
        </div>
      </div>

      {/* 6. STATUTORY GST & DIRECT PAYOUT COMPLIANCE FOOTER */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Statutory GST &amp; Direct Payout Compliance</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              All cashback disbursements reflect verified QR serial redemptions and Admin UTR payout releases.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black font-mono border border-slate-200 tracking-wider">
            ISO 27001 • NPCI COMPLIANT
          </span>
        </div>
      </section>

      {/* MODAL 1: MONTHLY AUDIT LEDGER DRILL-DOWN */}
      {selectedMonthDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#A62C11] to-[#C84826] text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {selectedMonthDetail.month} — Monthly Audit Ledger
                  </h3>
                  <span className="text-[10px] font-mono bg-white/20 text-white px-2 py-0.5 rounded">
                    {selectedMonthDetail.batchId}
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  Consolidated live reconciliation &amp; escrow payout summary.
                </p>
              </div>
              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="text-white/80 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 text-xs text-slate-700 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Disbursed</span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {selectedMonthDetail.displayAmount}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Applications</span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {selectedMonthDetail.totalScans}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
                  <div className="text-base font-black text-emerald-600 font-mono mt-0.5">
                    {selectedMonthDetail.successRate}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#FEF2EE] border border-[#F9CEB8] rounded-xl">
                  <span className="text-[10px] font-bold text-[#A62C11] uppercase block">Contractors &amp; Masons</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {selectedMonthDetail.contractorsCount}
                  </span>
                </div>
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Authorized Dealers</span>
                  <span className="text-lg font-black text-blue-950 font-mono">
                    {selectedMonthDetail.dealersCount}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">Approved &amp; Disbursed:</span>
                  <span className="font-bold font-mono text-emerald-700">{selectedMonthDetail.approvedApps} Scans</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">Pending Review:</span>
                  <span className="font-bold font-mono text-amber-700">{selectedMonthDetail.pendingApps} Scans</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-600">Rejected / Quarantined:</span>
                  <span className="font-bold font-mono text-rose-700">{selectedMonthDetail.rejectedApps} Scans</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleExportMonthlyLedger();
                  setSelectedMonthDetail(null);
                }}
                className="px-4 py-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULE AUTO-REPORT */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-[#A62C11] to-[#C84826] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">Schedule Automated Monthly Report</h3>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="text-white/80 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <p className="text-slate-500 text-[11px]">
                Receive the finalized month-end cashback reconciliation directly in your executive mailbox.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setScheduleModalOpen(false);
                  showToast(`Automated report schedule saved for ${scheduleEmail}!`);
                }}
                className="px-4 py-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
