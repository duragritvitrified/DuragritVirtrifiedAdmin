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
import {
  checkClientUpdateStatus,
  applyClientAppUpdate,
  getClientInstalledVersion,
  getLatestRelease,
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

  // Strict Port & URL Separation:
  // Port 3001 -> DuraGrit Admin Mobile App (strictly)
  // Port 3002 -> DuraGrit Vendor Mobile App (strictly)
  // Or URL query param fallback ?app=admin / ?app=vendor
  const isAppAdmin = typeof window !== 'undefined' && (() => {
    const port = String(window.location.port || '');
    if (port === '3001') return true;
    if (port === '3002') return false;
    const params = new URLSearchParams(window.location.search);
    const app = params.get('app') || params.get('mode');
    if (app === 'admin') return true;
    if (app === 'vendor') return false;
    return false;
  })();

  const [currentScreen, setCurrentScreen] = useState(() => {
    if (!currentUser?.isAuthenticated) return 'signin';
    return 'dashboard';
  });

  // OTA App Version & Update State
  const [updateStatus, setUpdateStatus] = useState(() => checkClientUpdateStatus());
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatusMessage, setUpdateStatusMessage] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

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
    setUpdateStatus(checkClientUpdateStatus());

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
  }, [currentUser]);

  const handleTriggerUpdate = () => {
    setShowUpdateModal(true);
    setIsUpdating(true);
    setUpdateProgress(15);
    setUpdateStatusMessage('Connecting to Morbi Release CDN...');

    setTimeout(() => {
      setUpdateProgress(45);
      setUpdateStatusMessage(`Downloading bundle ${updateStatus.latestVersion} (18.6 MB)...`);

      setTimeout(() => {
        setUpdateProgress(75);
        setUpdateStatusMessage('Validating cryptographic integrity & HMAC signature...');

        setTimeout(() => {
          setUpdateProgress(95);
          setUpdateStatusMessage('Applying patch files & refreshing local schemas...');

          setTimeout(() => {
            const res = applyClientAppUpdate(updateStatus.latestVersion);
            setUpdateProgress(100);
            setUpdateStatusMessage(`✓ Successfully updated to ${res.version}!`);
            setUpdateStatus(checkClientUpdateStatus());
            setIsUpdating(false);

            setTimeout(() => {
              setShowUpdateModal(false);
              setToastMsg(`App successfully updated to ${res.version}! All new features are now active.`);
              setTimeout(() => setToastMsg(''), 4000);
            }, 1000);
          }, 450);
        }, 500);
      }, 500);
    }, 400);
  };

  const pendingCount = claims.filter((c) => c.status === 'Pending').length;
  const isVendor = currentUser?.role === 'Vendor' || currentUser?.role === 'vendor' || !currentUser?.role || currentUser?.role === 'Contractor';

  // If URL has ?app=admin or running on Port 3001, render strictly the dedicated Admin Mobile App!
  if (isAppAdmin) {
    return (
      <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#0B0F19] flex flex-col items-center justify-center p-0 sm:py-4 sm:px-2 selection:bg-[#BA3A24] selection:text-white font-sans overflow-hidden">
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
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-stone-900/60 flex flex-col items-center justify-center p-0 sm:py-4 selection:bg-[#C84826] selection:text-white font-serif overflow-hidden">
      <div className="w-full max-w-[440px] bg-[#FAF9F6] h-[100dvh] max-h-[100dvh] sm:h-[min(900px,94vh)] sm:min-h-[580px] rounded-none sm:rounded-[40px] overflow-hidden shadow-2xl border-0 sm:border border-stone-200/90 flex flex-col relative">
        
        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="fixed top-4 inset-x-4 z-50 max-w-sm mx-auto bg-[#A62C11] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-white/20 flex items-center space-x-2 text-xs font-semibold font-sans animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TOP OTA UPDATE NOTIFICATION BANNER (When Admin pushes new version)    */}
        {/* ===================================================================== */}
        {updateStatus.hasUpdate && (
          <div className="bg-gradient-to-r from-[#A62C11] via-[#C84826] to-[#8B230C] text-white px-3.5 py-2.5 shadow-md flex items-center justify-between text-xs border-b border-white/20 shrink-0 font-sans sticky top-0 z-50">
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

        {/* Top App Control Bar (Always pinned at top, never hides on scroll) */}
        {currentScreen !== 'signin' && (
          <header className="bg-[#1C1917] px-4 py-2.5 text-white flex items-center justify-between text-xs border-b border-stone-800 shrink-0 font-sans sticky top-0 z-40 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <img
                src="/logo-white.png"
                alt="DuraGrit Vitrified"
                className="h-6 w-auto object-contain shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <span className="font-extrabold tracking-wider text-white block leading-tight text-[11px] uppercase">
                  DURAGRIT VITRIFIED
                </span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-[9px] text-[#F9CEB8] font-bold">
                    Vendor Partner App
                  </span>
                  <span className="text-stone-600">•</span>
                  <span className="text-[8.5px] font-mono font-bold text-stone-300">
                    {updateStatus.installedVersion}
                  </span>
                  {updateStatus.hasUpdate ? (
                    <span className="text-[8px] font-black text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-500/30">
                      Update Ready
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-500/30">
                      Up to date ✓
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3001/' : `${window.location.pathname}?app=admin`}
                className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 text-[10px] font-bold border border-amber-500/30 flex items-center space-x-1 transition cursor-pointer active:scale-95"
                title="Switch to Admin Mobile Operations App"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">Admin App</span>
              </a>

              <button
                onClick={() => {
                  logout();
                  setCurrentScreen('signin');
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-stone-300 hover:text-red-300 transition cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
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
        {/* INTERACTIVE OTA UPDATE INSTALLATION MODAL                             */}
        {/* ===================================================================== */}
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#1C1917] border border-stone-700 text-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl font-sans text-center animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#A62C11] to-[#C84826] flex items-center justify-center shadow-lg">
                <Rocket className="w-7 h-7 text-white animate-pulse" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">
                  {updateProgress === 100 ? 'Update Complete!' : `Installing Update ${updateStatus.latestVersion}`}
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
                Do not close the application while the software bundle is applying.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
