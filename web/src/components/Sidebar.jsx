import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getDeviceInstalls } from '../services/appInstallService';
import {
  LayoutDashboard,
  Users,
  Package,
  Wallet,
  BarChart2,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Mail,
  SendHorizonal,
  Settings,
  Smartphone,
  Truck,
  Workflow,
  Eye,
  FileText,
  X,
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isMobileOpen, onCloseMobile }) => {
  const { logout } = useAuth();
  const { users = [], skus = [], vendors = [], claims = [] } = useData();

  const pendingClaimsCount = claims.filter((c) => c.status === 'Pending').length;
  const activeInstallsCount = getDeviceInstalls ? getDeviceInstalls().length : 0;

  const productSubItems = [
    { id: 'qr-generator', label: 'QR Batch Generator' },
    { id: 'catalog', label: 'Tiles & SKU Catalog' },
  ];

  const reportSubItems = [
    { id: 'reports-vendor', label: 'Vendor Sales & Cashback', badge: 'Live' },
    { id: 'reports', label: 'Executive BI Analytics' },
    { id: 'reports-financial', label: 'Financial & Tax Audit' },
  ];

  const settingsSubItems = [
    { id: 'settings', label: 'Overview & DB Sync' },
    { id: 'settings-app-download', label: '📱 Mobile APK & iOS PWA', badge: 'Download' },
    { id: 'settings-smtp', label: 'Email & SMTP Config' },
    { id: 'settings-security', label: 'Admin Credentials' },
    { id: 'settings-sms', label: 'SMS Gateway' },
  ];

  const emailSubItems = [
    { id: 'email-templates', label: 'View Email Templates', badge: '5' },
    { id: 'email-reports', label: 'Dispatches & Logs', badge: 'Audit' },
  ];

  const isProductSubActive = productSubItems.some((item) => item.id === activeTab);
  const isReportSubActive = activeTab === 'reports' || reportSubItems.some((item) => item.id === activeTab);
  const isEmailSubActive = activeTab === 'email-reports' || activeTab === 'email-templates';
  const isSettingsSubActive = activeTab === 'settings' || settingsSubItems.some((item) => item.id === activeTab);

  // Helper to identify which collapsible section contains the given tab
  const getSectionForTab = (tab) => {
    if (productSubItems.some((i) => i.id === tab)) return 'product';
    if (tab === 'reports' || reportSubItems.some((i) => i.id === tab)) return 'report';
    if (tab === 'email-reports' || tab === 'email-templates' || emailSubItems.some((i) => i.id === tab)) return 'email';
    if (tab === 'settings' || settingsSubItems.some((i) => i.id === tab)) return 'settings';
    return null;
  };

  // Accordion State: Only one section's subpages open at a time
  const [openSection, setOpenSection] = useState(() => getSectionForTab(activeTab));

  // Automatically keep only the active section open when activeTab changes
  useEffect(() => {
    const sec = getSectionForTab(activeTab);
    if (sec) {
      setOpenSection(sec);
    }
  }, [activeTab]);

  const handleNav = (tabId) => {
    setActiveTab(tabId);
    const sec = getSectionForTab(tabId);
    setOpenSection(sec); // Automatically minimises all subpages if opening a standalone section
    if (onCloseMobile) onCloseMobile();
  };

  const toggleSection = (sectionKey, defaultTab) => {
    if (openSection === sectionKey) {
      // If clicking currently open section, minimise it
      setOpenSection(null);
    } else {
      // Open this section and automatically minimise all other sections
      setOpenSection(sectionKey);
      if (defaultTab && getSectionForTab(activeTab) !== sectionKey) {
        setActiveTab(defaultTab);
        if (onCloseMobile) onCloseMobile();
      }
    }
  };

  const productMenuOpen = openSection === 'product';
  const reportMenuOpen = openSection === 'report';
  const emailMenuOpen = openSection === 'email';
  const settingsMenuOpen = openSection === 'settings';

  const navBtnClass = (isActive) =>
    `w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all cursor-pointer ${
      isActive
        ? 'bg-[#FEF2EE] text-[#A62C11] font-bold border border-[#C84826]/30 shadow-xs'
        : 'text-stone-600 hover:bg-stone-50 font-medium'
    }`;

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 md:w-64 lg:w-72 bg-white border-r border-[#E7E5E0]
          flex flex-col justify-between py-4 sm:py-5 shrink-0 select-none overflow-y-auto h-full font-sans
          transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Drawer Header with Close Button */}
        <div className="flex md:hidden items-center justify-between px-4 pb-3 mb-2 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="DuraGrit" className="h-6 w-auto" />
            <span className="font-black text-xs text-stone-800 tracking-tight">ERP Navigation</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="space-y-1.5 px-3">
          {/* 0. Executive Dashboard */}
          <button
            onClick={() => handleNav('dashboard')}
            className={navBtnClass(activeTab === 'dashboard')}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard
                className={`w-4 h-4 ${
                  activeTab === 'dashboard' ? 'text-[#C84826]' : 'text-stone-400'
                }`}
              />
              <span>Executive Dashboard</span>
            </div>
            <span className="text-[10px] bg-[#FEF2EE] text-[#C84826] font-extrabold px-1.5 py-0.5 rounded-full border border-[#C84826]/25 font-mono">
              LIVE
            </span>
          </button>

          {/* 1. User Manage */}
          <button
            onClick={() => handleNav('users')}
            className={navBtnClass(activeTab === 'users')}
          >
          <div className="flex items-center space-x-3">
            <Users
              className={`w-4 h-4 ${
                activeTab === 'users' ? 'text-[#C84826]' : 'text-stone-400'
              }`}
            />
            <span>1. User Manage</span>
          </div>
          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
            {users.length}
          </span>
        </button>

        {/* 2. Product Manage */}
        <div
          className={`rounded-lg p-1.5 border transition-all ${
            isProductSubActive
              ? 'bg-[#FEF2EE]/70 border-[#C84826]/25'
              : 'bg-transparent border-transparent'
          }`}
        >
          <button
            onClick={() => toggleSection('product', 'catalog')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              isProductSubActive
                ? 'text-[#A62C11] font-bold'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Package
                className={`w-4 h-4 ${
                  isProductSubActive ? 'text-[#C84826]' : 'text-stone-400'
                }`}
              />
              <span>2. Product Manage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                {skus.length}
              </span>
              {productMenuOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              )}
            </div>
          </button>

          {productMenuOpen && (
            <div className="mt-1 pl-6 pr-1 space-y-0.5">
              {productSubItems.map((sub) => {
                const isActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleNav(sub.id)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-[11px] flex items-center transition-all cursor-pointer ${
                      isActive
                        ? 'font-bold text-[#A62C11] bg-white shadow-xs border-l-2 border-[#C84826] pl-2.5'
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50/80 font-medium'
                    }`}
                  >
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Cashback Request */}
        <button
          onClick={() => handleNav('cashback')}
          className={navBtnClass(activeTab === 'cashback')}
        >
          <div className="flex items-center space-x-3">
            <Wallet
              className={`w-4 h-4 ${
                activeTab === 'cashback' ? 'text-[#C84826]' : 'text-stone-400'
              }`}
            />
            <span>3. Cashback Request</span>
          </div>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-full font-mono ${
              pendingClaimsCount > 0
                ? 'bg-[#C84826] text-white shadow-xs'
                : 'bg-stone-100 text-stone-500'
            }`}
          >
            {pendingClaimsCount}
          </span>
        </button>

        {/* 4. Report Section with Submenus */}
        <div
          className={`rounded-lg p-1.5 border transition-all ${
            isReportSubActive
              ? 'bg-[#FEF2EE]/70 border-[#C84826]/25'
              : 'bg-transparent border-transparent'
          }`}
        >
          <button
            onClick={() => toggleSection('report', 'reports-vendor')}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              isReportSubActive
                ? 'text-[#A62C11] font-bold'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <BarChart2
                className={`w-4 h-4 ${
                  isReportSubActive ? 'text-[#C84826]' : 'text-stone-400'
                }`}
              />
              <span>4. Report</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                Live BI
              </span>
              {reportMenuOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              )}
            </div>
          </button>

          {reportMenuOpen && (
            <div className="mt-1 pl-6 pr-1 space-y-0.5">
              {reportSubItems.map((sub) => {
                const isActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleNav(sub.id)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-[11px] flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'font-bold text-[#A62C11] bg-white shadow-xs border-l-2 border-[#C84826] pl-2.5'
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50/80 font-medium'
                    }`}
                  >
                    <span className="truncate">{sub.label}</span>
                    {sub.badge && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#C84826] text-white">
                        {sub.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Vendor Manage */}
        <button
          onClick={() => handleNav('vendor-manage')}
          className={navBtnClass(activeTab === 'vendor-manage')}
        >
          <div className="flex items-center space-x-3">
            <Truck
              className={`w-4 h-4 ${
                activeTab === 'vendor-manage' ? 'text-[#C84826]' : 'text-stone-400'
              }`}
            />
            <span>5. Vendor Manage</span>
          </div>
          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
            {vendors.length}
          </span>
        </button>

        {/* 6. Onboarding & APK Dossier */}
        <button
          onClick={() => handleNav('onboarding')}
          className={navBtnClass(activeTab === 'onboarding')}
        >
          <div className="flex items-center space-x-3">
            <Mail
              className={`w-4 h-4 ${
                activeTab === 'onboarding' ? 'text-[#C84826]' : 'text-stone-400'
              }`}
            />
            <span>6. Onboarding &amp; APK</span>
          </div>
          <span className="text-[10px] bg-[#FEF2EE] text-[#C84826] font-bold px-1.5 py-0.5 rounded">
            Gateway
          </span>
        </button>

        {/* 7. Email Reports & Template Audit */}
        <div>
          <button
            onClick={() => toggleSection('email', 'email-templates')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all cursor-pointer ${
              isEmailSubActive
                ? 'bg-[#FEF2EE] text-[#A62C11] font-bold border border-[#C84826]/30 shadow-xs'
                : 'text-stone-600 hover:bg-stone-50 font-medium'
            }`}
          >
            <div className="flex items-center space-x-3">
              <SendHorizonal
                className={`w-4 h-4 ${
                  isEmailSubActive ? 'text-[#C84826]' : 'text-stone-400'
                }`}
              />
              <span>7. Email Reports</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                Gmail
              </span>
              {emailMenuOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              )}
            </div>
          </button>

          {emailMenuOpen && (
            <div className="mt-1 pl-6 pr-1 space-y-0.5">
              {emailSubItems.map((sub) => {
                const isActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleNav(sub.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#A62C11] text-white font-bold'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {sub.id === 'email-templates' ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      <span>{sub.label}</span>
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-white text-[#A62C11]'
                          : sub.badge === '5'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {sub.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 8. System Settings & Mobile Download Console */}
        <div>
          <button
            onClick={() => toggleSection('settings', 'settings')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all cursor-pointer ${
              isSettingsSubActive
                ? 'bg-[#FEF2EE] text-[#A62C11] font-bold border border-[#C84826]/30 shadow-xs'
                : 'text-stone-600 hover:bg-stone-50 font-medium'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Settings
                className={`w-4 h-4 ${
                  isSettingsSubActive ? 'text-[#C84826]' : 'text-stone-400'
                }`}
              />
              <span>8. System Settings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-[#FEF2EE] text-[#C84826] font-bold px-1.5 py-0.5 rounded">
                Config
              </span>
              {settingsMenuOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              )}
            </div>
          </button>

          {settingsMenuOpen && (
            <div className="mt-1 pl-6 pr-1 space-y-0.5">
              {settingsSubItems.map((sub) => {
                const isActive = activeTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleNav(sub.id)}
                    className={`w-full text-left py-1.5 px-2.5 rounded-md text-[11px] flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'font-bold text-[#A62C11] bg-white shadow-xs border-l-2 border-[#C84826] pl-2.5'
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50/80 font-medium'
                    }`}
                  >
                    <span>{sub.label}</span>
                    {sub.badge && (
                      <span className="text-[9px] bg-[#C84826] text-white px-1.5 py-0.2 rounded font-mono font-bold">
                        {sub.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 9. App Installs & Telemetry */}
        <button
          onClick={() => handleNav('app-installs')}
          className={navBtnClass(activeTab === 'app-installs')}
        >
          <div className="flex items-center space-x-3">
            <Smartphone
              className={`w-4 h-4 ${
                activeTab === 'app-installs' ? 'text-[#C84826]' : 'text-stone-400'
              }`}
            />
            <span>9. App Installs</span>
          </div>
          <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-1.5 py-0.5 rounded font-mono">
            {activeInstallsCount} Live
          </span>
        </button>

        {/* 10. 14-Step Supply Chain Master Workflow */}
        <button
          onClick={() => handleNav('master-workflow')}
          className={navBtnClass(activeTab === 'master-workflow')}
        >
          <div className="flex items-center space-x-3">
            <Workflow
              className={`w-4 h-4 ${
                activeTab === 'master-workflow' ? 'text-[#C84826]' : 'text-stone-400'
              }`}
            />
            <span>10. Master Pipeline</span>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded">
            14 Steps
          </span>
        </button>
      </nav>

      {/* Security notice & Bottom Sign Out */}
      <div className="px-4 border-t border-[#E7E5E0] pt-4 space-y-3">
        <div className="bg-[#FAF9F6] rounded-lg p-2.5 border border-[#E7E5E0] text-[10px] text-stone-500">
          <div className="flex items-center space-x-1.5 font-bold text-[#A62C11] mb-0.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#C84826]" />
            <span>DuraGrit Security Engine</span>
          </div>
          FIPS 140-2 Level 3 HSM Token &amp; SHA-256 Code Verification Active.
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center space-x-2.5 text-xs font-semibold text-stone-600 hover:text-[#A62C11] transition-colors py-2 px-2 rounded-lg hover:bg-stone-50 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-stone-400" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
    </>
  );
};
