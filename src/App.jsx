import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { Step8_MobileSignIn } from './modules/Step8_MobileSignIn';
import { Step9_ContractorDashboard } from './modules/Step9_ContractorDashboard';
import { Step9_VendorDashboard } from './modules/Step9_VendorDashboard';
import { Step10_QRScanUpload } from './modules/Step10_QRScanUpload';
import { Step11_MyCashbackRequests } from './modules/Step11_MyCashbackRequests';
import { Step12_MobileModeration } from './modules/Step12_MobileModeration';
import { AdminMobileApp } from './modules/AdminMobileApp';
import { Step13_WelcomeDossier } from './modules/Step13_WelcomeDossier';
import { OpeningSplashScreen } from './components/OpeningSplashScreen';
import { PartnerVerificationPortal } from './components/PartnerVerificationPortal';
import {
  checkClientUpdateStatus,
  checkForLiveServerUpdate,
  applyClientAppUpdate,
  getClientInstalledVersion,
  getLatestRelease,
  isVersionHigher,
  syncMobileClientDevice
} from './services/appInstallService';
import {
  QrCode,
  LayoutGrid,
  ClipboardList,
  Package,
  User,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Settings,
  Rocket,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';

export function App() {
  const { currentUser, logout } = useAuth();
  const { claims = [], vendors = [] } = useData();

  // Strict Port, Build-Flag, Native App ID & URL Separation:
  // Priority 1: Injected build flag (dedicated Admin Mobile APK vs Vendor APK)
  // Priority 2: Capacitor App ID (com.duragrit.vitrified.admin)
  // Priority 3: Local Port (3001 Admin, 3002 Vendor)
  // Priority 4: Query param (?app=admin / ?mode=admin)
  // Priority 5: LocalStorage preferred portal
  const isAppAdmin = typeof window !== 'undefined' && (() => {
    if (window.DURAGRIT_APP_TYPE === 'admin') return true;
    if (window.DURAGRIT_APP_TYPE === 'vendor') return false;

    const metaMode = document.querySelector('meta[name="duragrit-app-type"]')?.getAttribute('content') ||
                     document.querySelector('meta[name="duragrit-app-mode"]')?.getAttribute('content');
    if (metaMode === 'admin') return true;
    if (metaMode === 'vendor') return false;

    if (window.Capacitor?.appId?.includes('admin')) return true;

    const port = String(window.location.port || '');
    if (port === '3001') return true;
    if (port === '3002') return false;

    const params = new URLSearchParams(window.location.search);
    const app = params.get('app') || params.get('mode');
    if (app === 'admin') return true;
    if (app === 'vendor') return false;

    try {
      const preferred = localStorage.getItem('duragrit_preferred_portal');
      if (preferred === 'admin') return true;
      if (preferred === 'vendor') return false;
    } catch (_) {}

    return false;
  })();

  const [currentScreen, setCurrentScreen] = useState(() => {
    if (!currentUser?.isAuthenticated) return 'signin';
    return 'dashboard';
  });

  // App Opening Splash Animation (Official Logo + Background)
  const [showSplash, setShowSplash] = useState(() => {
    try {
      if (sessionStorage.getItem('duragrit_mobile_splash_shown')) return false;
    } catch (_) {}
    return true;
  });

  const handleSplashComplete = React.useCallback(() => {
    try {
      sessionStorage.setItem('duragrit_mobile_splash_shown', 'true');
    } catch (_) {}
    setShowSplash(false);
  }, []);

  // Sync Preferred Portal & PWA Manifest for Strict Separation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('duragrit_preferred_portal', isAppAdmin ? 'admin' : 'vendor');
      const manifestEl = document.getElementById('app-manifest') || document.querySelector('link[rel="manifest"]');
      if (manifestEl) {
        manifestEl.setAttribute('href', isAppAdmin ? '/manifest-admin.json' : '/manifest-vendor.json');
      }
    } catch (_) {}
  }, [isAppAdmin]);

  // OTA App Version & Update State
  const [updateStatus, setUpdateStatus] = useState(() => checkClientUpdateStatus());
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatusMessage, setUpdateStatusMessage] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Email Verification Portal State
  const [showVerifyPortal, setShowVerifyPortal] = useState(false);
  const [initialVerifyCode, setInitialVerifyCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const code = params.get('code');
    const token = params.get('verify');
    if (page === 'verify' || code || token) {
      const c = code || token || '';
      window.location.replace(`/verify?code=${encodeURIComponent(c)}`);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.isAuthenticated) {
      setCurrentScreen('signin');
    }
  }, [currentUser]);

  // Live Partner Session Invalidation when Admin Deactivates
  useEffect(() => {
    if (currentUser?.isAuthenticated && !currentUser?.isAdmin) {
      const vid = String(currentUser.id || currentUser.vendorId || currentUser.userId || '').toLowerCase();
      const vPhone = String(currentUser.mobile || currentUser.phone || '').replace(/\D/g, '').slice(-10);
      const liveVendor = vendors.find((v) => {
        const id = String(v.vendorId || v.id || '').toLowerCase();
        const p = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
        return id === vid || (vPhone && p === vPhone);
      });
      if (liveVendor) {
        const isInactive =
          liveVendor.status === 'INACTIVE' ||
          liveVendor.status === 'DEACTIVE' ||
          liveVendor.status === 'Suspended' ||
          liveVendor.accountStatus === 'Suspended' ||
          liveVendor.active === false;

        if (isInactive) {
          logout();
          setToastMsg('Your partner account has been deactivated by DuraGrit Administrator.');
        }
      }
    }
  }, [currentUser, vendors, logout]);

  // Telemetry Sync & OTA Push Listeners
  useEffect(() => {
    syncMobileClientDevice(currentUser);
    
    // Check local status and also poll live server endpoint
    checkForLiveServerUpdate().then((status) => {
      if (status) {
        setUpdateStatus(status);
        const isApplied = localStorage.getItem('duragrit_ota_applied_' + status.latestVersion) === 'true';
        const isDismissed = sessionStorage.getItem('duragrit_ota_dismissed_' + status.latestVersion) === 'true' ||
                            localStorage.getItem('duragrit_ota_dismissed_' + status.latestVersion) === 'true';
        if (status.hasUpdate && !isApplied && !isDismissed) {
          setShowUpdateModal(true);
        }
      }
    });

    const handleSync = () => {
      checkForLiveServerUpdate().then((status) => {
        if (status) {
          setUpdateStatus(status);
          const isApplied = localStorage.getItem('duragrit_ota_applied_' + status.latestVersion) === 'true';
          const isDismissed = sessionStorage.getItem('duragrit_ota_dismissed_' + status.latestVersion) === 'true' ||
                              localStorage.getItem('duragrit_ota_dismissed_' + status.latestVersion) === 'true';
          if (status.hasUpdate && !isApplied && !isDismissed) {
            setShowUpdateModal(true);
          }
        }
      });
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('duragrit:ota-release-pushed', handleSync);
    window.addEventListener('duragrit:ota-update-applied', handleSync);

    const interval = setInterval(() => {
      checkForLiveServerUpdate().then((status) => {
        if (status?.hasUpdate) {
          setUpdateStatus(status);
          const isApplied = localStorage.getItem('duragrit_ota_applied_' + status.latestVersion) === 'true';
          const isDismissed = sessionStorage.getItem('duragrit_ota_dismissed_' + status.latestVersion) === 'true' ||
                              localStorage.getItem('duragrit_ota_dismissed_' + status.latestVersion) === 'true';
          if (!isApplied && !isDismissed) {
            setShowUpdateModal(true);
          }
        } else {
          setUpdateStatus(prev => ({ ...prev, hasUpdate: false }));
        }
      });
    }, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('duragrit:ota-release-pushed', handleSync);
      window.removeEventListener('duragrit:ota-update-applied', handleSync);
    };
  }, [currentUser]);

  const handleTriggerUpdate = () => {
    setShowUpdateModal(true);
    setIsUpdating(true);
    setUpdateProgress(15);
    setUpdateStatusMessage('Connecting to Morbi Release CDN...');

    setTimeout(() => {
      setUpdateProgress(45);
      setUpdateStatusMessage(`Downloading update bundle ${updateStatus.latestVersion || 'v4.8.4'}...`);

      setTimeout(() => {
        setUpdateProgress(75);
        setUpdateStatusMessage('Validating cryptographic HMAC integrity & schemas...');

        setTimeout(async () => {
          setUpdateProgress(95);
          setUpdateStatusMessage('Purging legacy cache & applying latest patches...');

          const res = await applyClientAppUpdate(updateStatus.latestVersion);
          setUpdateProgress(100);
          setUpdateStatusMessage(`✓ Successfully updated to ${res.version}!`);
          setIsUpdating(false);
          setUpdateStatus((prev) => ({ ...prev, hasUpdate: false }));
          setShowUpdateModal(false);

          if (res?.version) {
            localStorage.setItem('duragrit_ota_applied_' + res.version, 'true');
            localStorage.setItem('duragrit_ota_dismissed_' + res.version, 'true');
            try {
              sessionStorage.setItem('duragrit_ota_dismissed_' + res.version, 'true');
            } catch (_) {}
          }

          setTimeout(() => {
            setToastMsg(`App successfully updated to ${res.version}! Reloading latest work...`);
            setTimeout(() => {
              const url = new URL(window.location.href);
              url.searchParams.set('v', String(Date.now()));
              window.location.replace(url.toString());
            }, 500);
          }, 400);
        }, 400);
      }, 400);
    }, 350);
  };

  const pendingCount = claims.filter((c) => c.status === 'Pending').length;
  const isVendor = currentUser?.role === 'Vendor' || currentUser?.role === 'vendor' || !currentUser?.role || currentUser?.role === 'Contractor';

  // If URL has ?app=admin or running on Port 3001, render strictly the dedicated Admin Mobile App!
  if (isAppAdmin) {
    return (
      <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#0B0F19] flex flex-col items-center justify-center landscape:justify-start p-0 sm:py-4 sm:px-2 landscape:p-0 landscape:py-0 selection:bg-[#BA3A24] selection:text-white font-sans overflow-hidden">
        {showSplash && (
          <OpeningSplashScreen
            onComplete={handleSplashComplete}
            durationMs={900}
            portalLabel="Admin Command Portal"
          />
        )}
        <AdminMobileApp
          onSwitchToPartnerApp={() => {
            const host = window.location.hostname || 'localhost';
            const protocol = window.location.protocol || 'http:';
            if (host === 'localhost' || host === '127.0.0.1') {
              window.location.href = `${protocol}//${host}:3002/`;
            } else {
              const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
              window.location.href = `${pathname}?app=vendor`;
            }
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // VENDOR MOBILE APP (Dedicated Partner / Vendor Mobile Portal)
  // =========================================================================
  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-stone-900/60 flex flex-col items-center justify-center landscape:justify-start p-0 sm:py-4 landscape:p-0 landscape:py-0 selection:bg-[#C84826] selection:text-white font-serif overflow-hidden">
      {showSplash && (
        <OpeningSplashScreen
          onComplete={handleSplashComplete}
          durationMs={900}
          portalLabel="Vendor Partner Portal"
        />
      )}
      <div className="w-full max-w-[440px] landscape:max-w-2xl bg-[#FAF9F6] h-[100dvh] max-h-[100dvh] sm:h-[min(900px,94vh)] sm:min-h-0 landscape:h-[100dvh] landscape:max-h-[100dvh] landscape:min-h-0 rounded-none sm:rounded-[40px] landscape:rounded-none overflow-hidden shadow-2xl border-0 sm:border landscape:border-0 border-stone-200/90 flex flex-col relative">
        
        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="fixed top-4 inset-x-4 z-50 max-w-sm mx-auto bg-[#A62C11] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-white/20 flex items-center space-x-2 text-xs font-semibold font-sans animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Dedicated Partner Email Verification Portal (When ?page=verify or ?code= is triggered) */}
        {showVerifyPortal && (
          <PartnerVerificationPortal
            initialCode={initialVerifyCode}
            onClose={() => {
              setShowVerifyPortal(false);
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, '', cleanUrl);
            }}
            onVerified={(vendor) => {
              setToastMsg(`✓ Account verified! Welcome ${vendor?.companyName || 'Partner'}.`);
            }}
          />
        )}

        {/* ===================================================================== */}
        {/* TOP OTA UPDATE NOTIFICATION BANNER (When Admin pushes new version)    */}
        {/* ===================================================================== */}
        {updateStatus.hasUpdate && isVersionHigher(updateStatus.latestVersion, updateStatus.installedVersion) && (
          <div className="bg-gradient-to-r from-[#A62C11] via-[#C84826] to-[#8B230C] text-white px-3.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 shadow-md flex items-center justify-between text-xs border-b border-white/20 shrink-0 font-sans sticky top-0 z-50">
            <div className="flex items-center space-x-2.5 overflow-hidden pr-1">
              <div className="p-1.5 rounded-lg bg-white/20 text-white shrink-0">
                <Rocket className="w-4 h-4 text-white animate-bounce" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-[11px] tracking-tight">
                    Update Available: {updateStatus.latestVersion}
                  </span>
                  <span className="text-[8.5px] bg-amber-400 text-stone-900 font-black px-1.5 py-0.2 rounded font-mono">
                    NEW
                  </span>
                </div>
                <p className="text-[9.5px] text-white/90 truncate leading-tight mt-0.5">
                  {updateStatus.changelog || 'Latest features & optimizations ready.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleTriggerUpdate}
              disabled={isUpdating}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 text-[#A62C11] font-black text-[10.5px] rounded-lg shadow-sm transition active:scale-95 cursor-pointer shrink-0 ml-2"
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
          </div>
        )}

        {/* Top App Control Bar (Pinned at top, clean, uncluttered & 100% responsive) */}
        {currentScreen !== 'signin' && (
          <header className="bg-[#1C1917] px-3.5 pt-[max(0.65rem,env(safe-area-inset-top))] pb-2 text-white flex items-center justify-between text-xs border-b border-stone-800 shrink-0 font-sans sticky top-0 z-40 shadow-xs">
            {/* Left: Branded Logo only (Text removed per user request) */}
            <div className="flex items-center min-w-0">
              <img
                src="/logo-white.png"
                alt="DuraGrit"
                className="h-6 sm:h-7 w-auto max-w-[130px] sm:max-w-[160px] object-contain shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo.png';
                }}
              />
            </div>

            {/* Right: Version Number, Sync Status Badge, and Logout Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Version Number */}
              <span className="text-[9.5px] sm:text-[10.5px] font-mono font-bold text-stone-300 bg-white/10 px-2 py-0.5 rounded-full border border-stone-700/80 shrink-0">
                {updateStatus.installedVersion || 'v4.8.5'}
              </span>

              {/* Sync Status Badge */}
              <span className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/40 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sync ✓</span>
              </span>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  setCurrentScreen('signin');
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/25 text-stone-300 hover:text-red-300 transition cursor-pointer active:scale-95 flex items-center justify-center shrink-0 border border-stone-700/60"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}

        {/* Active Screen View (Scrolls independently between pinned header and footer) */}
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {currentScreen === 'signin' && (
            <Step8_MobileSignIn
              onLoginSuccess={() => {
                setCurrentScreen('dashboard');
              }}
            />
          )}

          {currentScreen === 'dashboard' && (
            isVendor ? (
              <Step9_VendorDashboard
                vendorId={currentUser?.vendorId || currentUser?.id}
                onNavigateScan={() => setCurrentScreen('scan')}
                onNavigateRequests={() => setCurrentScreen('requests')}
                onNavigateDossier={() => setCurrentScreen('dossier')}
                onLogout={() => {
                  logout();
                  setCurrentScreen('signin');
                }}
              />
            ) : (
              <Step9_ContractorDashboard
                onNavigateScan={() => setCurrentScreen('scan')}
                onNavigateRequests={() => setCurrentScreen('requests')}
                onNavigateDossier={() => setCurrentScreen('dossier')}
                onLogout={() => {
                  logout();
                  setCurrentScreen('signin');
                }}
              />
            )
          )}

          {currentScreen === 'dossier' && (
            <Step13_WelcomeDossier
              onBack={() => setCurrentScreen('dashboard')}
            />
          )}

          {currentScreen === 'scan' && (
            <Step10_QRScanUpload
              onBack={() => setCurrentScreen('dashboard')}
              onClaimCreated={() => setCurrentScreen('requests')}
            />
          )}

          {currentScreen === 'requests' && (
            <Step11_MyCashbackRequests
              onBack={() => setCurrentScreen('dashboard')}
              onNavigateScan={() => setCurrentScreen('scan')}
            />
          )}
        </div>

        {/* Unified Bottom Navigation Bar (Permanently pinned at bottom, never hides on scroll) */}
        {currentScreen !== 'signin' && (
          <nav className="shrink-0 sticky bottom-0 inset-x-0 bg-white/98 backdrop-blur-md border-t border-[#ECEAE6] px-3 pt-2 pb-[max(0.65rem,env(safe-area-inset-bottom))] flex items-center justify-around z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] font-sans">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                currentScreen === 'dashboard' ? 'text-[#A6300F] font-bold' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Overview</span>
            </button>

            <button
              onClick={() => setCurrentScreen('requests')}
              className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                currentScreen === 'requests' ? 'text-[#A6300F] font-bold' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Registry</span>
            </button>

            {/* Tab 3: Central Elevated Round QR Scan Tab (Always Available) */}
            <button
              onClick={() => setCurrentScreen('scan')}
              className="flex flex-col items-center justify-center -mt-6 cursor-pointer group shrink-0"
              title="Scan QR Code"
            >
              <div
                className={`w-13 h-13 rounded-full text-white flex items-center justify-center shadow-lg transition-all border-3 border-white active:scale-95 ${
                  currentScreen === 'scan'
                    ? 'bg-[#7E1D05] ring-3 ring-[#C84826] scale-105 shadow-xl'
                    : 'bg-[#A6300F] hover:bg-[#8B230C] group-hover:scale-105'
                }`}
              >
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span
                className={`text-[9.5px] font-bold mt-0.5 tracking-tight ${
                  currentScreen === 'scan' ? 'text-[#A6300F]' : 'text-stone-600'
                }`}
              >
                Scan QR
              </span>
            </button>

            {/* Tab 4: Orders */}
            <button
              onClick={() => setCurrentScreen('requests')}
              className={`flex flex-col items-center gap-0.5 relative transition-all cursor-pointer text-stone-400 hover:text-stone-700`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">Orders</span>
            </button>

            {/* Tab 5: Account / Dossier & Settings */}
            <button
              onClick={() => setCurrentScreen('dossier')}
              className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                currentScreen === 'dossier' ? 'text-[#A6300F] font-bold' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              {currentUser?.avatarUrl || currentUser?.profileImage ? (
                <img
                  src={currentUser.avatarUrl || currentUser.profileImage}
                  alt="Account"
                  className="w-5 h-5 rounded-full object-cover border border-stone-300"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span className="text-[10px] tracking-tight">Account</span>
            </button>
          </nav>
        )}

        {/* ===================================================================== */}
        {/* INTERACTIVE OTA UPDATE POPUP & INSTALLATION MODAL                     */}
        {/* ===================================================================== */}
        {showUpdateModal && updateStatus.hasUpdate && isVersionHigher(updateStatus.latestVersion, updateStatus.installedVersion) && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
            <div className="bg-[#1C1917] border border-stone-700 text-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 relative overflow-hidden">
              
              {/* Soft decorative glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#C84826]/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>

              {!isUpdating ? (
                /* 1. ANNOUNCEMENT & ACTION POPUP */
                <div className="space-y-4 relative z-10">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#A62C11] via-[#C84826] to-amber-500 flex items-center justify-center shadow-lg shadow-[#A62C11]/40 border border-white/20">
                    <Rocket className="w-8 h-8 text-white animate-bounce" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-black text-amber-300 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      New Release {updateStatus.latestVersion || 'v4.8.3'}
                    </div>
                    <h3 className="text-lg font-black text-white tracking-tight">
                      New Software Update Ready!
                    </h3>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      A new official version has been published with important mobile UI responsiveness fixes and real-time vendor sync.
                    </p>
                  </div>

                  {/* Highlights Card */}
                  <div className="bg-stone-900/90 rounded-2xl p-3 border border-stone-800 text-left space-y-2 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span className="text-stone-300">Mobile responsive 1-Tap header &amp; login layout fixed</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span className="text-stone-300">Real-time database sync with Admin Vendor Management</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span className="text-stone-300">Fast 1-tap in-app refresh — no APK reinstall needed</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleTriggerUpdate}
                      className="w-full py-3 bg-gradient-to-r from-[#C84826] to-[#A62C11] hover:brightness-110 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-[#C84826]/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>⚡ Update Now &amp; Apply Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpdateModal(false);
                        if (updateStatus.latestVersion) {
                          sessionStorage.setItem('duragrit_ota_dismissed_' + updateStatus.latestVersion, 'true');
                          localStorage.setItem('duragrit_ota_dismissed_' + updateStatus.latestVersion, 'true');
                        }
                      }}
                      className="w-full py-2 text-stone-400 hover:text-stone-200 text-xs font-semibold transition cursor-pointer"
                    >
                      Remind Me Later
                    </button>
                  </div>
                </div>
              ) : (
                /* 2. DOWNLOADING & APPLYING PROGRESS POPUP */
                <div className="space-y-4 relative z-10">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#A62C11] to-[#C84826] flex items-center justify-center shadow-lg">
                    <Rocket className="w-7 h-7 text-white animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-white">
                      {updateProgress === 100 ? 'Update Complete!' : `Installing Update ${updateStatus.latestVersion || 'v4.8.3'}`}
                    </h3>
                    <p className="text-xs text-stone-400">
                      {updateStatusMessage}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-stone-800 rounded-full h-3 overflow-hidden border border-stone-700">
                      <div
                        className="bg-gradient-to-r from-[#C84826] to-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${updateProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                      <span>DuraGrit OTA System</span>
                      <span>{updateProgress}%</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-500 pt-1">
                    Refreshing application bundles and applying latest changes...
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
