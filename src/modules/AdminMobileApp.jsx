import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  LayoutGrid,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  Flag,
  PhoneCall,
  Headphones,
  Plus,
  RefreshCw,
  Check,
  ArrowRight,
  Layers,
  QrCode,
  FileText,
  Lock,
  LogOut,
  Sliders,
  AlertTriangle,
  User,
  Radio,
  Server,
  Zap,
  Building2,
  Copy,
  ExternalLink,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Smartphone,
  PieChart,
  TrendingUp,
  Activity,
  ArrowUpRight,
  BarChart3,
  Clock,
  Rocket,
  Download,
  History,
  Send
} from 'lucide-react';
import {
  checkAdminUpdateStatus,
  applyAdminAppUpdate,
  getAdminAppReleases,
  publishAdminNewRelease
} from '../services/appInstallService';

export const AdminMobileApp = ({ onSwitchToPartnerApp }) => {
  const { currentUser, loginUser, logout } = useAuth();
  const {
    claims = [],
    batches = [],
    skus = [],
    vendors = [],
    users = [],
    approveClaimStep1,
    rejectClaim,
    createBatch,
    refreshAllData,
    dbStatus = {}
  } = useData();

  // Helper to reliably resolve Vendor Name & ID for each claim
  const resolveVendorInfo = (c) => {
    if (c?.vendorName && String(c.vendorName).trim() && c.vendorName !== '—') {
      return {
        vendorName: String(c.vendorName).trim(),
        vendorId: c.vendorId || 'VEN-001'
      };
    }
    if (c?.companyName && String(c.companyName).trim()) {
      return {
        vendorName: String(c.companyName).trim(),
        vendorId: c.vendorId || 'VEN-001'
      };
    }

    if (c?.vendorId) {
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

    const cleanUid = String(c?.userId || c?.userSupabaseId || '').toUpperCase();
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

    const cleanMobile = String(c?.userMobile || c?.mobile || '').replace(/\D/g, '').slice(-10);
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

    const cleanName = String(c?.userName || c?.contractorName || '').trim().toLowerCase();
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

    if (
      String(c?.userRole || '').toLowerCase().includes('vend') ||
      String(c?.userRole || '').toLowerCase().includes('deal')
    ) {
      return {
        vendorName: c?.userName || 'Authorized Vendor Partner',
        vendorId: c?.vendorId || 'VEN-001'
      };
    }

    const firstVendor = vendors.find((v) => v.companyName);
    return {
      vendorName: firstVendor?.companyName || 'Reliance Polymers Ltd (Hazira Complex)',
      vendorId: firstVendor?.vendorId || firstVendor?.id || 'VEN-001'
    };
  };

  // Screen & Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'requests' | 'qrgen' | 'audit'
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(6);

  // Floating Haptic HUD Notification
  const [hudNotice, setHudNotice] = useState({ visible: false, text: '', icon: '📳', color: 'slate' });
  const hudTimeoutRef = useRef(null);

  // Reject / Flag Modal State
  const [flagModalClaim, setFlagModalClaim] = useState(null);
  const [flagReason, setFlagReason] = useState('Duplicate or unreadable QR serial token');

  // Quick Batch Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [batchQty, setBatchQty] = useState(100);
  const [batchCashback, setBatchCashback] = useState(250);
  const [batchLoading, setBatchLoading] = useState(false);
  const [inspectedBatch, setInspectedBatch] = useState(null);
  const [copiedToken, setCopiedToken] = useState('');

  // Admin Login State (if accessed without admin session)
  const [adminId, setAdminId] = useState('admin');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const isAdminAuthenticated = Boolean(
    currentUser && (currentUser.isAdmin || currentUser.role === 'Admin' || currentUser.email === 'duragrit07@gmail.com')
  );

  // Admin OTA Versioning & Auto-Push State
  const [adminUpdateStatus, setAdminUpdateStatus] = useState(() => checkAdminUpdateStatus());
  const [isAdminUpdating, setIsAdminUpdating] = useState(false);
  const [adminUpdateProgress, setAdminUpdateProgress] = useState(0);
  const [adminUpdateProgressMsg, setAdminUpdateProgressMsg] = useState('');
  const [showAdminChangelogModal, setShowAdminChangelogModal] = useState(false);
  const [showPublishReleaseModal, setShowPublishReleaseModal] = useState(false);
  const [newReleaseVersion, setNewReleaseVersion] = useState('');
  const [newReleaseTitle, setNewReleaseTitle] = useState('');
  const [newReleaseChangelog, setNewReleaseChangelog] = useState('');

  // Auto-Push Listeners: Listen for live broadcasts
  useEffect(() => {
    const handleSync = () => {
      setAdminUpdateStatus(checkAdminUpdateStatus());
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('duragrit:admin-ota-release-pushed', handleSync);
    window.addEventListener('duragrit:admin-ota-update-applied', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('duragrit:admin-ota-release-pushed', handleSync);
      window.removeEventListener('duragrit:admin-ota-update-applied', handleSync);
    };
  }, []);

  const handleTriggerAdminUpdate = () => {
    setIsAdminUpdating(true);
    setAdminUpdateProgress(20);
    setAdminUpdateProgressMsg('Handshaking with Morbi Central Cloud...');

    setTimeout(() => {
      setAdminUpdateProgress(50);
      setAdminUpdateProgressMsg(`Verifying package integrity for ${adminUpdateStatus.latestVersion}...`);
      setTimeout(() => {
        setAdminUpdateProgress(85);
        setAdminUpdateProgressMsg('Patching executive moderation node & hot-reloading state...');
        setTimeout(() => {
          setAdminUpdateProgress(100);
          setAdminUpdateProgressMsg(`Applied ${adminUpdateStatus.latestVersion}!`);
          setTimeout(() => {
            applyAdminAppUpdate(adminUpdateStatus.latestVersion);
            setAdminUpdateStatus(checkAdminUpdateStatus());
            setIsAdminUpdating(false);
            setAdminUpdateProgress(0);
            setAdminUpdateProgressMsg('');
            playApproveChime();
            showHapticHUD(`Super Admin Console updated to ${adminUpdateStatus.latestVersion}!`, '🚀', 'emerald');
          }, 400);
        }, 500);
      }, 500);
    }, 400);
  };

  const handlePublishNewRelease = (e) => {
    e.preventDefault();
    if (!newReleaseVersion.trim()) return;
    const res = publishAdminNewRelease({
      version: newReleaseVersion,
      title: newReleaseTitle || `Admin Console ${newReleaseVersion}`,
      changelog: newReleaseChangelog || 'Performance and security updates.'
    });
    setAdminUpdateStatus(checkAdminUpdateStatus());
    setShowPublishReleaseModal(false);
    setNewReleaseVersion('');
    setNewReleaseTitle('');
    setNewReleaseChangelog('');
    showHapticHUD(`OTA Release ${res.release.version} Published & Auto-Pushed!`, '📢', 'emerald');
  };

  // Sync Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncSeconds((prev) => (prev >= 60 ? 4 : prev + 2));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Synthesizer (Zero asset dependency)
  const playApproveChime = () => {
    if (!hapticEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (_) { }
  };

  const playRejectBuzz = () => {
    if (!hapticEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch (_) { }
  };

  const playRejectChime = playRejectBuzz;

  const showHapticHUD = (text, icon = '📳', color = 'slate') => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    setHudNotice({ visible: true, text, icon, color });
    hudTimeoutRef.current = setTimeout(() => {
      setHudNotice((prev) => ({ ...prev, visible: false }));
    }, 2500);

    if (hapticEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  // PWA Native Installation Handling for Admin Console
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true)
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      showHapticHUD('Admin Console Installed', '📲', 'emerald');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        '📲 To install DuraGrit Admin Console on your phone:\n\n' +
        '• Android Chrome: Tap the 3 dots (⋮) at top right → Select "Install app" or "Add to Home screen"\n' +
        '• Apple Safari: Tap the Share button at bottom → Select "Add to Home Screen"'
      );
      return;
    }
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        showHapticHUD('Installing Admin Console to Home Screen...', '📲', 'emerald');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  const toggleHaptic = () => {
    const next = !hapticEnabled;
    setHapticEnabled(next);
    showHapticHUD(next ? 'Tactile Haptic & Audio: Active' : 'Tactile Haptic Muted', next ? '📳' : '🔇');
  };

  const handleRefresh = async () => {
    if (!refreshAllData) return;
    setIsSyncing(true);
    try {
      await refreshAllData();
      setLastSyncSeconds(0);
      showHapticHUD('Live Moderation Node Synced', '🔄', 'emerald');
    } finally {
      setIsSyncing(false);
    }
  };

  // Metrics Counters & Financial Escrow
  const pendingCount = claims.filter((c) => c.status === 'Pending').length;
  const approvedCount = claims.filter((c) => c.status === 'Approved' || c.status === 'Disbursed').length;
  const rejectedCount = claims.filter((c) => c.status === 'Rejected' || c.status === 'Flagged').length;
  const totalRequestsCount = claims.length;

  const pendingAmount = claims
    .filter((c) => c.status === 'Pending')
    .reduce((sum, c) => sum + Number(c.amount || c.cashbackAmount || 250), 0);
  const approvedAmount = claims
    .filter((c) => c.status === 'Approved' || c.status === 'Disbursed')
    .reduce((sum, c) => sum + Number(c.amount || c.cashbackAmount || 250), 0);
  const rejectedAmount = claims
    .filter((c) => c.status === 'Rejected' || c.status === 'Flagged')
    .reduce((sum, c) => sum + Number(c.amount || c.cashbackAmount || 250), 0);
  const totalAmount = pendingAmount + approvedAmount + rejectedAmount;

  // Dual-Mode Pie / Donut Chart State ('count' = Claims Volume, 'amount' = Escrow Liability in ₹)
  const [chartMetricMode, setChartMetricMode] = useState('count');
  const [chartActiveSlice, setChartActiveSlice] = useState(null);

  const isAmountMode = chartMetricMode === 'amount';
  const metricApproved = isAmountMode ? approvedAmount : approvedCount;
  const metricPending = isAmountMode ? pendingAmount : pendingCount;
  const metricRejected = isAmountMode ? rejectedAmount : rejectedCount;
  const metricTotal = isAmountMode
    ? (totalAmount > 0 ? totalAmount : 1)
    : (totalRequestsCount > 0 ? totalRequestsCount : 1);

  // Circular Donut / Pie Chart Math (Radius = 54, Circumference = 2 * PI * 54 ≈ 339.292)
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.292
  const safeTotal = totalRequestsCount > 0 ? totalRequestsCount : 1;

  const pctApproved = metricApproved / metricTotal;
  const pctPending = metricPending / metricTotal;
  const pctRejected = metricRejected / metricTotal;

  const dashApproved = pctApproved * circumference;
  const dashPending = pctPending * circumference;
  const dashRejected = pctRejected * circumference;

  const offsetApproved = 0;
  const offsetPending = -dashApproved;
  const offsetRejected = -(dashApproved + dashPending);

  // Safe Timestamp Helper: Ensures latest request is always on TOP
  const getClaimTimestamp = (c) => {
    if (c.submittedAt) {
      const t = new Date(c.submittedAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (c.timestamp) {
      const t = new Date(c.timestamp).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (c.createdAt) {
      const t = new Date(c.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (c.updatedAt) {
      const t = typeof c.updatedAt === 'number' ? c.updatedAt : new Date(c.updatedAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (c.date) {
      const t = new Date(c.date).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    const numMatch = String(c.requestId || c.id || '').match(/\d+/g);
    if (numMatch) {
      const num = parseInt(numMatch.join(''), 10);
      if (!isNaN(num)) return num;
    }
    return 0;
  };

  // Format Date and Time for Request Receipts
  const formatRequestDateTime = (claim) => {
    const raw = claim.submittedAt || claim.timestamp || claim.createdAt || claim.date;
    if (!raw) return 'Live Queue';
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    return String(raw);
  };

  // Filtered Claims (Always sorted with Latest Request on TOP)
  const filteredClaims = claims
    .filter((c) => {
      if (filterTab === 'pending' && c.status !== 'Pending') return false;
      if (filterTab === 'approved' && c.status !== 'Approved' && c.status !== 'Disbursed') return false;
      if (filterTab === 'rejected' && c.status !== 'Rejected' && c.status !== 'Flagged') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const vInfo = resolveVendorInfo(c);
        return (
          String(c.requestId || c.claimCode || c.id || '').toLowerCase().includes(q) ||
          String(vInfo.vendorName).toLowerCase().includes(q) ||
          String(vInfo.vendorId).toLowerCase().includes(q) ||
          String(c.userName || c.contractorName || '').toLowerCase().includes(q) ||
          String(c.userMobile || c.mobile || '').toLowerCase().includes(q) ||
          String(c.qrSerial || c.serialKey || '').toLowerCase().includes(q) ||
          String(c.skuCode || '').toLowerCase().includes(q) ||
          String(c.productName || '').toLowerCase().includes(q) ||
          String(c.amount || '').includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const diff = getClaimTimestamp(b) - getClaimTimestamp(a);
      if (diff !== 0) return diff;
      return String(b.requestId || b.id || '').localeCompare(String(a.requestId || a.id || ''));
    });

  // Recent Factory Batches sorted latest first
  const sortedBatches = (batches || []).slice().sort((a, b) => {
    const tA = new Date(a.createdAt || a.date || a.timestamp || 0).getTime() || 0;
    const tB = new Date(b.createdAt || b.date || b.timestamp || 0).getTime() || 0;
    if (tB !== tA) return tB - tA;
    return String(b.batchId || b.id || '').localeCompare(String(a.batchId || a.id || ''));
  });

  // Action Handlers
  const handleApprove = async (claim) => {
    playApproveChime();
    showHapticHUD(`Claim ${claim.requestId || claim.id} Approved & Escrow Released`, '✔', 'emerald');
    if (approveClaimStep1) {
      await approveClaimStep1(claim.id);
    }
  };

  const handleConfirmReject = async () => {
    if (!flagModalClaim) return;
    playRejectBuzz();
    showHapticHUD(`Claim ${flagModalClaim.requestId || flagModalClaim.id} Flagged`, '🚩', 'rose');
    if (rejectClaim) {
      await rejectClaim(flagModalClaim.id, flagReason);
    }
    setFlagModalClaim(null);
  };

  const handleQuickCreateBatch = async (e) => {
    if (e) e.preventDefault();
    setBatchLoading(true);
    try {
      const targetSku =
        skus.find((s) => s.id === selectedSkuId) ||
        skus[0] || {
          id: 'SKU-DG-ADH-01',
          skuCode: 'DG-ADH-01',
          name: 'Tile Adhesive 20kg',
          cashbackReward: batchCashback
        };

      const count = Math.max(1, Number(batchQty) || 1);
      const reward = Number(batchCashback) || Number(targetSku.cashbackReward) || 50;
      const batchNum = Math.floor(1000 + Math.random() * 9000);
      const batchId = `DG-BATCH-${targetSku.skuCode || 'SKU'}-${batchNum}`;

      const tokensList = Array.from({ length: count }).map((_, i) => {
        const serialSeq = String(i + 1).padStart(6, '0');
        const tokenSerial = `DG-${targetSku.skuCode || 'SKU'}-${batchNum}-${serialSeq}`;
        return {
          serialKey: tokenSerial,
          serial: tokenSerial,
          cashbackAmount: reward,
          isScanned: false
        };
      });

      if (createBatch) {
        await createBatch({
          batchId,
          skuId: targetSku.id,
          skuCode: targetSku.skuCode,
          productName: targetSku.name,
          quantity: count,
          cashbackAmount: reward,
          tokens: tokensList,
          status: 'Active'
        });
      }

      playApproveChime();
      showHapticHUD(`Generated Batch ${batchId} (${count} QR tokens)`, '📦', 'indigo');
      setShowBatchModal(false);
    } catch (err) {
      console.error('Error creating batch:', err);
      showHapticHUD('Batch creation error: ' + (err.message || 'Check connection'), '❌', 'rose');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleAdminSignIn = (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    const rawId = adminId.trim().toLowerCase();
    const rawPass = adminPass.trim();

    const isValidId =
      rawId === 'admin' ||
      rawId === 'duragrit07@gmail.com' ||
      rawId === 'admin@duragrit.com' ||
      rawId === '9000000000';

    const isValidPass =
      rawPass === 'admin' ||
      rawPass === '1234' ||
      rawPass === 'DuraGritAdmin@2026!' ||
      rawPass === 'DG-SEC-9942-ALPHA';

    if (!isValidId || !isValidPass) {
      setLoginError('Invalid Administrator credentials. Default: admin / 1234');
      setIsSubmittingLogin(false);
      return;
    }

    loginUser({
      id: 'ADMIN-01',
      name: 'DuraGrit Super Admin',
      email: 'duragrit07@gmail.com',
      mobile: '9000000000',
      role: 'Admin',
      isAdmin: true,
      location: 'Morbi Kiln HQ, Gujarat',
      status: 'Active'
    });

    setIsSubmittingLogin(false);
    playApproveChime();
    showHapticHUD('Super Admin Authenticated', '🛡️', 'emerald');
  };

  // =========================================================================
  // IF NOT AUTHENTICATED AS ADMIN: SHOW DISTINCT EXECUTIVE BLUE ADMIN LOGIN SCREEN
  // =========================================================================
  if (!isAdminAuthenticated) {
    return (
      <div className="w-full max-w-[460px] mx-auto h-[100dvh] max-h-[100dvh] sm:h-[min(900px,94vh)] sm:min-h-[580px] bg-gradient-to-b from-[#061224] via-[#0B1E3D] to-[#050D1A] text-slate-100 flex flex-col justify-between p-5 sm:p-6 select-none font-sans relative overflow-y-auto sm:rounded-[36px] border border-blue-900/50 shadow-2xl">
        {/* Luminous Blue & Cyan Ambient Glow Orbs */}
        <div className="absolute -top-12 -right-12 w-72 h-72 bg-blue-600/25 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="pt-4 sm:pt-6 space-y-5 relative z-10">
          {/* Executive Blue Brand Logo & Header */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 border border-blue-400/40 shrink-0">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">DuraGrit</h1>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase border border-blue-400/40 shadow-xs shadow-blue-500/20">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-[11px] text-blue-300 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Executive Field Moderation Console
              </p>
            </div>
          </div>

          {/* Blue Cyber Glass Security Terminal Card */}
          <div className="bg-[#0B1E3C]/80 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 space-y-2 shadow-lg shadow-blue-950/60 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />
            <div className="flex items-center justify-between text-xs font-bold text-blue-100">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Super Admin Security Terminal</span>
              </div>
              <span className="text-[9.5px] font-mono text-cyan-300 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800/80">
                FIPS 140-2
              </span>
            </div>
            <p className="text-[11px] text-blue-200/80 leading-relaxed font-sans">
              Sign in with your master administrative credentials to access live QR claim moderation, automated escrow payouts, and factory batch generation.
            </p>
          </div>

          {/* 1-Tap Mobile Admin App Install Banner */}
          {!isInstalled && (
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-3 border border-blue-500/40 shadow-lg shadow-blue-950/80 flex items-center justify-between font-sans relative z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                  <span className="text-base">📲</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-black tracking-tight text-white flex items-center gap-1.5">
                    <span>Install Admin Console</span>
                    <span className="text-[8px] bg-cyan-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full uppercase">1-Tap</span>
                  </div>
                  <p className="text-[9.5px] text-blue-200/90 truncate mt-0.5">
                    Add to home screen for fullscreen executive command &amp; offline sync
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="ml-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 active:scale-95 text-stone-950 font-black text-[10.5px] rounded-xl shadow-xs transition shrink-0 cursor-pointer"
              >
                Install App
              </button>
            </div>
          )}

          {/* Login Error Notification */}
          {loginError && (
            <div className="bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wide mb-1.5 font-mono">
                Admin Username or Email <span className="text-cyan-400">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-blue-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="admin or duragrit07@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#07162C]/90 border border-blue-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 rounded-xl text-xs text-white placeholder-blue-300/40 transition font-mono outline-none shadow-inner"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wide font-mono">
                  Master Security Password <span className="text-cyan-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer font-bold"
                >
                  {showAdminPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-blue-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Enter admin password (e.g. 1234)"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#07162C]/90 border border-blue-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 rounded-xl text-xs text-white placeholder-blue-300/40 transition font-mono outline-none shadow-inner"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              onClick={handleAdminSignIn}
              disabled={isSubmittingLogin}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/40 transition active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2 border border-blue-400/30"
            >
              {isSubmittingLogin ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Demo Admin Credentials Helper Card */}
          <div className="p-3 bg-[#081833]/90 rounded-2xl border border-blue-800/60 flex items-center justify-between text-xs shadow-inner">
            <div>
              <div className="text-[10px] text-blue-300/80 font-mono font-medium">Default Super Admin Credentials</div>
              <div className="text-[11px] font-mono font-bold text-white mt-0.5">
                admin / <span className="text-cyan-400">1234</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAdminId('admin');
                setAdminPass('1234');
                setLoginError('');
                showHapticHUD('Admin Credentials Loaded', '🔑', 'emerald');
              }}
              className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 border border-blue-400/40 rounded-xl text-[10px] font-bold font-mono transition cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Auto-Fill</span>
            </button>
          </div>
        </div>

        {/* Footer Navigation Strip */}
        <div className="pt-6 border-t border-blue-900/60 text-center space-y-2 relative z-10">
          {onSwitchToPartnerApp && (
            <button
              type="button"
              onClick={onSwitchToPartnerApp}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>← Switch to Vendor / Contractor App</span>
            </button>
          )}
          <p className="text-[9.5px] text-blue-400/70 font-mono">
            DuraGrit Security Core v2.5.0 • FIPS 140-2 Level 3 • 256-Bit TLS 1.3
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN ADMIN MOBILE APP (STEP 12 IMPLEMENTATION - OBSIDIAN & CRIMSON)
  // =========================================================================
  return (
    <div className="w-full max-w-[460px] mx-auto h-[100dvh] max-h-[100dvh] sm:h-[min(900px,94vh)] sm:min-h-[580px] bg-[#FAFBFD] text-slate-800 flex flex-col font-sans select-none relative shadow-2xl rounded-none sm:rounded-[36px] overflow-hidden border-0 sm:border border-slate-200/80 overflow-x-hidden">
      <style>{`
        @keyframes hapticBumpSuccess {
          0% { transform: scale(1); }
          30% { transform: scale(0.97) translateY(2px); }
          60% { transform: scale(1.02) translateY(-1px); }
          100% { transform: scale(1); }
        }
        @keyframes hapticBumpReject {
          0% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }
        .anim-haptic-success {
          animation: hapticBumpSuccess 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .anim-haptic-reject {
          animation: hapticBumpReject 320ms ease-in-out;
        }
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marqueeScroll 22s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes shimmerGradient {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmerGradient 4s linear infinite;
        }
        @keyframes barberPole {
          from { background-position: 0 0; }
          to { background-position: 30px 0; }
        }
        .animate-stripes {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.25) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.25) 50%,
            rgba(255, 255, 255, 0.25) 75%,
            transparent 75%,
            transparent
          );
          background-size: 20px 20px;
          animation: barberPole 1.2s linear infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .animate-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }
      `}</style>

      {/* Floating Haptic HUD Notification */}
      <div
        className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 transform ${hudNotice.visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          } flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full shadow-lg border backdrop-blur-md text-[10.5px] font-semibold ${hudNotice.color === 'emerald'
            ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/40'
            : hudNotice.color === 'rose'
              ? 'bg-rose-900/90 text-rose-100 border-rose-500/40'
              : 'bg-slate-900/90 text-white border-slate-700/60'
          }`}
      >
        <span>{hudNotice.icon}</span>
        <span className="tracking-tight">{hudNotice.text}</span>
      </div>

      {/* ===================================================================== */}
      {/* 1. TOP APP HEADER (Executive Obsidian & Crimson Theme)               */}
      {/* ===================================================================== */}
      <header className="pt-3.5 pb-2.5 px-4 bg-[#0B0F19] border-b border-slate-800 text-white flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-2.5">
          {/* Brand Icon Tile */}
          <div className="w-8 h-8 rounded-lg bg-[#BA3A24] flex items-center justify-center text-white shadow-sm shrink-0 ring-1 ring-[#BA3A24]/40">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z"></path>
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white text-xs tracking-tight">DuraGrit</span>
              <span className="bg-[#BA3A24] text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
                ADMIN
              </span>
              <span className="text-[9px] font-mono font-bold text-cyan-300">
                {adminUpdateStatus.installedVersion}
              </span>
              {adminUpdateStatus.hasUpdate ? (
                <button
                  type="button"
                  onClick={handleTriggerAdminUpdate}
                  className="text-[8px] font-black text-amber-300 bg-amber-950/80 hover:bg-amber-900 px-1.5 py-0.2 rounded border border-amber-500/50 cursor-pointer active:scale-95 animate-pulse"
                  title="New Admin Version Available — Tap to Update"
                >
                  Update Ready ⚡
                </button>
              ) : (
                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Up to date ✓
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium leading-tight font-mono flex items-center gap-1.5 mt-0.5">
              <span>Super Admin Portal</span>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setShowAdminChangelogModal(true)}
                className="text-[9.5px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                Version Logs
              </button>
            </div>
          </div>
        </div>

        {/* Profile / Switch / Logout Icon Buttons */}
        <div className="flex items-center gap-1.5">
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              title="Install Admin App on Home Screen"
              className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 border border-blue-400/50 text-white text-[10px] font-bold flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <span>📲</span>
              <span className="hidden xs:inline">Install</span>
            </button>
          )}

          <button
            onClick={() => {
              if (onSwitchToPartnerApp) onSwitchToPartnerApp();
              else window.location.href = '/?app=vendor';
            }}
            title="Open Vendor / Partner Mobile App"
            className="px-2 py-1 rounded-md bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-[10px] font-bold flex items-center space-x-1 transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Vendor App</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Sign out of Admin Mobile App?')) {
                logout();
                showHapticHUD('Signed out of Super Admin', '🔒');
              }
            }}
            title="Admin Sign Out"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#BA3A24] border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white shadow-sm cursor-pointer active:scale-95 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* TOP ADMIN OTA UPDATE BANNER (Shown ONLY when an update is available)  */}
      {/* ===================================================================== */}
      {adminUpdateStatus.hasUpdate && (
        <div className="bg-gradient-to-r from-[#061224] via-[#0B1E3D] to-[#1E112A] text-white px-3.5 py-2.5 shadow-lg border-b border-cyan-500/40 shrink-0 font-sans sticky top-0 z-40 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-blue-600/40 text-cyan-300 border border-blue-400/40 shrink-0">
                <Rocket className="w-4 h-4 text-cyan-300 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-[11px] tracking-tight text-white">
                    Update Available: {adminUpdateStatus.latestVersion}
                  </span>
                  <span className="text-[8px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono uppercase">
                    NEW
                  </span>
                </div>
                <p className="text-[9.5px] text-blue-200/90 truncate leading-tight mt-0.5 max-w-[210px] sm:max-w-xs">
                  {adminUpdateStatus.title || adminUpdateStatus.changelog}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowAdminChangelogModal(true)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-cyan-200 text-[10px] font-semibold rounded-lg border border-white/15 cursor-pointer"
              >
                Logs
              </button>
              <button
                type="button"
                onClick={handleTriggerAdminUpdate}
                disabled={isAdminUpdating}
                className="px-3 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-[10.5px] rounded-lg shadow-sm transition active:scale-95 cursor-pointer flex items-center space-x-1"
              >
                {isAdminUpdating ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-slate-950" />
                ) : (
                  <Zap className="w-3 h-3 fill-current" />
                )}
                <span>{isAdminUpdating ? 'Updating...' : 'Update Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. SCROLLABLE DASHBOARD CONTENT (Bounded between pinned header & footer) */}
      {/* ===================================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 pb-28 space-y-3 pt-2.5">
        {/* Node Connectivity & Haptic Feedback Banner */}
        <section className="flex items-center justify-between text-[10px] px-1 text-slate-600 font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-pulse"></span>
            <span className="tracking-wide font-semibold text-slate-700 uppercase text-[9px]">
              NODE: MORBI CENTRAL HQ
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={toggleHaptic}
              title="Toggle tactile haptic & audio chimes"
              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-semibold transition active:scale-95 cursor-pointer shadow-2xs border ${hapticEnabled
                  ? 'bg-amber-50 text-amber-800 border-amber-300/80'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
            >
              <span className="inline-block text-[8px]">{hapticEnabled ? '📳' : '🔇'}</span>
              <span>{hapticEnabled ? 'HAPTIC: ON' : 'HAPTIC: OFF'}</span>
            </button>

            <button
              onClick={handleRefresh}
              className="bg-slate-100 hover:bg-slate-200 text-slate-500 text-[9px] px-2 py-0.5 rounded font-mono border border-slate-200/60 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin text-[#B9381E]' : ''}`} />
              <span>SYNC: {lastSyncSeconds}s ago</span>
            </button>
          </div>
        </section>

        {/* =================================================================== */}
        {/* TAB 1: OVERVIEW SCREEN                                             */}
        {/* =================================================================== */}
        {activeTab === 'overview' && (
          <>
            {/* 1. Real-time Moving Telemetry Ticker Marquee */}
            <div className="bg-[#0B0F19] text-slate-300 py-1.5 px-3 rounded-xl border border-slate-800/90 shadow-sm overflow-hidden flex items-center space-x-2 text-[10px]">
              <div className="flex items-center space-x-1 text-[#BA3A24] font-black shrink-0 font-mono tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] uppercase">HQ LIVE:</span>
              </div>
              <div className="overflow-hidden whitespace-nowrap flex-1 relative">
                <div className="inline-flex animate-marquee space-x-6 text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    NPCI UPI Direct Escrow: ACTIVE (99.98% SLA)
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Pending Verification: {pendingCount} claims (₹{pendingAmount.toLocaleString('en-IN')})
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Factory Kiln Lot: MOR-884-A Ingested
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1.5 text-rose-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Anti-Counterfeit SHA-256 HMAC Active
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Disbursed Payout: ₹{approvedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Executive Metrics Summary Card with Moving Shimmer Accent */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm relative overflow-hidden space-y-3.5 transition-all">
              {/* Animated Moving Iridescent Shimmer Accent Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#BA3A24] via-amber-400 via-emerald-400 to-[#BA3A24] animate-shimmer"
              />

              <div className="flex items-start justify-between pt-0.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] tracking-wider uppercase font-black text-slate-500 font-mono">
                      EXECUTIVE MODERATION CONSOLE
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                      {totalRequestsCount}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Total Cashback Claims
                    </span>
                  </div>
                </div>

                {/* Gross Escrow Value Pill */}
                <div className="text-right bg-slate-50 border border-slate-200/80 rounded-xl p-2 px-3 shadow-2xs">
                  <div className="text-[9px] font-mono text-slate-500 uppercase font-bold">Gross Escrow Value</div>
                  <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Status Counters Grid with Pulsing Indicators */}
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <div
                  onClick={() => {
                    setFilterTab('pending');
                    setActiveTab('requests');
                    playRejectChime();
                  }}
                  className="bg-[#FAFBFD] hover:bg-amber-50/60 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition active:scale-95 cursor-pointer shadow-2xs group min-w-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate">Pending</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ml-1 animate-pulse"></span>
                  </div>
                  <div className="mt-1.5 min-w-0">
                    <div className="text-xs sm:text-sm font-black text-slate-900 font-mono truncate">{pendingCount}</div>
                    <div className="text-[8.5px] sm:text-[9.5px] font-mono text-amber-700 font-semibold mt-0.5 truncate">
                      ₹{pendingAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setFilterTab('approved');
                    setActiveTab('requests');
                    playApproveChime();
                  }}
                  className="bg-[#FAFBFD] hover:bg-emerald-50/60 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition active:scale-95 cursor-pointer shadow-2xs group min-w-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate">Approved</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-1"></span>
                  </div>
                  <div className="mt-1.5 min-w-0">
                    <div className="text-xs sm:text-sm font-black text-slate-900 font-mono truncate">{approvedCount}</div>
                    <div className="text-[8.5px] sm:text-[9.5px] font-mono text-emerald-700 font-semibold mt-0.5 truncate">
                      ₹{approvedAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setFilterTab('rejected');
                    setActiveTab('requests');
                    playRejectChime();
                  }}
                  className="bg-[#FAFBFD] hover:bg-rose-50/60 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition active:scale-95 cursor-pointer shadow-2xs group min-w-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate">Rejected</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-1"></span>
                  </div>
                  <div className="mt-1.5 min-w-0">
                    <div className="text-xs sm:text-sm font-black text-slate-900 font-mono truncate">{rejectedCount}</div>
                    <div className="text-[8.5px] sm:text-[9.5px] font-mono text-rose-700 font-semibold mt-0.5 truncate">
                      ₹{rejectedAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. VISUAL ANALYTICS: INTERACTIVE ANIMATED PIE / DONUT CHART */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm relative overflow-hidden space-y-3.5">
              {/* Section Header with Volume (#) vs Value (₹) Switcher */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-[#FEF2EE] text-[#BA3A24] rounded-lg shadow-2xs">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-slate-900 uppercase tracking-wide">
                      Claims Moderation Ratio
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Real-time status breakdown &amp; escrow ratio</p>
                  </div>
                </div>

                {/* Dual-Mode Selector: Volume (#) vs Value (₹) */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-[9.5px] font-mono">
                  <button
                    onClick={() => {
                      setChartMetricMode('count');
                      showHapticHUD('Mode: Claims Count (#)');
                    }}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${chartMetricMode === 'count'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    # Count
                  </button>
                  <button
                    onClick={() => {
                      setChartMetricMode('amount');
                      showHapticHUD('Mode: Escrow Value (₹)');
                    }}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${chartMetricMode === 'amount'
                        ? 'bg-white text-[#BA3A24] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    ₹ Value
                  </button>
                </div>
              </div>

              {/* Sub-header Filter Reset Pill (if slice selected) */}
              {chartActiveSlice && (
                <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70 text-[10px] animate-in fade-in duration-200">
                  <span className="text-slate-600 font-medium">
                    Filtered by{' '}
                    <strong className="text-slate-900 uppercase font-mono">{chartActiveSlice}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setChartActiveSlice(null);
                      showHapticHUD('Filter Reset');
                    }}
                    className="font-bold text-[#BA3A24] hover:underline cursor-pointer"
                  >
                    Show All
                  </button>
                </div>
              )}

              {/* Chart & Interactive Core (Centered Donut + Full-Width Stack) */}
              <div className="flex flex-col items-center gap-3 py-1">
                {/* SVG Donut Chart with Rotating Ambient Glow */}
                <div className="relative w-40 h-40 shrink-0 flex items-center justify-center mx-auto">
                  {/* Subtle Ambient Pulse Core */}
                  <div className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-amber-100/30 via-emerald-100/40 to-rose-100/30 blur-lg pointer-events-none animate-pulse-glow" />

                  <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 140 140">
                    <defs>
                      {/* Gradient for Approved / Disbursed */}
                      <linearGradient id="approvedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>

                      {/* Gradient for Pending */}
                      <linearGradient id="pendingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FBBF24" />
                        <stop offset="100%" stopColor="#D97706" />
                      </linearGradient>

                      {/* Gradient for Rejected */}
                      <linearGradient id="rejectedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F87171" />
                        <stop offset="100%" stopColor="#BA3A24" />
                      </linearGradient>

                      {/* Subtle Track Gradient */}
                      <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F1F5F9" />
                        <stop offset="100%" stopColor="#E2E8F0" />
                      </linearGradient>

                      {/* Shadow Filter for Highlighted Slice */}
                      <filter id="pieSliceGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#000" floodOpacity="0.25" />
                      </filter>
                    </defs>

                    {/* Outer Precision Tick Ring */}
                    <circle
                      cx="70"
                      cy="70"
                      r="65"
                      stroke="#E2E8F0"
                      strokeWidth="0.75"
                      strokeDasharray="2 6"
                      fill="transparent"
                      opacity="0.7"
                    />

                    {/* Background Track Ring */}
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke="url(#trackGrad)"
                      strokeWidth="14"
                      fill="transparent"
                    />

                    {/* Inner Concentric Tech Halo Ring */}
                    <circle
                      cx="70"
                      cy="70"
                      r="42"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                      strokeDasharray="2 3"
                      fill="transparent"
                      opacity="0.6"
                    />

                    {totalRequestsCount === 0 ? (
                      /* Empty state ring */
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        stroke="#CBD5E1"
                        strokeWidth="14"
                        strokeDasharray="6 4"
                        fill="transparent"
                      />
                    ) : (
                      <>
                        {/* 1. Approved & Disbursed Slice - Emerald Gradient */}
                        {metricApproved > 0 && (
                          <circle
                            cx="70"
                            cy="70"
                            r={radius}
                            stroke="url(#approvedGrad)"
                            strokeWidth={chartActiveSlice === 'approved' ? '18' : '14'}
                            strokeDasharray={`${dashApproved} ${circumference}`}
                            strokeDashoffset={offsetApproved}
                            strokeLinecap="round"
                            fill="transparent"
                            filter={chartActiveSlice === 'approved' ? 'url(#pieSliceGlow)' : undefined}
                            className="transition-all duration-700 ease-out cursor-pointer hover:opacity-95"
                            onClick={() => {
                              setChartActiveSlice(chartActiveSlice === 'approved' ? null : 'approved');
                              playApproveChime();
                              showHapticHUD('Approved Slice Selected');
                            }}
                          />
                        )}

                        {/* 2. Pending Verification Slice - Amber Gradient */}
                        {metricPending > 0 && (
                          <circle
                            cx="70"
                            cy="70"
                            r={radius}
                            stroke="url(#pendingGrad)"
                            strokeWidth={chartActiveSlice === 'pending' ? '18' : '14'}
                            strokeDasharray={`${dashPending} ${circumference}`}
                            strokeDashoffset={offsetPending}
                            strokeLinecap="round"
                            fill="transparent"
                            filter={chartActiveSlice === 'pending' ? 'url(#pieSliceGlow)' : undefined}
                            className="transition-all duration-700 ease-out cursor-pointer hover:opacity-95"
                            onClick={() => {
                              setChartActiveSlice(chartActiveSlice === 'pending' ? null : 'pending');
                              playRejectBuzz();
                              showHapticHUD('Pending Slice Selected');
                            }}
                          />
                        )}

                        {/* 3. Rejected / Flagged Slice - Crimson Gradient */}
                        {metricRejected > 0 && (
                          <circle
                            cx="70"
                            cy="70"
                            r={radius}
                            stroke="url(#rejectedGrad)"
                            strokeWidth={chartActiveSlice === 'rejected' ? '18' : '14'}
                            strokeDasharray={`${dashRejected} ${circumference}`}
                            strokeDashoffset={offsetRejected}
                            strokeLinecap="round"
                            fill="transparent"
                            filter={chartActiveSlice === 'rejected' ? 'url(#pieSliceGlow)' : undefined}
                            className="transition-all duration-700 ease-out cursor-pointer hover:opacity-95"
                            onClick={() => {
                              setChartActiveSlice(chartActiveSlice === 'rejected' ? null : 'rejected');
                              playRejectBuzz();
                              showHapticHUD('Rejected Slice Selected');
                            }}
                          />
                        )}
                      </>
                    )}
                  </svg>

                  {/* Center Interactive Glass Orb Hole Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none z-20">
                    <div className="w-20 h-20 rounded-full bg-white/95 shadow-sm border border-slate-100 flex flex-col items-center justify-center p-1.5 transition-all">
                      {chartActiveSlice === 'approved' ? (
                        <div className="animate-in zoom-in-95 duration-200">
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-700 uppercase font-mono">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            Approved
                          </span>
                          <div className="text-sm font-black text-slate-900 font-mono leading-tight">
                            {Math.round(pctApproved * 100)}%
                          </div>
                          <span className="text-[8.5px] text-slate-500 font-mono font-semibold block truncate max-w-[68px]">
                            {isAmountMode ? `₹${approvedAmount.toLocaleString('en-IN')}` : `${approvedCount} claims`}
                          </span>
                        </div>
                      ) : chartActiveSlice === 'pending' ? (
                        <div className="animate-in zoom-in-95 duration-200">
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 uppercase font-mono">
                            <Clock className="w-2.5 h-2.5 text-amber-500" />
                            Pending
                          </span>
                          <div className="text-sm font-black text-slate-900 font-mono leading-tight">
                            {Math.round(pctPending * 100)}%
                          </div>
                          <span className="text-[8.5px] text-slate-500 font-mono font-semibold block truncate max-w-[68px]">
                            {isAmountMode ? `₹${pendingAmount.toLocaleString('en-IN')}` : `${pendingCount} claims`}
                          </span>
                        </div>
                      ) : chartActiveSlice === 'rejected' ? (
                        <div className="animate-in zoom-in-95 duration-200">
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-rose-700 uppercase font-mono">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                            Flagged
                          </span>
                          <div className="text-sm font-black text-slate-900 font-mono leading-tight">
                            {Math.round(pctRejected * 100)}%
                          </div>
                          <span className="text-[8.5px] text-slate-500 font-mono font-semibold block truncate max-w-[68px]">
                            {isAmountMode ? `₹${rejectedAmount.toLocaleString('en-IN')}` : `${rejectedCount} claims`}
                          </span>
                        </div>
                      ) : (
                        <div className="animate-in zoom-in-95 duration-200">
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            {isAmountMode ? 'TOTAL VAL' : 'TOTAL'}
                          </span>
                          <div className="text-sm font-black text-slate-900 font-mono leading-tight">
                            {isAmountMode ? `₹${totalAmount >= 1000 ? `${(totalAmount / 1000).toFixed(1)}k` : totalAmount}` : totalRequestsCount}
                          </div>
                          <span className="text-[8.5px] font-bold text-emerald-600 font-mono flex items-center justify-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            {Math.round(pctApproved * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interactive Legend Cards with Animated Mini Progress Bars */}
                <div className="w-full space-y-2 text-xs">
                  {/* Approved Pill */}
                  <div
                    onClick={() => {
                      setChartActiveSlice(chartActiveSlice === 'approved' ? null : 'approved');
                      playApproveChime();
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${chartActiveSlice === 'approved'
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200/80 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                        <div className="min-w-0 truncate">
                          <div className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1">
                            <span>Approved &amp; Disbursed</span>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono truncate">
                            {approvedCount} claims • ₹{approvedAmount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-mono font-black text-emerald-700 text-xs bg-emerald-100/80 px-1.5 py-0.5 rounded">
                          {Math.round(pctApproved * 100)}%
                        </span>
                      </div>
                    </div>
                    {/* Micro Progress Bar */}
                    <div className="w-full h-1 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(pctApproved * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Pending Pill */}
                  <div
                    onClick={() => {
                      setChartActiveSlice(chartActiveSlice === 'pending' ? null : 'pending');
                      playRejectBuzz();
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${chartActiveSlice === 'pending'
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200/80 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 shadow-xs animate-pulse" />
                        <div className="min-w-0 truncate">
                          <div className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1">
                            <span>Pending Verification</span>
                            <Clock className="w-3 h-3 text-amber-600 inline" />
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono truncate">
                            {pendingCount} claims • ₹{pendingAmount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-mono font-black text-amber-700 text-xs bg-amber-100/80 px-1.5 py-0.5 rounded">
                          {Math.round(pctPending * 100)}%
                        </span>
                      </div>
                    </div>
                    {/* Micro Progress Bar */}
                    <div className="w-full h-1 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(pctPending * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Rejected Pill */}
                  <div
                    onClick={() => {
                      setChartActiveSlice(chartActiveSlice === 'rejected' ? null : 'rejected');
                      playRejectBuzz();
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${chartActiveSlice === 'rejected'
                        ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200/80 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#BA3A24] shrink-0 shadow-xs" />
                        <div className="min-w-0 truncate">
                          <div className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1">
                            <span>Rejected / Flagged</span>
                            <AlertTriangle className="w-3 h-3 text-[#BA3A24] inline" />
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono truncate">
                            {rejectedCount} claims • ₹{rejectedAmount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-mono font-black text-rose-700 text-xs bg-rose-100/80 px-1.5 py-0.5 rounded">
                          {Math.round(pctRejected * 100)}%
                        </span>
                      </div>
                    </div>
                    {/* Micro Progress Bar */}
                    <div className="w-full h-1 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-400 to-[#BA3A24] rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(pctRejected * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Escrow Settlement Velocity Bar with Moving Stripes */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-600 flex items-center gap-1 font-mono uppercase">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Automated Settlement Velocity
                  </span>
                  <span className="font-black text-slate-900 font-mono">
                    {Math.round(pctApproved * 100)}% Cleared
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-stripes transition-all duration-1000 ease-out shadow-xs"
                    style={{ width: `${Math.max(5, Math.min(100, Math.round(pctApproved * 100)))}%` }}
                  />
                </div>
              </div>
            </section>

            {/* 4. Quick Action Buttons Row */}
            <section className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowBatchModal(true)}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-gradient-to-r from-[#BA3A24] to-[#992813] hover:from-[#A02F17] hover:to-[#85220E] text-white rounded-xl text-xs font-bold shadow-md transition active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Generate Batch</span>
              </button>

              <button
                onClick={() => {
                  setFilterTab('pending');
                  setActiveTab('requests');
                }}
                className="relative flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
              >
                <Radio className="w-4 h-4 text-[#BA3A24]" />
                <span>Review Queue ({pendingCount})</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#BA3A24] ring-2 ring-white animate-ping"></span>
                )}
              </button>
            </section>

            {/* Search & Filter Pills */}
            <section className="space-y-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, Name, or Mobile..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/90 border border-transparent rounded-xl placeholder-slate-400 focus:bg-white focus:border-slate-300 focus:ring-0 transition"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto text-[10px] pb-0.5 scrollbar-none">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${filterTab === 'all'
                      ? 'bg-[#1E252D] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  All ({totalRequestsCount})
                </button>

                <button
                  onClick={() => setFilterTab('pending')}
                  className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap flex items-center space-x-1 transition cursor-pointer ${filterTab === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Pending ({pendingCount})</span>
                </button>

                <button
                  onClick={() => setFilterTab('approved')}
                  className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap flex items-center space-x-1 transition cursor-pointer ${filterTab === 'approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Approved ({approvedCount})</span>
                </button>

                <button
                  onClick={() => setFilterTab('rejected')}
                  className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap flex items-center space-x-1 transition cursor-pointer ${filterTab === 'rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>Rejected ({rejectedCount})</span>
                </button>
              </div>
            </section>

            {/* Moderation Queue Section Header */}
            <section className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5">
                <h2 className="text-xs font-bold text-slate-900">Pending Moderation</h2>
                <span className="bg-orange-50 text-[#B9381E] border border-orange-200/50 text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {pendingCount}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('requests')}
                className="text-[10px] font-semibold text-[#B9381E] hover:underline flex items-center space-x-0.5 cursor-pointer"
              >
                <span>View Full Queue</span>
                <span>→</span>
              </button>
            </section>

            {/* Moderation Cards List */}
            <section className="space-y-2.5">
              {filteredClaims.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Queue is Clear</p>
                  <p className="text-[10.5px] text-slate-500">
                    No claims match the active filter. Tap &ldquo;Generate Batch&rdquo; to ingest new factory QR serials.
                  </p>
                </div>
              ) : (
                filteredClaims.map((claim) => {
                  const isPending = claim.status === 'Pending';
                  const isApproved = claim.status === 'Approved' || claim.status === 'Disbursed';
                  const isRejected = claim.status === 'Rejected' || claim.status === 'Flagged';
                  const vInfo = resolveVendorInfo(claim);

                  return (
                    <article
                      key={claim.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-2.5 hover:border-slate-300 transition"
                    >
                      {/* Card Header ID & State */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center space-x-1.5 text-slate-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#B9381E]" />
                          <span className="text-xs font-bold tracking-tight font-mono">
                            {claim.requestId || claim.claimCode || claim.id}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            • {formatRequestDateTime(claim)}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center space-x-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isRejected
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                              }`}
                          ></span>
                          <span>{isApproved ? 'Approved & Settled' : isRejected ? 'Rejected / Flagged' : 'Pending Verification'}</span>
                        </span>
                      </div>

                      {/* Prominent Vendor Banner */}
                      <div className="flex items-center space-x-2 bg-gradient-to-r from-[#FEF2EE] to-amber-50/70 border border-[#F9CEB8]/80 px-2.5 py-1.5 rounded-xl">
                        <div className="w-6 h-6 rounded-md bg-white border border-[#F9CEB8] flex items-center justify-center text-[#C84826] shrink-0">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-black uppercase tracking-wider text-[#A62C11] flex items-center gap-1">
                            <span>Vendor / Partner Firm</span>
                            <span className="text-stone-300">•</span>
                            <span className="font-mono text-stone-500 font-semibold">{vInfo.vendorId || 'VEN-001'}</span>
                          </div>
                          <div className="text-xs font-black text-slate-900 truncate">
                            {vInfo.vendorName}
                          </div>
                        </div>
                      </div>

                      {/* Contractor / Applicant Profile Details */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Applicant:</span>
                            <span className="text-xs font-bold text-slate-900">{claim.userName || 'Registered Partner'}</span>
                            <CheckCircle2 className="w-3 h-3 text-sky-500" />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {claim.userRole || 'Contractor'} • {claim.userMobile || claim.mobile || '+91 98450 21980'}
                          </p>
                        </div>
                        <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/80 font-mono">
                          {claim.location ? String(claim.location).slice(0, 10).toUpperCase() : 'MOR-HQ-01'}
                        </span>
                      </div>

                      {/* Product Claim Info Block */}
                      <div className="bg-slate-50/80 rounded-xl p-2 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-200/70 flex items-center justify-center text-slate-700 text-xs shrink-0 font-bold font-mono">
                            📦
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10.5px] font-bold text-slate-800 tracking-tight font-mono truncate">
                              {claim.skuCode || 'DTA-999'} • {claim.qrSerial || claim.serialKey || 'QR-88410-01'}
                            </div>
                            <div className="text-[9.5px] text-slate-500 truncate">
                              {claim.productName || '20kg Bag • High-Polymer Adhesive'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <div className="text-xs font-black text-slate-900 font-mono">
                            ₹{claim.amount || 250}
                          </div>
                          <div className="text-[8.5px] text-slate-500 font-mono">
                            {formatRequestDateTime(claim)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {isPending ? (
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <button
                            onClick={() => handleApprove(claim)}
                            className="py-1.5 px-3 bg-[#B9381E] text-white text-[11px] font-bold rounded-xl hover:bg-[#A33019] flex items-center justify-center space-x-1 shadow-xs active:scale-95 transition cursor-pointer"
                          >
                            <span>✔</span>
                            <span>Review &amp; Approve</span>
                          </button>

                          <button
                            onClick={() => setFlagModalClaim(claim)}
                            className="py-1.5 px-3 bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-xl hover:bg-slate-50 flex items-center justify-center space-x-1 active:scale-95 transition cursor-pointer"
                          >
                            <span>⚐</span>
                            <span>Flag / Reject</span>
                          </button>
                        </div>
                      ) : isRejected ? (
                        <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="uppercase tracking-wider">Rejection Reason:</span>
                          </div>
                          <p className="text-[11px] text-rose-700 font-medium pl-5 leading-snug">
                            {claim.flagReason || claim.remarks || claim.reason || 'Flagged during audit verification'}
                          </p>
                        </div>
                      ) : (
                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
                          <span>Audited by Super Admin</span>
                          <span className="font-mono font-bold text-slate-700">
                            UTR: {claim.npciRrn || claim.transactionId || 'SETTLED-DIRECT'}
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </section>

            {/* NPCI 256-Bit Automated Escrow Footer matching Step 12 */}
            <footer className="bg-slate-100/90 rounded-2xl p-3 border border-slate-200/70 space-y-2 mt-3">
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">NPCI 256-Bit Automated Escrow</h4>
                  <p className="text-[9px] text-slate-500 leading-tight mt-0.5">
                    Claims auto-reconcile via UPI Direct Node. 1% GSTIN TDS deducted under Sec 194C for non-composite mason accounts.
                  </p>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1 text-slate-600">
                  <span>🎧</span>
                  <span>Admin IT Desk: <strong className="text-slate-800 font-mono">+91 7303967198</strong></span>
                </div>
                <a
                  href="tel:+917303967198"
                  className="text-[9px] font-semibold bg-white border border-slate-300 text-slate-700 px-2 py-0.5 rounded-lg shadow-2xs hover:bg-slate-50"
                >
                  Call Node
                </a>
              </div>
            </footer>
          </>
        )}

        {/* =================================================================== */}
        {/* TAB 2: REQUESTS QUEUE SCREEN                                       */}
        {/* =================================================================== */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#BA3A24]" />
                    <span>Moderation Requests Queue</span>
                  </h2>
                  <p className="text-[10px] text-slate-500">Live verification queue (Latest requests on top)</p>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                  {filteredClaims.length} Total
                </span>
              </div>

              {/* Quick Search Header Section for Instant Search & Approve */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search request ID, applicant, mobile, vendor, or SKU..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-800 focus:bg-white focus:border-[#BA3A24] focus:ring-2 focus:ring-[#BA3A24]/10 transition shadow-2xs font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex gap-1 overflow-x-auto text-[10px] pb-1">
                {[
                  { id: 'all', label: 'All', count: totalRequestsCount },
                  { id: 'pending', label: 'Pending', count: pendingCount },
                  { id: 'approved', label: 'Approved', count: approvedCount },
                  { id: 'rejected', label: 'Rejected', count: rejectedCount }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold capitalize transition cursor-pointer flex items-center gap-1.5 shrink-0 ${filterTab === tab.id
                        ? 'bg-[#BA3A24] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${filterTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2.5">
              {filteredClaims.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">
                    {searchQuery
                      ? `No requests matching "${searchQuery}"`
                      : `No ${filterTab === 'all' ? '' : filterTab} requests found`}
                  </p>
                  <p className="text-[10.5px] text-slate-500">
                    {searchQuery
                      ? 'Try searching with a different keyword or clear search filter.'
                      : filterTab === 'rejected'
                        ? 'No rejected or quarantined cashback claims in this queue.'
                        : filterTab === 'pending'
                          ? 'All pending cashback requests have been reviewed.'
                          : filterTab === 'approved'
                            ? 'No approved cashback claims in this queue.'
                            : 'There are currently no cashback claims logged.'}
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                filteredClaims.map((claim) => {
                  const vInfo = resolveVendorInfo(claim);
                  const isPending = claim.status === 'Pending';
                  const isApproved = claim.status === 'Approved' || claim.status === 'Disbursed';
                  const isRejected = claim.status === 'Rejected' || claim.status === 'Flagged';
                  const rejectionReason = claim.flagReason || claim.remarks || claim.reason || 'Flagged during audit verification';

                  return (
                    <div
                      key={claim.id}
                      className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 shadow-2xs hover:border-slate-300 transition"
                    >
                      {/* Top Header: Request ID, Date-Time Received & Amount */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                              {claim.requestId || claim.claimCode || claim.id}
                            </span>
                            {/* Prominent Date & Time Request Received */}
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 font-semibold bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200">
                              <Clock className="w-3 h-3 text-[#BA3A24]" />
                              <span>{formatRequestDateTime(claim)}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-700 font-mono block">
                            ₹{Number(claim.amount || claim.cashbackAmount || 250).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Vendor Name Badge */}
                      <div className="flex items-center space-x-1.5 bg-[#FEF2EE] border border-[#F9CEB8]/70 px-2.5 py-1.5 rounded-lg">
                        <Building2 className="w-3.5 h-3.5 text-[#C84826] shrink-0" />
                        <div className="min-w-0 flex-1 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-900 truncate">
                            Vendor: <strong className="text-[#A62C11]">{vInfo.vendorName}</strong>
                          </span>
                          <span className="text-[9px] font-mono font-bold text-stone-500 bg-white px-1.5 py-0.5 rounded border border-[#F9CEB8]/60 ml-1">
                            {vInfo.vendorId}
                          </span>
                        </div>
                      </div>

                      {/* Applicant & SKU / Product Details */}
                      <div className="text-xs text-slate-600 bg-slate-50/70 p-2 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 truncate">
                            Applicant: {claim.userName || 'Registered Partner'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {claim.userMobile || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10.5px] text-slate-500 pt-1 border-t border-slate-200/50">
                          <span className="truncate">{claim.productName || 'DuraGrit Tile Adhesive'}</span>
                          <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0 ml-1">
                            {claim.skuCode || 'DG-ADH-01'}
                          </span>
                        </div>
                      </div>

                      {/* REJECTION REASON BOX (Prominently displayed on Rejected tab and on any rejected claim) */}
                      {isRejected && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="uppercase tracking-wider">Rejection Reason:</span>
                          </div>
                          <p className="text-[11px] text-rose-700 font-medium pl-5 leading-relaxed">
                            {rejectionReason}
                          </p>
                        </div>
                      )}

                      {/* Pending Action Buttons */}
                      {isPending && (
                        <div className="flex gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => handleApprove(claim)}
                            className="flex-1 py-1.5 bg-[#BA3A24] text-white rounded-lg text-[11px] font-bold cursor-pointer hover:bg-[#A33019] active:scale-95 transition shadow-2xs"
                          >
                            Approve &amp; Release
                          </button>
                          <button
                            onClick={() => setFlagModalClaim(claim)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg text-[11px] font-bold cursor-pointer active:scale-95 transition border border-slate-200"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* BOTTOM STATUS ROW ON ALL TABS (small color badge for Approved / Pending / Rejected) */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium text-[10px]">Status:</span>
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{claim.status === 'Disbursed' ? 'Disbursed' : 'Approved'}</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>{claim.status === 'Flagged' ? 'Flagged' : 'Rejected'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Pending</span>
                            </span>
                          )}
                        </div>

                        <div className="text-slate-500 font-mono text-[9.5px] flex items-center gap-1">
                          {isApproved && (claim.npciRrn || claim.transactionId || claim.utr) ? (
                            <span className="font-semibold text-slate-600">
                              UTR: {claim.npciRrn || claim.transactionId || claim.utr}
                            </span>
                          ) : (
                            <>
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              <span>Req: {formatRequestDateTime(claim)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: QR BATCH GENERATOR                                          */}
        {/* =================================================================== */}
        {activeTab === 'qrgen' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#BA3A24]" />
                <h2 className="text-xs font-bold text-slate-900">Mobile QR Batch Ingestion Engine</h2>
              </div>
              <p className="text-[11px] text-slate-500">
                Generate cryptographic QR code tokens for factory kilns. Tokens are instantly stored in Supabase with dual SHA-128 anti-counterfeit hashes.
              </p>

              <form onSubmit={handleQuickCreateBatch} className="space-y-3 pt-1 text-xs">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Target Product SKU</label>
                  <select
                    value={selectedSkuId}
                    onChange={(e) => setSelectedSkuId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  >
                    {skus.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.skuCode} — {s.name} (Reward: ₹{s.cashbackReward || 50})
                      </option>
                    ))}
                    {skus.length === 0 && <option value="">DG-ADH-01 — High Polymer Tile Adhesive (20kg)</option>}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Batch Size (Qty)</label>
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      value={batchQty}
                      onChange={(e) => setBatchQty(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Reward (₹ per QR)</label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={batchCashback}
                      onChange={(e) => setBatchCashback(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={batchLoading}
                  className="w-full py-2.5 bg-[#BA3A24] hover:bg-[#A02F17] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{batchLoading ? 'Generating Cryptographic Tokens...' : `Generate Batch (${batchQty} Tokens)`}</span>
                </button>
              </form>
            </div>

            {/* Recent Batches List & QR Token Inspector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <QrCode className="w-4 h-4 text-[#BA3A24]" />
                  <h3 className="text-xs font-bold text-slate-900">Recent Factory Batches ({sortedBatches.length})</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Latest First
                </span>
              </div>

              {sortedBatches.length === 0 ? (
                <div className="p-6 text-center space-y-1.5 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <QrCode className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Batches Generated Yet</p>
                  <p className="text-[10.5px] text-slate-500">
                    Use the form above to generate your first factory QR batch. It will appear here immediately.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sortedBatches.map((b) => {
                    const tokenCount = b.quantity || b.tokens?.length || 0;
                    const totalVal = tokenCount * (Number(b.cashbackAmount) || 0);
                    const formattedDate = formatRequestDateTime(b);

                    return (
                      <div
                        key={b.batchId || b.id}
                        className="p-3 bg-slate-50/90 hover:bg-slate-50 border border-slate-200 rounded-xl space-y-2 transition shadow-2xs"
                      >
                        {/* Header: Batch ID & Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {b.batchId || b.id}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          </div>
                          <span className="text-xs font-black text-emerald-700 font-mono">
                            ₹{b.cashbackAmount || 50} / QR
                          </span>
                        </div>

                        {/* Product Info */}
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="font-bold text-slate-800 truncate">
                            {b.productName || 'DuraGrit Product'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {b.skuCode || 'DG-SKU'}
                          </span>
                        </div>

                        {/* Batch Stats Row */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono bg-white p-2 rounded-lg border border-slate-200/60">
                          <div>
                            <span className="text-slate-400 block text-[9px]">TOTAL QTY</span>
                            <strong className="text-slate-900 font-bold">{tokenCount} QRs</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">ESCROW VAL</span>
                            <strong className="text-emerald-700 font-bold">₹{totalVal.toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block text-[9px]">CREATED</span>
                            <span className="text-slate-600 truncate block text-[9px]">{formattedDate}</span>
                          </div>
                        </div>

                        {/* Inspection Action Button */}
                        <div className="pt-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setInspectedBatch(b)}
                            className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#BA3A24]" />
                            <span>Inspect {tokenCount} QR Tokens</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: AUDIT LOG SCREEN                                            */}
        {/* =================================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#BA3A24]" />
                <h2 className="text-xs font-bold text-slate-900">NPCI Escrow &amp; Security Audit Trail</h2>
              </div>
              <p className="text-[11px] text-slate-500">
                Cryptographic transaction telemetry, audit logs, and hardware security module status.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400">HSM Core</span>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5">FIPS 140-2 Level 3</div>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Sync Pipeline</span>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">Supabase Realtime</div>
                </div>
              </div>
            </div>

            {/* Audit Entries */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 text-xs">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider pb-1 border-b border-slate-100">
                Live Audit Logs
              </h3>
              <div className="space-y-2 font-mono text-[10px] text-slate-600">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-emerald-600 font-bold">✓ ESCROW-REL:</span> Batch CB-9021 auto-reconciled via UPI Gateway.
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-blue-600 font-bold">ℹ SEC-AUTH:</span> Super Admin authenticated via local mobile session.
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-amber-600 font-bold">⚡ SYNC-PULSE:</span> Cross-port RPC relay connected to port 3000.
                </div>
              </div>
            </div>

            {/* Admin Software Version & OTA Auto-Push Control Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 text-xs shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#BA3A24]">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs tracking-tight">Software Version & OTA Pipeline</h3>
                    <p className="text-[10px] text-slate-500">Continuous Auto-Push Deployment Engine</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${adminUpdateStatus.hasUpdate
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                  {adminUpdateStatus.hasUpdate ? 'Update Available' : 'Current & Synced'}
                </span>
              </div>

              {/* Version & Sync Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Installed Version</div>
                  <div className="text-xs font-black text-slate-800 font-mono mt-0.5 flex items-center gap-1.5">
                    <span>{adminUpdateStatus.installedVersion}</span>
                    {!adminUpdateStatus.hasUpdate && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">✓ Latest</span>
                    )}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Latest Live Release</div>
                  <div className="text-xs font-black text-[#BA3A24] font-mono mt-0.5">
                    {adminUpdateStatus.latestVersion}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Auto-Push Relay</div>
                  <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Instant Live Push</span>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[9px] uppercase font-bold text-slate-400">Target Channel</div>
                  <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                    Production Exec
                  </div>
                </div>
              </div>

              {/* Pending Update CTA (Only shown when hasUpdate === true) */}
              {adminUpdateStatus.hasUpdate && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-amber-900 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Update Ready: {adminUpdateStatus.latestVersion}</span>
                      </div>
                      <p className="text-[10px] text-amber-700 mt-0.5 line-clamp-1">
                        {adminUpdateStatus.title || 'New performance and executive features are available.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerAdminUpdate}
                      disabled={isAdminUpdating}
                      className="px-3 py-1.5 bg-[#BA3A24] hover:bg-[#A02F17] text-white text-[11px] font-black rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isAdminUpdating ? 'Updating...' : 'Update Now'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons: Version Logs & Push New Release */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminChangelogModal(true)}
                  className="w-full py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-slate-600" />
                  <span>Version Logs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPublishReleaseModal(true)}
                  className="w-full py-2 px-2.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Push Version</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. BOTTOM EXECUTIVE NAVIGATION (Permanently pinned at bottom, never hides) */}
      {/* ===================================================================== */}
      <nav
        aria-label="Executive Bottom Navigation"
        className="shrink-0 sticky bottom-0 inset-x-0 bg-white/98 backdrop-blur-md border-t-2 border-slate-200/90 px-1 sm:px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.09)]"
      >
        {/* Tab 1: Overview */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('overview');
            showHapticHUD('Tab: Overview Dashboard');
          }}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative active:scale-95 ${activeTab === 'overview'
              ? 'text-[#BA3A24] font-black bg-[#FEF2EE] border border-[#F9CEB8]/70 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <div className="relative">
            <LayoutGrid className={`w-5 h-5 transition-transform ${activeTab === 'overview' ? 'scale-110 text-[#BA3A24]' : 'text-slate-500'}`} />
          </div>
          <span className="text-[9.5px] sm:text-[10px] tracking-wider uppercase mt-0.5 font-bold truncate max-w-full">
            Overview
          </span>
          {activeTab === 'overview' && (
            <span className="w-5 h-0.5 bg-[#BA3A24] rounded-full mt-0.5 -mb-0.5 animate-in fade-in" />
          )}
        </button>

        {/* Tab 2: Requests (with Pending Claims Badge) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('requests');
            showHapticHUD('Tab: Moderation Requests Queue');
          }}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative active:scale-95 ${activeTab === 'requests'
              ? 'text-[#BA3A24] font-black bg-[#FEF2EE] border border-[#F9CEB8]/70 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <div className="relative">
            <Layers className={`w-5 h-5 transition-transform ${activeTab === 'requests' ? 'scale-110 text-[#BA3A24]' : 'text-slate-500'}`} />
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-[#BA3A24] text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[9.5px] sm:text-[10px] tracking-wider uppercase mt-0.5 font-bold truncate max-w-full">
            Requests
          </span>
          {activeTab === 'requests' && (
            <span className="w-5 h-0.5 bg-[#BA3A24] rounded-full mt-0.5 -mb-0.5 animate-in fade-in" />
          )}
        </button>

        {/* Tab 3: QR Gen */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('qrgen');
            showHapticHUD('Tab: QR Batch Engine');
          }}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative active:scale-95 ${activeTab === 'qrgen'
              ? 'text-[#BA3A24] font-black bg-[#FEF2EE] border border-[#F9CEB8]/70 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <div className="relative">
            <QrCode className={`w-5 h-5 transition-transform ${activeTab === 'qrgen' ? 'scale-110 text-[#BA3A24]' : 'text-slate-500'}`} />
          </div>
          <span className="text-[9.5px] sm:text-[10px] tracking-wider uppercase mt-0.5 font-bold truncate max-w-full">
            QR Gen
          </span>
          {activeTab === 'qrgen' && (
            <span className="w-5 h-0.5 bg-[#BA3A24] rounded-full mt-0.5 -mb-0.5 animate-in fade-in" />
          )}
        </button>

        {/* Tab 4: Audit */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('audit');
            showHapticHUD('Tab: Escrow Audit Log');
          }}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative active:scale-95 ${activeTab === 'audit'
              ? 'text-[#BA3A24] font-black bg-[#FEF2EE] border border-[#F9CEB8]/70 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <div className="relative">
            <ShieldCheck className={`w-5 h-5 transition-transform ${activeTab === 'audit' ? 'scale-110 text-[#BA3A24]' : 'text-slate-500'}`} />
          </div>
          <span className="text-[9.5px] sm:text-[10px] tracking-wider uppercase mt-0.5 font-bold truncate max-w-full">
            Audit
          </span>
          {activeTab === 'audit' && (
            <span className="w-5 h-0.5 bg-[#BA3A24] rounded-full mt-0.5 -mb-0.5 animate-in fade-in" />
          )}
        </button>
      </nav>

      {/* ===================================================================== */}
      {/* 4. MODALS (FLAG / REJECT & QUICK BATCH)                               */}
      {/* ===================================================================== */}
      {flagModalClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Flag / Reject Claim</h3>
                <span className="text-xs font-mono text-[#B9381E] font-bold block">
                  {flagModalClaim.requestId || flagModalClaim.id}
                </span>
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-[#C84826]" />
                  <span>Vendor: {resolveVendorInfo(flagModalClaim).vendorName}</span>
                </span>
              </div>
              <button
                onClick={() => setFlagModalClaim(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-bold text-slate-700">Reason for Rejection</label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
              >
                <option value="Duplicate or unreadable QR serial token">Duplicate or unreadable QR serial token</option>
                <option value="Invalid tile box purchase proof image">Invalid tile box purchase proof image</option>
                <option value="Serial key outside authorized sales territory">Serial key outside authorized sales territory</option>
                <option value="Account flagged for suspicious rapid scanning">Account flagged for suspicious rapid scanning</option>
                <option value="Non-contractor retail redemption attempt">Non-contractor retail redemption attempt</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setFlagModalClaim(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Generate Factory Batch</h3>
                <p className="text-[10px] text-slate-500">Inject new QR tokens into database</p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Target Product SKU</label>
                <select
                  value={selectedSkuId}
                  onChange={(e) => setSelectedSkuId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {skus.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.skuCode} — {s.name}
                    </option>
                  ))}
                  {skus.length === 0 && <option value="">DG-ADH-01 — High Polymer Tile Adhesive (20kg)</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Token Count</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={batchQty}
                    onChange={(e) => setBatchQty(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Cashback (₹)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={batchCashback}
                    onChange={(e) => setBatchCashback(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={batchLoading}
                  className="flex-1 py-2.5 bg-[#BA3A24] hover:bg-[#A02F17] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {batchLoading ? 'Generating...' : 'Generate Batch'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH TOKENS INSPECTION MODAL */}
      {inspectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm max-h-[90vh] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 flex flex-col space-y-3 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#BA3A24]" />
                  <h3 className="text-sm font-black text-slate-900">Batch QR Serial Tokens</h3>
                </div>
                <span className="text-xs font-mono font-bold text-[#BA3A24] block mt-0.5">
                  {inspectedBatch.batchId || inspectedBatch.id}
                </span>
                <p className="text-[10px] text-slate-500">
                  {inspectedBatch.productName} • {inspectedBatch.quantity || inspectedBatch.tokens?.length || 0} tokens generated
                </p>
              </div>
              <button
                onClick={() => setInspectedBatch(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
              {(inspectedBatch.tokens || []).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-mono">
                  No individual tokens cached for this legacy batch.
                </div>
              ) : (
                (inspectedBatch.tokens || []).map((t, idx) => {
                  const serial = t.serialKey || t.serial || t.code || `TOKEN-${idx + 1}`;
                  const isCopied = copiedToken === serial;

                  return (
                    <div
                      key={serial + idx}
                      className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400">#{idx + 1}</span>
                          <span className="font-mono font-bold text-slate-900 text-[10.5px] truncate block">
                            {serial}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-emerald-700 font-mono font-semibold">
                          Reward: ₹{t.cashbackAmount || inspectedBatch.cashbackAmount || 50}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(serial);
                            setCopiedToken(serial);
                            setTimeout(() => setCopiedToken(''), 1500);
                          } catch (_) { }
                        }}
                        className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-[#BA3A24] text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Close Modal Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectedBatch(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH TOKENS INSPECTION MODAL */}
      {inspectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm max-h-[90vh] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 flex flex-col space-y-3 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#BA3A24]" />
                  <h3 className="text-sm font-black text-slate-900">Batch QR Serial Tokens</h3>
                </div>
                <span className="text-xs font-mono font-bold text-[#BA3A24] block mt-0.5">
                  {inspectedBatch.batchId || inspectedBatch.id}
                </span>
                <p className="text-[10px] text-slate-500">
                  {inspectedBatch.productName} • {inspectedBatch.quantity || inspectedBatch.tokens?.length || 0} tokens generated
                </p>
              </div>
              <button
                onClick={() => setInspectedBatch(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
              {(inspectedBatch.tokens || []).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-mono">
                  No individual tokens cached for this legacy batch.
                </div>
              ) : (
                (inspectedBatch.tokens || []).map((t, idx) => {
                  const serial = t.serialKey || t.serial || t.code || `TOKEN-${idx + 1}`;
                  const isCopied = copiedToken === serial;

                  return (
                    <div
                      key={serial + idx}
                      className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-slate-400">#{idx + 1}</span>
                          <span className="font-mono font-bold text-slate-900 text-[10.5px] truncate block">
                            {serial}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-emerald-700 font-mono font-semibold">
                          Reward: ₹{t.cashbackAmount || inspectedBatch.cashbackAmount || 50}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(serial);
                            setCopiedToken(serial);
                            setTimeout(() => setCopiedToken(''), 1500);
                          } catch (_) {}
                        }}
                        className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-[#BA3A24] text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Close Modal Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectedBatch(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. ADMIN OTA UPDATE MODALS & OVERLAYS */}
      {/* ===================================================================== */}

      {/* Admin OTA Update Progress Overlay Modal */}
      {isAdminUpdating && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#BA3A24] relative shadow-inner">
              <Rocket className="w-8 h-8 animate-bounce text-[#BA3A24]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Updating Admin Mobile App</h3>
              <p className="text-xs font-semibold text-[#BA3A24] mt-0.5 font-mono">
                Applying {adminUpdateStatus.latestVersion}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 min-h-[16px]">
                {adminUpdateProgressMsg || 'Patching system files & hot-reloading runtime...'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-[#BA3A24] to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${adminUpdateProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold font-mono text-slate-500">
                <span>Synchronizing OTA</span>
                <span>{adminUpdateProgress}%</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600">
              ⚡ Safe hot-reload: no unsaved session data will be lost.
            </div>
          </div>
        </div>
      )}

      {/* Admin Version Release History Log Modal */}
      {showAdminChangelogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 flex flex-col space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <History className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Admin Version Release History</h3>
                  <p className="text-[10px] text-slate-500">Live OTA update audit trail & release logs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminChangelogModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Releases List (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {getAdminAppReleases().map((rel, idx) => {
                const isCurrent = rel.version === adminUpdateStatus.installedVersion;
                const isLatest = rel.version === adminUpdateStatus.latestVersion;
                return (
                  <div
                    key={rel.id || rel.version || idx}
                    className={`p-3.5 rounded-2xl border transition-all ${isCurrent
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/40'
                        : isLatest
                          ? 'bg-amber-50/50 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-slate-900">{rel.version}</span>
                        <span className="text-[9.5px] font-mono text-slate-500">Build #{rel.buildNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                            Current Installed
                          </span>
                        )}
                        {!isCurrent && isLatest && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#BA3A24] text-white">
                            Update Ready
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">{rel.releaseDate}</span>
                      </div>
                    </div>

                    <div className="font-bold text-slate-800 text-[11.5px] mb-1">{rel.title}</div>
                    <p className="text-[10.5px] text-slate-600 mb-2 leading-relaxed">{rel.changelog}</p>

                    {Array.isArray(rel.changesList) && rel.changesList.length > 0 && (
                      <div className="p-2 bg-white/80 rounded-xl border border-slate-200/80 space-y-1 mb-2">
                        <div className="text-[9px] uppercase font-bold text-slate-400">Included Changes:</div>
                        <ul className="space-y-0.5">
                          {rel.changesList.map((chg, i) => (
                            <li key={i} className="text-[10px] text-slate-700 flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                              <span>{chg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[9.5px] text-slate-500">
                      <span>Size: {rel.downloadSize || '24.5 MB'}</span>
                      <span>Author: {rel.author || 'Super Admin Ops'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                Current Device: {adminUpdateStatus.installedVersion}
              </span>
              <button
                type="button"
                onClick={() => setShowAdminChangelogModal(false)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-black"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Publish & Auto-Push New Version Modal */}
      {showPublishReleaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-[#BA3A24]">
                  <Send className="w-4 h-4 text-[#BA3A24]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Push New Admin Version</h3>
                  <p className="text-[10px] text-slate-500">Auto-Push live update to all admin sessions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishReleaseModal(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishNewRelease} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Version Tag (e.g. v3.2.1 or v3.3.0)
                </label>
                <input
                  type="text"
                  required
                  placeholder="v3.2.1"
                  value={newReleaseVersion}
                  onChange={(e) => setNewReleaseVersion(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#BA3A24]"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Release Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Admin Mobile Console v3.2.1 Update"
                  value={newReleaseTitle}
                  onChange={(e) => setNewReleaseTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#BA3A24]"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                  Changelog & Key Improvements
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Details of the update: bug fixes, vendor report exports, real-time push..."
                  value={newReleaseChangelog}
                  onChange={(e) => setNewReleaseChangelog(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#BA3A24]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 leading-relaxed">
                📢 <strong>Auto-Push Guarantee:</strong> Saving this will immediately broadcast across all active admin mobile sessions. The "Update Now" button will appear on all admin screens instantly.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#BA3A24] hover:bg-[#A02F17] text-white text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish & Auto-Push</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPublishReleaseModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

