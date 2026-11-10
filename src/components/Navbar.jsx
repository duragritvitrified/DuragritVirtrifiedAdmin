import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDown,
  User,
  LogOut,
  Smartphone,
  Laptop,
  Menu
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, currentMode, setMode, onToggleMobileSidebar }) => {
  const { currentUser, logout, sessionFormatted } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-[#E7E5E4] sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between shadow-xs select-none font-sans">
      {/* Left Brand Lockup & Mobile Menu Toggle */}
      <div className="flex items-center space-x-2 sm:space-x-3.5">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 -ml-1 text-stone-700 hover:text-[#C84826] hover:bg-stone-100 rounded-lg transition cursor-pointer"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div
          onClick={() => setActiveTab && setActiveTab('dashboard')}
          className="flex items-center space-x-2 cursor-pointer group"
          title="DuraGrit Vitrified — Stronger Bonds. Lasting Trust."
        >
          <img
            src="/logo.png"
            alt="DuraGrit Vitrified"
            className="h-7 sm:h-9 w-auto object-contain transition-transform group-hover:scale-102"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span className="hidden sm:inline-flex items-center text-[10px] font-black uppercase tracking-wider bg-[#FEF2EE] text-[#A62C11] border border-[#C84826]/25 px-2 py-0.5 rounded-full font-mono">
            ERP PORTAL
          </span>
        </div>

        <div className="h-5 w-px bg-stone-300 hidden sm:block"></div>

        <span className="text-xs font-semibold tracking-tight text-stone-600 hidden lg:inline">
          Retail &amp; QR Manage
        </span>
      </div>

      {/* Right User & Profile Pill matching PDF Blueprint */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Desktop ERP Environment Indicator (Field App button hidden per user request) */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E7E5E4] text-[11px] font-bold text-[#C84826]">
          <Laptop className="w-3.5 h-3.5 shrink-0 text-[#C84826]" />
          <span>Desktop ERP</span>
        </div>

        {/* Profile Pill matching PDF: RK dark circle + Admin / Super Admin + ⌄ */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-1.5 sm:space-x-2 pl-1 pr-2 sm:pr-2.5 py-1 rounded-full border border-[#E7E5E4] bg-[#FAF9F6] hover:bg-stone-100 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#1C1917] text-white font-bold text-xs flex items-center justify-center font-mono">
              RK
            </div>
            <div className="text-left text-xs leading-tight hidden xs:block sm:block">
              <span className="font-bold text-stone-900 block text-[11px]">Admin</span>
              <span className="text-[9.5px] text-stone-400 block -mt-0.5">Super Admin</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E7E5E4] py-2 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-stone-100">
                <div className="font-bold text-stone-900">
                  {currentUser?.name || 'DuraGrit Principal Admin'}
                </div>
                <div className="text-[11px] text-stone-500 font-mono truncate">
                  {currentUser?.email || 'duragrit07@gmail.com'}
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  Session: <span className="font-mono font-bold text-stone-700">{sessionFormatted}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveTab('catalog');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-stone-700 hover:bg-[#FEF2EE] hover:text-[#C84826] font-medium"
                >
                  Tiles &amp; SKU Catalog
                </button>
                <button
                  onClick={() => {
                    setActiveTab('users');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-stone-700 hover:bg-[#FEF2EE] hover:text-[#C84826] font-medium"
                >
                  User Directory
                </button>
              </div>

              <div className="border-t border-stone-100 my-1"></div>

              <button
                onClick={logout}
                className="w-full text-left px-3.5 py-2 text-[#A62C11] hover:bg-[#FEF2EE] font-bold flex items-center space-x-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of ERP</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
