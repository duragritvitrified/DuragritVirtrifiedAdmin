import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { AudioService } from '../services/audioService';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { ManifestIngestSheet } from '../components/modals/ManifestIngestSheet';
import { saveStoredClaimProof } from '../components/modals/ClaimProofPreviewModal';
import {
  ArrowLeft,
  Flashlight,
  FlashlightOff,
  QrCode,
  Box,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  UploadCloud,
  RefreshCw
} from 'lucide-react';

export const FIELD_TAG_QUEUE_STORAGE_KEY = 'duragrit_field_tag_queue_v1';

export const Step10_QRScanUpload = ({ onBack, onClaimCreated }) => {
  const { currentUser } = useAuth();
  const { submitScannedCode, batches = [], claims = [] } = useData();

  const [manualSerial, setManualSerial] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSerial = params.get('serial') || params.get('qr') || params.get('code');
      return urlSerial ? urlSerial.trim().toUpperCase() : '';
    } catch (_) {
      return '';
    }
  });
  const [proofImage, setProofImage] = useState(null);
  const [proofFileName, setProofFileName] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [soundEnabled] = useState(true);
  const [scanStatus, setScanStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showManifestSheet, setShowManifestSheet] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [recentTags, setRecentTags] = useState(() => {
    try {
      const localQueue = localStorage.getItem(FIELD_TAG_QUEUE_STORAGE_KEY);
      if (localQueue) {
        const parsed = JSON.parse(localQueue);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const stored = sessionStorage.getItem('duragrit_recent_tags_session');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  const fileInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastScannedTextRef = useRef('');
  const lastScannedTimeRef = useRef(0);
  const lastBuzzTimeRef = useRef(0);
  const scannerContainerId = 'interactive-qr-scanner-viewport';

  const formatTimeHMS = () => {
    const d = new Date();
    return [
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
      String(d.getSeconds()).padStart(2, '0'),
    ].join(':');
  };

  // Persist session & offline queue tags under duragrit_field_tag_queue_v1
  useEffect(() => {
    try {
      localStorage.setItem(FIELD_TAG_QUEUE_STORAGE_KEY, JSON.stringify(recentTags));
      sessionStorage.setItem('duragrit_recent_tags_session', JSON.stringify(recentTags));
    } catch (_) {}
  }, [recentTags]);

  // Step A.3: Replay queued items when connectivity becomes active
  const replayQueuedTags = async () => {
    const queuedItems = recentTags.filter((t) => t.status === 'QUEUED');
    if (queuedItems.length === 0) return;

    for (const item of queuedItems) {
      try {
        await submitScannedCode({
          serialKey: item.tag,
          user: currentUser,
          proofImage: item.proofImage || null,
        });
      } catch (_) {}
    }

    const syncedTime = formatTimeHMS();
    setRecentTags((prev) =>
      prev.map((t) =>
        t.status === 'QUEUED'
          ? { ...t, status: 'SYNCED', time: syncedTime }
          : t
      )
    );
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      replayQueuedTags();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [recentTags]);

  // Optical Camera QR Scanner initialization
  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        const element = document.getElementById(scannerContainerId);
        if (!element) return;

        html5QrCode = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = html5QrCode;

        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const cameraId = cameras[cameras.length - 1].id; // back camera
          await html5QrCode.start(
            cameraId,
            {
              fps: 15, // Optimal 15 fps scanning to prevent CPU/battery strain and rapid jitter
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (!decodedText || isProcessingRef.current) return;
              const clean = String(decodedText).trim();
              const now = Date.now();
              // Prevent repeat rapid firing on same code
              if (lastScannedTextRef.current === clean && now - lastScannedTimeRef.current < 3000) {
                return;
              }
              lastScannedTextRef.current = clean;
              lastScannedTimeRef.current = now;
              isProcessingRef.current = true;

              processSubmission(clean).finally(() => {
                setTimeout(() => {
                  isProcessingRef.current = false;
                }, 1500);
              });
            },
            () => {}
          );
        }
      } catch (_) {
        // Camera permissions or mock browser fallback
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {});
        } catch (_) {}
      }
    };
  }, []);

  // Step A.1: Hardware Camera Torch Control (videoTrack.applyConstraints + Html5Qrcode)
  const toggleTorch = async () => {
    const nextTorchState = !torchOn;
    try {
      const container = document.getElementById(scannerContainerId);
      const videoEl = container ? container.querySelector('video') : null;
      const mediaStream = videoEl && videoEl.srcObject;
      const videoTracks =
        mediaStream && typeof mediaStream.getVideoTracks === 'function'
          ? mediaStream.getVideoTracks()
          : [];

      if (videoTracks.length > 0 && typeof videoTracks[0].applyConstraints === 'function') {
        await videoTracks[0].applyConstraints({
          advanced: [{ torch: nextTorchState }],
        });
      } else if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: nextTorchState }],
        });
      }
    } catch (_) {
      // Hardware flash fallback on non-torch cameras
    }
    setTorchOn(nextTorchState);
  };

  // Derive latest batch info for metadata cards
  const latestBatch = batches[0] || null;

  // Next available serial from generated batch for camera tap or fallback
  const getNextAvailableSerial = () => {
    const claimedSet = new Set(
      claims.map((c) => String(c.serialKey || c.qrSerial || c.batchCode || '').trim().toUpperCase())
    );
    for (const batch of batches) {
      const tokens = batch.tokens || batch.codes || [];
      for (const tok of tokens) {
        const key = String(tok.serialKey || tok.serial || '').trim().toUpperCase();
        if (key && !tok.isScanned && !claimedSet.has(key)) {
          return key;
        }
      }
    }
    return '';
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFileName(file.name);

    // If it's an image, attempt optical QR decoding via html5-qrcode
    if (file.type.startsWith('image/')) {
      const html5Qr = new Html5Qrcode('temp-qr-file-scan-node');
      html5Qr
        .scanFile(file, true)
        .then((decodedText) => {
          if (decodedText) {
            setManualSerial(decodedText);
            processSubmission(decodedText);
          }
        })
        .catch(() => {
          // If optical detection fails, keep file as attachment
        });
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setProofImage(ev.target?.result || null);
    };
    reader.readAsDataURL(file);
  };

  const processSubmission = async (serialInput, customProofImg = null, customProofName = '') => {
    const rawSerial = String(serialInput || manualSerial || '').trim();
    if (!rawSerial) {
      setScanStatus({
        type: 'error',
        message: 'Please align QR code in camera reticle or enter serial code.',
      });
      return;
    }

    // Clean leading # if present
    const cleanSerial = rawSerial.replace(/^#/, '').trim();
    const activeProof = customProofImg || proofImage;
    const activeProofName = customProofName || proofFileName;

    // Step A.3: If offline, queue into duragrit_field_tag_queue_v1 with QUEUED badge
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const queuedTag = {
        id: Date.now() + Math.random(),
        tag: cleanSerial,
        desc: `Offline Field Scan • Queued for Auto-Sync`,
        time: formatTimeHMS(),
        status: 'QUEUED',
        proofImage: activeProof || null,
      };
      setRecentTags((prev) => [queuedTag, ...prev.slice(0, 14)]);
      setScanStatus({
        type: 'processing',
        message: `Offline Mode: Serial "${cleanSerial}" saved to local queue (QUEUED). Will auto-sync when online.`,
      });
      setManualSerial('');
      return;
    }

    setIsScanning(true);
    setScanStatus({
      type: 'processing',
      message: `Verifying QR code "${cleanSerial}"...`,
    });

    // Insert as QUEUED first, then transition to green SYNCED once verified
    const tempId = Date.now() + Math.random();
    const initialTag = {
      id: tempId,
      tag: cleanSerial,
      desc: `Validating with DuraGrit Serialization Ledger...`,
      time: formatTimeHMS(),
      status: 'QUEUED',
    };
    setRecentTags((prev) => [initialTag, ...prev.slice(0, 14)]);

    try {
      const result = await submitScannedCode({
        serialKey: cleanSerial,
        user: currentUser,
        proofImage: activeProof,
      });

      setIsScanning(false);

      if (!result || !result.success) {
        const now = Date.now();
        if (now - lastBuzzTimeRef.current > 3000) {
          lastBuzzTimeRef.current = now;
          if (soundEnabled && AudioService?.playErrorBuzz) AudioService.playErrorBuzz();
        }
        // Keep in session queue as QUEUED if offline/unverified or remove if duplicate
        setRecentTags((prev) => prev.filter((t) => t.id !== tempId));
        setScanStatus({
          type: 'error',
          message: result?.message || 'Unable to verify QR code. Ensure batch is generated in Admin Panel.',
        });
        return;
      }

      if (activeProof && (result.claimCode || cleanSerial)) {
        saveStoredClaimProof(result.claimCode || cleanSerial, {
          fileName: activeProofName || 'Scan_Batch_Receipt_08.jpg',
          dataUrl: activeProof,
        });
      }

      if (soundEnabled && AudioService?.playSuccessChime) AudioService.playSuccessChime();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#C84826', '#15803D', '#EAB308'],
        });
      } catch (_) {}

      const syncedTimestamp = formatTimeHMS();
      setRecentTags((prev) =>
        prev.map((t) =>
          t.id === tempId
            ? {
                ...t,
                desc: `${result.productName || 'Vitrified SKU'} • ₹${result.cashbackAmount || 150} Cashback Claimed`,
                time: syncedTimestamp,
                status: 'SYNCED',
              }
            : t
        )
      );

      setScanStatus({
        type: 'success',
        message: `Success! Claim ${result.claimCode || ''} (₹${result.cashbackAmount || 150}) synced to NPCI Escrow moderation.`,
      });
      setManualSerial('');
      setProofImage(null);
      setProofFileName('');

      if (onClaimCreated) {
        setTimeout(() => onClaimCreated(), 2000);
      }
    } catch (err) {
      setIsScanning(false);
      const now = Date.now();
      if (now - lastBuzzTimeRef.current > 3000) {
        lastBuzzTimeRef.current = now;
        if (soundEnabled && AudioService?.playErrorBuzz) AudioService.playErrorBuzz();
      }
      setScanStatus({
        type: 'error',
        message: `Verification Error: ${err.message}`,
      });
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto flex-1 flex flex-col font-serif select-none pb-8">
      {/* Hidden container for file-based optical scan */}
      <div id="temp-qr-file-scan-node" className="hidden"></div>

      {/* Screen Header matching PDF Page 10 (Sticky header, never hides on scroll) */}
      <header className="px-4 pt-3 pb-3 bg-white border-b border-[#ECEAE6] flex items-center justify-between font-sans sticky top-0 z-30 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 text-stone-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-stone-900" />
          </button>
          <h2 className="text-base font-bold font-serif text-stone-900 tracking-tight">
            Scan Qr &amp; Upload
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-[#F2F1EE] text-stone-700 px-2 py-0.5 rounded font-mono border border-[#DFDDD8]">
            {currentUser?.id ? (String(currentUser.id).slice(-4)) : 'RS01'}
          </span>
          <div className="w-7 h-7 rounded-full bg-[#A6300F] text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs">
            {currentUser?.name ? currentUser.name[0] : 'R'}
          </div>
        </div>
      </header>

      <div className="px-3.5 pt-3 space-y-3 flex-1">
        {/* Camera HUD Box matching PDF Page 10 */}
        <div className="relative w-full aspect-square bg-[#1A1A1A] rounded-3xl overflow-hidden shadow-inner flex flex-col justify-between p-3.5 border border-stone-800">
          {/* Live Optical QR Video Container */}
          <div
            id={scannerContainerId}
            className="absolute inset-0 w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>div]:hidden"
          ></div>

          {/* Top HUD Telemetry Row (Step 10A Blueprint Specification) */}
          <div className="relative z-10 flex items-center justify-between font-sans text-xs">
            <div className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white font-mono text-[10px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>DETECTING: {latestBatch?.skuCode || 'DTA-TYPE3-HD'}</span>
            </div>

            <button
              type="button"
              onClick={toggleTorch}
              className={`px-2.5 py-1 rounded-full backdrop-blur-md border transition cursor-pointer flex items-center gap-1.5 font-mono text-[10px] font-bold ${
                torchOn
                  ? 'bg-amber-400 text-stone-900 border-amber-300 shadow-sm'
                  : 'bg-black/65 text-white border-white/15 hover:bg-black/80'
              }`}
              title="Toggle Hardware Camera Torch"
            >
              {torchOn ? (
                <Flashlight className="w-3.5 h-3.5 text-stone-900" />
              ) : (
                <FlashlightOff className="w-3.5 h-3.5 text-stone-300" />
              )}
              <span>{torchOn ? 'Torch On' : 'Torch Off'}</span>
            </button>
          </div>

          {/* Center Viewfinder Reticle with 3px #C84826 L-Brackets & 3x3 Grid */}
          <div
            onClick={() => {
              const fallbackToken = getNextAvailableSerial();
              if (fallbackToken) {
                setManualSerial(fallbackToken);
                processSubmission(fallbackToken);
              } else {
                setScanStatus({
                  type: 'error',
                  message: 'No active unscanned QR tokens in queue. Generate a batch in Admin Panel first.',
                });
              }
            }}
            className="relative z-10 mx-auto w-56 h-56 flex items-center justify-center cursor-pointer group"
            title="Click reticle to scan next available token"
          >
            {/* 4 Corner L-Brackets */}
            <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-[#C84826] rounded-tl-[4px]"></div>
            <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-[#C84826] rounded-tr-[4px]"></div>
            <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-[#C84826] rounded-bl-[4px]"></div>
            <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-[#C84826] rounded-br-[4px]"></div>

            {/* 3x3 Grid Hairlines */}
            <div className="absolute inset-2 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
              <div className="border-r border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-r border-b border-white"></div>
              <div className="border-b border-white"></div>
              <div className="border-r border-white"></div>
              <div className="border-r border-white"></div>
              <div></div>
            </div>

            {/* Red Scanning Laser Line */}
            <div className="absolute inset-x-3 h-0.5 bg-[#C84826] shadow-[0_0_8px_#C84826] animate-pulse"></div>

            {/* Center Circle Crosshair */}
            <div className="w-4 h-4 rounded-full border border-white/80 flex items-center justify-center pointer-events-none">
              <span className="w-1 h-1 rounded-full bg-[#C84826]"></span>
            </div>
          </div>

          {/* Bottom HUD Alignment Pill matching PDF Page 10 */}
          <div className="relative z-10 font-sans">
            <div className="bg-white/95 backdrop-blur-md rounded-full py-2 px-3 text-center shadow-lg border border-white">
              <span className="text-[11px] font-bold text-stone-800">
                Align DuraGrit QR within frame for auto-ingest
              </span>
            </div>
          </div>
        </div>

        {/* 3-Col Metadata Strip matching PDF Page 10 */}
        <div className="grid grid-cols-3 gap-2 font-sans">
          <div className="bg-white rounded-xl p-2.5 border border-[#ECEAE6] shadow-2xs">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
              LOT TARGET
            </span>
            <span className="text-xs font-black text-stone-900 font-mono mt-0.5 block truncate">
              {latestBatch?.batchId?.replace('DG-BATCH-', '') || 'MOR-24-B9'}
            </span>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-[#ECEAE6] shadow-2xs">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
              SKU CLASS
            </span>
            <span className="text-xs font-black text-stone-900 font-mono mt-0.5 block truncate">
              {latestBatch?.skuCode || 'CER-ADH-70'}
            </span>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-[#ECEAE6] shadow-2xs">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
              BATCH STATE
            </span>
            <span className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>VALIDATED</span>
            </span>
          </div>
        </div>

        {/* Status Alerts with stable container to eliminate vertical jumping */}
        <div className="min-h-[58px] flex items-center">
          {scanStatus ? (
            <div
              className={`w-full p-3 rounded-2xl text-xs flex items-start gap-2.5 font-sans transition-all duration-200 ${
                scanStatus.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : scanStatus.type === 'processing'
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {scanStatus.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              ) : scanStatus.type === 'processing' ? (
                <div className="w-4 h-4 shrink-0 mt-0.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              )}
              <span className="leading-relaxed font-semibold">{scanStatus.message}</span>
            </div>
          ) : (
            <div className="w-full py-2.5 px-3 bg-stone-50 border border-stone-200/60 rounded-xl text-center text-[11px] text-stone-500 font-sans">
              Point camera steadily at QR code on DuraGrit bag or carton
            </div>
          )}
        </div>

        {/* Manual Serial Ingest Card matching PDF Page 10 */}
        <section className="bg-white rounded-2xl p-4 border border-[#ECEAE6] shadow-xs space-y-3 font-sans">
          <div>
            <h3 className="font-bold text-stone-900 text-xs font-serif">
              Manual Serial Ingest
            </h3>
            <p className="text-[11px] text-stone-500">Having trouble scanning label?</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              processSubmission(manualSerial);
            }}
            className="space-y-2.5"
          >
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Serial / Batch Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 flex items-center">
                  <span className="absolute left-3 text-stone-400 font-mono font-bold text-xs">
                    #
                  </span>
                  <input
                    type="text"
                    value={manualSerial}
                    onChange={(e) => setManualSerial(e.target.value.toUpperCase())}
                    placeholder="DG-88410-B04"
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-[#F4F3F0] border border-[#ECEAE6] rounded-xl focus:bg-white focus:border-[#C84826] outline-none text-stone-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isScanning || !manualSerial.trim()}
                  className="bg-[#C84826] hover:bg-[#A6300F] disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-2xs transition cursor-pointer font-serif shrink-0"
                >
                  {isScanning ? 'Logging...' : 'Log Code'}
                </button>
              </div>
              <p className="text-[10px] text-stone-400 font-mono mt-1">
                ⓘ Format: DG-[5-digit Lot]-[Unit Identifier]
              </p>
            </div>

            {/* Switch to Manifest CSV / Photo Ingest Button matching PDF Page 10 (Step A.2) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProofFileChange}
              accept="image/*,.csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => setShowManifestSheet(true)}
              className="w-full bg-white hover:bg-stone-50 text-stone-800 font-bold py-2.5 px-3 rounded-xl border border-stone-300 text-xs flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer font-serif"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#C84826]" />
              <span>
                {proofFileName ? `Selected: ${proofFileName}` : 'Switch to Manifest CSV / Photo Ingest'}
              </span>
            </button>

            {/* Field Device Sync Pill matching PDF Page 10 */}
            <div className="bg-[#F4F3F0] rounded-xl p-2 text-center border border-[#ECEAE6] flex items-center justify-between text-[10px] text-stone-600 font-mono">
              <span className="flex items-center gap-1 font-bold text-stone-800">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span>Field Device Sync: MOR-FD-08</span>
              </span>
              <span>MORBI YARD 04</span>
            </div>
          </form>
        </section>

        {/* Recent Field Tags (Session) matching PDF Page 10 (Step A.3 Offline Queue & Auto-Sync) */}
        <section className="space-y-2 font-sans">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              RECENT FIELD TAGS (SESSION)
            </span>
            <div className="flex items-center gap-1.5">
              {recentTags.some((t) => t.status === 'QUEUED') && (
                <button
                  type="button"
                  onClick={replayQueuedTags}
                  className="text-[9.5px] font-mono font-bold text-[#A6300F] bg-[#FEF2EE] px-2 py-0.5 rounded-full border border-[#F9CEB8] flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Sync Queue</span>
                </button>
              )}
              <span className="text-[10px] font-mono font-bold text-[#2B4A8E] bg-[#D5E0F8] px-2 py-0.5 rounded-full border border-[#C5D5F5]">
                {recentTags.filter((t) => t.status === 'QUEUED').length > 0
                  ? `${recentTags.filter((t) => t.status === 'QUEUED').length} QUEUED`
                  : `${recentTags.length} SYNCED`}
              </span>
            </div>
          </div>

          {recentTags.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 border border-[#ECEAE6] text-center text-[11px] text-stone-400 font-serif">
              No field scans queued in this session yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recentTags.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-3 border border-[#ECEAE6] shadow-2xs flex items-center justify-between font-sans"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F4F3F0] text-[#C84826] flex items-center justify-center border border-[#ECEAE6] shrink-0">
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-xs text-stone-900">{t.tag}</div>
                      <div className="text-[10.5px] text-stone-500">{t.desc}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase font-mono border ${
                        t.status === 'QUEUED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="block text-[9.5px] text-stone-400 font-mono mt-0.5">{t.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Step A.2: Manifest CSV / Photo Ingest Modal */}
      <ManifestIngestSheet
        isOpen={showManifestSheet}
        onClose={() => setShowManifestSheet(false)}
        onIngestSerial={(serial, photoDataUrl, fileName) =>
          processSubmission(serial, photoDataUrl, fileName)
        }
      />
    </div>
  );
};
