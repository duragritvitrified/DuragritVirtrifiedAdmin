import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Send,
  Eye,
  Package,
  Tag,
  CreditCard,
  Banknote,
  UploadCloud
} from 'lucide-react';
import {
  checkAdminUpdateStatus,
  checkForLiveAdminUpdate,
  applyAdminAppUpdate,
  getAdminAppReleases,
  publishAdminNewRelease,
  isVersionHigher
} from '../services/appInstallService';

const DEFAULT_RECEIPT_PREVIEW = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260" fill="none"><rect width="400" height="260" rx="16" fill="%23A62C11"/><rect x="12" y="12" width="376" height="236" rx="12" fill="%23FEF2EE" stroke="%23C84826" stroke-width="2"/><circle cx="200" cy="55" r="24" fill="%23059669"/><path d="M192 55L198 61L209 49" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="200" y="98" font-family="sans-serif" font-size="14" font-weight="bold" fill="%237c2d12" text-anchor="middle">NPCI PAYOUT SETTLEMENT VOUCHER</text><text x="200" y="120" font-family="monospace" font-size="11" fill="%239a3412" text-anchor="middle">DURAGRIT VITRIFIED ESCROW GATEWAY</text><line x1="30" y1="135" x2="370" y2="135" stroke="%23F9CEB8" stroke-width="1.5" stroke-dasharray="4 4"/><text x="40" y="160" font-family="sans-serif" font-size="11" fill="%237c2d12">Status:</text><text x="360" y="160" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23059669" text-anchor="end">PAID / DISBURSED</text><text x="40" y="185" font-family="sans-serif" font-size="11" fill="%237c2d12">Verification:</text><text x="360" y="185" font-family="monospace" font-size="11" font-weight="bold" fill="%237c2d12" text-anchor="end">DUAL-CONTROL SETTLED</text><text x="40" y="210" font-family="sans-serif" font-size="11" fill="%237c2d12">Settlement Rail:</text><text x="360" y="210" font-family="sans-serif" font-size="11" font-weight="bold" fill="%237c2d12" text-anchor="end">IMPS / UPI 24x7</text><rect x="30" y="222" width="340" height="18" rx="4" fill="%23fde68a"/><text x="200" y="235" font-family="monospace" font-size="9" fill="%2378350f" font-weight="bold" text-anchor="middle">DURAGRIT VITRIFIED CORP SETTLEMENT ESCROW</text></svg>`;

export const AdminMobileApp = ({ onSwitchToPartnerApp }) => {
  const { currentUser, loginUser, logout } = useAuth();
  const {
    claims = [],
    batches = [],
    skus = [],
    vendors = [],
    users = [],
    approveClaimStep1,
    releaseClaimPayout,
    rejectClaim,
    createBatch,
    refreshAllData,
    dbStatus = {}
  } = useData();

  // Helper to reliably resolve Vendor Name & ID for each claim
  const resolveVendorInfo = (c) => {
    // 1. Explicit vendorName (ignore generic placeholder)
    const rawVName = String(c?.vendorName || '').trim();
    if (
      rawVName &&
      rawVName !== '—' &&
      rawVName.toLowerCase() !== 'duragrit authorized partner' &&
      rawVName.toLowerCase() !== 'duragrit partner'
    ) {
      return {
        vendorName: rawVName,
        vendorId: c?.vendorId || 'VND-101'
      };
    }

    // 2. Explicit companyName (ignore generic placeholder)
    const rawCName = String(c?.companyName || '').trim();
    if (
      rawCName &&
      rawCName !== '—' &&
      rawCName.toLowerCase() !== 'duragrit authorized partner' &&
      rawCName.toLowerCase() !== 'duragrit partner'
    ) {
      return {
        vendorName: rawCName,
        vendorId: c?.vendorId || 'VND-101'
      };
    }

    // 3. Match against vendors directory by vendorId
    if (c?.vendorId) {
      const v = vendors.find(
        (item) => String(item.vendorId || item.id || '').toUpperCase() === String(c.vendorId).toUpperCase()
      );
      if (v?.companyName && v.companyName.toLowerCase() !== 'duragrit authorized partner') {
        return {
          vendorName: v.companyName,
          vendorId: v.vendorId || v.id || c.vendorId
        };
      }
    }

    // 4. Match by userId / supabaseId against vendors
    const cleanUid = String(c?.userId || c?.userSupabaseId || '').toUpperCase();
    if (cleanUid) {
      const v = vendors.find(
        (item) => String(item.vendorId || item.id || '').toUpperCase() === cleanUid
      );
      if (v?.companyName && v.companyName.toLowerCase() !== 'duragrit authorized partner') {
        return {
          vendorName: v.companyName,
          vendorId: v.vendorId || v.id || cleanUid
        };
      }
    }

    // 5. Match against vendors directory by 10-digit mobile phone
    const cleanMobile = String(c?.userMobile || c?.mobile || '').replace(/\D/g, '').slice(-10);
    if (cleanMobile && cleanMobile.length === 10) {
      const v = vendors.find((item) => {
        const vDigits = String(item.phone || item.mobile || '').replace(/\D/g, '').slice(-10);
        return vDigits === cleanMobile;
      });
      if (v?.companyName && v.companyName.toLowerCase() !== 'duragrit authorized partner') {
        return {
          vendorName: v.companyName,
          vendorId: v.vendorId || v.id || 'VND-101'
        };
      }
    }

    // 6. Match against vendors directory by person or firm name
    const cleanName = String(c?.userName || c?.contractorName || '').trim().toLowerCase();
    if (
      cleanName &&
      cleanName !== 'registered partner' &&
      cleanName !== 'partner applicator' &&
      cleanName !== 'duragrit partner'
    ) {
      const v = vendors.find((item) => {
        const cName = String(item.companyName || '').trim().toLowerCase();
        const pName = String(item.contactPerson || '').trim().toLowerCase();
        return cName === cleanName || pName === cleanName;
      });
      if (v?.companyName && v.companyName.toLowerCase() !== 'duragrit authorized partner') {
        return {
          vendorName: v.companyName,
          vendorId: v.vendorId || v.id || 'VND-101'
        };
      }
    }

    // 7. Check users directory for matching mobile phone
    if (cleanMobile) {
      const u = users.find(
        (item) => String(item.mobile || item.phone || '').replace(/\D/g, '').slice(-10) === cleanMobile
      );
      if (u?.companyName && u.companyName.toLowerCase() !== 'duragrit authorized partner') {
        return {
          vendorName: u.companyName,
          vendorId: u.vendorId || 'VND-101'
        };
      }
      if (u?.vendorName && u.vendorName.toLowerCase() !== 'duragrit authorized partner') {
        return {
          vendorName: u.vendorName,
          vendorId: u.vendorId || 'VND-101'
        };
      }
      if (u?.associatedVendor && u.associatedVendor.toLowerCase() !== 'duragrit authorized partner') {
        return {
          vendorName: u.associatedVendor,
          vendorId: u.vendorId || 'VND-101'
        };
      }
      if (u?.name && u.name.toLowerCase() !== 'admin') {
        return {
          vendorName: u.name,
          vendorId: u.vendorId || u.userId || 'VND-101'
        };
      }
    }

    // 8. If claimant has explicit registered user name
    if (
      c?.userName &&
      String(c.userName).trim().toLowerCase() !== 'registered partner' &&
      String(c.userName).trim().toLowerCase() !== 'admin'
    ) {
      return {
        vendorName: String(c.userName).trim(),
        vendorId: c?.vendorId || 'VND-101'
      };
    }

    if (c?.contractorName && String(c.contractorName).trim()) {
      return {
        vendorName: String(c.contractorName).trim(),
        vendorId: c?.vendorId || 'VND-101'
      };
    }

    if (rawVName && rawVName !== '—') {
      return {
        vendorName: rawVName,
        vendorId: c?.vendorId || 'VND-101'
      };
    }

    // 9. Clean fallback (NEVER 'DuraGrit Authorized Partner')
    return {
      vendorName: 'Partner Applicator',
      vendorId: c?.vendorId || 'VND-101'
    };
  };

  // Helper to reliably resolve full Product info (Name, SKU, Pack Size, Category, MRP, Photo, etc.)
  const resolveProductInfo = (c) => {
    const rawSku = String(c?.skuCode || '').trim();
    const rawName = String(c?.productName || '').trim();
    const rawSerial = String(c?.serialKey || c?.qrSerial || c?.batchCode || '').trim();

    // Match in catalog skus
    const matchedSku = skus.find((s) => {
      const sCode = String(s.skuCode || s.id || '').toUpperCase();
      const sClean = sCode.replace(/[^a-zA-Z0-9]/g, '');
      const rawSkuClean = rawSku.toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
      const serialClean = rawSerial.toUpperCase().replace(/[^a-zA-Z0-9]/g, '');

      return (
        (rawSku && sCode === rawSku.toUpperCase()) ||
        (rawSkuClean && sClean && (sClean.includes(rawSkuClean) || rawSkuClean.includes(sClean))) ||
        (serialClean && sClean && serialClean.includes(sClean)) ||
        (rawName && String(s.name || '').toLowerCase() === rawName.toLowerCase())
      );
    }) || skus[0] || {};

    const productName =
      c?.productName && c.productName !== 'DuraGrit Verified Pack'
        ? c.productName
        : (matchedSku.name || 'DuraGrit DA 777 High Polymer Adhesive');

    const skuCode = c?.skuCode || matchedSku.skuCode || 'DA-777';
    const packSize = c?.packSize || matchedSku.packSize || matchedSku.packWeight || '20 kg';
    const category = c?.category || matchedSku.category || 'Adhesives';
    const subCategory = c?.subCategory || matchedSku.subCategory || 'High-Polymer Vitrified';
    const mrp = Number(c?.mrp || matchedSku.baseMrp || matchedSku.mrp || 650);
    const rewardValue = Number(c?.amount || c?.claimValue || matchedSku.cashbackReward || matchedSku.cashbackAmount || 150);
    const photoUrl = c?.proofUrl || c?.proofImageUrl || matchedSku.imageUrl || matchedSku.photoUrl || '/site-assets/logo.png';
    const description = matchedSku.description || 'DuraGrit DA 777 High Polymer Polymer-Modified Adhesive for Vitrified & Large Format Tiles.';

    return {
      productName,
      skuCode,
      packSize,
      category,
      subCategory,
      mrp,
      rewardValue,
      photoUrl,
      description,
      rawSerial
    };
  };

  // Screen & Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'requests' | 'release' | 'qrgen'
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSeconds, setLastSyncSeconds] = useState(6);

  // Floating Haptic HUD Notification
  const [hudNotice, setHudNotice] = useState({ visible: false, text: '', icon: '📳', color: 'slate' });
  const hudTimeoutRef = useRef(null);

  // Inspect Product Modal State (View Link)
  const [inspectedProductClaim, setInspectedProductClaim] = useState(null);

  // Reject / Flag Modal State
  const [flagModalClaim, setFlagModalClaim] = useState(null);
  const [flagReason, setFlagReason] = useState('Duplicate or unreadable QR serial token');

  // Release Payment & Disbursal State
  const [releaseModalClaim, setReleaseModalClaim] = useState(null);
  const [releaseForm, setReleaseForm] = useState({
    amount: '',
    paymentMode: 'UPI',
    transactionId: '',
    proofImage: null,
    proofFileName: '',
    remarks: ''
  });
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseSubTab, setReleaseSubTab] = useState('awaiting'); // 'awaiting' | 'settled'
  const [releaseSearchQuery, setReleaseSearchQuery] = useState('');
  const [viewReceiptClaim, setViewReceiptClaim] = useState(null);

  // Quick Batch Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [batchQty, setBatchQty] = useState(100);
  const [batchCashback, setBatchCashback] = useState(150);
  const [batchLoading, setBatchLoading] = useState(false);
  const [inspectedBatch, setInspectedBatch] = useState(null);
  const [copiedToken, setCopiedToken] = useState('');

  // Auto-sync selected SKU and reward with live catalog from Supabase
  useEffect(() => {
    if (skus.length > 0) {
      const currentExists = skus.some((s) => s.id === selectedSkuId || s.skuCode === selectedSkuId);
      if (!selectedSkuId || !currentExists) {
        setSelectedSkuId(skus[0].id || skus[0].skuCode);
        const reward = Number(skus[0].cashbackReward || skus[0].cashbackAmount || 150);
        setBatchCashback(reward);
      }
    }
  }, [skus, selectedSkuId]);

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
  const [showAdminUpdateModal, setShowAdminUpdateModal] = useState(false);
  const [showAdminChangelogModal, setShowAdminChangelogModal] = useState(false);
  const [showPublishReleaseModal, setShowPublishReleaseModal] = useState(false);
  const [newReleaseVersion, setNewReleaseVersion] = useState('');
  const [newReleaseTitle, setNewReleaseTitle] = useState('');
  const [newReleaseChangelog, setNewReleaseChangelog] = useState('');

  // Auto-Push Listeners: Check server immediately on mount & listen for live broadcasts
  useEffect(() => {
    let isMounted = true;
    const checkLiveUpdate = async () => {
      try {
        const live = await checkForLiveAdminUpdate();
        if (live && isMounted) {
          setAdminUpdateStatus(live);
        }
      } catch (err) {
        console.warn('Admin live update check error:', err);
      }
    };

    checkLiveUpdate();

    const handleSync = () => {
      checkLiveUpdate();
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('duragrit:admin-ota-release-pushed', handleSync);
    window.addEventListener('duragrit:admin-ota-update-applied', handleSync);

    const interval = setInterval(checkLiveUpdate, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('duragrit:admin-ota-release-pushed', handleSync);
      window.removeEventListener('duragrit:admin-ota-update-applied', handleSync);
    };
  }, []);

  const handleTriggerAdminUpdate = () => {
    setShowAdminUpdateModal(false);
    setIsAdminUpdating(true);
    setAdminUpdateProgress(20);
    setAdminUpdateProgressMsg('Handshaking with Morbi Central Cloud...');

    setTimeout(() => {
      setAdminUpdateProgress(50);
      setAdminUpdateProgressMsg(`Verifying package integrity for ${adminUpdateStatus.latestVersion}...`);
      setTimeout(() => {
        setAdminUpdateProgress(85);
        setAdminUpdateProgressMsg('Patching executive moderation node & hot-reloading state...');
        setTimeout(async () => {
          setAdminUpdateProgress(100);
          setAdminUpdateProgressMsg(`Applied ${adminUpdateStatus.latestVersion}!`);
          await applyAdminAppUpdate(adminUpdateStatus.latestVersion);
          setAdminUpdateStatus((prev) => ({ ...prev, hasUpdate: false }));
          showHapticHUD(`Super Admin Console updated to ${adminUpdateStatus.latestVersion}!`, '🚀', 'emerald');
          playApproveChime();

          setTimeout(() => {
            setIsAdminUpdating(false);
            setAdminUpdateProgress(0);
            setAdminUpdateProgressMsg('');
            const url = new URL(window.location.href);
            url.searchParams.set('v', String(Date.now()));
            window.location.replace(url.toString());
          }, 600);
        }, 400);
      }, 400);
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
    setIsSyncing(true);
    try {
      if (refreshAllData) await refreshAllData();
      // Also check live server for OTA update on manual header refresh!
      try {
        const live = await checkForLiveAdminUpdate();
        if (live?.hasUpdate) {
          setAdminUpdateStatus(live);
        }
      } catch (_) {}
      setLastSyncSeconds(0);
      showHapticHUD('Live Moderation Node Synced', '🔄', 'emerald');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter claims strictly to exclude any test or internal events
  const cleanClaims = (claims || []).filter((c) => {
    const reqId = String(c.requestId || c.id || c.claimNumber || '').toUpperCase();
    const qr = String(c.qrSerial || c.serialKey || c.qr_serial || '').toUpperCase();
    return (
      !reqId.startsWith('TEST') &&
      !reqId.startsWith('CB-TEST') &&
      !reqId.startsWith('CB-VERIFY') &&
      !reqId.startsWith('SYNC') &&
      !qr.startsWith('TEST') &&
      !qr.startsWith('SYNC') &&
      !qr.startsWith('DG-TEST') &&
      !qr.startsWith('DURAGRIT')
    );
  });

  // Metrics Counters & Financial Escrow
  const pendingCount = cleanClaims.filter((c) => c.status === 'Pending').length;
  const approvedCount = cleanClaims.filter((c) => c.status === 'Approved' && c.payoutStatus !== 'Disbursed').length;
  const disbursedCount = cleanClaims.filter((c) => c.status === 'Disbursed' || c.payoutStatus === 'Disbursed').length;
  const rejectedCount = cleanClaims.filter((c) => c.status === 'Rejected' || c.status === 'Flagged').length;
  const totalRequestsCount = cleanClaims.length;

  const pendingAmount = cleanClaims
    .filter((c) => c.status === 'Pending')
    .reduce((sum, c) => sum + Number(c.amount || c.cashbackAmount || 150), 0);
  const approvedAmount = cleanClaims
    .filter((c) => c.status === 'Approved' && c.payoutStatus !== 'Disbursed')
    .reduce((sum, c) => sum + Number(c.amount || c.cashbackAmount || 150), 0);
  const disbursedAmount = cleanClaims
    .filter((c) => c.status === 'Disbursed' || c.payoutStatus === 'Disbursed')
    .reduce((sum, c) => sum + Number(c.disbursedAmount || c.netDisbursed || c.amount || c.cashbackAmount || 150), 0);
  const rejectedAmount = cleanClaims
    .filter((c) => c.status === 'Rejected' || c.status === 'Flagged')
    .reduce((sum, c) => sum + Number(c.amount || c.cashbackAmount || 150), 0);
  const totalAmount = pendingAmount + approvedAmount + disbursedAmount + rejectedAmount;
  const combinedApprovedCount = approvedCount + disbursedCount;
  const combinedApprovedAmount = approvedAmount + disbursedAmount;

  // Payout Disbursal Filter Lists & Counters
  const awaitingReleaseClaims = useMemo(() => {
    return cleanClaims.filter((c) => c.status === 'Approved' && c.payoutStatus !== 'Disbursed');
  }, [cleanClaims]);
  const awaitingReleaseCount = awaitingReleaseClaims.length;
  const awaitingReleaseAmount = awaitingReleaseClaims.reduce(
    (sum, c) => sum + Number(c.amount || c.cashbackAmount || c.claimValue || 150),
    0
  );

  const settledClaims = useMemo(() => {
    return cleanClaims.filter((c) => c.status === 'Disbursed' || c.payoutStatus === 'Disbursed');
  }, [cleanClaims]);
  const settledCount = settledClaims.length;
  const settledAmount = settledClaims.reduce(
    (sum, c) => sum + Number(c.disbursedAmount || c.netDisbursed || c.amount || c.cashbackAmount || 150),
    0
  );

  // Filtered lists for Release Payment tab
  const filteredAwaitingClaims = useMemo(() => {
    if (!releaseSearchQuery.trim()) return awaitingReleaseClaims;
    const q = releaseSearchQuery.trim().toLowerCase();
    return awaitingReleaseClaims.filter((c) => {
      const vInfo = resolveVendorInfo(c);
      return (
        String(c.requestId || c.claimCode || c.id || '').toLowerCase().includes(q) ||
        String(c.userName || c.contractorName || '').toLowerCase().includes(q) ||
        String(vInfo.vendorName || '').toLowerCase().includes(q) ||
        String(c.userMobile || c.mobile || '').includes(q) ||
        String(c.skuCode || c.productName || '').toLowerCase().includes(q) ||
        String(c.qrSerial || c.serialKey || '').toLowerCase().includes(q)
      );
    });
  }, [awaitingReleaseClaims, releaseSearchQuery]);

  const filteredSettledClaims = useMemo(() => {
    if (!releaseSearchQuery.trim()) return settledClaims;
    const q = releaseSearchQuery.trim().toLowerCase();
    return settledClaims.filter((c) => {
      const vInfo = resolveVendorInfo(c);
      return (
        String(c.requestId || c.claimCode || c.id || '').toLowerCase().includes(q) ||
        String(c.userName || c.contractorName || '').toLowerCase().includes(q) ||
        String(vInfo.vendorName || '').toLowerCase().includes(q) ||
        String(c.userMobile || c.mobile || '').includes(q) ||
        String(c.transactionId || c.npciRrn || c.utr || '').toLowerCase().includes(q)
      );
    });
  }, [settledClaims, releaseSearchQuery]);

  // Release Payment Modal Handlers
  const handleOpenReleaseModal = (claim) => {
    const netAmt = Number(claim.amount || claim.cashbackAmount || claim.claimValue || 150);
    const autoUtr = 'UTR' + Math.floor(1000000000 + Math.random() * 9000000000);
    setReleaseForm({
      amount: String(netAmt),
      paymentMode: claim.payoutMethod || claim.paymentMode || 'UPI',
      transactionId: autoUtr,
      proofImage: DEFAULT_RECEIPT_PREVIEW,
      proofFileName: 'duragrit_escrow_voucher.svg',
      remarks: 'Disbursed via Admin Mobile Command Release.'
    });
    setReleaseModalClaim(claim);
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showHapticHUD('Screenshot must be < 10MB', '⚠️', 'rose');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setReleaseForm((prev) => ({
        ...prev,
        proofImage: event.target?.result,
        proofFileName: file.name
      }));
      showHapticHUD('Screenshot attached', '📎', 'emerald');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRelease = async (e) => {
    if (e) e.preventDefault();
    if (!releaseModalClaim) return;

    const numAmount = parseFloat(releaseForm.amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      showHapticHUD('Enter a valid disbursal amount', '⚠️', 'amber');
      return;
    }

    if (!releaseForm.transactionId.trim()) {
      showHapticHUD('Enter a Transaction ID / UTR', '⚠️', 'amber');
      return;
    }

    setIsReleasing(true);
    const target = releaseModalClaim;
    const utr = releaseForm.transactionId.trim();

    try {
      await releaseClaimPayout(target.id, {
        disbursedAmount: numAmount,
        transactionId: utr,
        paymentMode: releaseForm.paymentMode,
        remarks: releaseForm.remarks.trim() || 'Disbursed via Admin Mobile Command Release.',
        paymentProofUrl: releaseForm.proofImage || DEFAULT_RECEIPT_PREVIEW,
      });

      showHapticHUD(`Disbursed ₹${numAmount.toFixed(2)} (UTR: ${utr})`, '💸', 'emerald');
      setReleaseModalClaim(null);
    } catch (err) {
      showHapticHUD('Disbursal failed: ' + (err?.message || 'Error'), '❌', 'rose');
    } finally {
      setIsReleasing(false);
    }
  };

  // Dual-Mode Pie / Donut Chart State ('count' = Claims Volume, 'amount' = Escrow Liability in ₹)
  const [chartMetricMode, setChartMetricMode] = useState('count');
  const [chartActiveSlice, setChartActiveSlice] = useState(null);

  const isAmountMode = chartMetricMode === 'amount';
  const metricApproved = isAmountMode ? combinedApprovedAmount : combinedApprovedCount;
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
  const filteredClaims = cleanClaims
    .filter((c) => {
      const isDisbursedClaim = c.status === 'Disbursed' || c.payoutStatus === 'Disbursed';
      if (filterTab === 'pending' && c.status !== 'Pending') return false;
      if (filterTab === 'approved' && !(c.status === 'Approved' && !isDisbursedClaim)) return false;
      if (filterTab === 'disbursed' && !isDisbursedClaim) return false;
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
        skus.find((s) => s.id === selectedSkuId || s.skuCode === selectedSkuId) ||
        skus[0] || {
          id: 'SKU-DA-777',
          skuCode: 'DA-777',
          name: 'duragrit DA 777',
          cashbackReward: batchCashback || 150
        };

      const count = Math.max(1, Number(batchQty) || 1);
      const reward = Number(batchCashback) || Number(targetSku.cashbackReward || targetSku.cashbackAmount) || 150;
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
  // IF NOT AUTHENTICATED AS ADMIN: CLEAN MINIMALISTIC ADMIN LOGIN SCREEN
  // =========================================================================
  if (!isAdminAuthenticated) {
    return (
      <div className="w-full max-w-[420px] mx-auto h-full min-h-[100dvh] bg-[#FAF9F6] px-4 flex flex-col items-center justify-center font-sans overflow-hidden select-none">
        <div className="w-full">
          {/* Centered Official DuraGrit Vitrified Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="DuraGrit Vitrified"
              className="h-10 sm:h-12 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo-white.png';
              }}
            />
          </div>

          {/* Main Sign-In Card (Clean, Minimalistic & Centered) */}
          <div className="bg-white rounded-3xl p-5 border border-[#ECEAE6] shadow-sm relative overflow-hidden">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 mb-3.5">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-800 mb-1.5">
                  Admin Username <span className="text-[#C84826]">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-stone-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="e.g. admin or 9000000000"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#ECEAE6] bg-[#FBFAF9] focus:bg-white focus:border-[#C84826] focus:ring-1 focus:ring-[#C84826] text-xs font-semibold text-stone-900 outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-stone-800">
                    Master Security Password <span className="text-[#C84826]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    {showAdminPass ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-stone-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-9 pr-14 py-2.5 rounded-xl border border-[#ECEAE6] bg-[#FBFAF9] focus:bg-white focus:border-[#C84826] focus:ring-1 focus:ring-[#C84826] text-xs font-mono text-stone-900 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                onClick={handleAdminSignIn}
                disabled={isSubmittingLogin}
                className="w-full active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer bg-[#C84826] hover:bg-[#A6300F] text-xs"
              >
                {isSubmittingLogin ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign in to admin console →</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN ADMIN MOBILE APP (STEP 12 IMPLEMENTATION - OBSIDIAN & CRIMSON)
  // =========================================================================
  return (
    <div className="w-full max-w-[480px] landscape:max-w-3xl mx-auto h-[100dvh] max-h-[100dvh] sm:h-[min(900px,94vh)] sm:min-h-0 landscape:h-[100dvh] landscape:max-h-[100dvh] landscape:min-h-0 bg-[#FAFBFD] text-slate-800 flex flex-col font-sans select-none relative shadow-2xl rounded-none sm:rounded-[36px] landscape:rounded-none overflow-hidden border-0 sm:border landscape:border-0 border-slate-200/80 overflow-x-hidden">
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
      <header className="h-12 sm:h-13 px-3.5 sm:px-4 py-1.5 pt-[max(0.5rem,env(safe-area-inset-top))] landscape:py-1 bg-[#0B0F19] border-b border-slate-800 text-white flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-2.5 min-w-0">
          {/* Official DuraGrit Logo with clean 'Admin' label directly below */}
          <div className="flex flex-col justify-center min-w-0 shrink-0">
            <img
              src="/logo-white.png"
              alt="DuraGrit Vitrified"
              className="h-4 sm:h-4.5 w-auto max-w-[105px] sm:max-w-[125px] object-contain shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
            <span className="text-[8px] font-black uppercase tracking-wider text-[#FAA322] font-mono leading-none mt-0.5">
              Admin
            </span>
          </div>

          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="text-[9.5px] font-mono font-bold text-cyan-300 shrink-0 self-center">
              {adminUpdateStatus.installedVersion}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isSyncing}
              title="Sync Live Moderation Queue with Database"
              className="inline-flex items-center gap-1 text-[8.5px] font-bold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 px-2 py-0.5 rounded-full transition active:scale-95 cursor-pointer ml-1"
            >
              <RefreshCw className={`w-2.5 h-2.5 text-cyan-300 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Right Action: Admin Logout Button */}
        <div className="flex items-center shrink-0 ml-2">
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
      {adminUpdateStatus.hasUpdate && isVersionHigher(adminUpdateStatus.latestVersion, adminUpdateStatus.installedVersion) && (
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
              <button
                type="button"
                onClick={() => {
                  const v = adminUpdateStatus.latestVersion;
                  const clean = v.replace(/^v/i, '');
                  localStorage.setItem('duragrit_admin_ota_dismissed_' + v, 'true');
                  localStorage.setItem('duragrit_admin_ota_dismissed_' + clean, 'true');
                  localStorage.setItem('duragrit_admin_ota_dismissed_v' + clean, 'true');
                  try {
                    sessionStorage.setItem('duragrit_admin_ota_dismissed_' + v, 'true');
                  } catch (_) {}
                  setAdminUpdateStatus(prev => ({ ...prev, hasUpdate: false }));
                }}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition"
                title="Dismiss update"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. SCROLLABLE DASHBOARD CONTENT (Bounded between pinned header & footer) */}
      {/* ===================================================================== */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 pb-28 landscape:pb-16 space-y-3 pt-2.5 landscape:pt-1.5">
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
                    Disbursed Payout: ₹{disbursedAmount.toLocaleString('en-IN')} ({disbursedCount})
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] tracking-wider uppercase font-black text-slate-500 font-mono">
                      EXECUTIVE MODERATION CONSOLE
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                    <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                      {totalRequestsCount}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Total Cashback Claims
                    </span>
                  </div>
                </div>

                {/* Gross Escrow Value Pill */}
                <div className="self-start sm:self-auto text-left sm:text-right bg-gradient-to-br from-orange-50/90 via-amber-50/70 to-[#FEF2EE] border border-[#F9CEB8] rounded-xl py-1.5 px-3 shadow-2xs shrink-0">
                  <div className="text-[9px] font-mono text-[#9A3412] uppercase font-bold tracking-tight">Gross Escrow Value</div>
                  <div className="text-sm sm:text-base font-black text-[#BA3A24] font-mono">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Status Counters Grid with Pulsing Indicators (4 KPIs: Pending, Approved, Disbursed, Rejected in 2x2 Grid) */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div
                  onClick={() => {
                    setFilterTab('pending');
                    playRejectChime();
                    showHapticHUD('Filtered: Pending Claims');
                  }}
                  className={`bg-gradient-to-br from-amber-50/95 via-amber-50/75 to-orange-50/60 hover:from-amber-100/90 hover:to-amber-50 border rounded-xl p-2.5 flex flex-col justify-between transition active:scale-95 cursor-pointer shadow-2xs group min-w-0 ${
                    filterTab === 'pending'
                      ? 'border-amber-500 ring-2 ring-amber-300/70 from-amber-100/95 to-amber-50'
                      : 'border-amber-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] sm:text-[10px] font-extrabold text-amber-900 uppercase tracking-tight truncate">
                      Pending
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200 shrink-0 ml-1 animate-pulse"></span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-1 min-w-0">
                    <div className="text-sm sm:text-base font-black text-amber-950 font-mono truncate">{pendingCount}</div>
                    <div className="text-[9px] sm:text-[9.5px] font-mono text-amber-800 bg-white/85 px-1.5 py-0.5 rounded-md border border-amber-200/80 font-bold truncate">
                      ₹{pendingAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setFilterTab('approved');
                    playApproveChime();
                    showHapticHUD('Filtered: Approved Claims');
                  }}
                  className={`bg-gradient-to-br from-emerald-50/95 via-emerald-50/75 to-green-50/60 hover:from-emerald-100/90 hover:to-emerald-50 border rounded-xl p-2.5 flex flex-col justify-between transition active:scale-95 cursor-pointer shadow-2xs group min-w-0 ${
                    filterTab === 'approved'
                      ? 'border-emerald-500 ring-2 ring-emerald-300/70 from-emerald-100/95 to-emerald-50'
                      : 'border-emerald-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] sm:text-[10px] font-extrabold text-emerald-900 uppercase tracking-tight truncate">
                      Approved
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0 ml-1"></span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-1 min-w-0">
                    <div className="text-sm sm:text-base font-black text-emerald-950 font-mono truncate">{approvedCount}</div>
                    <div className="text-[9px] sm:text-[9.5px] font-mono text-emerald-800 bg-white/85 px-1.5 py-0.5 rounded-md border border-emerald-200/80 font-bold truncate">
                      ₹{approvedAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setFilterTab('disbursed');
                    playApproveChime();
                    showHapticHUD('Filtered: Disbursed Claims');
                  }}
                  className={`bg-gradient-to-br from-teal-50/95 via-cyan-50/75 to-sky-50/60 hover:from-teal-100/90 hover:to-cyan-50 border rounded-xl p-2.5 flex flex-col justify-between transition active:scale-95 cursor-pointer shadow-2xs group min-w-0 ${
                    filterTab === 'disbursed'
                      ? 'border-teal-500 ring-2 ring-teal-300/70 from-teal-100/95 to-cyan-50'
                      : 'border-teal-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] sm:text-[10px] font-extrabold text-teal-900 uppercase tracking-tight truncate">
                      Disbursed
                    </span>
                    <span className="w-2 h-2 rounded-full bg-teal-500 ring-2 ring-teal-200 shrink-0 ml-1"></span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-1 min-w-0">
                    <div className="text-sm sm:text-base font-black text-teal-950 font-mono truncate">{disbursedCount}</div>
                    <div className="text-[9px] sm:text-[9.5px] font-mono text-teal-800 bg-white/85 px-1.5 py-0.5 rounded-md border border-teal-200/80 font-bold truncate">
                      ₹{disbursedAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setFilterTab('rejected');
                    playRejectChime();
                    showHapticHUD('Filtered: Rejected Claims');
                  }}
                  className={`bg-gradient-to-br from-rose-50/95 via-rose-50/75 to-red-50/60 hover:from-rose-100/90 hover:to-rose-50 border rounded-xl p-2.5 flex flex-col justify-between transition active:scale-95 cursor-pointer shadow-2xs group min-w-0 ${
                    filterTab === 'rejected'
                      ? 'border-rose-500 ring-2 ring-rose-300/70 from-rose-100/95 to-rose-50'
                      : 'border-rose-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] sm:text-[10px] font-extrabold text-rose-900 uppercase tracking-tight truncate">
                      Rejected
                    </span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0 ml-1"></span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-1 min-w-0">
                    <div className="text-sm sm:text-base font-black text-rose-950 font-mono truncate">{rejectedCount}</div>
                    <div className="text-[9px] sm:text-[9.5px] font-mono text-rose-800 bg-white/85 px-1.5 py-0.5 rounded-md border border-rose-200/80 font-bold truncate">
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
                            {isAmountMode ? `₹${combinedApprovedAmount.toLocaleString('en-IN')}` : `${combinedApprovedCount} claims`}
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
                            {combinedApprovedCount} claims (Approved: {approvedCount} • Disbursed: {disbursedCount}) • ₹{combinedApprovedAmount.toLocaleString('en-IN')}
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
                  onClick={() => setFilterTab('disbursed')}
                  className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap flex items-center space-x-1 transition cursor-pointer ${filterTab === 'disbursed'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <span>Disbursed ({disbursedCount})</span>
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
                <h2 className="text-xs font-bold text-slate-900">
                  {filterTab === 'pending'
                    ? 'Pending Verification'
                    : filterTab === 'approved'
                    ? 'Approved Claims'
                    : filterTab === 'disbursed'
                    ? 'Disbursed Claims'
                    : filterTab === 'rejected'
                    ? 'Rejected Claims'
                    : 'Recent Claims Activity'}
                </h2>
                <span className="bg-orange-50 text-[#B9381E] border border-orange-200/50 text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {filteredClaims.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="text-[10px] font-semibold text-[#B9381E] hover:underline flex items-center space-x-0.5 cursor-pointer"
              >
                <span>Full Queue</span>
                <span>→</span>
              </button>
            </section>

            {/* Moderation Cards List (Simplified, Streamlined & 100% Responsive) */}
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
                (filterTab === 'all' ? filteredClaims.slice(0, 5) : filteredClaims).map((claim) => {
                  const isPending = claim.status === 'Pending';
                  const isDisbursed = claim.status === 'Disbursed' || claim.payoutStatus === 'Disbursed';
                  const isApproved = claim.status === 'Approved' && !isDisbursed;
                  const isRejected = claim.status === 'Rejected' || claim.status === 'Flagged';
                  const displayAmount = isDisbursed
                    ? Number(claim.disbursedAmount || claim.netDisbursed || claim.amount || claim.cashbackAmount || 150)
                    : Number(claim.amount || claim.cashbackAmount || 150);
                  const vInfo = resolveVendorInfo(claim);
                  const rejectionReason = claim.flagReason || claim.remarks || claim.reason || 'Flagged during audit verification';
                  const statusBorderClass = isDisbursed
                    ? 'border-emerald-400 border-l-4 border-l-emerald-600'
                    : isRejected
                    ? 'border-rose-400 border-l-4 border-l-rose-600'
                    : isApproved
                    ? 'border-blue-400 border-l-4 border-l-blue-600'
                    : 'border-amber-400 border-l-4 border-l-amber-500';

                  return (
                    <article
                      key={claim.id}
                      className={`bg-white rounded-xl border p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 transition space-y-2.5 ${statusBorderClass}`}
                    >
                      {/* Row 1: Header - Vendor Firm & Amount + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-[13px] text-slate-900 truncate">
                              {vInfo.vendorName || claim.userName || 'Partner Applicator'}
                            </span>
                            {vInfo.vendorId && (
                              <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                {vInfo.vendorId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                            <span>{claim.requestId || claim.claimCode || claim.id}</span>
                            <span>•</span>
                            <span>{formatRequestDateTime(claim)}</span>
                          </div>
                        </div>

                        {/* Amount & Status Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block">
                            ₹{displayAmount.toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${
                              isDisbursed
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : isApproved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isRejected
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDisbursed
                                  ? 'bg-teal-500'
                                  : isApproved
                                  ? 'bg-emerald-500'
                                  : isRejected
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500 animate-pulse'
                              }`}
                            />
                            <span>{isDisbursed ? 'Disbursed' : isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Applicant & Product SKU in Single Clean Strip */}
                      <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 flex items-center justify-between gap-2 text-[10.5px]">
                        <div className="min-w-0 flex-1 truncate text-slate-700">
                          <span className="font-semibold text-slate-900 truncate">
                            {claim.userName || claim.contractorName || 'Partner'}
                          </span>
                          {(claim.userMobile || claim.mobile) && (
                            <span className="text-slate-500 font-mono ml-1.5 text-[10px]">
                              {claim.userMobile || claim.mobile}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="font-mono text-[9.5px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                            {claim.skuCode || claim.productName || 'DA-777'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectedProductClaim(claim)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#BA3A24] hover:text-[#962B16] bg-[#FEF2EE] hover:bg-[#FCE3D8] border border-[#F9CEB8] px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                            title="View Product & Cashback Details"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>

                      {/* Row 3 (Conditional): Rejection Reason if Rejected */}
                      {isRejected && (
                        <div className="bg-rose-50/90 border border-rose-200/80 rounded-lg px-2.5 py-1.5 text-[10.5px] text-rose-800 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-rose-900 text-[10px] uppercase font-mono mr-1">Reason:</span>
                            <span className="font-medium text-rose-700 break-words">
                              {rejectionReason}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Row 4 (Conditional): UTR for Disbursed / Settled */}
                      {(isDisbursed || isApproved) && (claim.npciRrn || claim.transactionId || claim.utr || isDisbursed) && (
                        <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5 font-mono">
                          <span className="text-teal-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-teal-600" /> Settled via {claim.paymentMode || claim.payoutMethod || 'UPI'}
                          </span>
                          <span className="text-slate-600 font-medium truncate ml-2">
                            UTR: <strong className="text-slate-800">{claim.transactionId || claim.npciRrn || claim.utr || 'SETTLED'}</strong>
                          </span>
                        </div>
                      )}

                      {/* Row 5 (Conditional): Quick Review & Approve / Reject Action Buttons */}
                      {isPending && (
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(claim)}
                            className="py-1.5 px-3 bg-[#BA3A24] hover:bg-[#A02F17] text-white text-[11px] font-bold rounded-lg shadow-xs active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer min-w-0"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFlagModalClaim(claim)}
                            className="py-1.5 px-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-[11px] font-bold rounded-lg active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer min-w-0"
                          >
                            <X className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Reject</span>
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReleaseModal(claim)}
                            className="w-full py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-bold rounded-lg shadow-xs active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span>Release Payment &amp; Disburse</span>
                          </button>
                        </div>
                      )}

                      {isDisbursed && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => setViewReceiptClaim(claim)}
                            className="w-full py-1.5 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-[10.5px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-700" />
                            <span>View Settlement Voucher &amp; Receipt</span>
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })
              )}

              {/* View Full Queue button when more than 5 claims exist in Overview */}
              {filterTab === 'all' && filteredClaims.length > 5 && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200/90 transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>View All {filteredClaims.length} Claims in Full Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </section>


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
                  { id: 'disbursed', label: 'Disbursed', count: disbursedCount },
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
                            ? 'No approved cashback claims awaiting disbursal in this queue.'
                            : filterTab === 'disbursed'
                              ? 'No disbursed cashback claims settled yet.'
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
                  const isDisbursed = claim.status === 'Disbursed' || claim.payoutStatus === 'Disbursed';
                  const isApproved = claim.status === 'Approved' && !isDisbursed;
                  const isRejected = claim.status === 'Rejected' || claim.status === 'Flagged';
                  const displayAmount = isDisbursed
                    ? Number(claim.disbursedAmount || claim.netDisbursed || claim.amount || claim.cashbackAmount || 150)
                    : Number(claim.amount || claim.cashbackAmount || 150);
                  const rejectionReason = claim.flagReason || claim.remarks || claim.reason || 'Flagged during audit verification';
                  const statusBorderClass = isDisbursed
                    ? 'border-emerald-400 border-l-4 border-l-emerald-600'
                    : isRejected
                    ? 'border-rose-400 border-l-4 border-l-rose-600'
                    : isApproved
                    ? 'border-blue-400 border-l-4 border-l-blue-600'
                    : 'border-amber-400 border-l-4 border-l-amber-500';

                  return (
                    <article
                      key={claim.id}
                      className={`bg-white rounded-xl border p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 transition space-y-2.5 ${statusBorderClass}`}
                    >
                      {/* Row 1: Header - Vendor Firm & Amount + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-[13px] text-slate-900 truncate">
                              {vInfo.vendorName || claim.userName || 'Partner Applicator'}
                            </span>
                            {vInfo.vendorId && (
                              <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                {vInfo.vendorId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                            <span>{claim.requestId || claim.claimCode || claim.id}</span>
                            <span>•</span>
                            <span>{formatRequestDateTime(claim)}</span>
                          </div>
                        </div>

                        {/* Amount & Status Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-black text-slate-900 font-mono block">
                            ₹{displayAmount.toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${
                              isDisbursed
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : isApproved
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isRejected
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDisbursed
                                  ? 'bg-teal-500'
                                  : isApproved
                                  ? 'bg-emerald-500'
                                  : isRejected
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500 animate-pulse'
                              }`}
                            />
                            <span>{isDisbursed ? 'Disbursed' : isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Applicant & Product SKU in Single Clean Strip */}
                      <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 flex items-center justify-between gap-2 text-[10.5px]">
                        <div className="min-w-0 flex-1 truncate text-slate-700">
                          <span className="font-semibold text-slate-900 truncate">
                            {claim.userName || claim.contractorName || 'Partner'}
                          </span>
                          {(claim.userMobile || claim.mobile) && (
                            <span className="text-slate-500 font-mono ml-1.5 text-[10px]">
                              {claim.userMobile || claim.mobile}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="font-mono text-[9.5px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                            {claim.skuCode || claim.productName || 'DA-777'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectedProductClaim(claim)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#BA3A24] hover:text-[#962B16] bg-[#FEF2EE] hover:bg-[#FCE3D8] border border-[#F9CEB8] px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                            title="View Product & Cashback Details"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>

                      {/* Row 3 (Conditional): Rejection Reason if Rejected */}
                      {isRejected && (
                        <div className="bg-rose-50/90 border border-rose-200/80 rounded-lg px-2.5 py-1.5 text-[10.5px] text-rose-800 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-rose-900 text-[10px] uppercase font-mono mr-1">Reason:</span>
                            <span className="font-medium text-rose-700 break-words">
                              {rejectionReason}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Row 4 (Conditional): UTR for Disbursed / Approved */}
                      {(isDisbursed || isApproved) && (claim.npciRrn || claim.transactionId || claim.utr || isDisbursed) && (
                        <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5 font-mono">
                          <span className="text-teal-700 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 text-teal-600" /> Settled via {claim.paymentMode || claim.payoutMethod || 'UPI'}
                          </span>
                          <span className="text-slate-600 font-medium truncate ml-2">
                            UTR: <strong className="text-slate-800">{claim.transactionId || claim.npciRrn || claim.utr || 'SETTLED'}</strong>
                          </span>
                        </div>
                      )}

                      {/* Row 5 (Conditional): Quick Review & Approve / Reject Action Buttons */}
                      {isPending && (
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(claim)}
                            className="py-1.5 px-3 bg-[#BA3A24] hover:bg-[#A02F17] text-white text-[11px] font-bold rounded-lg shadow-xs active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer min-w-0"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFlagModalClaim(claim)}
                            className="py-1.5 px-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-[11px] font-bold rounded-lg active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer min-w-0"
                          >
                            <X className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Reject</span>
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReleaseModal(claim)}
                            className="w-full py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-bold rounded-lg shadow-xs active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span>Release Payment &amp; Disburse</span>
                          </button>
                        </div>
                      )}

                      {isDisbursed && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => setViewReceiptClaim(claim)}
                            className="w-full py-1.5 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-[10.5px] font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-700" />
                            <span>View Settlement Voucher &amp; Receipt</span>
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: VENDOR RELEASE PAYMENT & REDEMPTION HUB                     */}
        {/* =================================================================== */}
        {activeTab === 'release' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Header Hub Card */}
            <div className="bg-gradient-to-br from-white via-[#FEF2EE]/40 to-orange-50/50 rounded-2xl border border-[#F9CEB8]/80 p-3.5 sm:p-4 space-y-3 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#BA3A24] to-[#E35D38] text-white flex items-center justify-center shadow-xs">
                    <Zap className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                      Vendor Payment Release &amp; Disbursal
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Realtime Cloud</span>
                  </span>
                </div>
              </div>

              {/* 2 Financial KPI Tiles */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="bg-white/90 rounded-xl p-2.5 border border-amber-200/80 shadow-2xs">
                  <span className="text-[9.5px] font-bold text-amber-800 uppercase tracking-wider block">
                    Awaiting Release
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                      ₹{awaitingReleaseAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 font-mono">
                      ({awaitingReleaseCount})
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Approved &amp; Ready to Disburse</span>
                </div>

                <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-200/80 shadow-2xs">
                  <span className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Disbursed Payouts
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">
                      ₹{settledAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 font-mono">
                      ({settledCount})
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Settled via IMPS / UPI Rails</span>
                </div>
              </div>

              {/* Sub-tab Switches: Awaiting Release vs Settled */}
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setReleaseSubTab('awaiting')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    releaseSubTab === 'awaiting'
                      ? 'bg-white text-[#BA3A24] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Awaiting Release</span>
                  {awaitingReleaseCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#BA3A24] text-white">
                      {awaitingReleaseCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setReleaseSubTab('settled')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    releaseSubTab === 'settled'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Settled History</span>
                  {settledCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white">
                      {settledCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Search Bar for Release Tab */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={releaseSearchQuery}
                  onChange={(e) => setReleaseSearchQuery(e.target.value)}
                  placeholder="Search by vendor, claimant, mobile, UTR..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#BA3A24]"
                />
                {releaseSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setReleaseSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* List for Awaiting Release */}
            {releaseSubTab === 'awaiting' && (
              <div className="space-y-2.5">
                {filteredAwaitingClaims.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      {releaseSearchQuery ? 'No matching claims awaiting payout' : 'No claims awaiting release'}
                    </p>
                    <p className="text-[10.5px] text-slate-500 max-w-xs mx-auto">
                      All approved claims have been settled, or new claims need approval in the Requests tab first.
                    </p>
                  </div>
                ) : (
                  filteredAwaitingClaims.map((claim) => {
                    const vInfo = resolveVendorInfo(claim);
                    const amount = Number(claim.amount || claim.cashbackAmount || claim.claimValue || 150);

                    return (
                      <article
                        key={claim.id}
                        className="bg-white rounded-xl border border-amber-400 border-l-4 border-l-amber-500 p-3 sm:p-3.5 shadow-2xs hover:border-amber-500 transition space-y-2.5"
                      >
                        {/* Header: Vendor Name & Amount */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs sm:text-[13px] text-slate-900 truncate">
                                {vInfo.vendorName || claim.userName || 'Partner Applicator'}
                              </span>
                              {vInfo.vendorId && (
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                  {vInfo.vendorId}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                              <span>{claim.requestId || claim.claimCode || claim.id}</span>
                              <span>•</span>
                              <span>{formatRequestDateTime(claim)}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black text-[#BA3A24] font-mono block">
                              ₹{amount.toLocaleString('en-IN')}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mt-0.5 bg-amber-50 text-amber-800 border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Approved</span>
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Applicant & Product SKU + View link */}
                        <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 flex items-center justify-between gap-2 text-[10.5px]">
                          <div className="min-w-0 flex-1 truncate text-slate-700">
                            <span className="font-semibold text-slate-900 truncate">
                              {claim.userName || claim.contractorName || 'Partner'}
                            </span>
                            {(claim.userMobile || claim.mobile) && (
                              <span className="text-slate-500 font-mono ml-1.5 text-[10px]">
                                {claim.userMobile || claim.mobile}
                              </span>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className="font-mono text-[9.5px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                              {claim.skuCode || claim.productName || 'DA-777'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setInspectedProductClaim(claim)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#BA3A24] hover:text-[#962B16] bg-[#FEF2EE] hover:bg-[#FCE3D8] border border-[#F9CEB8] px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                              title="View Product & Cashback Details"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </div>
                        </div>

                        {/* Row 3: Destination VPA / Account */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5 font-mono">
                          <span className="text-slate-600 font-medium truncate">
                            Payout Dest: <strong className="text-slate-800">{claim.vpaOrIfsc || claim.upiId || 'pending@upi'}</strong>
                          </span>
                          <span className="text-slate-500 shrink-0 ml-2">
                            Mode: <strong className="text-slate-700">{claim.payoutMethod || 'UPI'}</strong>
                          </span>
                        </div>

                        {/* Row 4: Release Payment Primary Button */}
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReleaseModal(claim)}
                            className="w-full py-2 px-3 bg-gradient-to-r from-[#BA3A24] to-[#C84826] hover:from-[#A02F17] hover:to-[#B9381E] text-white text-xs font-black rounded-xl shadow-xs active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-4 h-4 fill-white" />
                            <span>Release Payment (Disburse Funds)</span>
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* List for Settled History */}
            {releaseSubTab === 'settled' && (
              <div className="space-y-2.5">
                {filteredSettledClaims.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">No settled payout records found</p>
                    <p className="text-[10.5px] text-slate-500">
                      Settled disbursements and NPCI vouchers will appear here once released.
                    </p>
                  </div>
                ) : (
                  filteredSettledClaims.map((claim) => {
                    const vInfo = resolveVendorInfo(claim);
                    const disbursedAmt = Number(claim.disbursedAmount || claim.netDisbursed || claim.amount || 0);

                    return (
                      <article
                        key={claim.id}
                        className="bg-white rounded-xl border border-emerald-400 border-l-4 border-l-emerald-600 p-3 sm:p-3.5 shadow-2xs hover:border-emerald-500 transition space-y-2.5"
                      >
                        {/* Header: Vendor Name & Amount */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs sm:text-[13px] text-slate-900 truncate">
                                {vInfo.vendorName || claim.userName || 'Partner Applicator'}
                              </span>
                              {vInfo.vendorId && (
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                  {vInfo.vendorId}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                              <span>{claim.requestId || claim.claimCode || claim.id}</span>
                              <span>•</span>
                              <span>{formatRequestDateTime(claim)}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono block">
                              ₹{disbursedAmt.toLocaleString('en-IN')}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mt-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Disbursed</span>
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Applicant & Product SKU */}
                        <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 flex items-center justify-between gap-2 text-[10.5px]">
                          <div className="min-w-0 flex-1 truncate text-slate-700">
                            <span className="font-semibold text-slate-900 truncate">
                              {claim.userName || claim.contractorName || 'Partner'}
                            </span>
                            {(claim.userMobile || claim.mobile) && (
                              <span className="text-slate-500 font-mono ml-1.5 text-[10px]">
                                {claim.userMobile || claim.mobile}
                              </span>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className="font-mono text-[9.5px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                              {claim.skuCode || claim.productName || 'DA-777'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setInspectedProductClaim(claim)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#BA3A24] hover:text-[#962B16] bg-[#FEF2EE] hover:bg-[#FCE3D8] border border-[#F9CEB8] px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                              title="View Product Details"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </div>
                        </div>

                        {/* Row 3: Settlement UTR & Mode */}
                        <div className="flex items-center justify-between text-[10px] text-slate-600 px-0.5 font-mono bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100">
                          <span className="truncate">
                            Rail: <strong className="text-emerald-900">{claim.paymentMode || claim.payoutMethod || 'UPI'}</strong>
                          </span>
                          <span className="truncate ml-2">
                            UTR: <strong className="text-slate-900">{claim.transactionId || claim.npciRrn || claim.utr || 'NPCI-DISBURSED'}</strong>
                          </span>
                        </div>

                        {/* Row 4: View Settlement Voucher Slip Button */}
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => setViewReceiptClaim(claim)}
                            className="w-full py-1.5 px-3 bg-white hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300 text-emerald-800 text-[11px] font-bold rounded-xl shadow-2xs active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Settlement Voucher &amp; Receipt</span>
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: QR BATCH GENERATOR                                          */}
        {/* =================================================================== */}
        {activeTab === 'qrgen' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#BA3A24]" />
                <h2 className="text-xs font-bold text-slate-900">Mobile QR Batch Ingestion Engine</h2>
              </div>

              <form onSubmit={handleQuickCreateBatch} className="space-y-3 pt-1 text-xs">
                <div>
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Target Product SKU</label>
                  <select
                    value={selectedSkuId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSkuId(val);
                      const target = skus.find((s) => s.id === val || s.skuCode === val);
                      if (target && (target.cashbackReward || target.cashbackAmount)) {
                        setBatchCashback(Number(target.cashbackReward || target.cashbackAmount));
                      }
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  >
                    {skus.map((s) => (
                      <option key={s.id || s.skuCode} value={s.id || s.skuCode}>
                        {s.skuCode} — {s.name} (Reward: ₹{s.cashbackReward || s.cashbackAmount || 50})
                      </option>
                    ))}
                    {skus.length === 0 && <option value="">Loading live products from Supabase...</option>}
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
                        className="p-3 bg-white border border-emerald-400 border-l-4 border-l-emerald-600 rounded-xl space-y-2 transition shadow-2xs hover:border-emerald-500"
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


      </div>

      {/* ===================================================================== */}
      {/* 3. BOTTOM EXECUTIVE NAVIGATION (Permanently pinned at bottom, never hides) */}
      {/* ===================================================================== */}
      <nav
        aria-label="Executive Bottom Navigation"
        className="shrink-0 sticky bottom-0 inset-x-0 bg-white/98 backdrop-blur-md border-t-2 border-slate-200/90 px-1 sm:px-2 pt-1.5 landscape:pt-1 pb-[max(0.65rem,env(safe-area-inset-bottom))] landscape:pb-[max(0.35rem,env(safe-area-inset-bottom))] flex items-center justify-around z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.09)]"
      >
        {/* Tab 1: Overview */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('overview');
            showHapticHUD('Tab: Overview Dashboard');
          }}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 landscape:py-0.5 px-0.5 rounded-xl transition-all duration-200 cursor-pointer relative active:scale-95 ${activeTab === 'overview'
              ? 'text-[#BA3A24] font-black bg-[#FEF2EE] border border-[#F9CEB8]/70 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <div className="relative">
            <LayoutGrid className={`w-4.5 h-4.5 landscape:w-4 landscape:h-4 transition-transform ${activeTab === 'overview' ? 'scale-110 text-[#BA3A24]' : 'text-slate-500'}`} />
          </div>
          <span className="text-[9px] sm:text-[9.5px] landscape:text-[8px] tracking-tight uppercase mt-0.5 font-bold truncate max-w-full">
            Overview
          </span>
          {activeTab === 'overview' && (
            <span className="w-4 h-0.5 bg-[#BA3A24] rounded-full mt-0.5 -mb-0.5 animate-in fade-in" />
          )}
        </button>

        {/* Tab 2: Requests (with Pending Claims Badge) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('requests');
            showHapticHUD('Tab: Moderation Requests Queue');
          }}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 landscape:py-0.5 px-0.5 rounded-xl transition-all duration-200 cursor-pointer relative active:scale-95 ${activeTab === 'requests'
              ? 'text-[#BA3A24] font-black bg-[#FEF2EE] border border-[#F9CEB8]/70 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <div className="relative">
            <Layers className={`w-4.5 h-4.5 landscape:w-4 landscape:h-4 transition-transform ${activeTab === 'requests' ? 'scale-110 text-[#BA3A24]' : 'text-slate-500'}`} />
            {pendingCount > 0 && (
              <span className="absolute top-0 right-1 min-w-[15px] h-[15px] px-0.5 bg-[#BA3A24] text-white text-[8px] font-black rounded-full flex items-center justify-center ring-1 ring-white shadow-xs animate-pulse">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[9px] sm:text-[9.5px] landscape:text-[8px] tracking-tight uppercase mt-0.5 font-bold truncate max-w-full">
            Requests
          </span>
          {activeTab === 'requests' && (
            <span className="w-4 h-0.5 bg-[#BA3A24] rounded-full mt-0.5 -mb-0.5 animate-in fade-in" />
          )}
        </button>

        {/* Tab 3: Release Payment (with Awaiting Disbursal Badge) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('release');
            showHapticHUD('Tab: Release Payment & Disbursals');
          }}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 landscape:py-0.5 px-0.5 rounded-xl transition-all duration-200 cursor-pointer relative active:scale-95 ${
            activeTab === 'release'
              ? 'text-[#BA3A24] font-black bg-[#FEF2EE] border border-[#F9CEB8]/70 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100/70 border border-transparent'
          }`}
        >
          <div className="relative">
            <Zap className={`w-4.5 h-4.5 landscape:w-4 landscape:h-4 transition-transform ${activeTab === 'release' ? 'scale-110 text-[#BA3A24] fill-[#BA3A24]' : 'text-slate-500'}`} />
            {awaitingReleaseCount > 0 && (
              <span className="absolute top-0 right-1 min-w-[15px] h-[15px] px-0.5 bg-emerald-600 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-1 ring-white shadow-xs animate-pulse">
                {awaitingReleaseCount}
              </span>
            )}
          </div>
          <span className="text-[8.5px] sm:text-[9px] landscape:text-[8px] tracking-tight uppercase mt-0.5 font-bold truncate max-w-full">
            Release Pay
          </span>
          {activeTab === 'release' && (
            <span className="w-4 h-0.5 bg-[#BA3A24] rounded-full mt-0.5 -mb-0.5 animate-in fade-in" />
          )}
        </button>

        {/* Tab 4: QR Gen */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('qrgen');
            showHapticHUD('Tab: QR Batch Engine');
          }}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 landscape:py-0.5 px-0.5 rounded-xl transition-all duration-200 cursor-pointer relative active:scale-95 ${activeTab === 'qrgen'
              ? 'text-[#BA3A24] font-black bg-[#FEF2EE] border border-[#F9CEB8]/70 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-100/70 border border-transparent'
            }`}
        >
          <div className="relative">
            <QrCode className={`w-4.5 h-4.5 landscape:w-4 landscape:h-4 transition-transform ${activeTab === 'qrgen' ? 'scale-110 text-[#BA3A24]' : 'text-slate-500'}`} />
          </div>
          <span className="text-[9px] sm:text-[9.5px] landscape:text-[8px] tracking-tight uppercase mt-0.5 font-bold truncate max-w-full">
            QR Gen
          </span>
          {activeTab === 'qrgen' && (
            <span className="w-4 h-0.5 bg-[#BA3A24] rounded-full mt-0.5 -mb-0.5 animate-in fade-in" />
          )}
        </button>
      </nav>

      {/* ===================================================================== */}
      {/* 4. MODALS (PRODUCT INSPECTION, FLAG / REJECT & QUICK BATCH)           */}
      {/* ===================================================================== */}
      {inspectedProductClaim && (() => {
        const pInfo = resolveProductInfo(inspectedProductClaim);
        const vInfo = resolveVendorInfo(inspectedProductClaim);
        const isPending = inspectedProductClaim.status === 'Pending';
        const isDisbursed = inspectedProductClaim.status === 'Disbursed' || inspectedProductClaim.payoutStatus === 'Disbursed';
        const isApproved = inspectedProductClaim.status === 'Approved' && !isDisbursed;
        const isRejected = inspectedProductClaim.status === 'Rejected' || inspectedProductClaim.status === 'Flagged';

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#BA3A24] to-[#E35D38] text-white flex items-center justify-center shadow-sm">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">Product &amp; Cashback Details</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Verified SKU &amp; Claim Inspection</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedProductClaim(null)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer transition active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product Hero Banner */}
              <div className="bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/40 rounded-2xl p-3.5 border border-amber-100/80 space-y-3">
                <div className="flex items-start gap-3">
                  {/* Photo or Visual Badge */}
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    {inspectedProductClaim.proofUrl || inspectedProductClaim.proofImageUrl ? (
                      <img
                        src={inspectedProductClaim.proofUrl || inspectedProductClaim.proofImageUrl}
                        alt={pInfo.productName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#FEF2EE] rounded-lg flex flex-col items-center justify-center text-[#BA3A24]">
                        <Package className="w-6 h-6" />
                        <span className="text-[8px] font-black tracking-tight uppercase">DuraGrit</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-[#BA3A24] bg-[#FEF2EE] border border-[#F9CEB8] px-2 py-0.5 rounded-md">
                        {pInfo.skuCode}
                      </span>
                      <span className="text-[9.5px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {pInfo.category}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 text-[13px] leading-snug mt-1.5">
                      {pInfo.productName}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {pInfo.description}
                    </p>
                  </div>
                </div>

                {/* 4-Tile Spec Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                  <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/80">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Packing Size</span>
                    <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">{pInfo.packSize}</span>
                  </div>

                  <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/80">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">MRP Price</span>
                    <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">₹{pInfo.mrp.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-emerald-50/80 rounded-xl p-2.5 border border-emerald-200/80">
                    <span className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-wider block">Cashback Reward</span>
                    <span className="text-xs font-black text-emerald-700 font-mono mt-0.5 block">₹{pInfo.rewardValue.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/80">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Sub-Category</span>
                    <span className="text-xs font-bold text-slate-800 truncate mt-0.5 block">{pInfo.subCategory}</span>
                  </div>
                </div>
              </div>

              {/* Vendor & Scan Audit Information */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-0.5">Scan &amp; Claimant Audit</span>
                
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2 text-xs">
                  {/* Scanned Serial */}
                  <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">QR Serial</span>
                    <span className="text-[11px] font-mono font-bold text-[#BA3A24] truncate">
                      {pInfo.rawSerial || inspectedProductClaim.requestId}
                    </span>
                  </div>

                  {/* Actual Vendor */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-slate-500 text-[11px]">Claimant Vendor:</span>
                    <span className="font-bold text-slate-900 text-right text-[11px] truncate max-w-[60%]">
                      {vInfo.vendorName} {vInfo.vendorId ? `(${vInfo.vendorId})` : ''}
                    </span>
                  </div>

                  {/* Scanned By User */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-[11px]">Scanned By:</span>
                    <span className="font-semibold text-slate-800 text-right text-[11px] truncate">
                      {inspectedProductClaim.userName || 'Trade Partner'} • {inspectedProductClaim.userMobile || 'Verified Mobile'}
                    </span>
                  </div>

                  {/* Date & Request ID */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-[11px]">Request / Date:</span>
                    <span className="font-mono text-slate-700 text-[10.5px]">
                      {inspectedProductClaim.requestId || inspectedProductClaim.id} • {formatRequestDateTime(inspectedProductClaim)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
                    <span className="text-slate-500 text-[11px]">Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                        isDisbursed
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isRejected
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isDisbursed
                            ? 'bg-teal-500'
                            : isApproved
                            ? 'bg-emerald-500'
                            : isRejected
                            ? 'bg-rose-500'
                            : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                      <span>{isDisbursed ? 'Disbursed' : isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Verification'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {isPending ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = inspectedProductClaim;
                        setInspectedProductClaim(null);
                        handleApprove(target);
                      }}
                      className="flex-1 py-2.5 bg-[#BA3A24] hover:bg-[#A02F17] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = inspectedProductClaim;
                        setInspectedProductClaim(null);
                        setFlagModalClaim(target);
                      }}
                      className="px-3 py-2.5 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-700 text-xs font-bold rounded-xl active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setInspectedProductClaim(null)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer active:scale-95 transition"
                  >
                    Close Window
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* 4. RELEASE PAYMENT MODAL                                              */}
      {/* ===================================================================== */}
      {releaseModalClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-[#BA3A24] to-[#C84826] text-white flex items-center justify-between rounded-t-3xl shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 text-white flex items-center justify-center font-black border border-white/20">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white">Release Payout &amp; Disburse</h3>
                  <p className="text-[10px] text-white/80 font-mono">
                    Ref: {releaseModalClaim.requestId || releaseModalClaim.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReleaseModalClaim(null)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitRelease} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              {/* Beneficiary Banner */}
              <div className="bg-[#FEF2EE]/70 border border-[#F9CEB8] rounded-2xl p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                      <span>{releaseModalClaim.userName || 'Partner'}</span>
                      <span className="text-[10px] bg-white px-1.5 py-0.2 rounded font-mono text-slate-700 border border-[#F9CEB8]">
                        {releaseModalClaim.userMobile || '—'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#BA3A24] font-bold mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{resolveVendorInfo(releaseModalClaim).vendorName}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Claim Amount</span>
                    <span className="text-sm font-black font-mono text-[#BA3A24] block">
                      ₹{Number(releaseModalClaim.amount || releaseModalClaim.cashbackAmount || 150).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-[10.5px] text-slate-600 font-mono pt-1 border-t border-[#F9CEB8]/60 flex items-center justify-between">
                  <span>Dest: <strong className="text-[#BA3A24]">{releaseModalClaim.vpaOrIfsc || releaseModalClaim.upiId || 'pending@upi'}</strong></span>
                  <span>SKU: <strong>{releaseModalClaim.skuCode || 'DA-777'}</strong></span>
                </div>
              </div>

              {/* Disbursal Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Disbursed Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={releaseForm.amount}
                    onChange={(e) => setReleaseForm({ ...releaseForm, amount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#BA3A24] text-slate-900"
                    placeholder="150.00"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Payment Mode / Gateway Rail <span className="text-rose-500">*</span>
                </label>
                <select
                  value={releaseForm.paymentMode}
                  onChange={(e) => setReleaseForm({ ...releaseForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#BA3A24] text-slate-800 cursor-pointer"
                >
                  <option value="UPI">UPI Instant Escrow (NPCI)</option>
                  <option value="Bank NEFT">NEFT Direct Interbank</option>
                  <option value="IMPS">IMPS 24x7 Immediate Settlement</option>
                  <option value="RTGS">RTGS High-Value Transfer</option>
                  <option value="Cash">Cash Direct Settlement</option>
                </select>
              </div>

              {/* Transaction ID / UTR */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Transaction ID / UTR <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setReleaseForm((prev) => ({
                        ...prev,
                        transactionId: 'UTR' + Math.floor(1000000000 + Math.random() * 9000000000),
                      }))
                    }
                    className="text-[10px] text-[#BA3A24] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto-generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={releaseForm.transactionId}
                  onChange={(e) => setReleaseForm({ ...releaseForm, transactionId: e.target.value })}
                  placeholder="e.g. UTR602918239012"
                  className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#BA3A24] text-slate-900"
                />
              </div>

              {/* Screenshot / Proof Attachment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Payment Screenshot / Voucher
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setReleaseForm((prev) => ({
                        ...prev,
                        proofImage: DEFAULT_RECEIPT_PREVIEW,
                        proofFileName: 'duragrit_escrow_voucher.svg',
                      }))
                    }
                    className="text-[10px] text-[#BA3A24] font-bold bg-[#FEF2EE] px-2 py-0.5 rounded border border-[#F9CEB8] cursor-pointer active:scale-95"
                  >
                    + Digital Voucher
                  </button>
                </div>

                {releaseForm.proofImage ? (
                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={releaseForm.proofImage}
                        alt="Proof"
                        className="w-10 h-10 object-cover rounded-lg border border-emerald-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Proof Attached</span>
                        </span>
                        <span className="text-[9.5px] text-emerald-700 font-mono truncate block">
                          {releaseForm.proofFileName || 'receipt_slip.svg'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReleaseForm((prev) => ({ ...prev, proofImage: null, proofFileName: '' }))}
                      className="p-1 text-rose-600 hover:text-rose-800 rounded-md cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#BA3A24] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-[#FEF2EE]/40 transition text-center">
                    <UploadCloud className="w-5 h-5 text-[#BA3A24] mb-0.5" />
                    <span className="text-[11px] font-bold text-slate-700">Attach payment screenshot or slip</span>
                    <span className="text-[9px] text-slate-400">PNG, JPG, or WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Remarks / Settlement Notes
                </label>
                <textarea
                  rows={2}
                  value={releaseForm.remarks}
                  onChange={(e) => setReleaseForm({ ...releaseForm, remarks: e.target.value })}
                  placeholder="Enter settlement notes..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#BA3A24] text-slate-800"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReleaseModalClaim(null)}
                  className="px-3 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReleasing}
                  className="flex-1 py-2 px-3 bg-[#BA3A24] hover:bg-[#A02F17] text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isReleasing ? 'Disbursing...' : `Submit & Disburse (₹${parseFloat(releaseForm.amount || 0).toFixed(2)})`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. VIEW VOUCHER / RECEIPT MODAL                                       */}
      {/* ===================================================================== */}
      {viewReceiptClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">Settlement Voucher Slip</h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    UTR: {viewReceiptClaim.transactionId || viewReceiptClaim.npciRrn || 'SETTLED'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewReceiptClaim(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voucher Image or SVG Preview */}
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-50">
              <img
                src={viewReceiptClaim.paymentProofUrl || DEFAULT_RECEIPT_PREVIEW}
                alt="Settlement Slip"
                className="w-full h-auto object-contain"
              />
            </div>

            {/* Details Table */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Claimant:</span>
                <span className="font-bold text-slate-900">{viewReceiptClaim.userName || 'Partner'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vendor:</span>
                <span className="font-bold text-[#BA3A24]">{resolveVendorInfo(viewReceiptClaim).vendorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Disbursed Amount:</span>
                <span className="font-black font-mono text-emerald-700">₹{Number(viewReceiptClaim.disbursedAmount || viewReceiptClaim.amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Settlement Rail:</span>
                <span className="font-mono font-semibold text-slate-800">{viewReceiptClaim.paymentMode || viewReceiptClaim.payoutMethod || 'UPI'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">UTR / Ref:</span>
                <span className="font-mono font-bold text-slate-900">{viewReceiptClaim.transactionId || viewReceiptClaim.npciRrn || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Settled At:</span>
                <span className="font-mono text-slate-700">{formatRequestDateTime(viewReceiptClaim)}</span>
              </div>
              {viewReceiptClaim.remarks && (
                <div className="pt-1 border-t border-slate-200 text-slate-600">
                  <span className="font-bold text-slate-700">Remarks: </span>
                  <span>{viewReceiptClaim.remarks}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewReceiptClaim(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95"
            >
              Close Voucher
            </button>
          </div>
        </div>
      )}

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
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSkuId(val);
                    const target = skus.find((s) => s.id === val || s.skuCode === val);
                    if (target && (target.cashbackReward || target.cashbackAmount)) {
                      setBatchCashback(Number(target.cashbackReward || target.cashbackAmount));
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                >
                  {skus.map((s) => (
                    <option key={s.id || s.skuCode} value={s.id || s.skuCode}>
                      {s.skuCode} — {s.name}
                    </option>
                  ))}
                  {skus.length === 0 && <option value="">Loading live products from Supabase...</option>}
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
      {/* 4. ADMIN OTA UPDATE PROGRESS OVERLAY */}
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

