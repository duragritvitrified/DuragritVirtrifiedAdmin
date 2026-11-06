import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, Key,  Smartphone, Hash,  ArrowRight, ShieldCheck,  Zap, Radio 
} from 'lucide-react';

export const MobileYardSignIn = ({ onSignedIn }) => {
  const { loginAsContractor, loginAsVendor } = useAuth();
  const [roleMode, setRoleMode] = useState('contractor'); // 'contractor' | 'vendor'
  const [identifier, setIdentifier] = useState('9820144521');
  const [selectedHub, setSelectedHub] = useState('North India Central Master Hub');
  const [securityKey, setSecurityKey] = useState('DG-YARD-771');
  const [loading, setLoading] = useState(false);

  const yardHubs = [
    'North India Central Master Hub', 'Gujarat Vitrified Petrochem Yard', 'Western Regional Logistics Depot', 'South Zone Industrial Cluster Yard'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (roleMode === 'contractor') {
        loginAsContractor(identifier, 'Rameshwar Prasad Sharma');
      } else {
        loginAsVendor(identifier, 'Reliance Polymers Ltd');
      }
      if (onSignedIn) onSignedIn();
    }, 500);
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
      
      {/* Brand Header */}
      <div className="text-center pb-5 border-b border-gray-100">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#8B0000] text-amber-400 font-extrabold text-xl shadow mb-2">
          DG
        </div>
        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">DG Field Terminal</h2>
        <p className="text-xs text-gray-500">Contractor & Vendor Yard Access Node</p>
        
        {/* Live Serialization Counter Badge */}
        <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Live Serialization Counter: 1,842,910 QRs</span>
        </div>
      </div>

      {/* Role Toggle */}
      <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-gray-100 rounded-xl text-xs font-bold">
        <button
          type="button"
          onClick={() => { setRoleMode('contractor'); setIdentifier('9820144521'); }}
          className={`py-2 rounded-lg transition-all ${
            roleMode === 'contractor'
              ? 'bg-[#8B0000] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Contractor / Mason
        </button>
        <button
          type="button"
          onClick={() => { setRoleMode('vendor'); setIdentifier('27AAACR5055K1Z0'); }}
          className={`py-2 rounded-lg transition-all ${
            roleMode === 'vendor'
              ? 'bg-[#8B0000] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Vendor / Yard Hub
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-gray-700 mb-1">
            {roleMode === 'contractor' ? 'Registered 10-Digit Mobile ID' : 'Company GSTIN ID'}
          </label>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#8B0000] font-mono font-semibold"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">
            Assigned Yard Hub Dispatch Node
          </label>
          <select
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#8B0000]"
          >
            {yardHubs.map(hub => (
              <option key={hub} value={hub}>{hub}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">
            Terminal Security Key
          </label>
          <div className="relative">
            <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              required
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full duragrit-btn-primary py-2.5 flex items-center justify-center space-x-2 text-sm"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Connect Terminal & Launch</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <span className="flex items-center">
          <ShieldCheck className="w-3 h-3 text-emerald-600 mr-1" />
          Geo-Location Verified
        </span>
        <span className="font-mono">Ver 2.4.0 Mobile</span>
      </div>

    </div>
  );
};
