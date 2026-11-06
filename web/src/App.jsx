import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { TopStatusBar } from './components/TopStatusBar';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { processVerificationToken, sendOnboardingEmail } from './services/emailService';

// Enterprise ERP Modules
import { Dashboard } from './modules/0_Dashboard/Dashboard';
import { AdminLogin } from './modules/1_AdminLogin/AdminLogin';
import { MasterWorkflowIndex } from './modules/0_MasterWorkflowIndex/MasterWorkflowIndex';
import { UserManagement } from './modules/1_UserManagement/UserManagement';
import { CashbackRequests } from './modules/2_CashbackRequests/CashbackRequests';
import { ReportsAnalytics } from './modules/3_ReportsAnalytics/ReportsAnalytics';
import { VendorSalesReport } from './modules/3_ReportsAnalytics/VendorSalesReport';
import { FinancialReports } from './modules/14_FinancialReports/FinancialReports';
import { ProductCatalogMaster } from './modules/2_ProductCatalog/ProductCatalogMaster';
import { QRBatchGeneratorMaster } from './modules/4_QRBatchGenerator/QRBatchGeneratorMaster';
import { BatchSerialRegistry } from './modules/5_BatchSerialRegistry/BatchSerialRegistry';
import { DistributorDispatch } from './modules/6_DistributorDispatch/DistributorDispatch';
import { DealerCartonInward } from './modules/7_DealerCartonInward/DealerCartonInward';
import { ContractorRedemption } from './modules/8_ContractorRedemption/ContractorRedemption';
import { AntiFraudEscrow } from './modules/9_AntiFraudEscrow/AntiFraudEscrow';
import { ExecutiveSettlement } from './modules/10_ExecutiveSettlement/ExecutiveSettlement';
import { MobileFieldApp } from './modules/11_MobileFieldApp/MobileFieldApp';
import { OnboardingDossier } from './modules/15_OnboardingDossier/OnboardingDossier';
import { EmailReports } from './modules/16_EmailReports/EmailReports';
import { SystemSettings } from './modules/17_SystemSettings/SystemSettings';
import { AppInstallReports } from './modules/18_AppInstallReports/AppInstallReports';
import { VendorManagement } from './modules/7_VendorDirectory/VendorManagement';

export function App() {
  const { currentUser } = useAuth();
  
  // Navigation State
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Normalize tab aliases so all dashboard/sidebar links work seamlessly
  const handleSetActiveTab = (tab) => {
    if (tab === 'qr-batch') setActiveTab('qr-generator');
    else if (tab === 'vendors') setActiveTab('vendor-manage');
    else setActiveTab(tab);
  };

  // Email Verification Toast
  const [verifyBanner, setVerifyBanner] = useState(null); // { success, name, userId }

  // ── On mount: handle ?verify=TOKEN in URL (email verification link) ──────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('verify');
    if (!token) return;

    const result = processVerificationToken(token);

    if (result.success) {
      if (result.isVendor) {
        setVerifyBanner({
          success: true,
          name: result.name || 'Partner',
          userId: result.id,
          message: `✅ Partner Email Verified! Welcome ${result.name} (${result.id}) — Login credentials & APK dossier dispatched to your inbox.`
        });
      } else {
        const user = result.user;
        setVerifyBanner({
          success: true,
          name: user?.name || result.name || 'User',
          userId: user ? (String(user.id).startsWith('USR-') ? user.id : `USR-${user.id}`) : `USR-${result.userId || result.id}`,
          message: `✅ Email Verified! Welcome ${result.name || user?.name} — Login credentials & APK setup guide sent to your inbox.`
        });
      }
    } else {
      setVerifyBanner({ success: false, name: '', userId: '' });
    }

    // Clean URL (remove ?verify= param without reload)
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    // Auto-dismiss banner after 9 seconds
    setTimeout(() => setVerifyBanner(null), 9000);
  }, []);

  // Direct Step Navigator from Master Workflow
  const handleNavigateStep = (stepNum) => {
    switch (stepNum) {
      case 0:
        setActiveTab('dashboard');
        break;
      case 2:
        setActiveTab('catalog');
        break;
      case 4:
        setActiveTab('qr-generator');
        break;
      case 5:
        setActiveTab('users');
        break;
      case 6:
        setActiveTab('cashback');
        break;
      case 7:
        setActiveTab('reports');
        break;
      case 8:
        setActiveTab('catalog');
        break;
      case 9:
        setActiveTab('batch-registry');
        break;
      case 10:
        setActiveTab('dispatch');
        break;
      case 11:
        setActiveTab('inward');
        break;
      case 12:
        setActiveTab('redemption');
        break;
      case 13:
        setActiveTab('escrow');
        break;
      case 14:
        setActiveTab('settlement');
        break;
      case 16:
        setActiveTab('email-reports');
        break;
      case 17:
        setActiveTab('settings');
        break;
      case 18:
        setActiveTab('app-installs');
        break;
      default:
        setActiveTab('master-workflow');
        break;
    }
  };

  const getFooterStepLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Overview & Live Supabase Sync';
      case 'master-workflow': return '14-Step Supply Chain Pipeline';
      case 'users': return 'Step 05 of 14: User & Partner Management';
      case 'cashback': return 'Step 06 of 14: 2-Step Cashback Disbursal';
      case 'reports': return 'Step 07 of 14: Reports & Analytics';
      case 'reports-vendor': return 'Step 07 of 14: Vendor Sales & Cashback Performance';
      case 'reports-financial': return 'Step 07 of 14: Financial & Statutory Tax Ledger';
      case 'catalog': return 'Step 02 of 14: Product Catalog & SKU Management';
      case 'qr-generator':
      case 'qr-batch': return 'Step 04 of 14: QR Code Batch Generator';
      case 'batch-registry': return 'Step 09 of 14: Batch Serial Registry';
      case 'dispatch': return 'Step 10 of 14: Distributor Dispatch';
      case 'inward': return 'Step 11 of 14: Dealer Carton Inward';
      case 'redemption': return 'Step 12 of 14: Contractor QR Redemption';
      case 'escrow': return 'Step 13 of 14: Anti-Fraud Escrow';
      case 'settlement': return 'Step 14 of 14: Executive Settlement';
      case 'onboarding': return 'Partner Credentials & APK Dossier';
      case 'email-reports': return 'Email Delivery & SMTP Audit Logs';
      case 'email-templates': return 'Official HTML Email Templates Showcase & Audit';
      case 'settings':
      case 'settings-app-download':
      case 'settings-smtp':
      case 'settings-security':
      case 'settings-sms':
        return activeTab === 'settings-app-download'
          ? 'Mobile Companion App APK & iPhone PWA Downloads'
          : 'System Settings & Supabase Sync Console';
      case 'app-installs': return 'Mobile App Installs & Device Telemetry Audit';
      case 'vendor-manage':
      case 'vendors': return 'Step 07 of 14: Vendor Supply Chain Directory';
      default: return 'Step 11 of 14';
    }
  };

  if (!currentUser?.isAuthenticated) {
    return <AdminLogin onSuccessfulLogin={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="h-screen bg-[#FAF9F6] flex flex-col font-sans antialiased text-slate-800 overflow-hidden">
      
      {/* ── Email Verification Success / Failure Banner ── */}
      {verifyBanner && (
        <div className={`flex items-center justify-between px-5 py-2.5 text-sm font-semibold z-50 ${
          verifyBanner.success
            ? 'bg-emerald-600 text-white'
            : 'bg-rose-600 text-white'
        }`}>
          <span>
            {verifyBanner.message || (verifyBanner.success
              ? `✅ Email Verified! Welcome ${verifyBanner.name} (${verifyBanner.userId})`
              : '⛔ Invalid or expired verification link. Please contact DuraGrit Admin to resend the verification email.')}
          </span>
          <button onClick={() => setVerifyBanner(null)} className="ml-4 text-white/80 hover:text-white font-bold text-base cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Brand Header matching PDF Pages 2-7, 13, 14 */}
      <Navbar 
        currentMode={deviceMode} 
        setMode={setDeviceMode} 
        currentTab={activeTab}
        setActiveTab={handleSetActiveTab}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main Viewport Container */}
      {deviceMode === 'desktop' ? (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar Navigation */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* ERP Module Main Viewport */}
          <main className="flex-1 bg-[#FAF9F6] overflow-y-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3.5 sm:py-5 md:py-6 max-w-full">
            <ErrorBoundary name="ERP Viewport">
              {activeTab === 'dashboard' && (
                <Dashboard onNavigateTab={handleSetActiveTab} />
              )}
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'catalog' && (
                <ProductCatalogMaster onNavigateQR={() => setActiveTab('qr-generator')} />
              )}
              {(activeTab === 'qr-generator' || activeTab === 'qr-batch') && (
                <QRBatchGeneratorMaster onNavigateCatalog={() => setActiveTab('catalog')} />
              )}
              {activeTab === 'cashback' && <CashbackRequests />}
              {activeTab === 'reports' && <ReportsAnalytics />}
              {activeTab === 'reports-vendor' && <VendorSalesReport />}
              {activeTab === 'reports-financial' && <FinancialReports />}
              {(activeTab === 'vendor-manage' || activeTab === 'vendors') && <VendorManagement />}
              {activeTab === 'onboarding' && (
                <OnboardingDossier onNavigateToFieldApp={() => setDeviceMode('mobile')} />
              )}
              {(activeTab === 'email-reports' || activeTab === 'email-templates') && (
                <EmailReports
                  initialMainTab={activeTab === 'email-templates' ? 'templates' : 'logs'}
                  onNavigateSettings={() => setActiveTab('settings-smtp')}
                />
              )}
              {(activeTab === 'settings' || activeTab.startsWith('settings-')) && (
                <SystemSettings
                  initialSubTab={
                    activeTab === 'settings-app-download'
                      ? 'mobile-downloads'
                      : activeTab === 'settings-smtp'
                      ? 'email-smtp'
                      : activeTab === 'settings-security'
                      ? 'security'
                      : activeTab === 'settings-sms'
                      ? 'sms-otp'
                      : 'general'
                  }
                />
              )}
              {activeTab === 'app-installs' && <AppInstallReports />}
              {activeTab === 'master-workflow' && (
                <MasterWorkflowIndex onNavigateStep={handleNavigateStep} />
              )}
              {activeTab === 'batch-registry' && <BatchSerialRegistry />}
              {activeTab === 'dispatch' && <DistributorDispatch />}
              {activeTab === 'inward' && <DealerCartonInward />}
              {activeTab === 'redemption' && <ContractorRedemption />}
              {activeTab === 'escrow' && <AntiFraudEscrow />}
              {activeTab === 'settlement' && <ExecutiveSettlement />}
            </ErrorBoundary>
          </main>
        </div>
      ) : (
        /* Mobile Field App (PWA & APK Preview) - Adapted for Laptop Screen */
        <div className="flex-1 flex overflow-hidden min-h-0">
          <MobileFieldApp onSwitchToDesktop={() => setDeviceMode('desktop')} />
        </div>
      )}

      {/* Pinned Enterprise Status Footer Bar (Permanently visible, never hides on scroll) */}
      <footer className="h-7 bg-[#1C1917] border-t border-stone-800 text-stone-300 text-[10px] px-3 sm:px-6 flex items-center justify-between shrink-0 select-none font-mono z-20">
        <div className="flex items-center space-x-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="text-white font-semibold truncate">{getFooterStepLabel()}</span>
          <span className="text-stone-500 hidden sm:inline">•</span>
          <span className="text-stone-400 hidden sm:inline">DuraGrit National Kiln Network</span>
        </div>
        <div className="flex items-center space-x-3 text-stone-400 shrink-0 text-[9.5px]">
          <span className="hidden md:inline">DB: Supabase PostgreSQL</span>
          <span>SLA: 99.98%</span>
          <span className="text-emerald-400 font-bold hidden sm:inline">ONLINE</span>
        </div>
      </footer>
    </div>
  );
}
