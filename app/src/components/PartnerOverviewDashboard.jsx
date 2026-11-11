import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  checkClientUpdateStatus,
  applyClientAppUpdate
} from '../services/appInstallService';
import {
  QrCode,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Headphones,
  Award,
  PhoneCall,
  Check,
  RefreshCw,
  ArrowRight,
  Rocket,
  Wallet,
  ClipboardList,
  Building2,
  Mail,
  Phone,
  Landmark,
  AlertCircle,
  FileText,
  X,
  CreditCard,
  ChevronRight,
  TrendingUp,
  PieChart as PieChartIcon,
  Package
} from 'lucide-react';

export const PartnerOverviewDashboard = ({
  onNavigateScan,
  onNavigateRequests,
  onNavigateDossier,
  onNavigateOrders,
  onLogout,
  isVendorMode = false
}) => {
  const { currentUser, updateCurrentUser } = useAuth();
  const { users = [], vendors = [], claims = [], orders = [], dbStatus = {}, refreshAllData } = useData();

  const [copiedKey, setCopiedKey] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(() => checkClientUpdateStatus());
  const [isUpdating, setIsUpdating] = useState(false);
  const [claimFilter, setClaimFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'disbursed' | 'rejected'
  const [selectedClaim, setSelectedClaim] = useState(null);

  // OTA Listeners
  useEffect(() => {
    refreshAllData?.();
  }, [refreshAllData]);

  useEffect(() => {
    const handleSync = () => {
      setUpdateStatus(checkClientUpdateStatus());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('duragrit:ota-release-pushed', handleSync);
    window.addEventListener('duragrit:ota-update-applied', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('duragrit:ota-release-pushed', handleSync);
      window.removeEventListener('duragrit:ota-update-applied', handleSync);
    };
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    showToast(`Downloading & installing OTA update ${updateStatus.latestVersion}...`);
    setTimeout(() => {
      const res = applyClientAppUpdate(updateStatus.latestVersion);
      setUpdateStatus(checkClientUpdateStatus());
      setIsUpdating(false);
      showToast(`✓ Updated to ${res.version}! All latest features are active.`);
    }, 1200);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleCopy = (text, keyName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast(`Copied ${keyName}: ${text}`);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleRefresh = async () => {
    if (!refreshAllData) return;
    setIsSyncing(true);
    try {
      await refreshAllData();
      showToast('Live wallet, claims & profile data synced with Admin Panel.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Match live partner from vendors table (all external partners: Contractor, Distributor, Retailer, Vendor)
  const currentDigits = String(currentUser?.mobile || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
  const currentId = String(currentUser?.vendorId || currentUser?.id || currentUser?.userId || '').toLowerCase();
  const currentEmail = String(currentUser?.email || '').toLowerCase().trim();
  const currentName = String(currentUser?.companyName || currentUser?.name || '').toLowerCase().trim();

  const matchedVendor = vendors.find((v) => {
    const vDigits = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
    const vId = String(v.vendorId || v.id || '').toLowerCase();
    const vEmail = String(v.email || '').toLowerCase().trim();
    const vName = String(v.companyName || v.name || '').toLowerCase().trim();
    const vContact = String(v.contactPerson || '').toLowerCase().trim();
    return (
      (vId && currentId && (vId === currentId || currentId.includes(vId) || vId.includes(currentId))) ||
      (currentDigits.length === 10 && vDigits === currentDigits) ||
      (currentEmail && vEmail === currentEmail) ||
      (currentName && vName && (currentName === vName || currentName.includes(vName) || vName.includes(currentName))) ||
      (currentName && vContact && (currentName === vContact || currentName.includes(vContact) || vContact.includes(currentName)))
    );
  });

  const matchedUser = users.find((u) => {
    const uDigits = String(u.mobile || u.phone || '').replace(/\D/g, '').slice(-10);
    const uId = String(u.userId || u.id || '').toLowerCase();
    const uEmail = String(u.email || '').toLowerCase().trim();
    return (
      (uId && (uId === currentId || currentId.includes(uId) || uId.includes(currentId))) ||
      (currentDigits.length === 10 && uDigits === currentDigits) ||
      (currentEmail && uEmail === currentEmail)
    );
  });

  // Dynamic corporate monogram SVG avatar so it is never a blank wireframe icon
  const getBrandedVendorAvatar = (name, id) => {
    const cleanName = (name || 'DuraGrit Partner').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    const initials = parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : cleanName.slice(0, 2).toUpperCase();
    const safeInitials = initials || 'DG';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="terracottaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C84826"/>
          <stop offset="60%" stop-color="#A6300F"/>
          <stop offset="100%" stop-color="#6E1E09"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill="url(#terracottaGrad)"/>
      <rect x="8" y="8" width="80" height="80" rx="18" fill="none" stroke="#F9CEB8" stroke-width="2" stroke-opacity="0.45"/>
      <text x="48" y="58" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="34" font-weight="900" text-anchor="middle" letter-spacing="1.5">${safeInitials}</text>
      <circle cx="72" cy="24" r="5" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const partner = {
    id: matchedVendor?.vendorId || matchedVendor?.id || currentUser?.vendorId || currentUser?.id || matchedUser?.userId || matchedUser?.id || 'VND-101',
    companyName: matchedVendor?.companyName || matchedVendor?.name || currentUser?.companyName || currentUser?.name || matchedUser?.companyName || 'DuraGrit Authorized Partner',
    contactPerson: matchedVendor?.contactPerson || currentUser?.contactPerson || matchedVendor?.name || currentUser?.name || 'Verified Partner',
    name: matchedVendor?.companyName || matchedVendor?.contactPerson || matchedVendor?.name || currentUser?.name || currentUser?.companyName || 'Verified Partner',
    phone: matchedVendor?.phone || matchedVendor?.mobile || currentUser?.phone || currentUser?.mobile || '',
    email: matchedVendor?.email || currentUser?.email || '',
    category: matchedVendor?.category || currentUser?.category || currentUser?.role || 'Vendor Partner',
    role: matchedVendor?.category || currentUser?.role || 'Vendor',
    city: matchedVendor?.city || matchedVendor?.location || matchedUser?.location || 'Morbi',
    state: matchedVendor?.state || 'Gujarat',
    location: matchedVendor?.city
      ? `${matchedVendor.city}, ${matchedVendor.state || 'Gujarat'}`
      : matchedVendor?.location || matchedUser?.location || 'Morbi, Gujarat',
    status: matchedVendor?.status || matchedVendor?.accountStatus || currentUser?.status || matchedUser?.accountStatus || 'ACTIVE',
    bankName: matchedVendor?.bankName || matchedUser?.bankName || '',
    accountNumber: matchedVendor?.accountNumber || matchedUser?.accountNo || '',
    ifsc: matchedVendor?.ifscCode || matchedVendor?.ifsc || matchedUser?.ifsc || '',
    upi: matchedVendor?.upi || matchedVendor?.upiId || matchedUser?.upi || '',
    tierLevel: matchedVendor?.tierLevel || matchedUser?.tierLevel || 'Gold Applicator (Tier 2)',
    avatarUrl: matchedVendor?.avatarUrl || matchedVendor?.profileImage || currentUser?.avatarUrl || currentUser?.profileImage || matchedUser?.avatarUrl || '',
    profileImage: matchedVendor?.avatarUrl || matchedVendor?.profileImage || currentUser?.avatarUrl || currentUser?.profileImage || matchedUser?.avatarUrl || '',
    activePurchaseOrders: matchedVendor?.activePurchaseOrders || 0,
    poValueLakhs: matchedVendor?.poValueLakhs || 0,
    releasedPayoutLakhs: matchedVendor?.releasedPayoutLakhs || 0,
    payoutHistory: matchedVendor?.payoutHistory || []
  };

  // Auto-sync live matched vendor changes back into AuthContext session so session storage stays fresh
  useEffect(() => {
    if (matchedVendor && updateCurrentUser) {
      if (
        matchedVendor.companyName &&
        currentUser?.companyName !== matchedVendor.companyName
      ) {
        updateCurrentUser({
          companyName: matchedVendor.companyName,
          name: matchedVendor.companyName || matchedVendor.name,
          contactPerson: matchedVendor.contactPerson || currentUser?.contactPerson,
          phone: matchedVendor.phone || matchedVendor.mobile || currentUser?.phone,
          email: matchedVendor.email || currentUser?.email,
          status: matchedVendor.status || matchedVendor.accountStatus || currentUser?.status,
          location: matchedVendor.location || matchedVendor.city || currentUser?.location,
        });
      }
    }
  }, [matchedVendor, currentUser?.companyName, updateCurrentUser]);

  const displayName = partner.companyName || partner.contactPerson || partner.name;
  const vendorAvatarSrc =
    matchedVendor?.avatarUrl ||
    matchedVendor?.profileImage ||
    matchedVendor?.logoUrl ||
    currentUser?.avatarUrl ||
    currentUser?.profileImage ||
    matchedUser?.avatarUrl ||
    matchedUser?.profileImage ||
    getBrandedVendorAvatar(partner.companyName, partner.id);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'DG';

  // Filter claims strictly belonging to this signed-in partner
  const userClaims = claims.filter((c) => {
    const cDigits = String(c.userMobile || c.contractorPhone || c.mobile || '').replace(/\D/g, '').slice(-10);
    const cUserId = String(c.userId || c.contractorId || c.vendorId || '').toLowerCase().replace(/^(usr|vnd)-/i, '');
    const myIdClean = String(partner.id || '').toLowerCase().replace(/^(usr|vnd)-/i, '');
    const cEmail = String(c.userEmail || c.email || '').toLowerCase().trim();
    const myEmail = String(partner.email || '').toLowerCase().trim();
    const cName = String(c.userName || c.contractorName || c.companyName || c.vendorName || '').toLowerCase().trim();
    const myContact = String(partner.contactPerson || '').toLowerCase().trim();
    const myCompany = String(partner.companyName || '').toLowerCase().trim();

    return (
      (currentDigits.length === 10 && cDigits === currentDigits) ||
      (myIdClean && cUserId && (cUserId === myIdClean || myIdClean.includes(cUserId) || cUserId.includes(myIdClean))) ||
      (myEmail && cEmail && cEmail === myEmail) ||
      (cName && (cName === myContact || cName === myCompany || cName.includes(myContact) || cName.includes(myCompany) || myCompany.includes(cName)))
    );
  });

  // Calculate Specific Financial & Count KPIs requested by user:
  // 1. Kitna Scan Kiya (Total Scans)
  const totalScans = userClaims.length;

  // 2. Kitna Payout Total (Total Payout Amount in ₹)
  const totalPayout = userClaims.reduce((sum, c) => sum + (Number(c.amount || c.claimValue) || 0), 0);

  // Helper status checkers
  const isClaimDisbursed = (c) => {
    const s = String(c.status || '').toLowerCase();
    const p = String(c.payoutStatus || '').toLowerCase();
    return s === 'disbursed' || p === 'disbursed' || s === 'completed' || s === 'paid' || p === 'paid' || Number(c.disbursedAmount || 0) > 0;
  };
  const isClaimApproved = (c) => {
    const s = String(c.status || '').toLowerCase();
    const p = String(c.payoutStatus || '').toLowerCase();
    return !isClaimDisbursed(c) && (s === 'approved' || p === 'pending release' || s === 'in process');
  };
  const isClaimRejected = (c) => {
    const s = String(c.status || '').toLowerCase();
    return s === 'rejected' || s === 'flagged';
  };
  const isClaimPending = (c) => {
    return !isClaimDisbursed(c) && !isClaimApproved(c) && !isClaimRejected(c);
  };

  // 3. Disbursed / Paid Kitna (Disbursed Claims Amount & Count)
  const disbursedClaims = userClaims.filter(isClaimDisbursed);
  const disbursedAmount = disbursedClaims.reduce(
    (sum, c) => sum + (Number(c.disbursedAmount || c.netDisbursed || c.amount || c.claimValue) || 0),
    0
  );
  const disbursedCount = disbursedClaims.length;

  // 4. Approve Kitna (Approved Claims Amount & Count - awaiting release)
  const approvedClaims = userClaims.filter(isClaimApproved);
  const approvedAmount = approvedClaims.reduce((sum, c) => sum + (Number(c.amount || c.claimValue) || 0), 0);
  const approvedCount = approvedClaims.length;

  // 5. Pending Kitna Hai (Pending Claims Amount & Count)
  const pendingClaims = userClaims.filter(isClaimPending);
  const pendingAmount = pendingClaims.reduce((sum, c) => sum + (Number(c.amount || c.claimValue) || 0), 0);
  const pendingCount = pendingClaims.length;

  // 6. Rejected / Flagged Claims
  const rejectedClaims = userClaims.filter(isClaimRejected);
  const rejectedAmount = rejectedClaims.reduce((sum, c) => sum + (Number(c.amount || c.claimValue) || 0), 0);
  const rejectedCount = rejectedClaims.length;

  // Percent settled
  const percentSettled = totalPayout > 0 ? Math.round((disbursedAmount / totalPayout) * 100) : 0;

  // Circular Donut Chart Math (Radius = 52, Circumference = 2 * PI * 52 ≈ 326.726)
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.73

  const safeTotal = totalPayout > 0 ? totalPayout : totalScans > 0 ? totalScans : 1;
  const valDisbursed = totalPayout > 0 ? disbursedAmount : disbursedCount;
  const valApproved = totalPayout > 0 ? approvedAmount : approvedCount;
  const valPending = totalPayout > 0 ? pendingAmount : pendingCount;
  const valRejected = totalPayout > 0 ? rejectedAmount : rejectedCount;

  const pctDisbursed = (valDisbursed / safeTotal);
  const pctApproved = (valApproved / safeTotal);
  const pctPending = (valPending / safeTotal);
  const pctRejected = (valRejected / safeTotal);

  const dashDisbursed = pctDisbursed * circumference;
  const dashApproved = pctApproved * circumference;
  const dashPending = pctPending * circumference;
  const dashRejected = pctRejected * circumference;

  const offsetDisbursed = 0;
  const offsetApproved = -dashDisbursed;
  const offsetPending = -(dashDisbursed + dashApproved);
  const offsetRejected = -(dashDisbursed + dashApproved + dashPending);

  // Filtered claims for summary section
  const filteredClaims = userClaims.filter((c) => {
    const isDisbursed = isClaimDisbursed(c);
    const isApproved = isClaimApproved(c);
    const isRejected = isClaimRejected(c);
    const isPending = isClaimPending(c);

    if (claimFilter === 'pending') return isPending;
    if (claimFilter === 'approved') return isApproved;
    if (claimFilter === 'disbursed') return isDisbursed;
    if (claimFilter === 'rejected') return isRejected;
    return true; // 'all'
  });

  return (
    <div className="w-full max-w-[440px] mx-auto flex-1 flex flex-col font-sans select-none pb-3 text-stone-800 overflow-x-hidden">
      <style>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.02); }
        }
        @keyframes shimmerSweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .anim-slide-up {
          animation: fadeInSlideUp 0.35s ease-out forwards;
        }
        .btn-shimmer {
          background: linear-gradient(90deg, #A6300F 0%, #C84826 30%, #E3643E 50%, #C84826 70%, #A6300F 100%);
          background-size: 200% 100%;
          animation: shimmerSweep 4s infinite linear;
        }
      `}</style>

      {/* Floating Toast Message */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#A6300F] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-white/20 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3 max-w-[90%]">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PARTNER PROFILE STRIP (Clean, Uncluttered & Fully Responsive)        */}
      {/* ===================================================================== */}
      <div className="w-full bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-[#ECEAE6] flex items-center justify-between shadow-2xs sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
          {/* 1. User Profile Icon */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#FEF2EE] to-white border-2 border-[#F9CEB8] flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            <img
              src={vendorAvatarSrc}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getBrandedVendorAvatar(partner.companyName, partner.id);
              }}
            />
          </div>

          {/* 2. Vendor Name & 3. Vendor ID */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5 min-w-0">
              <h1 className="text-xs sm:text-[13px] font-black text-stone-900 leading-snug break-words whitespace-normal">
                {partner.companyName || partner.contactPerson || 'Vendor Partner'}
              </h1>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center font-mono text-[9px] sm:text-[9.5px] font-black text-[#A6300F] bg-[#FEF2EE] px-1.5 py-0.5 rounded border border-[#F9CEB8] shrink-0 tracking-wider">
                {partner.id}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Active Badge & Instant Live Sync Icon */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isSyncing}
            title="Instant Live Sync with Admin Panel"
            className="p-1.5 sm:p-2 rounded-xl bg-[#FEF2EE] hover:bg-[#FCE3D9] text-[#A6300F] border border-[#F9CEB8] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A6300F] ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2 sm:px-2.5 py-1.5 rounded-xl shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>{partner.status || 'Active'}</span>
          </span>
        </div>
      </div>

      <main className="p-3.5 space-y-3.5 flex-1 anim-slide-up">
        {/* ===================================================================== */}
        {/* 3. KPI HEADER (Vendor Scans, Payout Total, Approve, Paid, Pending)    */}
        {/* ===================================================================== */}
        <section className="bg-white rounded-3xl p-4 border-2 border-[#C84826]/70 border-l-4 border-l-[#C84826] shadow-sm space-y-3 relative overflow-hidden">
          {/* Subtle background luxury accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FEF2EE] to-transparent rounded-bl-full pointer-events-none -mr-8 -mt-8"></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#A6300F]" />
              <span className="text-[11px] font-black tracking-wider text-stone-900 uppercase">
                Payout &amp; Scan Summary
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {percentSettled}% Settled
            </span>
          </div>

          {/* Top 2 Primary Metrics: Total Scans & Total Payout */}
          <div className="grid grid-cols-2 gap-2.5 relative z-10">
            {/* KPI 1: Kitna Scan Kiya with matching warm border */}
            <div className="bg-gradient-to-br from-[#FFF8F5] to-white border border-[#F9CEB8] rounded-2xl p-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                  Total Scanned
                </span>
                <div className="w-6 h-6 rounded-lg bg-[#FEF2EE] text-[#A6300F] flex items-center justify-center">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-stone-900 font-mono tracking-tight">
                  {totalScans}
                </span>
                <span className="text-[11px] font-semibold text-stone-500 font-serif">
                  {totalScans === 1 ? 'Bag' : 'Bags'}
                </span>
              </div>
              <span className="text-[9.5px] text-stone-400 block mt-0.5">
                QR Serials Claimed
              </span>
            </div>

            {/* KPI 2: Kitna Payout Total */}
            <div className="bg-gradient-to-br from-[#FFF8F5] to-white border border-[#F9CEB8] rounded-2xl p-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#A6300F] uppercase tracking-wider">
                  Total Payout
                </span>
                <div className="w-6 h-6 rounded-lg bg-[#A6300F] text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#A6300F] font-mono tracking-tight">
                  ₹{totalPayout.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[9.5px] text-[#A6300F]/70 block mt-0.5 font-medium">
                Gross Claim Value
              </span>
            </div>
          </div>

          {/* Bottom 4 Detailed Status Metrics: Disbursed/Paid, Approved, Pending, Rejected (2x2 Responsive Grid) */}
          <div className="grid grid-cols-2 gap-2.5 relative z-10 pt-1">
            {/* KPI 3: Disbursed / Paid Kitna */}
            <div
              onClick={() => setClaimFilter('disbursed')}
              className={`bg-gradient-to-br from-emerald-50/90 via-emerald-50/70 to-teal-50/50 border rounded-2xl p-3 flex flex-col justify-between gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-2xs ${
                claimFilter === 'disbursed'
                  ? 'border-emerald-500 ring-2 ring-emerald-200/80'
                  : 'border-emerald-200/90 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-emerald-800">
                <div className="w-5 h-5 rounded-lg bg-emerald-100/90 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-emerald-900">
                  Paid
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-700 font-mono leading-tight tracking-tight">
                ₹{disbursedAmount.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="inline-flex items-center text-[9.5px] font-mono font-bold text-emerald-800 bg-white/90 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                  {disbursedCount} Paid ✓
                </span>
                <span className="text-[9px] font-semibold text-emerald-600/80">
                  Settled UPI
                </span>
              </div>
            </div>

            {/* KPI 4: Approve Kitna */}
            <div
              onClick={() => setClaimFilter('approved')}
              className={`bg-gradient-to-br from-blue-50/90 via-blue-50/70 to-indigo-50/50 border rounded-2xl p-3 flex flex-col justify-between gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-2xs ${
                claimFilter === 'approved'
                  ? 'border-blue-500 ring-2 ring-blue-200/80'
                  : 'border-blue-200/90 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-blue-800">
                <div className="w-5 h-5 rounded-lg bg-blue-100/90 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-blue-900">
                  Approved
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-blue-700 font-mono leading-tight tracking-tight">
                ₹{approvedAmount.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="inline-flex items-center text-[9.5px] font-mono font-bold text-blue-800 bg-white/90 px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                  {approvedCount} Queued
                </span>
                <span className="text-[9px] font-semibold text-blue-600/80">
                  Verified
                </span>
              </div>
            </div>

            {/* KPI 5: Pending Kitna Hai */}
            <div
              onClick={() => setClaimFilter('pending')}
              className={`bg-gradient-to-br from-amber-50/90 via-amber-50/70 to-orange-50/50 border rounded-2xl p-3 flex flex-col justify-between gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-2xs ${
                claimFilter === 'pending'
                  ? 'border-amber-500 ring-2 ring-amber-200/80'
                  : 'border-amber-200/90 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-amber-800">
                <div className="w-5 h-5 rounded-lg bg-amber-100/90 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-amber-900">
                  Pending
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-amber-800 font-mono leading-tight tracking-tight">
                ₹{pendingAmount.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="inline-flex items-center text-[9.5px] font-mono font-bold text-amber-800 bg-white/90 px-2 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                  {pendingCount} Review
                </span>
                <span className="text-[9px] font-semibold text-amber-700/80">
                  In Queue
                </span>
              </div>
            </div>

            {/* KPI 6: Reject Kitna Hai */}
            <div
              onClick={() => setClaimFilter('rejected')}
              className={`bg-gradient-to-br from-rose-50/90 via-rose-50/70 to-red-50/50 border rounded-2xl p-3 flex flex-col justify-between gap-1.5 transition active:scale-[0.98] cursor-pointer shadow-2xs ${
                claimFilter === 'rejected'
                  ? 'border-rose-500 ring-2 ring-rose-200/80'
                  : 'border-rose-200/90 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-rose-800">
                <div className="w-5 h-5 rounded-lg bg-rose-100/90 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-rose-900">
                  Rejected
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-rose-700 font-mono leading-tight tracking-tight">
                ₹{rejectedAmount.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="inline-flex items-center text-[9.5px] font-mono font-bold text-rose-800 bg-white/90 px-2 py-0.5 rounded-full border border-rose-200 shadow-2xs">
                  {rejectedCount} Rejected
                </span>
                <span className="text-[9px] font-semibold text-rose-600/80">
                  Flagged
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 4. PRIMARY ACTION BUTTON (View Request List) with colorful border     */}
        {/* ===================================================================== */}
        <section className="pt-0.5">
          <button
            onClick={onNavigateRequests}
            className="w-full bg-gradient-to-r from-white via-[#FFFBF9] to-[#FFF5F0] hover:bg-stone-50 border-2 border-[#C84826]/50 hover:border-[#C84826] border-l-4 border-l-[#C84826] text-stone-900 py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98] transition cursor-pointer font-bold text-xs"
          >
            <div className="w-7 h-7 rounded-xl bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8] flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#A6300F]" />
            </div>
            <div className="text-left">
              <span className="block leading-tight font-extrabold text-[12px] text-stone-900">
                View Request List
              </span>
              <span className="block text-[9.5px] text-[#A6300F] font-mono font-bold">
                {userClaims.length} Claims Recorded →
              </span>
            </div>
          </button>
        </section>

        {/* ===================================================================== */}
        {/* 5. VISUAL ANALYTICS: INTERACTIVE CIRCULAR PIE / DONUT CHART          */}
        {/* ===================================================================== */}
        <section className="bg-white rounded-3xl p-4 border-2 border-[#C84826]/70 border-l-4 border-l-[#C84826] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-stone-100">
            <div className="flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-[#A6300F]" />
              <h3 className="font-extrabold text-xs text-stone-900 uppercase tracking-wide">
                Payout Distribution Chart
              </h3>
            </div>
            <span className="text-[10px] font-mono text-stone-400">
              Live Breakdown
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="text-stone-100"
                  strokeWidth="13"
                  stroke="currentColor"
                  fill="transparent"
                />

                {totalScans === 0 ? (
                  /* Empty state ring */
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="#E7E5E4"
                    strokeWidth="13"
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                ) : (
                  <>
                    {/* Disbursed (Paid) Slice - Emerald */}
                    {valDisbursed > 0 && (
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="#10B981"
                        strokeWidth="13"
                        strokeDasharray={`${dashDisbursed} ${circumference}`}
                        strokeDashoffset={offsetDisbursed}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Approved Slice - Blue */}
                    {valApproved > 0 && (
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="#3B82F6"
                        strokeWidth="13"
                        strokeDasharray={`${dashApproved} ${circumference}`}
                        strokeDashoffset={offsetApproved}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Pending Slice - Amber */}
                    {valPending > 0 && (
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="#F59E0B"
                        strokeWidth="13"
                        strokeDasharray={`${dashPending} ${circumference}`}
                        strokeDashoffset={offsetPending}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Rejected Slice - Rose */}
                    {valRejected > 0 && (
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="#EF4444"
                        strokeWidth="13"
                        strokeDasharray={`${dashRejected} ${circumference}`}
                        strokeDashoffset={offsetRejected}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    )}
                  </>
                )}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  {totalScans === 0 ? 'STATUS' : 'SETTLED'}
                </span>
                <span className="text-lg font-black text-stone-900 font-mono tracking-tight leading-tight">
                  {totalScans === 0 ? '0%' : `${percentSettled}%`}
                </span>
                <span className="text-[8.5px] font-bold text-emerald-700 font-mono truncate max-w-[80px]">
                  ₹{disbursedAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Legend & Slice Summary */}
            <div className="w-full space-y-1.5 text-xs">
              {/* Disbursed Row */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-2xs"></span>
                  <span className="font-semibold text-stone-700 text-[11px]">Disbursed / Paid</span>
                </div>
                <div className="font-mono text-[11px] font-bold text-emerald-700">
                  ₹{disbursedAmount.toLocaleString('en-IN')} <span className="text-stone-400 font-normal">({disbursedCount})</span>
                </div>
              </div>

              {/* Approved Row */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-2xs"></span>
                  <span className="font-semibold text-stone-700 text-[11px]">Approved</span>
                </div>
                <div className="font-mono text-[11px] font-bold text-blue-700">
                  ₹{approvedAmount.toLocaleString('en-IN')} <span className="text-stone-400 font-normal">({approvedCount})</span>
                </div>
              </div>

              {/* Pending Row */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-2xs"></span>
                  <span className="font-semibold text-stone-700 text-[11px]">Pending Review</span>
                </div>
                <div className="font-mono text-[11px] font-bold text-amber-700">
                  ₹{pendingAmount.toLocaleString('en-IN')} <span className="text-stone-400 font-normal">({pendingCount})</span>
                </div>
              </div>

              {/* Rejected Row */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-2xs"></span>
                  <span className="font-semibold text-stone-700 text-[11px]">Rejected / Flagged</span>
                </div>
                <div className="font-mono text-[11px] font-bold text-rose-700">
                  ₹{rejectedAmount.toLocaleString('en-IN')} <span className="text-stone-400 font-normal">({rejectedCount})</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* RECENT QR SCANS & CLAIMS SUMMARY with consistent colorful brand border */}
        {/* ===================================================================== */}
        <section className="bg-white rounded-3xl p-4 border-2 border-[#C84826]/70 border-l-4 border-l-[#C84826] shadow-sm space-y-3 font-sans">
          <div className="flex items-center justify-between pb-1 border-b border-stone-100">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#A6300F]" />
              <h3 className="font-extrabold text-xs text-stone-900 uppercase tracking-wide">
                Recent QR Scans &amp; Claims ({userClaims.length})
              </h3>
            </div>
            <button
              onClick={onNavigateRequests}
              className="text-[#A6300F] text-[11px] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: userClaims.length },
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'approved', label: 'Approved', count: approvedCount },
              { id: 'disbursed', label: 'Paid', count: disbursedCount },
              { id: 'rejected', label: 'Rejected', count: rejectedCount }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setClaimFilter(tab.id)}
                className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold whitespace-nowrap transition cursor-pointer ${
                  claimFilter === tab.id
                    ? 'bg-[#A6300F] text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Claims List with matching status card borders */}
          {filteredClaims.length === 0 ? (
            <div className="py-7 text-center text-xs text-stone-400 space-y-2 bg-[#FAF9F6] rounded-2xl border border-stone-200/60 p-4">
              <QrCode className="w-8 h-8 mx-auto text-stone-300" />
              <p className="font-bold text-stone-700">No {claimFilter !== 'all' ? claimFilter : ''} claims found</p>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                Scan DuraGrit verified QR codes on tile boxes to start earning instant reward cashback.
              </p>
              <button
                type="button"
                onClick={onNavigateScan}
                className="mt-1 px-4 py-2 bg-[#A6300F] hover:bg-[#8B230C] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan DuraGrit QR Code</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-0.5">
              {filteredClaims.slice(0, 5).map((claim) => {
                const isDisbursed = claim.status === 'Disbursed' || claim.payoutStatus === 'Disbursed';
                const isApproved = claim.status === 'Approved' && !isDisbursed;
                const isRejected = claim.status === 'Rejected' || claim.status === 'Flagged';
                const skuCode = claim.skuCode || 'DG-ADH-01';

                return (
                  <div
                    key={claim.id}
                    onClick={() => setSelectedClaim(claim)}
                    className={`p-2.5 rounded-xl border bg-white transition cursor-pointer shadow-2xs flex items-center justify-between gap-2 ${
                      isDisbursed
                        ? 'border-emerald-300 border-l-4 border-l-emerald-500 hover:border-emerald-400'
                        : isApproved
                        ? 'border-blue-300 border-l-4 border-l-blue-500 hover:border-blue-400'
                        : isRejected
                        ? 'border-rose-300 border-l-4 border-l-rose-500 hover:border-rose-400'
                        : 'border-amber-300 border-l-4 border-l-amber-500 hover:border-amber-400'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5 truncate">
                        <span className="font-mono text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded border border-stone-200">
                          {skuCode}
                        </span>
                        <span className="font-mono text-[11px] text-stone-600 truncate">
                          {claim.serialKey || claim.qrSerial || claim.batchCode}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                        {claim.productName || 'High-Polymer Vitrified Adhesive'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider font-mono border ${
                          isDisbursed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isApproved
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : isRejected
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isDisbursed ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span>PAID</span>
                          </>
                        ) : isApproved ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                            <span>APPROVED</span>
                          </>
                        ) : isRejected ? (
                          <>
                            <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                            <span>REJECTED</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            <span>PENDING</span>
                          </>
                        )}
                        <span>(₹{claim.amount})</span>
                      </span>

                      <span className="block text-[9.5px] text-stone-400 font-mono mt-0.5">
                        {claim.date || claim.submittedAt || 'Today'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ===================================================================== */}
        {/* 8. VENDOR PO ESCROW & ORDERS SECTION                                  */}
        {/* ===================================================================== */}
        {(isVendorMode || partner.poValueLakhs > 0 || (partner.payoutHistory && partner.payoutHistory.length > 0) || orders.length > 0) && (
          <section className="bg-white rounded-3xl p-4 border-2 border-[#C84826]/70 border-l-4 border-l-[#C84826] shadow-sm space-y-3 font-sans">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#A6300F]" />
                <h3 className="font-extrabold text-xs text-stone-900 uppercase tracking-wide">
                  Material Supply PO &amp; Orders
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">
                {orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length || partner.activePurchaseOrders || 1} Active Orders
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2 text-center">
                <span className="text-[9px] font-bold text-stone-400 uppercase">PO Sanctioned</span>
                <div className="text-sm font-black text-stone-900 font-mono mt-0.5">
                  ₹{Number(partner.poValueLakhs || 12.5).toFixed(1)}L
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-center">
                <span className="text-[9px] font-bold text-emerald-700 uppercase">Released</span>
                <div className="text-sm font-black text-emerald-700 font-mono mt-0.5">
                  ₹{Number(partner.releasedPayoutLakhs || 4.2).toFixed(1)}L
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-center">
                <span className="text-[9px] font-bold text-amber-700 uppercase">In Escrow</span>
                <div className="text-sm font-black text-amber-700 font-mono mt-0.5">
                  ₹{Math.max(0, Number((partner.poValueLakhs || 12.5) - (partner.releasedPayoutLakhs || 4.2))).toFixed(1)}L
                </div>
              </div>
            </div>

            {onNavigateOrders && (
              <button
                type="button"
                onClick={onNavigateOrders}
                className="w-full mt-1.5 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#A6300F] to-[#C84826] hover:from-[#8B230C] hover:to-[#A6300F] text-white text-xs font-bold flex items-center justify-between shadow-sm transition active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-white" />
                  <span>Place New Material Order &amp; View Indents</span>
                </div>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            )}
          </section>
        )}
      </main>

      {/* ===================================================================== */}
      {/* 10. CLAIM RECEIPT QUICK MODAL (when tapping a claim item)             */}
      {/* ===================================================================== */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#A6300F] bg-[#FEF2EE] px-2 py-0.5 rounded border border-[#F9CEB8]">
                  {selectedClaim.requestId || selectedClaim.id}
                </span>
                <h3 className="text-base font-extrabold text-stone-900 mt-1">
                  Claim Audit Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">QR Serial:</span>
                <span className="font-mono font-bold text-stone-900 select-all">
                  {selectedClaim.serialKey || selectedClaim.qrSerial}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Product:</span>
                <span className="font-bold text-stone-900 text-right">
                  {selectedClaim.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Reward Value:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ₹{selectedClaim.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Claim Status:</span>
                <span className="font-bold uppercase tracking-wider font-mono text-[10.5px]">
                  {selectedClaim.status || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date &amp; Time:</span>
                <span className="font-mono text-stone-600">
                  {selectedClaim.date || selectedClaim.submittedAt}
                </span>
              </div>
              {selectedClaim.npciRrn && (
                <div className="flex justify-between border-t border-stone-200/80 pt-1.5">
                  <span className="text-stone-500">NPCI UTR / RRN:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {selectedClaim.npciRrn}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedClaim(null);
                  onNavigateRequests();
                }}
                className="flex-1 py-2.5 bg-[#A6300F] hover:bg-[#8B230C] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer text-center"
              >
                View in Registry
              </button>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

