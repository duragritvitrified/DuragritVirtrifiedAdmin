import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  Award, Coins,  Clock, CheckCircle2,  QrCode, PhoneCall,  TrendingUp, ChevronRight,  ShieldCheck, History,  FileText
} from 'lucide-react';

export const ContractorDashboard = ({ onNavigateToScan, onNavigateToClaims }) => {
  const { currentUser } = useAuth();
  const { claims } = useData();

  // Contractor-specific claims
  const myClaims = claims.filter(c => c.userMobile === (currentUser?.mobile || '9820144521'));
  
  const pendingAmount = myClaims
    .filter(c => c.status === 'Pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const approvedAmount = myClaims
    .filter(c => c.status === 'Disbursed')
    .reduce((sum, c) => sum + c.amount, 4850);

  const totalScans = myClaims.length + 94;

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      
      {/* Top Profile & Tier Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#750000] to-[#5C0000] text-white shadow-xl relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
              DuraGrit Loyalty Network
            </span>
            <h2 className="text-lg font-extrabold mt-0.5">{currentUser?.name || "Rameshwar Prasad Sharma"}</h2>
            <p className="text-xs text-red-200 font-mono mt-0.5">Mob: {currentUser?.mobile || "9820144521"}</p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-sm shadow-md">
            <Award className="w-6 h-6 text-stone-950" />
          </div>
        </div>

        {/* Tier Status Badge */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold text-[11px] flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>Gold Applicator Tier 2</span>
            </span>
          </div>
          <span className="text-[11px] text-red-200">1.15x Reward Multiplier</span>
        </div>
      </div>

      {/* Rewards Ledger Card */}
      <div className="duragrit-card p-4 bg-white">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Real-Time Reward Balance
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              , {(approvedAmount).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>Disbursed via NPCI Instant UPI</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500">Pending Escrow</div>
            <div className="text-base font-bold text-amber-600">
              , {pendingAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
          <button
            onClick={onNavigateToScan}
            className="duragrit-btn-primary py-2.5 text-xs flex items-center justify-center space-x-1.5 rounded-xl shadow-md"
          >
            <QrCode className="w-4 h-4 text-amber-300" />
            <span>Scan QR Code</span>
          </button>

          <button
            onClick={onNavigateToClaims}
            className="duragrit-btn-secondary py-2.5 text-xs flex items-center justify-center space-x-1.5 rounded-xl"
          >
            <History className="w-4 h-4 text-gray-600" />
            <span>Escrow Claims ({myClaims.length})</span>
          </button>
        </div>
      </div>

      {/* Recent Scans List */}
      <div className="duragrit-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#8B0000]" />
            <span>Recent Tile Scans & Claims</span>
          </h3>
          <span className="text-[10px] font-semibold text-gray-400">Total Scans: {totalScans}</span>
        </div>

        <div className="divide-y divide-gray-100">
          {myClaims.slice(0,4).map((claim) => (
            <div key={claim.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-900">{claim.productName}</p>
                <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-0.5">
                  <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded">{claim.serialKey}</span>
                  <span>•</span>
                  <span>{claim.submittedAt}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-amber-800 text-sm">+, {claim.amount}</div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  claim.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {claim.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toll-Free Contractor Help Desk Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-[#8B0000] text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">Contractor Helpline Desk</div>
            <div className="text-xs font-extrabold text-[#8B0000] tracking-wide font-mono">
              1800-DURAGRIT (1800-387-2474)
            </div>
            <p className="text-[10px] text-gray-500">Toll-Free ? 8:00 AM - 8:00 PM All Days</p>
          </div>
        </div>
      </div>

    </div>
  );
};
