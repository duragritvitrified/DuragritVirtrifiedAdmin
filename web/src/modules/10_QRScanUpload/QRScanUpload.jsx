import React, { useState, useEffect,  useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { QREngineV24 } from '../../services/qrEngine';
import confetti from 'canvas-confetti';
import { 
  Camera, Keyboard,  CheckCircle, AlertCircle,  Zap, RotateCcw,  ArrowLeft, Sparkles,  ShieldCheck, ListFilter
} from 'lucide-react';

export const QRScanUpload = ({ onBack, onClaimCreated }) => {
  const { currentUser } = useAuth();
  const { submitScannedCode, batches } = useData();

  const [inputMode, setInputMode] = useState('camera'); // 'camera' | 'manual'
  const [manualSerial, setManualSerial] = useState('DG-50142-000109');
  const [isScanning, setIsScanning] = useState(true);
  const [scanStatus, setScanStatus] = useState(null); // { type: 'success' | 'error', message: '' }
  const [sessionLogs, setSessionLogs] = useState([
    { id: '1', key: 'DG-50142-000101', status: 'Ingested', time: '17:42:10' }, { id: '2', key: 'DG-50142-000102', status: 'Ingested', time: '17:43:05' }
  ]);

  // Video feed simulator / camera stream
  const videoRef = useRef(null);

  useEffect(() => {
    let stream = null;
    if (inputMode === 'camera' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          // Camera not available or denied; fallback silently to optical simulator
          console.warn('Camera feed not available, running optical targeting simulator', err);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [inputMode]);

  const handleSimulateAutoIngest = () => {
    // Pick an un-scanned sample from active batches or generate on-the-fly
    const randomLot = 50142;
    const randomUnit = Math.floor(100 + Math.random() * 899);
    const generatedKey = `DG-${randomLot}-${String(randomUnit).padStart(6, '0')}`;
    processKeySubmission(generatedKey);
  };

  const processKeySubmission = (serialKey) => {
    if (!QREngineV24.validateSerialFormat(serialKey)) {
      setScanStatus({
        type: 'error', message: 'Invalid Serial Key Format. Must match DG-[5-digit Lot]-[Unit Identifier] (e.g. DG-50142-000109)'
      });
      return;
    }

    const result = submitScannedCode({
      serialKey, user: currentUser || { name: 'Rameshwar Prasad Sharma', mobile: '9820144521', role: 'Contractor' }
    });

    if (result.success) {
      confetti({
        particleCount: 80, spread: 60, origin: { y: 0.6 }
      });

      setScanStatus({
        type: 'success', message: `Claim for , ${result.claim.amount} successfully ingested into Escrow Queue!`, claim: result.claim
      });

      setSessionLogs(prev => [
        {
          id: String(Date.now()), key: serialKey, status: 'Ingested', time: new Date().toLocaleTimeString()
        },  ...prev
      ]);

      if (onClaimCreated) onClaimCreated(result.claim);
    } else {
      setScanStatus({
        type: 'error', message: result.message
      });
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processKeySubmission(manualSerial);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Field Dashboard</span>
        </button>

        <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-bold">
          <button
            onClick={() => setInputMode('camera')}
            className={`px-3 py-1 rounded-md transition-all ${
              inputMode === 'camera' ? 'bg-[#8B0000] text-white shadow-sm' : 'text-gray-600'
            }`}
          >
            Optical Scan
          </button>
          <button
            onClick={() => setInputMode('manual')}
            className={`px-3 py-1 rounded-md transition-all ${
              inputMode === 'manual' ? 'bg-[#8B0000] text-white shadow-sm' : 'text-gray-600'
            }`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      {inputMode === 'camera' ? (
        <div className="duragrit-card overflow-hidden bg-black relative rounded-2xl shadow-xl aspect-square flex flex-col items-center justify-center">
          
          {/* Simulated or Real Video Background */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />

          {/* Optical Viewfinder Overlay (60FPS Styling) */}
          <div className="relative z-10 w-64 h-64 border-2 border-white/40 rounded-2xl flex items-center justify-center pointer-events-none">
            {/* Viewfinder Corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br"></div>

            {/* Scanning Laser Line */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,  )] animate-bounce"></div>

            <div className="absolute bottom-3 text-[10px] text-white/90 font-mono tracking-wider bg-black/60 px-2 py-0.5 rounded">
              AUTO-INGEST ALIGNMENT 60FPS
            </div>
          </div>

          {/* Quick Trigger Button for Optical Ingest */}
          <div className="absolute bottom-4 z-20 w-full px-6">
            <button
              onClick={handleSimulateAutoIngest}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-extrabold text-xs rounded-xl shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4 text-stone-950 fill-stone-950" />
              <span>Simulate Auto-Ingest Optical Capture</span>
            </button>
          </div>

        </div>
      ) : (
        /* Manual Key Entry Fallback */
        <div className="duragrit-card p-5 bg-white space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-800 border-b pb-3">
            <Keyboard className="w-4 h-4 text-[#8B0000]" />
            <span>Manual Serial Key Fallback</span>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Serial Key (Format: DG-[5-digit Lot]-[Unit Identifier])
              </label>
              <input
                type="text"
                required
                value={manualSerial}
                onChange={(e) => setManualSerial(e.target.value)}
                placeholder="DG-50142-000109"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#8B0000] font-mono uppercase font-bold"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Found on the thermal foil tamper seal beneath the scratch layer.
              </span>
            </div>

            <button
              type="submit"
              className="w-full duragrit-btn-primary py-2.5 text-xs flex items-center justify-center space-x-2 font-bold"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Verify Key & Ingest Escrow</span>
            </button>
          </form>
        </div>
      )}

      {/* Scan Feedback Alert */}
      {scanStatus && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
            scanStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {scanStatus.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{scanStatus.message}</p>
            {scanStatus.claim && (
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Claim #{scanStatus.claim.claimNumber} • Awaiting NPCI Supervisor release.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Session Queue Logs */}
      <div className="duragrit-card p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-700 border-b pb-2">
          <span className="flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-gray-500" />
            <span>Current Session Ingest Queue</span>
          </span>
          <span className="text-gray-400 font-normal">{sessionLogs.length} items logged</span>
        </div>

        <div className="divide-y divide-gray-100 max-h-36 overflow-y-auto">
          {sessionLogs.map(log => (
            <div key={log.id} className="py-1.5 flex items-center justify-between text-xs">
              <span className="font-mono text-gray-800 font-medium">{log.key}</span>
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="text-gray-400">{log.time}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
