import React, { useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  FileSpreadsheet,
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Play,
  QrCode,
  FileText
} from 'lucide-react';

// Extracts tokens matching /^#?DG-[A-Z0-9-]+$/i either as full row or cell within CSV
export function parseManifestSerialsFromText(rawText) {
  if (!rawText) return [];
  const lines = String(rawText)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const extracted = [];
  const seen = new Set();
  const exactTokenRegex = /^#?DG-[A-Z0-9-]+$/i;

  for (const line of lines) {
    // Split CSV cells by comma, semicolon, or tab
    const cells = line.split(/[,;\t]+/).map((c) => c.replace(/^["']|["']$/g, '').trim());
    for (const cell of cells) {
      if (exactTokenRegex.test(cell)) {
        const clean = cell.replace(/^#/, '').toUpperCase();
        if (!seen.has(clean)) {
          seen.add(clean);
          extracted.push(clean);
        }
      } else if (cell.includes('verify.duragritvitrified.com/qr/')) {
        const parts = cell.split('/qr/');
        const candidate = (parts[1] || '').split(/[?#\s]/)[0].trim();
        if (exactTokenRegex.test(candidate)) {
          const clean = candidate.replace(/^#/, '').toUpperCase();
          if (!seen.has(clean)) {
            seen.add(clean);
            extracted.push(clean);
          }
        }
      }
    }
  }
  return extracted;
}

export const ManifestIngestSheet = ({
  isOpen,
  onClose,
  onIngestSerial,
}) => {
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' | 'photo'
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedSerials, setParsedSerials] = useState([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState(null);

  // Photo Ingest state
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [decodedPhotoSerial, setDecodedPhotoSerial] = useState('');
  const [manualPhotoSerial, setManualPhotoSerial] = useState('');
  const [isDecodingPhoto, setIsDecodingPhoto] = useState(false);

  const csvInputRef = useRef(null);
  const photoInputRef = useRef(null);

  if (!isOpen) return null;

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      const serials = parseManifestSerialsFromText(content);
      setParsedSerials(serials);
      if (serials.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No valid DG-* serial tokens found in file. Expected format: DG-94812-A01',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Parsed ${serials.length} valid DuraGrit serial token(s) ready for sequential ingest.`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleRunBulkCsvIngest = async () => {
    if (parsedSerials.length === 0 || isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    setBulkProgress({ done: 0, total: parsedSerials.length });

    let successCount = 0;
    for (let i = 0; i < parsedSerials.length; i++) {
      const serial = parsedSerials[i];
      try {
        await onIngestSerial(serial, null, `CSV Manifest (${csvFileName || 'Batch'})`);
        successCount++;
      } catch (_) {}
      setBulkProgress({ done: i + 1, total: parsedSerials.length });
    }

    setIsSubmittingBulk(false);
    setStatusMessage({
      type: 'success',
      text: `Processed ${successCount} of ${parsedSerials.length} serials into session queue.`,
    });
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);
    setDecodedPhotoSerial('');
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreviewUrl(ev.target?.result || null);
    };
    reader.readAsDataURL(file);

    setIsDecodingPhoto(true);
    const scannerNodeId = 'manifest-photo-decode-node';
    try {
      const qr = new Html5Qrcode(scannerNodeId);
      qr.scanFile(file, true)
        .then((decoded) => {
          const clean = String(decoded || '')
            .replace(/^https?:\/\/[^/]+\/qr\//i, '')
            .replace(/^#/, '')
            .trim()
            .toUpperCase();
          setDecodedPhotoSerial(clean);
          setManualPhotoSerial(clean);
          setStatusMessage({
            type: 'success',
            text: `Decoded QR serial from label photo: ${clean}`,
          });
        })
        .catch(() => {
          setStatusMessage({
            type: 'info',
            text: 'Label photo attached. Enter or confirm the serial key below to log with photo proof.',
          });
        })
        .finally(() => {
          setIsDecodingPhoto(false);
        });
    } catch (_) {
      setIsDecodingPhoto(false);
    }
  };

  const handleLogPhotoSerial = async (e) => {
    e.preventDefault();
    const targetSerial = (manualPhotoSerial || decodedPhotoSerial).replace(/^#/, '').trim().toUpperCase();
    if (!targetSerial) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter or decode a valid DG-* serial key to log with this photo.',
      });
      return;
    }
    setIsSubmittingBulk(true);
    try {
      await onIngestSerial(targetSerial, photoPreviewUrl, photoFileName || 'Label_Photo.jpg');
      onClose();
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans select-none"
      onClick={onClose}
    >
      <div id="manifest-photo-decode-node" className="hidden"></div>

      <div
        className="bg-white w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl border border-[#ECEAE6] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#1C1917] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C84826] flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif tracking-tight">
                Manifest CSV &amp; Photo Ingest
              </h3>
              <p className="text-[10px] text-stone-400 font-mono">
                MOR-FD-08 • BULK &amp; OPTICAL DECODER
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Mode Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-3 bg-[#F4F3F0] border-b border-[#ECEAE6]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('csv');
              setStatusMessage(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-[#C84826] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#ECEAE6]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Manifest CSV (.csv/.txt)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('photo');
              setStatusMessage(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-[#C84826] text-white shadow-xs'
                : 'bg-white text-stone-700 hover:bg-stone-100 border border-[#ECEAE6]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo Ingest (.jpg/.png)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 max-h-[72vh] overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'csv' ? (
            <div className="space-y-3">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={handleCsvUpload}
                className="hidden"
              />

              <div
                onClick={() => csvInputRef.current?.click()}
                className="border-2 border-dashed border-[#D6D3CD] hover:border-[#C84826] bg-[#FAF9F6] rounded-2xl p-5 text-center cursor-pointer transition space-y-1.5"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#FEF2EE] text-[#C84826] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-stone-900">
                  {csvFileName ? csvFileName : 'Tap to upload Manifest .CSV or .TXT'}
                </div>
                <p className="text-[10.5px] text-stone-500 font-mono">
                  Matches /^#?DG-[A-Z0-9-]+$/i (e.g., DG-94812-A01, DG-94812-A02)
                </p>
              </div>

              {parsedSerials.length > 0 && (
                <div className="bg-[#F4F3F0] rounded-xl p-3 border border-[#ECEAE6] space-y-2">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-stone-600">
                    <span>DETECTED SERIAL TOKENS ({parsedSerials.length})</span>
                    <span className="font-mono text-[#A6300F]">SEQUENTIAL LOG CODE</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {parsedSerials.map((s, idx) => (
                      <div
                        key={s}
                        className="bg-white px-2.5 py-1.5 rounded-lg border border-[#ECEAE6] flex items-center justify-between text-xs font-mono"
                      >
                        <span className="font-bold text-stone-900">#{s}</span>
                        <span className="text-[10px] text-stone-400">Row {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSubmittingBulk && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 font-mono text-center">
                  Submitting {bulkProgress.done} / {bulkProgress.total} serials...
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={parsedSerials.length === 0 || isSubmittingBulk}
                  onClick={handleRunBulkCsvIngest}
                  className="flex-1 py-2.5 bg-[#C84826] hover:bg-[#A6300F] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer font-serif"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Ingest {parsedSerials.length || ''} Serials</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogPhotoSerial} className="space-y-3">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <div
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-[#D6D3CD] hover:border-[#C84826] bg-[#FAF9F6] rounded-2xl p-4 text-center cursor-pointer transition space-y-2"
              >
                {photoPreviewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={photoPreviewUrl}
                      alt="Selected QR Label"
                      className="w-28 h-28 object-cover mx-auto rounded-xl border border-stone-300 shadow-xs"
                    />
                    <span className="text-[11px] font-bold text-emerald-700 block truncate">
                      {photoFileName}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-[#FEF2EE] text-[#C84826] flex items-center justify-center mx-auto">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-stone-900">
                      Select Bag / Pallet Label Photo (.JPG / .PNG)
                    </div>
                    <p className="text-[10.5px] text-stone-500">
                      Auto-decodes QR barcode client-side or attaches photo to serial entry
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isDecodingPhoto ? 'Decoding Optical QR...' : 'Decoded / Manual Serial Key'}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-stone-400 font-mono font-bold text-xs">#</span>
                  <input
                    type="text"
                    value={manualPhotoSerial}
                    onChange={(e) => setManualPhotoSerial(e.target.value.toUpperCase())}
                    placeholder="DG-88410-B04"
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-[#F4F3F0] border border-[#ECEAE6] rounded-xl focus:bg-white focus:border-[#C84826] outline-none text-stone-900"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBulk || !(manualPhotoSerial || decodedPhotoSerial)}
                  className="flex-1 py-2.5 bg-[#C84826] hover:bg-[#A6300F] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer font-serif"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Log Photo &amp; Code</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
