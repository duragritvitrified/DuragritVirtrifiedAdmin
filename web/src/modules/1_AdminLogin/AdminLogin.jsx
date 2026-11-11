import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const AdminLogin = ({ onSuccessfulLogin }) => {
  const { loginAsAdmin, authLoading, authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberTerminal, setRememberTerminal] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Please enter official email address.');
      return;
    }
    if (!password.trim()) {
      setLocalError('Please enter password.');
      return;
    }

    setSubmitting(true);
    try {
      // Auto-detect vendor credentials and guide to Vendor Portal
      const cleanInput = email.trim().toLowerCase();
      const isVendorFormat = cleanInput.startsWith('usr-') || (!cleanInput.includes('@') && cleanInput.length >= 10);
      
      const res = await loginAsAdmin(email, password, '1234', rememberTerminal);
      if (res.success) {
        if (onSuccessfulLogin) onSuccessfulLogin();
      } else {
        if (isVendorFormat) {
          setLocalError('Vendor Partner credentials detected. Redirecting to Vendor Mobile Portal...');
          setTimeout(() => {
            window.location.href = '/app/?app=vendor';
          }, 800);
          return;
        }
        setLocalError(res.message || 'Invalid administrator credentials.');
      }
    } catch (err) {
      setLocalError(err.message || 'Authentication failed. Please check network.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans select-none">
      <div className="w-full max-w-6xl mx-auto my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: Brand, Centered Header Logo, Creative Visual & Highlights */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 lg:p-9 flex flex-col justify-between h-full space-y-5">
            {/* Top Centered Header Logo */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pb-1">
              <img
                src="/logo.png"
                alt="DuraGrit Vitrified"
                className="h-10 sm:h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo-white.png';
                }}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 bg-stone-50 border border-stone-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Console v2.0
              </span>
            </div>

            {/* Creative Visual Showcase */}
            <div className="flex-1 flex flex-col justify-center min-h-[220px]">
              <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-md bg-stone-900 w-full h-full min-h-[200px] max-h-[320px]">
                <img
                  src="/site-assets/admin-login-creative.jpg"
                  alt="DuraGrit Vitrified Enterprise Architecture"
                  className="w-full h-full object-cover object-center transform transition duration-700 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/site-assets/slider1.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between text-white pointer-events-none">
                  <div>
                    <span className="text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-[#FAA322] font-mono block">
                      Ceramic Technology &amp; Supply Network
                    </span>
                    <span className="text-xs sm:text-sm font-black font-serif text-white tracking-tight block">
                      Enterprise Vitrified Operations
                    </span>
                  </div>
                  <span className="hidden sm:inline-flex items-center text-[9.5px] font-mono font-bold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/30 text-white shadow-2xs">
                    256-Bit Escrow
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-50/80 border border-stone-200/80 shadow-2xs flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#C84826] border border-orange-200/60 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[10.5px] font-extrabold text-stone-900 block truncate">Anti-Fraud</span>
                  <span className="text-[8.5px] sm:text-[9px] text-stone-400 block truncate">NPCI Moderation</span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-50/80 border border-stone-200/80 shadow-2xs flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[10.5px] font-extrabold text-stone-900 block truncate">QR Registry</span>
                  <span className="text-[8.5px] sm:text-[9px] text-stone-400 block truncate">Unique Serial</span>
                </div>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-50/80 border border-stone-200/80 shadow-2xs flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-[10.5px] font-extrabold text-stone-900 block truncate">Live Payouts</span>
                  <span className="text-[8.5px] sm:text-[9px] text-stone-400 block truncate">Instant UPI/Bank</span>
                </div>
              </div>
            </div>

            {/* Bottom-Left Metadata Strip */}
            <div className="text-[11px] text-stone-500 font-mono flex flex-wrap items-center justify-center sm:justify-between gap-2 pt-3 border-t border-stone-100">
              <span>New Delhi, India</span>
              <span className="hidden sm:inline">•</span>
              <a href="mailto:info@duragritvitrified.com" className="hover:text-stone-800 transition">
                info@duragritvitrified.com
              </a>
              <span className="hidden sm:inline">•</span>
              <a href="tel:+917303967198" className="hover:text-stone-800 transition font-bold">
                +91 7303967198
              </a>
            </div>
          </div>

          {/* Right Column: Matched Height Form Card */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 lg:p-9 flex flex-col justify-between h-full space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Restricted Admin Access</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-serif pt-1">
                  Admin Sign In
                </h2>

                <p className="text-xs text-stone-500 leading-relaxed">
                  Enter official administrative credentials to access DuraGrit Retail &amp; QR portal.
                </p>
              </div>

              {/* Quick Demo Helper */}
              <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/90 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9.5px] text-blue-600 font-bold uppercase font-mono block">Master Admin Login</span>
                  <span className="text-[11px] font-mono font-bold text-stone-800">admin@duragrit.com / 1234</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@duragrit.com');
                    setPassword('1234');
                    setLocalError('');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10.5px] font-bold font-mono transition cursor-pointer shadow-2xs active:scale-95"
                >
                  Auto-Fill
                </button>
              </div>

              {displayError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-semibold">{displayError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Official Email, Mobile or User ID <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@duragrit.com, mobile or USR-1001"
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-700">
                      Password <span className="text-blue-600">*</span>
                    </label>
                    <a
                      href="mailto:info@duragritvitrified.com?subject=Admin%20Password%20Reset%20Request"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 pr-14 py-2.5 text-xs bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="pt-0.5">
                  <label className="flex items-start space-x-2 text-xs text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberTerminal}
                      onChange={(e) => setRememberTerminal(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-stone-300 text-blue-600 focus:ring-blue-600 accent-blue-600"
                    />
                    <span className="font-medium select-none">
                      Keep me signed in on this trusted workstation for 8 hours
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting || authLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] mt-2 font-serif"
                >
                  {submitting || authLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Security Badge (Paragraph line removed as requested) */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-center space-x-1.5 text-[11px] text-stone-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C84826]" />
              <span>Protected by DuraGrit Infrastructure Security</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
