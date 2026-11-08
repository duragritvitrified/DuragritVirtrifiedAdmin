import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * OpeningSplashScreen
 * Luxury branded opening animation for DuraGrit Vitrified
 * Features:
 * - Vitrified ceramic slate gradient background with architectural tile grid
 * - Ambient warm terracotta & golden kiln radial glow
 * - Official DuraGrit Vitrified logo entrance with scale-up, drop-shadow & golden shimmer sweep
 * - Refined brand subtitles & live kiln connection progress indicator
 * - Resilient, un-cancellable animation timer (immune to parent re-renders)
 * - Immediate 1-tap dismiss on screen tap (TAP TO SKIP)
 * - Hard 1.5s fallback auto-dismiss guarantee
 */
export function OpeningSplashScreen({ onComplete, durationMs = 900, portalLabel = 'Retail Network' }) {
  const [phase, setPhase] = useState('entering'); // 'entering' -> 'active' -> 'fading' -> 'hidden'
  const [progress, setProgress] = useState(35);
  const [statusText, setStatusText] = useState('Connecting to Morbi Kiln Hub...');

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const hasFinishedRef = useRef(false);

  const finishSplash = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setPhase('hidden');
    if (typeof onCompleteRef.current === 'function') {
      try {
        onCompleteRef.current();
      } catch (err) {
        console.warn('[SplashScreen] onComplete error:', err);
      }
    }
  }, []);

  const handleSkip = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    finishSplash();
  };

  useEffect(() => {
    // Phase 1: Logo enter
    const tEnter = setTimeout(() => {
      setPhase('active');
    }, 40);

    // Progress bar updates
    const tProg1 = setTimeout(() => {
      setProgress(75);
      setStatusText('Syncing security tokens & credentials...');
    }, 200);

    const tProg2 = setTimeout(() => {
      setProgress(100);
      setStatusText('Morbi Central Kiln Hub verified ✓');
    }, 450);

    // Phase 2: Fade out
    const tFade = setTimeout(() => {
      setPhase('fading');
    }, Math.max(550, durationMs - 250));

    // Phase 3: Complete & unmount
    const tEnd = setTimeout(() => {
      finishSplash();
    }, durationMs);

    // Absolute Hard Fallback: Force finish within 1000ms max under all conditions
    const tSafety = setTimeout(() => {
      finishSplash();
    }, 1000);

    return () => {
      clearTimeout(tEnter);
      clearTimeout(tProg1);
      clearTimeout(tProg2);
      clearTimeout(tFade);
      clearTimeout(tEnd);
      clearTimeout(tSafety);
    };
  }, [durationMs, finishSplash]);

  if (phase === 'hidden') return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between select-none overflow-hidden cursor-pointer transition-opacity duration-500 ease-out ${
        phase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #182352 0%, #0D132D 45%, #070A14 100%)'
      }}
      role="banner"
      aria-label="DuraGrit Vitrified Opening"
    >
      {/* Vitrified Tile Hairline Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.7) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Ambient Pulsing Terracotta & Amber Radial Halos */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] md:w-[480px] md:h-[480px] bg-gradient-to-tr from-[#C84826]/30 via-[#FAA322]/20 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-[#FAA322]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Top Branding / Network Badge */}
      <div className="w-full pt-12 px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] tracking-[0.2em] font-extrabold uppercase text-amber-300/80 font-mono">
            Kiln Network Online
          </span>
        </div>
        <span className="text-[9px] tracking-wider font-semibold text-slate-400/80 uppercase font-sans">
          Tap to skip
        </span>
      </div>

      {/* Centerpiece: Official DuraGrit Vitrified Logo & Emblem */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 max-w-md w-full">
        {/* Animated Emblem & Logo Container */}
        <div
          className={`relative transform transition-all duration-700 ease-out flex flex-col items-center ${
            phase === 'entering' ? 'scale-90 opacity-0 translate-y-3' : 'scale-100 opacity-100 translate-y-0'
          }`}
        >
          {/* Subtle Outer Ceramic Frame Badge */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/60 backdrop-blur-md border border-amber-500/25 shadow-2xl shadow-black/80 flex flex-col items-center">
            
            {/* Shimmer Light Sweep Overlay */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div
                className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-25deg]"
                style={{
                  animation: 'shimmerSweep 1.8s infinite ease-in-out'
                }}
              />
            </div>

            {/* Official Logo (White & Gold Website Asset) */}
            <img
              src="/logo-white.png"
              alt="DuraGrit Vitrified"
              className="h-14 sm:h-16 md:h-20 w-auto object-contain drop-shadow-[0_8px_24px_rgba(250,163,34,0.35)]"
              onError={(e) => {
                // Fallback to text / icon if asset path fails
                e.target.onerror = null;
                e.target.src = '/icon-512.png';
              }}
            />

            {/* Brand Category Subtitle */}
            <div className="mt-4 flex items-center space-x-2">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-amber-400/60" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.25em] text-amber-200/90 uppercase font-sans">
                {portalLabel}
              </span>
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-amber-400/60" />
            </div>

            {/* Morbi Kiln Hub Origin Verification */}
            <p className="text-[9.5px] tracking-wider text-slate-300/70 font-mono mt-1 uppercase text-center">
              Morbi Central Kiln Hub • Gujarat, India
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar & Connection Status */}
      <div className="w-full max-w-xs px-6 pb-12 z-10 flex flex-col items-center">
        {/* Progress Track */}
        <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10 p-[0.5px]">
          <div
            className="h-full bg-gradient-to-r from-[#C84826] via-[#FAA322] to-amber-300 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(250,163,34,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Live Status Caption */}
        <div className="mt-2.5 flex items-center justify-between w-full text-[10px] text-slate-400 font-mono">
          <span className="truncate max-w-[200px] text-amber-200/80">{statusText}</span>
          <span className="font-bold text-amber-400">{progress}%</span>
        </div>
      </div>

      {/* Inline Keyframes for Shimmer Sweep */}
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(0%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

