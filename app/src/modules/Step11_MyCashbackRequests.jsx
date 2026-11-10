import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  ClaimProofPreviewModal,
  loadStoredClaimProofs,
  saveStoredClaimProof,
} from '../components/modals/ClaimProofPreviewModal';
import { ClaimAuditDetailsModal } from '../components/modals/ClaimAuditDetailsModal';
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  Lock,
  QrCode,
  FileText,
  Copy,
  Check,
  Headphones,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  X,
  Keyboard,
  AlertTriangle,
  MapPin,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export const Step11_MyCashbackRequests = ({ onBack, onNavigateScan }) => {
  const { currentUser } = useAuth();
  const { claims = [], refreshAllData, submitScannedCode } = useData();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'inprocess' | 'completed' | 'rejected'
  const [toastMsg, setToastMsg] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [proofModalClaim, setProofModalClaim] = useState(null);
  const [geoAuditClaim, setGeoAuditClaim] = useState(null);
  const [storedProofs, setStoredProofs] = useState(() => loadStoredClaimProofs());
  const [isSyncing, setIsSyncing] = useState(false);

  // Manual claim modal state + Step B.3 proof attachment & GPS capture
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualProofFileName, setManualProofFileName] = useState('');
  const [manualProofDataUrl, setManualProofDataUrl] = useState('');
  const [manualGeoCoords, setManualGeoCoords] = useState({
    lat: '22.8173° N',
    lng: '70.8377° E',
    siteLabel: 'Job Site #12',
    dispatchNode: 'Morbi Yard 04 Hub',
  });
  const [manualLoading, setManualLoading] = useState(false);
  const manualFileInputRef = useRef(null);

  const captureDeviceGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const latStr = `${pos.coords.latitude.toFixed(4)}° N`;
            const lngStr = `${pos.coords.longitude.toFixed(4)}° E`;
            setManualGeoCoords((prev) => ({
              ...prev,
              lat: latStr,
              lng: lngStr,
            }));
          },
          () => {}
        );
      } catch (_) {}
    }
  };

  const handleOpenManualModal = () => {
    setShowManualModal(true);
    captureDeviceGps();
  };

  const handleManualProofSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Proof file exceeds 5MB limit. Please choose a smaller PDF or JPG.');
      return;
    }
    setManualProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setManualProofDataUrl(String(ev.target?.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleCopy = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Copied: ${id}`);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleSync = async () => {
    if (!refreshAllData) return;
    setIsSyncing(true);
    try {
      await refreshAllData();
      showToast('Synced claim statuses from Admin Panel & Supabase.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter claims strictly belonging to the signed-in user or vendor
  const myDigits = String(currentUser?.mobile || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
  const myId = String(currentUser?.vendorId || currentUser?.userId || currentUser?.id || '').toLowerCase().replace(/^(usr|vnd)-/i, '');
  const myName = String(currentUser?.companyName || currentUser?.name || currentUser?.contactPerson || '').toLowerCase().trim();

  const userClaims = claims.filter((c) => {
    const cDigits = String(c.userMobile || c.contractorPhone || c.mobile || '').replace(/\D/g, '').slice(-10);
    const cId = String(c.userId || c.contractorId || c.vendorId || '').toLowerCase().replace(/^(usr|vnd)-/i, '');
    const cName = String(c.userName || c.contractorName || c.vendorName || c.companyName || '').toLowerCase().trim();
    return (
      (myId && cId && (cId === myId || myId.includes(cId) || cId.includes(myId))) ||
      (myDigits.length === 10 && cDigits === myDigits) ||
      (myName && cName && (cName === myName || myName.includes(cName) || cName.includes(myName)))
    );
  });

  const getBucket = (c) => {
    const s = String(c.status || '').toLowerCase();
    const p = String(c.payoutStatus || '').toLowerCase();
    if (s === 'disbursed' || p === 'disbursed' || s === 'completed' || s === 'paid' || p === 'paid' || Number(c.disbursedAmount || 0) > 0) return 'completed';
    if (s === 'approved' || s === 'in process' || s === 'inprocess' || p === 'pending release') return 'inprocess';
    if (s === 'rejected' || s === 'flagged' || p === 'rejected') return 'rejected';
    return 'pending';
  };

  const pendingList = userClaims.filter((c) => getBucket(c) === 'pending');
  const inProcessList = userClaims.filter((c) => getBucket(c) === 'inprocess');
  const completedList = userClaims.filter((c) => getBucket(c) === 'completed');
  const rejectedList = userClaims.filter((c) => getBucket(c) === 'rejected');

  const inReviewAmount = pendingList.reduce(
    (sum, c) => sum + (Number(c.amount || c.claimValue) || 0),
    0
  );
  const disbursedTotal = completedList.reduce(
    (sum, c) => sum + (Number(c.disbursedAmount || c.netDisbursed || c.amount || c.claimValue) || 0),
    0
  );

  const currentList =
    activeTab === 'pending'
      ? pendingList
      : activeTab === 'inprocess'
      ? inProcessList
      : activeTab === 'completed'
      ? completedList
      : rejectedList;

  const initials = (currentUser?.name || 'RS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'RS';

  const handleManualClaimSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setManualLoading(true);
    try {
      const cleanSerial = manualCode.replace(/^#/, '').trim();
      const res = await submitScannedCode({
        serialKey: cleanSerial,
        user: currentUser,
        proofImage: manualProofDataUrl || null,
      });
      if (res && res.success) {
        const key = res.claimCode || cleanSerial;
        const savedMeta = saveStoredClaimProof(key, {
          fileName: manualProofFileName || 'Invoice_DTA999_MOR.pdf',
          dataUrl: manualProofDataUrl || '',
          lat: manualGeoCoords.lat,
          lng: manualGeoCoords.lng,
          siteLabel: manualGeoCoords.siteLabel,
          dispatchNode: manualGeoCoords.dispatchNode,
        });
        setStoredProofs((prev) => ({ ...prev, [key]: savedMeta, [cleanSerial]: savedMeta }));
        showToast(`Claim logged successfully for ${res.serialKey || cleanSerial}!`);
        setShowManualModal(false);
        setManualCode('');
        setManualProofFileName('');
        setManualProofDataUrl('');
      } else {
        showToast(res?.message || 'Verification failed. Ensure batch exists.');
      }
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto flex-1 flex flex-col font-serif select-none pb-3">
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#A6300F] text-white px-4 py-2 rounded-xl shadow-2xl border border-stone-200/40 flex items-center space-x-2 text-xs font-semibold font-sans">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Screen Header matching PDF Page 11 (Sticky header, never hides on scroll) */}
      <header className="px-4 pt-3 pb-3 bg-white border-b border-[#ECEAE6] flex items-center justify-between font-sans sticky top-0 z-30 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 text-stone-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-stone-900" />
          </button>
          <h2 className="text-base font-bold font-serif text-stone-900 tracking-tight">
            My Cashback Requests
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            className="p-1.5 rounded-full bg-[#F4F3F0] hover:bg-stone-200 text-stone-600 cursor-pointer"
            title="Sync Live Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#A6300F]' : ''}`} />
          </button>
          <div className="w-7 h-7 rounded-full bg-[#A6300F] text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs">
            {initials}
          </div>
        </div>
      </header>

      <div className="px-3.5 pt-3 space-y-3 flex-1">
        {/* CONTRACTOR ESCROW SNAPSHOT Card matching PDF Page 11 */}
        <section className="bg-white rounded-2xl p-4 border border-[#ECEAE6] shadow-xs space-y-3 font-sans">
          <div className="flex items-center justify-between pb-1 border-b border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-900 text-[10.5px] font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#A6300F]"></span>
              <span>CONTRACTOR ESCROW SNAPSHOT</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-stone-800 bg-[#EFEEEB] px-2 py-0.5 rounded-full border border-[#DFDDD8]">
              <Lock className="w-3 h-3 text-[#A6300F]" />
              <span>NPCI VERIFIED</span>
            </span>
          </div>

          {/* 2 Recessed #F4F3F0 Sub-Cards */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-[#F4F3F0] rounded-xl p-3 border border-[#ECEAE6]">
              <span className="text-[10px] text-stone-500 font-medium block">
                In-Review Claims
              </span>
              <div className="text-2xl font-black text-stone-900 font-serif mt-0.5">
                ₹{inReviewAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-[#C2410C] font-bold mt-1 flex items-center gap-1">
                <span>⏳</span>
                <span>{pendingList.length} Claims Pending</span>
              </div>
            </div>

            <div className="bg-[#F4F3F0] rounded-xl p-3 border border-[#ECEAE6]">
              <span className="text-[10px] text-stone-500 font-medium block">
                Lifetime Disbursed
              </span>
              <div className="text-2xl font-black text-[#15803D] font-serif mt-0.5">
                ₹{disbursedTotal.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-stone-600 font-medium mt-1 flex items-center gap-1 truncate">
                <span>🏛️</span>
                <span>Bank/UPI Payouts</span>
              </div>
            </div>
          </div>

          {/* Dual Action Buttons matching PDF Page 11 */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onNavigateScan}
              className="bg-[#A6300F] hover:bg-[#8B230C] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer font-serif"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan Next QR</span>
            </button>

            <button
              onClick={handleOpenManualModal}
              className="bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer font-serif"
            >
              <Keyboard className="w-3.5 h-3.5 text-[#A6300F]" />
              <span>Manual Claim</span>
            </button>
          </div>
        </section>

        {/* 4 Filter Tabs matching PDF Page 11 */}
        <div className="grid grid-cols-4 gap-1 bg-[#EFEEEB] p-1 rounded-xl text-xs font-sans">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#A6300F] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pending ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveTab('inprocess')}
            className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition cursor-pointer ${
              activeTab === 'inprocess'
                ? 'bg-[#A6300F] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            In Process ({inProcessList.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-[#A6300F] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Completed ({completedList.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-[#A6300F] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Rejected ({rejectedList.length})
          </button>
        </div>

        {/* Estimated Resolution Batch Strip matching PDF Page 11 */}
        <div className="bg-[#F4F3F0] rounded-xl px-3 py-2 border border-[#ECEAE6] flex items-center justify-between text-[11px] text-stone-700 font-sans">
          <div className="flex items-center gap-1.5">
            <span>🕒</span>
            <span className="font-medium">Est. resolution batch: <strong>Today, 18:00 IST</strong></span>
          </div>
          <span className="font-mono font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-[#DFDDD8] text-[10px]">
            BATCH 44B
          </span>
        </div>

        {/* Claims List matching PDF Page 11 */}
        <div className="space-y-3 font-sans">
          {currentList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-[#ECEAE6] text-center space-y-2">
              <FileText className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="text-stone-700 font-serif font-bold text-sm">
                No {activeTab} requests in queue
              </div>
              <p className="text-xs text-stone-400">
                {activeTab === 'pending'
                  ? 'Scan a DuraGrit QR code to submit a new cashback claim.'
                  : 'Requests will appear here as they move through the NPCI moderation queue.'}
              </p>
            </div>
          ) : (
            currentList.map((claim) => {
              const claimCode = claim.claimCode || claim.requestId || claim.id;
              const statusBucket = getBucket(claim);

              return (
                <div
                  key={claim.id}
                  className="bg-white rounded-2xl p-4 border border-[#ECEAE6] shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-stone-900 text-xs">
                        CLAIM #{String(claimCode).slice(-8)}
                      </span>
                      <button
                        onClick={() => handleCopy(claimCode)}
                        className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700 cursor-pointer"
                        title="Copy Claim ID"
                      >
                        {copiedId === claimCode ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        statusBucket === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : statusBucket === 'inprocess'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : statusBucket === 'rejected'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          statusBucket === 'completed'
                            ? 'bg-emerald-500'
                            : statusBucket === 'inprocess'
                            ? 'bg-blue-500'
                            : statusBucket === 'rejected'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      ></span>
                      <span>
                        {statusBucket === 'completed'
                          ? 'Completed'
                          : statusBucket === 'inprocess'
                          ? 'In Process'
                          : statusBucket === 'rejected'
                          ? 'Rejected'
                          : 'Pending Verification'}
                      </span>
                    </span>
                  </div>

                  {/* Recessed Product Box matching PDF Page 11 */}
                  <div className="bg-[#F4F3F0] rounded-xl p-2.5 border border-[#ECEAE6] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-stone-900 leading-tight">
                        {claim.productName || 'High-Polymer Adhesive'}
                      </div>
                      <div className="text-[10.5px] text-stone-500 font-mono mt-0.5">
                        Serial: {claim.qrSerial || claim.serialKey}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 bg-white px-2 py-0.5 rounded border border-[#DFDDD8] shrink-0">
                      {claim.packSize || '20 kg Kraft Bag'}
                    </span>
                  </div>

                  {/* Rejection Reason Notice */}
                  {statusBucket === 'rejected' && (
                    <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 space-y-0.5 text-xs text-rose-800">
                      <div className="flex items-center gap-1 font-bold text-[11px] text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Rejection Reason:</span>
                      </div>
                      <p className="text-[11px] text-rose-600 pl-4.5 font-medium leading-relaxed">
                        {claim.flagReason || claim.remarks || 'Documentation or QR code invalid'}
                      </p>
                    </div>
                  )}

                  {/* Payout & Context Row */}
                  <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                    <div>
                      <span className="text-stone-400">Cashback:</span>{' '}
                      <strong className="text-stone-900 font-serif">₹{claim.amount}</strong>
                      {claim.transactionId && (
                        <span className="text-stone-400 text-[10px] font-mono ml-2">
                          UTR: {claim.transactionId}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-stone-400 text-[10px] font-mono">
                      {claim.timestamp || claim.date || 'Today, 14:22'}
                    </div>
                  </div>

                  {/* Step 11A & 11B Blueprint Specification: Proof Attachment Pill (View proof ->) & Geo-Tag Row (View details ->) */}
                  {(() => {
                    const serialKey = claim.qrSerial || claim.serialKey || '';
                    const proofEntry = storedProofs[claimCode] || storedProofs[serialKey] || null;
                    const defaultDocName =
                      proofEntry?.fileName ||
                      claim.proofFileName ||
                      (String(claimCode).endsWith('8') || String(claimCode).includes('9018')
                        ? 'Scan_Batch_Receipt_08.jpg'
                        : 'Invoice_DTA999_MOR.pdf');
                    const isJpgDoc = /\.(jpg|jpeg|png|webp)$/i.test(defaultDocName);

                    return (
                      <div className="pt-2 border-t border-stone-100 space-y-1.5 text-[11px]">
                        {/* Row 1: Proof Attachment Pill + View proof -> */}
                        <div className="flex items-center justify-between bg-[#FAF9F6] px-2.5 py-1.5 rounded-lg border border-[#ECEAE6]">
                          <button
                            type="button"
                            onClick={() => setProofModalClaim(claim)}
                            className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-stone-800 hover:text-[#A6300F] truncate cursor-pointer"
                          >
                            {isJpgDoc ? (
                              <ImageIcon className="w-3.5 h-3.5 text-[#A6300F] shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-[#A6300F] shrink-0" />
                            )}
                            <span className="truncate">{defaultDocName}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setProofModalClaim(claim)}
                            className="text-[#A10000] font-bold text-[10.5px] hover:underline shrink-0 cursor-pointer ml-2"
                          >
                            View proof →
                          </button>
                        </div>

                        {/* Row 2: Geo-tagged at Job Site #12 + View details -> */}
                        <div className="flex items-center justify-between px-1 pt-0.5">
                          <span className="text-stone-500 text-[10.5px] flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-[#A6300F] shrink-0" />
                            <span>◎ Geo-tagged at {proofEntry?.siteLabel || 'Job Site #12'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setGeoAuditClaim(claim)}
                            className="text-[#A10000] font-bold text-[10.5px] hover:underline cursor-pointer"
                          >
                            View details →
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Step B.3: Manual Claim Modal with Proof Attachment & Auto GPS Capture */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-stone-200 shadow-xl space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900 font-serif">Manual Serial Ingest</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Enter the unique serialized key printed under the DuraGrit tile adhesive packaging label and optionally attach your tax invoice or batch receipt.
            </p>
            <form onSubmit={handleManualClaimSubmit} className="space-y-3">
              <div>
                <label className="block text-[10.5px] font-bold text-stone-700 mb-1">
                  Serialized QR Key <span className="text-[#A6300F]">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="DG-88410-B04"
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-xl focus:border-[#A6300F] outline-none"
                />
              </div>

              {/* Optional Invoice PDF / Batch Receipt JPG Attachment */}
              <div>
                <input
                  ref={manualFileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                  onChange={handleManualProofSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => manualFileInputRef.current?.click()}
                  className="w-full py-2 px-3 bg-[#FAF9F6] hover:bg-stone-100 border border-dashed border-stone-300 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#A6300F]" />
                  <span className="truncate">
                    {manualProofFileName
                      ? `Attached: ${manualProofFileName}`
                      : 'Attach Invoice PDF / Receipt JPG (Optional, max 5MB)'}
                  </span>
                </button>
              </div>

              {/* Auto GPS Capture Pill */}
              <div className="bg-[#F4F3F0] px-3 py-2 rounded-xl border border-[#ECEAE6] flex items-center justify-between text-[10px] font-mono text-stone-600">
                <span className="flex items-center gap-1 font-bold text-stone-800">
                  <MapPin className="w-3 h-3 text-[#A6300F]" />
                  <span>{manualGeoCoords.siteLabel}</span>
                </span>
                <span>
                  {manualGeoCoords.lat}, {manualGeoCoords.lng}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualLoading || !manualCode.trim()}
                  className="flex-1 py-2 text-xs font-bold bg-[#A6300F] hover:bg-[#8B230C] disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {manualLoading ? 'Logging...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step B.1: Claim Proof Preview Modal (View proof ->) */}
      <ClaimProofPreviewModal
        isOpen={Boolean(proofModalClaim)}
        claim={proofModalClaim}
        proofMeta={
          proofModalClaim
            ? storedProofs[proofModalClaim.claimCode || proofModalClaim.requestId || proofModalClaim.id] ||
              storedProofs[proofModalClaim.qrSerial || proofModalClaim.serialKey] ||
              null
            : null
        }
        currentUser={currentUser}
        onClose={() => setProofModalClaim(null)}
        onProofReplaced={(claimKey, updatedEntry) => {
          setStoredProofs((prev) => ({ ...prev, [claimKey]: updatedEntry }));
          showToast(`Updated proof attachment: ${updatedEntry.fileName}`);
        }}
      />

      {/* Step B.2: Claim Geo-Tag & Escrow Audit Modal (View details ->) */}
      <ClaimAuditDetailsModal
        isOpen={Boolean(geoAuditClaim)}
        claim={geoAuditClaim}
        geoMeta={
          geoAuditClaim
            ? storedProofs[geoAuditClaim.claimCode || geoAuditClaim.requestId || geoAuditClaim.id] ||
              storedProofs[geoAuditClaim.qrSerial || geoAuditClaim.serialKey] ||
              manualGeoCoords
            : null
        }
        onClose={() => setGeoAuditClaim(null)}
        onOpenProof={(c) => setProofModalClaim(c)}
      />
    </div>
  );
};
