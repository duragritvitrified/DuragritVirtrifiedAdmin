import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Copy, Check, Sparkles, X, Smartphone, Mail, Lock } from 'lucide-react';
import { verifyVendorByCode } from '../services/emailService';

export function PartnerVerificationPortal({ initialCode = '', onClose, onVerified }) {
  const [code, setCode] = useState(initialCode || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-detect code from URL on mount if not provided via props
  useEffect(() => {
    if (!code && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code') || params.get('verify') || '';
      if (urlCode) {
        setCode(urlCode.trim());
      }
    }
  }, [code]);

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setCode(text.trim());
          setErrorMsg('');
        }
      }
    } catch (_) {
      setErrorMsg('Clipboard access not permitted. Please paste manually into the text box.');
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!code || !code.trim()) {
      setErrorMsg('Please enter or paste your 8-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const res = await verifyVendorByCode(code.trim());
      if (res.success) {
        setSuccessData(res);
        if (onVerified) onVerified(res.vendor || res.entity);
      } else {
        setErrorMsg(res.reason || 'Verification failed. Please check the code received in your email.');
      }
    } catch (err) {
      setErrorMsg(`Verification error: ${err.message || 'Network error'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="bg-[#1C1917] border border-stone-700 text-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden my-auto animate-in fade-in zoom-in-95">
        
        {/* Soft background glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-[#C84826]/30 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer z-20"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {!successData ? (
          /* =================================================================== */
          /* 1. VERIFICATION CODE INPUT FORM                                     */
          /* =================================================================== */
          <div className="space-y-5 relative z-10">
            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#A62C11] via-[#C84826] to-amber-500 flex items-center justify-center shadow-lg shadow-[#A62C11]/40 border border-white/20">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-3 py-0.5 rounded-full text-[10px] font-black text-amber-300 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Official Partner Verification
              </div>

              <h2 className="text-xl font-black text-white tracking-tight">
                Verify Your Partner Email
              </h2>
              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
                Enter or paste the unique <strong>8-digit verification code</strong> dispatched to your email (<span className="text-stone-300 font-mono">Verify Your Email — DuraGrit Vitrified Partner Portal</span>).
              </p>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-3 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {/* Code Input Box */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-2">
                  Enter 8-Digit Verification Code
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setErrorMsg('');
                    }}
                    placeholder="e.g. 88264905"
                    maxLength={16}
                    autoFocus
                    className="w-full bg-stone-900/90 border-2 border-stone-600 focus:border-[#C84826] text-white text-center font-mono text-2xl font-black tracking-[0.25em] py-3.5 px-4 rounded-2xl shadow-inner outline-none transition uppercase placeholder:text-stone-600 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  />

                  {/* Paste from Clipboard Button */}
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 text-[11px] font-bold rounded-xl border border-stone-600 transition flex items-center gap-1 cursor-pointer"
                    title="Paste from clipboard"
                  >
                    <Copy className="w-3 h-3 text-stone-400" />
                    <span>Paste</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-500 mt-2 px-1">
                  <span>Numeric 8-digit or alphanumeric token</span>
                  <span>Instant Database Sync ✓</span>
                </div>
              </div>

              {/* Verify CTA Button */}
              <button
                type="submit"
                disabled={isVerifying || !code.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-[#C84826] via-[#B83E1E] to-[#A62C11] hover:brightness-110 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-[#C84826]/40 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Code in Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>✓ Verify Code &amp; Activate Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Help / Support strip */}
            <div className="bg-stone-900/60 rounded-2xl p-3 border border-stone-800 text-[11px] text-stone-400 space-y-1 text-center">
              <p>
                Haven&apos;t received your email? Check your <strong>Spam / Junk folder</strong> or ask DuraGrit Admin to resend from Vendor Management.
              </p>
            </div>
          </div>
        ) : (
          /* =================================================================== */
          /* 2. SUCCESS CONFIRMATION VIEW                                        */
          /* =================================================================== */
          <div className="space-y-5 text-center relative z-10 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-600/40 border border-white/20">
              <Check className="w-9 h-9 text-white stroke-[3]" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Account Status: ACTIVE
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Email Verified Successfully!
              </h2>
              <p className="text-xs text-stone-300 leading-relaxed max-w-xs mx-auto">
                Congratulations! Your partner account has been permanently validated in the DuraGrit Central Database.
              </p>
            </div>

            {/* Verified Partner Card */}
            <div className="bg-stone-900/90 rounded-2xl p-4 border border-stone-800 text-left space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <span className="text-stone-400 font-sans text-[11px]">Partner Name</span>
                <span className="text-white font-bold">{successData.name || 'Authorized Partner'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <span className="text-stone-400 font-sans text-[11px]">Partner ID</span>
                <span className="text-emerald-400 font-bold">{successData.id || 'VND-101'}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <span className="text-stone-400 font-sans text-[11px]">Verified Code</span>
                <span className="text-amber-300 font-bold">{successData.code || code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400 font-sans text-[11px]">Admin Status</span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Verified by Partner ✓</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <a
                href="/app/?app=vendor"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer no-underline"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open Vendor Mobile App &amp; Sign In</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 active:scale-98 text-stone-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Return to Admin Console
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

