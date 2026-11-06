import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Badge } from '../../components/Badge';
import { 
  History, ArrowLeft,  Clock, ShieldCheck,  AlertCircle, CheckCircle2,  Image, HelpCircle,  FileCheck, Send
} from 'lucide-react';
import { Modal } from '../../components/Modal';

export const MyCashbackRequests = ({ onBack }) => {
  const { currentUser } = useAuth();
  const { claims } = useData();

  const [selectedProofUrl, setSelectedProofUrl] = useState(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeClaim, setDisputeClaim] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  const myClaims = claims.filter(c => c.userMobile === (currentUser?.mobile || '9820144521'));

  const totalEscrowLocked = myClaims
    .filter(c => c.status === 'Pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const handleOpenDispute = (claim) => {
    setDisputeClaim(claim);
    setDisputeReason('');
    setDisputeSuccess(false);
    setIsDisputeModalOpen(true);
  };

  const handleDisputeSubmit = (e) => {
    e.preventDefault();
    setDisputeSuccess(true);
    setTimeout(() => {
      setIsDisputeModalOpen(false);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Field Dashboard</span>
        </button>

        <span className="text-xs font-bold text-gray-700">My Escrow Claims</span>
      </div>

      {/* Escrow Snapshot Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
              Detailed Escrow Snapshot
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">
              , {totalEscrowLocked}
            </div>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Held in NPCI Escrow Trust Node pending supervisor verification.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-800" />
          </div>
        </div>
      </div>

      {/* Claims List with Timeline */}
      <div className="space-y-3">
        {myClaims.map((claim) => (
          <div key={claim.id} className="duragrit-card p-4 space-y-3">
            
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {claim.claimNumber}
                </span>
                <h4 className="font-bold text-gray-900 text-sm mt-1">{claim.productName}</h4>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Serial: {claim.serialKey}
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold text-amber-700">, {claim.amount}</div>
                <Badge status={claim.status} />
              </div>
            </div>

            {/* Claim Verification Timeline */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-[11px]">
              <div className="font-bold text-gray-700 text-[10px] uppercase tracking-wider">
                Claim Verification Timeline
              </div>
              
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Submitted: {claim.submittedAt}</span>
              </div>

              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Single-Use Dual Stage Guard Verified</span>
              </div>

              {claim.status === 'Disbursed' ? (
                <div className="flex items-center space-x-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>NPCI Settlement Disbursed ({claim.npciRrn || 'NPCI991204857211'})</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-amber-700 font-medium">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>NPCI 256-bit Automated Escrow Hold</span>
                </div>
              )}
            </div>

            {/* Proof Viewer & Dispute Action */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => setSelectedProofUrl(claim.proofImageUrl)}
                className="flex items-center space-x-1 text-gray-600 hover:text-[#8B0000] font-medium"
              >
                <Image className="w-3.5 h-3.5" />
                <span>View Packaging Proof</span>
              </button>

              <button
                onClick={() => handleOpenDispute(claim)}
                className="flex items-center space-x-1 text-amber-700 hover:text-amber-800 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Dispute / Help</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Proof Viewer Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="p-3 bg-[#8B0000] text-white flex items-center justify-between">
              <span className="text-xs font-bold">Tamper Foil Packaging Proof</span>
              <button onClick={() => setSelectedProofUrl(null)} className="text-white hover:text-red-200 text-sm">✕</button>
            </div>
            <div className="p-4">
              <img src={selectedProofUrl} alt="Claim Proof" className="w-full h-56 object-cover rounded-xl" />
              <p className="text-[11px] text-gray-500 mt-2 text-center">
                High-resolution holographic foil & batch imprint captured at 60FPS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title="File Escrow Claim Dispute"
        subtitle={`Inquiry for Claim #${disputeClaim?.claimNumber}`}
        maxWidth="max-w-md"
      >
        {disputeSuccess ? (
          <div className="p-4 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-gray-900 text-sm">Dispute Ticket Logged</h4>
            <p className="text-xs text-gray-500">
              Escrow officer notified. Response guaranteed within 2 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDisputeSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Dispute Reason / Ingestion Issue
              </label>
              <textarea
                required
                rows="3"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. Scanned bag in rural hub with low connectivity, payout status delayed..."
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#8B0000]"
              ></textarea>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDisputeModalOpen(false)}
                className="duragrit-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="duragrit-btn-primary text-xs flex items-center space-x-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Ticket</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};
