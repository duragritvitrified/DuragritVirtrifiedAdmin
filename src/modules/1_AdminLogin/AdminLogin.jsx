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
    <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-3 sm:p-5 lg:p-6 font-sans select-none">
      <div className="w-full max-w-5xl mx-auto my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7 items-stretch">
          
          {/* Left Column: Brand, Centered Header Logo, Creative Visual & Highlights */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-7 lg:p-7.5 flex flex-col justify-between h-full space-y-4">
            {/* Top Centered Header Logo */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pb-0.5">
              <img
                src="/logo.png"
                alt="DuraGrit Vitrified"
                className="h-9 sm:h-11 w-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo-white.png';
                }}
              />
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 bg-stone-50 border border-stone-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Console v2.0
              </span>
            </div>

            {/* Creative Visual Showcase */}
            <div className="relative group overflow-hidden rounded-2xl border border-stone-200/80 shadow-xs bg-[#F7F6F2] w-full flex items-center justify-center p-2.5 sm:p-3.5 shrink-0">
              <img
                src="/site-assets/admin-login-creative.jpg"
                alt="DuraGrit Vitrified Enterprise Architecture"
                className="h-44 sm:h-48 lg:h-52 w-auto aspect-square object-contain drop-shadow-md rounded-2xl transform transition duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo.png';
                }}
              />
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div className="p-2 rounded-xl bg-stone-50/80 border border-stone-200/80 shadow-2xs flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-50 text-[#C84826] border border-orange-200/60 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-stone-900 block truncate leading-tight">Anti-Fraud</span>
                  <span className="text-[8.5px] text-stone-400 block truncate leading-tight">NPCI Moderation</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-stone-50/80 border border-stone-200/80 shadow-2xs flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-stone-900 block truncate leading-tight">QR Registry</span>
                  <span className="text-[8.5px] text-stone-400 block truncate leading-tight">Unique Serial</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-stone-50/80 border border-stone-200/80 shadow-2xs flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-stone-900 block truncate leading-tight">Live Payouts</span>
                  <span className="text-[8.5px] text-stone-400 block truncate leading-tight">Instant UPI/Bank</span>
                </div>
              </div>
            </div>

            {/* Bottom-Left Metadata Strip */}
            <div className="text-[10.5px] text-stone-500 font-mono flex flex-wrap items-center justify-center sm:justify-between gap-1.5 pt-2.5 border-t border-stone-100">
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
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-7 lg:p-7.5 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-3.5">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                  <Lock className="w-3 h-3 text-blue-600" />
                  <span>Restricted Admin Access</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-serif pt-0.5">
                  Admin Sign In
                </h2>

                <p className="text-xs text-stone-500 leading-normal">
                  Enter official administrative credentials to access DuraGrit Retail &amp; QR portal.
                </p>
              </div>

              {displayError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-semibold">{displayError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 pt-0.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 leading-tight">
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
                  <div className="mb-1">
                    <label className="block text-xs font-bold text-stone-700 leading-tight">
                      Password <span className="text-blue-600">*</span>
                    </label>
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
                    <span className="font-medium select-none leading-tight">
                      Keep me signed in on this trusted workstation for 8 hours
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting || authLoading}
                  className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] font-serif"
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

                <p className="text-[11px] text-stone-500 text-center leading-relaxed font-sans pt-0.5">
                  Authorized administrative personnel only. All access attempts, session activity, and operations are monitored and logged for security compliance.
                </p>
              </form>
            </div>

            {/* Bottom Security Badge */}
            <div className="pt-2.5 mt-2 border-t border-stone-100 flex items-center justify-center space-x-1.5 text-[11px] text-stone-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C84826]" />
              <span>Protected by DuraGrit Infrastructure Security</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
