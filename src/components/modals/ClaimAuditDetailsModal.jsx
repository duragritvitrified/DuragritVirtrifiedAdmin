import React from 'react';
import {
  X,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  FileText
} from 'lucide-react';

export const ClaimAuditDetailsModal = ({
  isOpen,
  claim,
  geoMeta,
  onClose,
  onOpenProof,
}) => {
  if (!isOpen || !claim) return null;

  const claimCode = claim.claimCode || claim.requestId || claim.id || 'CB-9014';
  const siteLabel = geoMeta?.siteLabel || claim.siteLabel || 'Job Site #12';
  const lat = geoMeta?.lat || claim.lat || '22.8173° N';
  const lng = geoMeta?.lng || claim.lng || '70.8377° E';
  const dispatchNode = geoMeta?.dispatchNode || claim.dispatchNode || 'Morbi Yard 04 Hub';
  const submittedTime = claim.timestamp || claim.date || '19 Oct 2026, 17:40';
  const isCompleted =
    String(claim.status || '').toLowerCase() === 'disbursed' ||
    String(claim.payoutStatus || '').toLowerCase() === 'disbursed' ||
    Number(claim.disbursedAmount || 0) > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3.5 font-sans select-none"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-[410px] w-full border border-[#ECEAE6] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#1C1917] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A6300F] flex items-center justify-center text-white shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-serif">
                Geo-Tag &amp; NPCI Escrow Audit Trail
              </h3>
              <p className="text-[10px] text-stone-400 font-mono">
                CLAIM #{String(claimCode).slice(-8)} • {dispatchNode.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 max-h-[78vh] overflow-y-auto">
          {/* Job-Site Geo-Tag Card */}
          <div className="bg-[#FAF9F6] rounded-2xl border border-[#DFDDD8] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-stone-900 font-serif">
                <MapPin className="w-3.5 h-3.5 text-[#A6300F]" />
                <span>◎ Geo-tagged at {siteLabel}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9.5px] font-mono font-bold">
                GPS VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-[#ECEAE6] text-xs">
              <div>
                <span className="text-[9.5px] text-stone-400 font-bold uppercase block">
                  Captured Coordinates
                </span>
                <span className="font-mono font-bold text-stone-800 text-[11px]">
                  {lat}, {lng}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] text-stone-400 font-bold uppercase block">
                  Dispatch Node
                </span>
                <span className="font-bold text-[#A6300F] text-[11px] flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>{dispatchNode}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-600 px-0.5">
              <span>
                Serial: <strong className="font-mono text-stone-900">{claim.qrSerial || claim.serialKey || 'DG-88410-B04'}</strong>
              </span>
              <span>
                Value: <strong className="font-serif text-emerald-700">₹{claim.amount || 150}</strong>
              </span>
            </div>
          </div>

          {/* 3-Step Verification Timeline */}
          <div className="bg-white rounded-2xl border border-[#ECEAE6] p-3.5 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              NPCI Escrow &amp; Factory Audit Timeline
            </div>

            <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {/* Stage 1 */}
              <div className="relative pl-7">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center absolute left-0 top-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
                <div className="text-xs font-bold text-stone-900">
                  Submitted Timestamp ({submittedTime})
                </div>
                <p className="text-[10.5px] text-stone-500 mt-0.5">
                  Field scan &amp; GPS telemetry logged at {siteLabel} ({lat}, {lng}).
                </p>
              </div>

              {/* Stage 2 */}
              <div className="relative pl-7">
                <span className="w-5 h-5 rounded-full bg-[#A6300F] text-white flex items-center justify-center absolute left-0 top-0.5">
                  <ShieldCheck className="w-3 h-3" />
                </span>
                <div className="text-xs font-bold text-stone-900">
                  DuraGrit Central Factory Serialization Ledger Cross-Audit (24–48 hrs)
                </div>
                <p className="text-[10.5px] text-stone-500 mt-0.5">
                  128-bit SHA-256 token verified against {dispatchNode} batch manifest.
                </p>
              </div>

              {/* Stage 3 */}
              <div className="relative pl-7">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center absolute left-0 top-0.5 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                </span>
                <div className="text-xs font-bold text-stone-900">
                  NPCI Instant Clearing Payout (Sec 194C TDS)
                </div>
                <p className="text-[10.5px] text-stone-500 mt-0.5">
                  {isCompleted
                    ? `Disbursed via UPI Escrow (${claim.transactionId || 'UTR Verified'}).`
                    : 'Queued for automated 18:00 IST batch settlement (Batch 44B).'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {onOpenProof && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProof(claim);
                }}
                className="flex-1 py-2.5 bg-[#F4F3F0] hover:bg-stone-200 text-stone-800 border border-[#DFDDD8] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer font-serif"
              >
                <FileText className="w-3.5 h-3.5 text-[#A6300F]" />
                <span>View Proof</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#A6300F] hover:bg-[#8B230C] text-white rounded-xl text-xs font-bold cursor-pointer font-serif"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
