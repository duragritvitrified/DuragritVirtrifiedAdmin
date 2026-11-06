import React, { useState, useMemo } from 'react';
import {
  CheckCircle2, QrCode, Users, Truck, ShieldCheck,
  Package, BarChart3, ArrowRight, RefreshCw, Sparkles, Search, Layers
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export function MasterWorkflowIndex({ onNavigateStep }) {
  const { skus = [], batches = [], users = [], vendors = [], claims = [], dbStatus, refreshAllData } = useData();
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

  const metrics = useMemo(() => {
    const totalSerials = batches.reduce(
      (sum, b) => sum + Number(b.quantity || (b.tokens || b.codes || []).length || 0),
      0
    );
    const totalScanned = batches.reduce(
      (sum, b) =>
        sum +
        Number(
          b.scannedCount ??
            (b.tokens || b.codes || []).filter((t) => t.isScanned || t.status === 'Redeemed').length
        ),
      0
    );
    const disbursedClaims = claims.filter(
      (c) => c.status === 'Disbursed' || c.payoutStatus === 'Disbursed'
    );
    const pendingClaims = claims.filter((c) => c.status === 'Pending');
    const flaggedClaims = claims.filter((c) => c.status === 'Flagged' || c.status === 'Rejected');
    const totalDisbursedInr = disbursedClaims.reduce(
      (sum, c) => sum + Number(c.disbursedAmount ?? c.amount ?? c.claimValue ?? 0),
      0
    );

    return {
      skusCount: skus.length,
      batchesCount: batches.length,
      totalSerials,
      totalScanned,
      usersCount: users.length,
      vendorsCount: vendors.length,
      claimsCount: claims.length,
      pendingCount: pendingClaims.length,
      disbursedCount: disbursedClaims.length,
      flaggedCount: flaggedClaims.length,
      totalDisbursedInr,
    };
  }, [skus, batches, users, vendors, claims]);

  const stages = useMemo(
    () => [
      {
        num: '01',
        phase: 'manufacturing',
        phaseLabel: 'Phase 1 • Mfg & Catalog',
        title: 'Product Catalog & Cashback Master',
        desc: 'Define DuraGrit SKU specifications, pack weight, MRP, and per-pack contractor cashback values.',
        statLabel: 'Active SKUs',
        statValue: `${metrics.skusCount} SKUs`,
        targetTab: 'product-catalog',
      },
      {
        num: '02',
        phase: 'manufacturing',
        phaseLabel: 'Phase 1 • Mfg & Catalog',
        title: 'Cryptographic QR Batch Generator',
        desc: 'Mint unique serialized QR tokens bound to SKUs and export print-ready vector sheets.',
        statLabel: 'Minted Serials',
        statValue: `${metrics.totalSerials.toLocaleString('en-IN')} QRs`,
        targetTab: 'qr-generator',
      },
      {
        num: '03',
        phase: 'manufacturing',
        phaseLabel: 'Phase 1 • Mfg & Catalog',
        title: 'Batch Serial Registry & Print Feeder',
        desc: 'Inspect live QR batches, serial ranges, and scan activation ratios across production lots.',
        statLabel: 'Production Batches',
        statValue: `${metrics.batchesCount} Batches`,
        targetTab: 'batch-registry',
      },
      {
        num: '04',
        phase: 'logistics',
        phaseLabel: 'Phase 2 • Distribution',
        title: 'Vendor & Dealer Directory',
        desc: 'Onboard regional vendors/dealers, track trade volume, and manage distributor payouts.',
        statLabel: 'Registered Vendors',
        statValue: `${metrics.vendorsCount} Vendors`,
        targetTab: 'vendor-manage',
      },
      {
        num: '05',
        phase: 'logistics',
        phaseLabel: 'Phase 2 • Distribution',
        title: 'Distributor Carton Dispatch Portal',
        desc: 'Track serialized QR batch allocations mapped to outbound regional vendor consignments.',
        statLabel: 'Active Allocations',
        statValue: `${metrics.batchesCount} Batches`,
        targetTab: 'distributor-dispatch',
      },
      {
        num: '06',
        phase: 'logistics',
        phaseLabel: 'Phase 2 • Distribution',
        title: 'Dealer Carton Inward Verification',
        desc: 'Verify inwarded QR batches and serial activation readiness for authorized trade partners.',
        statLabel: 'Activated Serials',
        statValue: `${metrics.totalScanned.toLocaleString('en-IN')} Scanned`,
        targetTab: 'dealer-inward',
      },
      {
        num: '07',
        phase: 'disbursal',
        phaseLabel: 'Phase 3 • Partner & Payouts',
        title: 'User & Contractor Directory',
        desc: 'Manage registered contractors, applicators, KYC status, mobile login IDs, and UPI details.',
        statLabel: 'Registered Partners',
        statValue: `${metrics.usersCount} Users`,
        targetTab: 'users',
      },
      {
        num: '08',
        phase: 'disbursal',
        phaseLabel: 'Phase 3 • Partner & Payouts',
        title: 'Mobile Field App (Contractor & Vendor)',
        desc: 'Partner login, live QR scan submission with site photo, wallet ledger, and receipt download.',
        statLabel: 'Total Scans Logged',
        statValue: `${metrics.claimsCount} Claims`,
        targetTab: 'mobile-app',
      },
      {
        num: '09',
        phase: 'disbursal',
        phaseLabel: 'Phase 3 • Partner & Payouts',
        title: '2-Step Cashback Requests & Disbursal',
        desc: 'Step 1 Approve in Pending List; Step 2 Release Payout with UTR, screenshot & remarks in Completed tab.',
        statLabel: 'Pending / Disbursed',
        statValue: `${metrics.pendingCount} Pending • ${metrics.disbursedCount} Paid`,
        targetTab: 'cashback',
      },
      {
        num: '10',
        phase: 'audit_fiscal',
        phaseLabel: 'Phase 4 • Audit & Fiscal',
        title: 'Anti-Fraud & Quarantine Audit',
        desc: 'Review rejected or flagged cashback claims and protect escrow integrity.',
        statLabel: 'Flagged / Rejected',
        statValue: `${metrics.flaggedCount} Claims`,
        targetTab: 'antifraud-escrow',
      },
      {
        num: '11',
        phase: 'audit_fiscal',
        phaseLabel: 'Phase 4 • Audit & Fiscal',
        title: 'Executive Settlement & Fiscal Close',
        desc: 'Reconcile settled UTRs, TDS records, and daily cashback disbursement totals.',
        statLabel: 'Settled Value',
        statValue: `₹${metrics.totalDisbursedInr.toLocaleString('en-IN')}`,
        targetTab: 'executive-settlement',
      },
      {
        num: '12',
        phase: 'audit_fiscal',
        phaseLabel: 'Phase 4 • Audit & Fiscal',
        title: 'Enterprise Reports & Analytics',
        desc: 'Live 12-month cashback disbursement analytics, scan conversion rates, and CSV exports.',
        statLabel: 'Disbursed Claims',
        statValue: `${metrics.disbursedCount} Settled`,
        targetTab: 'reports',
      },
    ],
    [metrics]
  );

  const filteredStages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stages.filter((s) => {
      const matchPhase = phaseFilter === 'all' || s.phase === phaseFilter;
      const matchQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.num.includes(q);
      return matchPhase && matchQuery;
    });
  }, [stages, phaseFilter, searchQuery]);

  const handleSync = async () => {
    setSyncing(true);
    await refreshAllData();
    setSyncing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8]">
            <span className="w-2 h-2 rounded-full bg-[#C84826] animate-pulse" />
            LIVE END-TO-END WORKFLOW • {dbStatus?.connected ? 'SUPABASE SYNCED' : 'LOCAL SYNC READY'}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            DuraGrit Supply Chain, QR Traceability &amp; Cashback Master Index
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Real-time operational overview connecting Product Catalog, QR Batch Minting, Partner Directory, Mobile App Scanning, and 2-Step Cashback Settlement.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#C84826]' : ''}`} />
            Sync Live Data
          </button>
          <button
            onClick={() => onNavigateStep && onNavigateStep('product-catalog')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Start at Step 01 Catalog
          </button>
        </div>
      </div>

      {/* Live Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Products &amp; Batches</span>
            <div className="w-9 h-9 rounded-xl bg-[#FEF2EE] text-[#C84826] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {metrics.skusCount} SKUs <span className="text-sm font-semibold text-slate-400">/ {metrics.batchesCount} Batches</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{metrics.totalSerials.toLocaleString('en-IN')} serialized QR codes minted</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Onboarded Network</span>
            <div className="w-9 h-9 rounded-xl bg-[#FEF2EE] text-[#C84826] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {metrics.usersCount} Users <span className="text-sm font-semibold text-slate-400">/ {metrics.vendorsCount} Vendors</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Live contractors, masons &amp; regional dealers</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">QR Claims Logged</span>
            <div className="w-9 h-9 rounded-xl bg-[#FEF2EE] text-[#C84826] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{metrics.claimsCount.toLocaleString('en-IN')}</div>
          <p className="text-xs text-slate-500 mt-2">
            {metrics.pendingCount} pending approval • {metrics.disbursedCount} disbursed
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Cashback Settled</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{metrics.totalDisbursedInr.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-2">Verified UTR &amp; receipt synchronized</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Stages (12)' },
            { id: 'manufacturing', label: 'Phase 1: Mfg & QR' },
            { id: 'logistics', label: 'Phase 2: Vendors & Inward' },
            { id: 'disbursal', label: 'Phase 3: App & Cashback' },
            { id: 'audit_fiscal', label: 'Phase 4: Audit & Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPhaseFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                phaseFilter === tab.id
                  ? 'bg-[#C84826] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter workflow stages..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#C84826]"
          />
        </div>
      </div>

      {/* Stage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStages.map((stage) => (
          <div
            key={stage.num}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[#F9CEB8] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FEF2EE] text-[#A62C11] border border-[#F9CEB8]">
                  STEP {stage.num}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">{stage.phaseLabel}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{stage.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{stage.desc}</p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stage.statLabel}</div>
                <div className="text-xs font-black text-slate-800 mt-0.5">{stage.statValue}</div>
              </div>
              <button
                onClick={() => onNavigateStep && onNavigateStep(stage.targetTab)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FEF2EE] hover:bg-[#C84826] text-[#A62C11] hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Open Module
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
