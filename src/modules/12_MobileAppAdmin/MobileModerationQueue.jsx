import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Badge } from '../../components/Badge';
import { 
  CheckCircle, XCircle,  Flag, ShieldCheck,  Coins, Clock,  Smartphone, ArrowRight,  ExternalLink, Zap
} from 'lucide-react';

export const MobileModerationQueue = () => {
  const { claims, approveClaim,  flagClaim, rejectClaim } = useData();
  const [processingId, setProcessingId] = useState(null);

  const pendingClaims = claims.filter(c => c.status === 'Pending' || c.status === 'Flagged');
  const totalPendingEscrow = pendingClaims.reduce((acc, c) => acc + c.amount, 0);

  const handleApprove = async (id) => {
    setProcessingId(id);
    await approveClaim(id);
    setProcessingId(null);
  };

  const handleFlag = (id) => {
    flagClaim(id, 'Supervisor flagged: Potential duplicate thermal foil angle');
  };

  const handleReject = (id) => {
    rejectClaim(id, 'Supervisor rejected: Tampered packaging image');
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#8B0000]" />
            <span>Mobile Supervisor Queue</span>
          </h2>
          <p className="text-[11px] text-gray-500">Fast 1-tap claim moderation & NPCI disbursement</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
          {pendingClaims.length} Pending
        </span>
      </div>

      {/* NPCI 256-bit Automated Escrow Summary Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#5C0000] to-[#8B0000] text-white shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
            NPCI 256-Bit Escrow Vault
          </span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-white">, {totalPendingEscrow}</div>
          <span className="text-[11px] text-red-200">Instant Clearing Live</span>
        </div>
        <p className="text-[10px] text-red-200 leading-tight">
          One-tap approvals disburse direct into contractor's verified UPI VPA in &lt;1.2 seconds.
        </p>
      </div>

      {/* Pending Items Stream */}
      {pendingClaims.length === 0 ? (
        <div className="duragrit-card p-8 text-center space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-gray-800 text-sm">Escrow Queue Cleared</h3>
          <p className="text-xs text-gray-500">All contractor scans have been processed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingClaims.map(claim => (
            <div key={claim.id} className="duragrit-card p-4 space-y-3 border-l-4 border-l-[#8B0000]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-gray-900">{claim.claimNumber}</span>
                    <Badge status={claim.status} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs mt-1">{claim.productName}</h4>
                  <p className="text-[11px] text-gray-500">
                    Applicator: <strong className="text-gray-700">{claim.userName}</strong> ({claim.userMobile})
                  </p>
                  <p className="text-[10px] font-mono text-amber-800 mt-0.5">
                    UPI VPA: {claim.vpaOrIfsc}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-emerald-700">, {claim.amount}</div>
                  <span className="text-[10px] text-gray-400">{claim.submittedAt?.split(' ')[1]}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-2">
                <button
                  disabled={processingId === claim.id}
                  onClick={() => handleApprove(claim.id)}
                  className="duragrit-btn-primary py-2 text-xs flex items-center justify-center space-x-1 col-span-1 shadow"
                >
                  {processingId === claim.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Approve</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleFlag(claim.id)}
                  className="duragrit-btn-secondary py-2 text-xs flex items-center justify-center space-x-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Flag</span>
                </button>

                <button
                  onClick={() => handleReject(claim.id)}
                  className="duragrit-btn-secondary py-2 text-xs flex items-center justify-center space-x-1 text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
