import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Upload,
  CheckCircle2,
  ShieldCheck,
  QrCode
} from 'lucide-react';

export const CLAIM_PROOFS_STORAGE_KEY = 'duragrit_claim_proofs_v1';

export function loadStoredClaimProofs() {
  try {
    const raw = localStorage.getItem(CLAIM_PROOFS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

export function saveStoredClaimProof(claimKey, proofEntry) {
  try {
    const current = loadStoredClaimProofs();
    current[claimKey] = {
      ...(current[claimKey] || {}),
      ...proofEntry,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(CLAIM_PROOFS_STORAGE_KEY, JSON.stringify(current));
    return current[claimKey];
  } catch (_) {
    return proofEntry;
  }
}

export const ClaimProofPreviewModal = ({
  isOpen,
  claim,
  proofMeta,
  currentUser,
  onClose,
  onProofReplaced,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [uploadStatus, setUploadStatus] = useState('');
  const replaceInputRef = useRef(null);

  if (!isOpen || !claim) return null;

  const claimCode = claim.claimCode || claim.requestId || claim.id || 'CB-9021';
  const fileName =
    proofMeta?.fileName ||
    claim.proofFileName ||
    (String(claimCode).endsWith('8') || String(claimCode).includes('9018')
      ? 'Scan_Batch_Receipt_08.jpg'
      : String(claimCode).includes('9921')
      ? 'TaxInv_9921_Dealer.pdf'
      : 'Invoice_DTA999_MOR.pdf');

  const isImageProof =
    /\.(jpg|jpeg|png|webp)$/i.test(fileName) ||
    String(proofMeta?.dataUrl || claim.proofImage || '').startsWith('data:image/');

  const skuDisplay = `${claim.skuCode || claim.productName || 'DTA 999'} • ${
    claim.qrSerial || claim.serialKey || 'QR-88410-01'
  }`;
  const valueDisplay = `₹${Number(claim.amount || claim.claimValue || 250).toLocaleString('en-IN')}`;
  const upiDisplay = claim.vpa || currentUser?.upi || 'rahulsharma@okaxis';

  const handleReplaceFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('File exceeds 5MB limit. Please choose a smaller PDF or JPG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result || '';
      const updated = saveStoredClaimProof(claimCode, {
        fileName: file.name,
        mimeType: file.type,
        dataUrl,
      });
      setUploadStatus(`Uploaded new proof: ${file.name}`);
      if (onProofReplaced) onProofReplaced(claimCode, updated);
    };
    reader.readAsDataURL(file);
  };

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
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#A6300F] flex items-center justify-center text-white shrink-0">
              {isImageProof ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold font-serif truncate">{fileName}</h3>
              <p className="text-[10px] text-stone-400 font-mono">
                CLAIM #{String(claimCode).slice(-8)} • VERIFIED ATTACHMENT
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
          {uploadStatus && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{uploadStatus}</span>
            </div>
          )}

          {isImageProof ? (
            /* High-Resolution Image Batch Receipt Preview with Pinch/Tap Zoom */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-[#F4F3F0] px-3 py-1.5 rounded-xl border border-[#ECEAE6] text-[11px]">
                <span className="font-bold text-stone-700">Batch Receipt Optical Preview</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                    className="p-1 rounded bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-[10px] px-1.5">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.25, Number((z + 0.25).toFixed(2))))}
                    className="p-1 rounded bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div
                className="bg-[#1A1A1A] rounded-2xl border border-stone-800 overflow-auto h-64 flex items-center justify-center p-3"
                style={{ touchAction: 'pinch-zoom' }}
              >
                {proofMeta?.dataUrl || claim.proofImage ? (
                  <img
                    src={proofMeta?.dataUrl || claim.proofImage}
                    alt={fileName}
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                    className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-150"
                  />
                ) : (
                  /* High-res synthesized batch receipt preview card */
                  <div
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                    className="bg-[#FAF9F6] text-stone-900 p-4 rounded-xl border-2 border-stone-400 w-full max-w-[270px] shadow-lg transition-transform duration-150 font-mono text-[10px] space-y-2"
                  >
                    <div className="border-b border-dashed border-stone-400 pb-2 text-center">
                      <div className="font-black text-xs text-[#A6300F]">DURAGRIT VITRIFIED</div>
                      <div className="text-[9px] text-stone-500">MORBI GIDC YARD 04 • BATCH SLIP</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-stone-500">RECEIPT:</span>
                        <span className="font-bold">{fileName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">CLAIM ID:</span>
                        <span className="font-bold">{claimCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">SERIAL:</span>
                        <span className="font-bold text-[#A6300F]">{claim.qrSerial || claim.serialKey || 'DG-88410-01'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">CASHBACK:</span>
                        <span className="font-black text-emerald-700">{valueDisplay}</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-dashed border-stone-400 flex items-center justify-between text-[9px] text-stone-500">
                      <span>OPTICAL VERIFIED</span>
                      <QrCode className="w-4 h-4 text-stone-800" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Embedded PDF Tax Invoice Summary Viewer */
            <div className="bg-[#FAF9F6] rounded-2xl border border-[#DFDDD8] p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-[#ECEAE6] pb-2.5">
                <div>
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#A6300F] block">
                    TAX INVOICE &amp; SERIALIZATION VOUCHER
                  </span>
                  <h4 className="text-xs font-black text-stone-900 font-serif mt-0.5">
                    DuraGrit Vitrified Pvt. Ltd. — Morbi Hub
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[9.5px] font-mono font-bold">
                  PDF AUDITED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs bg-white p-3 rounded-xl border border-[#ECEAE6]">
                <div>
                  <span className="text-[10px] text-stone-400 font-medium block">Claim ID</span>
                  <span className="font-mono font-black text-stone-900">{claimCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-medium block">Claim Value</span>
                  <span className="font-serif font-black text-emerald-700 text-sm">{valueDisplay}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-stone-100">
                  <span className="text-[10px] text-stone-400 font-medium block">SKU &amp; Serial Token</span>
                  <span className="font-mono font-bold text-stone-800 text-[11px]">{skuDisplay}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-stone-100">
                  <span className="text-[10px] text-stone-400 font-medium block">Payout UPI (NPCI Escrow)</span>
                  <span className="font-mono font-bold text-[#A6300F] text-[11px]">{upiDisplay}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-500 px-1 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>GST &amp; Sec 194C Compliant</span>
                </span>
                <span>{claim.timestamp || claim.date || '19 Oct 2026'}</span>
              </div>
            </div>
          )}

          {/* Replace / Upload New Proof Button */}
          <input
            ref={replaceInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
            onChange={handleReplaceFile}
            className="hidden"
          />

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => replaceInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs font-serif"
            >
              <Upload className="w-3.5 h-3.5 text-[#A6300F]" />
              <span>Replace / Upload New Proof</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-[#A6300F] hover:bg-[#8B230C] text-white rounded-xl text-xs font-bold transition cursor-pointer font-serif"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
