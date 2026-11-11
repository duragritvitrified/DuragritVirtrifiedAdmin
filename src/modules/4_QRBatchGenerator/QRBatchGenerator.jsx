import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { QREngineV24 } from '../../services/qrEngine';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { 
  QrCode, Sparkles,  ShieldCheck, Download,  Copy, Check,  Layers, Hash,  Lock, Boxes,  Eye
} from 'lucide-react';

export const QRBatchGenerator = () => {
  const { skus, batches,  createBatch } = useData();

  const [selectedSkuId, setSelectedSkuId] = useState(skus[0]?.id || '');
  const [prefix, setPrefix] = useState('DG');
  const [lotNumber, setLotNumber] = useState('50145');
  const [quantity, setQuantity] = useState(100);
  const [discountTier, setDiscountTier] = useState('Gold Applicator Tier 2');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeBatch, setActiveBatch] = useState(batches[0] || null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [showAllTokens, setShowAllTokens] = useState(false);

  const selectedSku = skus.find(s => s.id === selectedSkuId) || skus[0];

  // Render QR Code preview
  const handlePreviewToken = async (token) => {
    try {
      const url = await QRCode.toDataURL(token.serialKey, {
        width: 200, margin: 2, color: {
          dark: '#8B0000', light: '#FFFFFF'
        }
      });
      setPreviewQrDataUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      try {
        const newBatch = createBatch({
          skuId: selectedSkuId, prefix,  lotNumber, quantity: Number(quantity), discountTier
        });
        setActiveBatch(newBatch);
        if (newBatch.tokens?.[0]) {
          handlePreviewToken(newBatch.tokens[0]);
        }
        setIsGenerating(false);
      } catch (err) {
        alert(err.message);
        setIsGenerating(false);
      }
    }, 700);
  };

  const exportTokensPDF = () => {
    if (!activeBatch || !activeBatch.tokens) return;
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFillColor(9, 43, 99);
      doc.rect(0, 0, 210, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('DURAGRIT VITRIFIED - QR BATCH MANIFEST', 15, 14);

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`Batch ID: ${activeBatch.batchId} • Quantity: ${activeBatch.tokens.length} Units`, 15, 30);
      doc.text(`Status: Active • Encryption: Engine v2.4 (FIPS 140-2)`, 15, 36);

      let y = 46;
      doc.setFontSize(7.5);
      doc.setFont('courier', 'normal');
      activeBatch.tokens.forEach((t, idx) => {
        if (y > 280) {
          doc.addPage();
          y = 15;
        }
        doc.text(`${String(idx + 1).padStart(4, '0')}. ${t.serialKey} | SHA-128: ${t.dualSha128} | Lot: ${t.lotNumber}`, 15, y);
        y += 5.5;
      });

      doc.save(`DURAGRIT_${activeBatch.batchId}_SECURITY_TOKENS.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <span>QR Code Batch Generator</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
            Engine V2.4 Active
          </span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Cryptographic token generation with Dual 128-bit SHA hashing and anti-duplication collision protection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Generator Control Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="duragrit-card p-5">
            <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
              <Boxes className="w-4 h-4 text-[#8B0000]" />
              <span>Batch Parameter Controls</span>
            </h2>

            <form onSubmit={handleGenerate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Product SKU</label>
                <select
                  value={selectedSkuId}
                  onChange={(e) => setSelectedSkuId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
                >
                  {skus.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.skuCode} - {s.name.substring(0,30)}...
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-amber-700 font-semibold mt-1">
                  Cashback per Unit: , {selectedSku?.cashbackReward || 50}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Prefix Selector</label>
                  <select
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none font-mono font-bold"
                  >
                    <option value="DG">DG (Standard)</option>
                    <option value="DGV">DGV (Vitrified)</option>
                    <option value="DGM">DGM (Master)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">5-Digit Lot #</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Batch Serialization Quantity</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none"
                >
                  <option value={50}>50 Units (Sampling Run)</option>
                  <option value={100}>100 Units (Pilot Packaging)</option>
                  <option value={500}>500 Units (Factory Shift)</option>
                  <option value={1000}>1,000 Units (Full Industrial Lot)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Discount / Applicator Tier</label>
                <select
                  value={discountTier}
                  onChange={(e) => setDiscountTier(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none"
                >
                  <option value="Gold Applicator Tier 2">Gold Applicator Tier 2 (Standard)</option>
                  <option value="Platinum Authorized Partner">Platinum Authorized Partner (1.2x)</option>
                  <option value="Silver Applicator Tier 1">Silver Applicator Tier 1 (Base)</option>
                </select>
              </div>

              {/* Cryptographic Protection Badge */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
                <div className="flex items-center text-emerald-700 font-bold space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Dual 128-bit SHA Engine</span>
                </div>
                <p>Collision guard guarantees zero duplication across 10,000,000 lots.</p>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full duragrit-btn-primary py-2.5 flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate & Hash Batch</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live Tokens Inspection & QR Preview */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Active Batch Summary Header */}
          {activeBatch && (
            <div className="duragrit-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50 to-white">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-[#8B0000]">{activeBatch.batchId}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {activeBatch.quantity} Serialized Tokens
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  SKU: <strong className="text-gray-700">{activeBatch.skuCode}</strong> • Lot #{activeBatch.lotNumber} • Engine {activeBatch.engineVersion}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={exportTokensPDF}
                  className="duragrit-btn-secondary text-xs flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Manifest</span>
                </button>
              </div>
            </div>
          )}

          {/* Tokens List & Live Dual-Hash Viewer */}
          <div className="duragrit-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 text-xs font-bold text-gray-700">
              <span>Generated Serial Tokens (Click to Preview QR)</span>
              <span className="text-gray-400 font-normal">Format: DG-[5-digit Lot]-[Unit Identifier]</span>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {((showAllTokens ? activeBatch?.tokens : activeBatch?.tokens?.slice(0, 50)) || []).map((tok, idx) => (
                <div
                  key={tok.serialKey}
                  onClick={() => handlePreviewToken(tok)}
                  className="p-3 hover:bg-amber-50/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {tok.serialKey}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-700">
                        ₹{tok.cashbackAmount}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-gray-400 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Dual SHA-128: {tok.dualSha128}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(tok.serialKey);
                      setCopiedToken(tok.serialKey);
                      setTimeout(() => setCopiedToken(null), 1500);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    title="Copy Serial Key"
                  >
                    {copiedToken === tok.serialKey ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                {showAllTokens
                  ? `Showing all ${activeBatch?.tokens?.length || 0} tokens of batch.`
                  : `Showing first ${Math.min(50, activeBatch?.tokens?.length || 0)} of ${activeBatch?.tokens?.length || 0} tokens.`}
              </span>
              {(activeBatch?.tokens?.length || 0) > 50 && (
                <button
                  type="button"
                  onClick={() => setShowAllTokens(!showAllTokens)}
                  className="font-bold text-[#8B0000] hover:underline cursor-pointer"
                >
                  {showAllTokens ? 'Show Top 50' : `Show All (${activeBatch.tokens.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Optical QR Visual Preview Card */}
          {previewQrDataUrl && (
            <div className="duragrit-card p-4 bg-gradient-to-r from-amber-50/30 to-white flex items-center space-x-4 border border-amber-200">
              <div className="p-2 bg-white rounded-xl shadow border border-amber-100">
                <img src={previewQrDataUrl} alt="Token QR Preview" className="w-24 h-24" />
              </div>
              <div className="text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Thermal Foil Print Matrix
                </span>
                <p className="font-bold text-gray-900 text-sm">Optical Laser Scanner Target</p>
                <p className="text-gray-500">
                  Ready for 60FPS high-speed camera auto-ingestion on packaging lines.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
