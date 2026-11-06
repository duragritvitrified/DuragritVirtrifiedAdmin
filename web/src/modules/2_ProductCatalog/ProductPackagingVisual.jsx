import React from 'react';

/**
 * Photorealistic 3D Packaging Visual Component for DuraGrit Vitrified Products
 * Faithfully mirrors the 3D unit renders in DuraGrit_Step_By_Step_Screens.pdf (Page 2)
 */
export function ProductPackagingVisual({ skuCode = 'DTA-999', category = '', packWeight = '', imageUrl = '', className = 'w-12 h-12' }) {
  const code = (skuCode || '').toUpperCase().trim();

  // If custom or uploaded image is provided
  if (imageUrl) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`}>
        <img src={imageUrl} alt={skuCode} className="w-full h-full object-contain drop-shadow-md" />
      </div>
    );
  }

  // 3D Photographic Asset Mappings
  if (code.includes('333')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="DTA-333 Vitrified Tile Adhesive">
        <img src="/site-assets/dta333.png" alt="DTA-333" className="w-full h-full object-contain drop-shadow-md" onError={(e) => { e.target.style.display = 'none'; }} />
      </div>
    );
  }

  if (code.includes('444')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="DTA-444 Super Polymer Grout">
        <img src="/site-assets/dta444.png" alt="DTA-444" className="w-full h-full object-contain drop-shadow-md" onError={(e) => { e.target.style.display = 'none'; }} />
      </div>
    );
  }

  if (code.includes('555')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="DTA-555 Waterproofing Slurry">
        <img src="/site-assets/dta555.png" alt="DTA-555" className="w-full h-full object-contain drop-shadow-md" onError={(e) => { e.target.style.display = 'none'; }} />
      </div>
    );
  }

  // 1. DTA-999 (High-Polymer Tile Adhesive - Red & Black Kraft Bag)
  if (code.includes('999')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="DTA 999 20kg Kraft Bag">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md overflow-visible">
          <defs>
            <linearGradient id="kraft999" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b37d4e" />
              <stop offset="50%" stopColor="#d29b63" />
              <stop offset="100%" stopColor="#9c683b" />
            </linearGradient>
            <linearGradient id="redBand" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          {/* Bag Body with 3D Gusset */}
          <path d="M18 18 L82 18 L88 108 L12 108 Z" fill="url(#kraft999)" stroke="#784e27" strokeWidth="1.5" />
          {/* Top Fold / Sewn Seal */}
          <polygon points="15,12 85,12 82,18 18,18" fill="#8c582c" stroke="#5a3719" strokeWidth="1" />
          <line x1="16" y1="15" x2="84" y2="15" stroke="#fef08a" strokeWidth="1" strokeDasharray="2,2" />
          {/* Red Header Header Accent */}
          <rect x="18" y="22" width="64" height="24" fill="url(#redBand)" rx="1" />
          <text x="50" y="32" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">DURAGRIT</text>
          <text x="50" y="41" fill="#fef08a" fontSize="6" fontWeight="800" textAnchor="middle">DTA-999</text>
          {/* Product Type Spec */}
          <rect x="22" y="50" width="56" height="13" fill="#18181b" rx="1.5" />
          <text x="50" y="59" fill="#ffffff" fontSize="5.5" fontWeight="800" textAnchor="middle">TYPE 4 VITRIFIED</text>
          {/* Subtitle / Tech Spec */}
          <text x="50" y="73" fill="#3f2715" fontSize="4.8" fontWeight="700" textAnchor="middle">HIGH-POLYMER</text>
          <text x="50" y="80" fill="#451a03" fontSize="4.2" fontWeight="600" textAnchor="middle">C2TE S1 ADHESIVE</text>
          {/* Weight Badge */}
          <rect x="36" y="88" width="28" height="9" fill="#b91c1c" rx="2" />
          <text x="50" y="94.5" fill="#ffffff" fontSize="5" fontWeight="900" textAnchor="middle">20 KG</text>
          {/* Bottom Fold */}
          <line x1="12" y1="105" x2="88" y2="105" stroke="#5a3719" strokeWidth="1.5" strokeDasharray="3,1.5" />
        </svg>
      </div>
    );
  }

  // 2. DTA-777 (Standard Vitrified Adhesive - Blue & Kraft Bag)
  if (code.includes('777')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="DTA 777 20kg Kraft Bag">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md overflow-visible">
          <defs>
            <linearGradient id="kraft777" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b37d4e" />
              <stop offset="50%" stopColor="#cca16d" />
              <stop offset="100%" stopColor="#9c683b" />
            </linearGradient>
            <linearGradient id="blueBand" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <path d="M18 18 L82 18 L88 108 L12 108 Z" fill="url(#kraft777)" stroke="#784e27" strokeWidth="1.5" />
          <polygon points="15,12 85,12 82,18 18,18" fill="#8c582c" stroke="#5a3719" strokeWidth="1" />
          <line x1="16" y1="15" x2="84" y2="15" stroke="#fef08a" strokeWidth="1" strokeDasharray="2,2" />
          <rect x="18" y="22" width="64" height="24" fill="url(#blueBand)" rx="1" />
          <text x="50" y="32" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">DURAGRIT</text>
          <text x="50" y="41" fill="#93c5fd" fontSize="6" fontWeight="800" textAnchor="middle">DTA-777</text>
          <rect x="22" y="50" width="56" height="13" fill="#1e3a8a" rx="1.5" />
          <text x="50" y="59" fill="#ffffff" fontSize="5.5" fontWeight="800" textAnchor="middle">TYPE 2 CLADDING</text>
          <text x="50" y="73" fill="#3f2715" fontSize="4.8" fontWeight="700" textAnchor="middle">FLOOR &amp; WALL</text>
          <text x="50" y="80" fill="#451a03" fontSize="4.2" fontWeight="600" textAnchor="middle">TILE ADHESIVE</text>
          <rect x="36" y="88" width="28" height="9" fill="#1d4ed8" rx="2" />
          <text x="50" y="94.5" fill="#ffffff" fontSize="5" fontWeight="900" textAnchor="middle">20 KG</text>
          <line x1="12" y1="105" x2="88" y2="105" stroke="#5a3719" strokeWidth="1.5" strokeDasharray="3,1.5" />
        </svg>
      </div>
    );
  }

  // 3. DTA-555 (Silver Standard Ceramic Adhesive - Silver/Grey Bag)
  if (code.includes('555')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="DTA 555 20kg Kraft Bag">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md overflow-visible">
          <defs>
            <linearGradient id="kraft555" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="silverBand" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <path d="M18 18 L82 18 L88 108 L12 108 Z" fill="url(#kraft555)" stroke="#475569" strokeWidth="1.5" />
          <polygon points="15,12 85,12 82,18 18,18" fill="#64748b" stroke="#334155" strokeWidth="1" />
          <line x1="16" y1="15" x2="84" y2="15" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" />
          <rect x="18" y="22" width="64" height="24" fill="url(#silverBand)" rx="1" />
          <text x="50" y="32" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">DURAGRIT</text>
          <text x="50" y="41" fill="#e2e8f0" fontSize="6" fontWeight="800" textAnchor="middle">DTA-555</text>
          <rect x="22" y="50" width="56" height="13" fill="#0f172a" rx="1.5" />
          <text x="50" y="59" fill="#ffffff" fontSize="5.5" fontWeight="800" textAnchor="middle">TYPE 1 FLOORING</text>
          <text x="50" y="73" fill="#1e293b" fontSize="4.8" fontWeight="700" textAnchor="middle">CERAMIC ADHESIVE</text>
          <text x="50" y="80" fill="#334155" fontSize="4.2" fontWeight="600" textAnchor="middle">STANDARD BOND</text>
          <rect x="36" y="88" width="28" height="9" fill="#0284c7" rx="2" />
          <text x="50" y="94.5" fill="#ffffff" fontSize="5" fontWeight="900" textAnchor="middle">20 KG</text>
          <line x1="12" y1="105" x2="88" y2="105" stroke="#334155" strokeWidth="1.5" strokeDasharray="3,1.5" />
        </svg>
      </div>
    );
  }

  // 4. DTA-333 (Grey Masonry & Mortar - Woven Bag)
  if (code.includes('333')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="DTA 333 25kg Woven Bag">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md overflow-visible">
          <defs>
            <linearGradient id="woven333" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <path d="M16 16 L84 16 L88 108 L12 108 Z" fill="url(#woven333)" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Woven Cross-hatch */}
          <line x1="14" y1="28" x2="86" y2="28" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2,2" />
          <line x1="13" y1="42" x2="87" y2="42" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2,2" />
          <line x1="12" y1="60" x2="88" y2="60" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2,2" />
          <line x1="12" y1="80" x2="88" y2="80" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2,2" />
          {/* Navy Banner */}
          <rect x="16" y="24" width="68" height="24" fill="#0f172a" rx="1" />
          <text x="50" y="34" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">DURAGRIT</text>
          <text x="50" y="43" fill="#38bdf8" fontSize="6" fontWeight="800" textAnchor="middle">DTA-333</text>
          <rect x="22" y="52" width="56" height="13" fill="#ea580c" rx="1.5" />
          <text x="50" y="61" fill="#ffffff" fontSize="5.5" fontWeight="800" textAnchor="middle">REPAIR MORTAR</text>
          <text x="50" y="74" fill="#334155" fontSize="4.8" fontWeight="700" textAnchor="middle">MASONRY &amp; SCREED</text>
          <text x="50" y="81" fill="#64748b" fontSize="4.2" fontWeight="600" textAnchor="middle">GREY FORMULA</text>
          <rect x="36" y="88" width="28" height="9" fill="#0f172a" rx="2" />
          <text x="50" y="94.5" fill="#ffffff" fontSize="5" fontWeight="900" textAnchor="middle">25 KG</text>
          <line x1="12" y1="105" x2="88" y2="105" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2,1.5" />
        </svg>
      </div>
    );
  }

  // 5. DTG-EPOXY-01 (3-Part Solid Epoxy Grout - Sealed Bucket)
  if (code.includes('EPOXY')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="DuraGrit Epoxy 5kg Bucket">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md overflow-visible">
          <defs>
            <linearGradient id="bucketBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="35%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="epoxyBand" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          {/* Metal Wire Handle */}
          <path d="M22 45 C22 15, 78 15, 78 45" fill="none" stroke="#64748b" strokeWidth="2" />
          <rect x="42" y="14" width="16" height="5" fill="#1e293b" rx="2" />
          {/* Bucket Lid */}
          <ellipse cx="50" cy="38" rx="36" ry="6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
          <ellipse cx="50" cy="37" rx="34" ry="4" fill="#6366f1" />
          {/* Tapered Bucket Body */}
          <path d="M16 38 L24 104 C25 107, 75 107, 76 104 L84 38 Z" fill="url(#bucketBody)" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Label Wrap */}
          <path d="M19 52 L22 88 L78 88 L81 52 Z" fill="url(#epoxyBand)" />
          <text x="50" y="63" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="0.5">DURAGRIT</text>
          <text x="50" y="72" fill="#fde047" fontSize="5.5" fontWeight="800" textAnchor="middle">EPOXY GROUT</text>
          <text x="50" y="80" fill="#ffffff" fontSize="4.2" fontWeight="700" textAnchor="middle">3-PART SOLID RESIN</text>
          {/* Tub Size */}
          <rect x="40" y="94" width="20" height="7" fill="#4338ca" rx="1.5" />
          <text x="50" y="99" fill="#ffffff" fontSize="4.5" fontWeight="900" textAnchor="middle">5 KG</text>
        </svg>
      </div>
    );
  }

  // 6. DTG-POLY-04 (Polymer Unsanded Tile Grout - Pouch)
  if (code.includes('POLY') || code.includes('GROUT')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="Polymer Grout 1kg Pouch">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md overflow-visible">
          <defs>
            <linearGradient id="pouchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="50%" stopColor="#4338ca" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
          </defs>
          {/* Pouch Silhouette with side gussets */}
          <path d="M24 20 L76 20 C82 20, 84 25, 84 30 L80 102 C80 108, 20 108, 20 102 L16 30 C16 25, 18 20, 24 20 Z" fill="url(#pouchGrad)" stroke="#1e1b4b" strokeWidth="1.5" />
          {/* Top Seal & Notch */}
          <rect x="22" y="20" width="56" height="8" fill="#1e1b4b" />
          <circle cx="20" cy="24" r="1.5" fill="#f8fafc" />
          <circle cx="80" cy="24" r="1.5" fill="#f8fafc" />
          {/* Branding */}
          <text x="50" y="42" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle">DURAGRIT</text>
          <text x="50" y="52" fill="#a5b4fc" fontSize="5.5" fontWeight="800" textAnchor="middle">POLY-GROUT</text>
          <rect x="26" y="59" width="48" height="11" fill="#ec4899" rx="1.5" />
          <text x="50" y="67" fill="#ffffff" fontSize="5" fontWeight="800" textAnchor="middle">FINE JOINT 1-3mm</text>
          <text x="50" y="80" fill="#e0e7ff" fontSize="4.2" fontWeight="600" textAnchor="middle">MOISTURE-PROOF</text>
          <rect x="38" y="88" width="24" height="8" fill="#ffffff" rx="2" />
          <text x="50" y="94" fill="#312e81" fontSize="5" fontWeight="900" textAnchor="middle">1 KG</text>
        </svg>
      </div>
    );
  }

  // 7. DTS-PRIMER-02 (Surface Primer - Ergonomic Can / Jug)
  if (code.includes('PRIMER') || code.includes('ECO')) {
    return (
      <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="Eco-Bond Primer 5L Can">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md overflow-visible">
          <defs>
            <linearGradient id="canGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          {/* Top Handle */}
          <path d="M30 16 L70 16 L70 28 L30 28 Z" fill="#0369a1" rx="2" stroke="#075985" strokeWidth="1.5" />
          <rect x="38" y="19" width="24" height="6" fill="#f8fafc" rx="1.5" />
          {/* Screw Cap */}
          <rect x="68" y="24" width="10" height="7" fill="#dc2626" rx="1" stroke="#991b1b" strokeWidth="1" />
          {/* Can Body */}
          <path d="M22 28 L78 28 C82 28, 84 34, 84 38 L84 102 C84 106, 80 108, 76 108 L24 108 C20 108, 16 106, 16 102 L16 38 C16 34, 18 28, 22 28 Z" fill="url(#canGrad)" stroke="#075985" strokeWidth="1.5" />
          {/* White Center Label */}
          <rect x="20" y="44" width="60" height="42" fill="#ffffff" rx="2" stroke="#0284c7" strokeWidth="0.8" />
          <text x="50" y="55" fill="#0369a1" fontSize="7" fontWeight="900" textAnchor="middle">DURAGRIT</text>
          <text x="50" y="64" fill="#dc2626" fontSize="5.5" fontWeight="800" textAnchor="middle">ECO-BOND</text>
          <text x="50" y="73" fill="#334155" fontSize="4.2" fontWeight="700" textAnchor="middle">SBR LATEX PRIMER</text>
          <text x="50" y="80" fill="#64748b" fontSize="3.8" fontWeight="600" textAnchor="middle">HIGH ADHESION</text>
          <rect x="40" y="93" width="20" height="8" fill="#0c4a6e" rx="1.5" />
          <text x="50" y="99" fill="#ffffff" fontSize="4.8" fontWeight="900" textAnchor="middle">5 L</text>
        </svg>
      </div>
    );
  }

  // 8. DTS-WATER-10 (Hydro-Shield Slurry Seal - Heavy Pail)
  return (
    <div className={`relative ${className} shrink-0 select-none flex items-center justify-center`} title="Hydro-Shield 20kg Heavy Pail">
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md overflow-visible">
        <defs>
          <linearGradient id="pailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#115e59" />
          </linearGradient>
        </defs>
        {/* Metal Bail Handle */}
        <path d="M18 42 C18 12, 82 12, 82 42" fill="none" stroke="#64748b" strokeWidth="2.2" />
        <rect x="42" y="11" width="16" height="5" fill="#0f172a" rx="2" />
        {/* Rim & Lid */}
        <ellipse cx="50" cy="36" rx="36" ry="6" fill="#134e4a" stroke="#042f2e" strokeWidth="1.5" />
        <ellipse cx="50" cy="35" rx="33" ry="4" fill="#2dd4bf" />
        {/* Tapered Pail Body */}
        <path d="M16 36 L23 105 C24 108, 76 108, 77 105 L84 36 Z" fill="url(#pailGrad)" stroke="#115e59" strokeWidth="1.5" />
        {/* Waterproofing Graphic Ring */}
        <path d="M19 50 L22 86 L78 86 L81 50 Z" fill="#042f2e" />
        <text x="50" y="61" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="0.5">DURAGRIT</text>
        <text x="50" y="70" fill="#2dd4bf" fontSize="5.5" fontWeight="800" textAnchor="middle">HYDRO-SHIELD</text>
        <text x="50" y="78" fill="#ffffff" fontSize="4.2" fontWeight="700" textAnchor="middle">ELASTIC SLURRY SEAL</text>
        <rect x="38" y="93" width="24" height="7" fill="#ffffff" rx="1.5" />
        <text x="50" y="98.5" fill="#115e59" fontSize="5" fontWeight="900" textAnchor="middle">20 KG</text>
      </svg>
    </div>
  );
}

