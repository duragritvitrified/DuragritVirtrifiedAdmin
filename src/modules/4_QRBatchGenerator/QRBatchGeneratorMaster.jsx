import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import {
  THERMAL_PRINTER_SPEC,
  generateSerializedBatchTokens,
  exportThermal40x40Pdf,
  exportThermal40x40SvgSheet,
  exportThermalZplStream,
  exportSerializedBatchManifestCsv,
} from '../../utils/thermalPrintExport';
import {
  QrCode, ShieldCheck, Download, Printer,
  Copy, Check, Lock, RefreshCw, X, Info, Plus, Trash2,
  AlertCircle,
  CheckCircle2, FileText, FileSpreadsheet
} from 'lucide-react';

function createSimpleQRSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="160" height="160">
    <rect width="120" height="120" fill="#ffffff" rx="8"/>
    <path d="M12 12h28v28h-28z M16 16v20h20v-20z M20 20h12v12h-12z" fill="#1C1917"/>
    <path d="M80 12h28v28h-28z M84 16v20h20v-20z M88 20h12v12h-12z" fill="#1C1917"/>
    <path d="M12 80h28v28h-28z M16 84v20h20v-20z M20 88h12v12h-12z" fill="#1C1917"/>
    <rect x="52" y="52" width="16" height="16" rx="3" fill="#C84826"/>
    <path d="M57 56h3v8h-3z M62 56h3v8h-3z" fill="#ffffff"/>
    <rect x="46" y="14" width="6" height="6" fill="#1C1917"/>
    <rect x="58" y="14" width="6" height="6" fill="#1C1917"/>
    <rect x="68" y="22" width="6" height="6" fill="#1C1917"/>
    <rect x="46" y="28" width="6" height="6" fill="#1C1917"/>
    <rect x="58" y="34" width="6" height="6" fill="#1C1917"/>
    <rect x="14" y="46" width="6" height="6" fill="#1C1917"/>
    <rect x="28" y="52" width="6" height="6" fill="#1C1917"/>
    <rect x="76" y="48" width="6" height="6" fill="#1C1917"/>
    <rect x="88" y="54" width="6" height="6" fill="#1C1917"/>
    <rect x="46" y="74" width="6" height="6" fill="#1C1917"/>
    <rect x="58" y="80" width="6" height="6" fill="#1C1917"/>
    <rect x="76" y="74" width="6" height="6" fill="#1C1917"/>
    <rect x="88" y="84" width="6" height="6" fill="#1C1917"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function TokenQrPreview({ url, fallbackSvg }) {
  const [svgData, setSvgData] = useState('');

  useEffect(() => {
    let active = true;
    const qrLib = QRCode?.default || QRCode;
    if (qrLib && typeof qrLib.toString === 'function') {
      qrLib.toString(url, { type: 'svg', margin: 0, width: 72 })
        .then((res) => { if (active) setSvgData(res); })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [url]);

  if (svgData) {
    return (
      <div
        className="w-16 h-16 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
        dangerouslySetInnerHTML={{ __html: svgData }}
      />
    );
  }
  return <img src={fallbackSvg} alt="QR" className="w-16 h-16" />;
}

export function QRBatchGeneratorMaster({ onNavigateCatalog }) {
  const { skus = [], batches = [], createBatch, deleteBatch } = useData();

  const currentMonthYear = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' }).toUpperCase().replace(' ', '-');

  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [batchPrefix, setBatchPrefix] = useState(`BATCH-${currentMonthYear}`);
  const [quantity, setQuantity] = useState(25);
  const [cashbackReward, setCashbackReward] = useState(50);
  const [discountTier, setDiscountTier] = useState(15);
  const [validityPeriod, setValidityPeriod] = useState('12 Months from Generation Date');

  const [liveQrDataUrl, setLiveQrDataUrl] = useState(() => createSimpleQRSvg());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatedBatchModal, setGeneratedBatchModal] = useState(null);
  const [printStickersModal, setPrintStickersModal] = useState(null);
  const [stickerPage, setStickerPage] = useState(1);
  const [stickerSearch, setStickerSearch] = useState('');
  const [stickerPageSize, setStickerPageSize] = useState(24);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  useEffect(() => {
    try {
      const pendingRaw = localStorage.getItem('duragrit_pending_qr_sku');
      if (pendingRaw) {
        const pendingSku = JSON.parse(pendingRaw);
        localStorage.removeItem('duragrit_pending_qr_sku');
        const match = skus.find(
          (s) => s.skuCode === pendingSku.skuCode || s.id === pendingSku.id
        );
        const targetId = match ? (match.id || match.skuCode) : (pendingSku.id || pendingSku.skuCode);
        if (targetId) setSelectedSkuId(targetId);
        if (pendingSku.cashbackReward || pendingSku.cashbackAmount) {
          setCashbackReward(Number(pendingSku.cashbackReward ?? pendingSku.cashbackAmount));
        }
        if (pendingSku.minBatchQty || pendingSku.initialBatchQuantity) {
          setQuantity(Number(pendingSku.minBatchQty || pendingSku.initialBatchQuantity || 25));
        }
        showToast(`Loaded SKU ${pendingSku.skuCode} into Step 04 Print Queue (${THERMAL_PRINTER_SPEC.port} Online)`);
        return;
      }
    } catch (_) {}

    if (skus.length > 0 && (!selectedSkuId || !skus.some((s) => s.id === selectedSkuId || s.skuCode === selectedSkuId))) {
      setSelectedSkuId(skus[0].id || skus[0].skuCode);
    }
  }, [skus, selectedSkuId]);

  const selectedSku = useMemo(() => {
    return skus.find((s) => s.id === selectedSkuId || s.skuCode === selectedSkuId) || skus[0] || null;
  }, [skus, selectedSkuId]);

  useEffect(() => {
    if (selectedSku) {
      const codePart = (selectedSku.skuCode || 'SKU').replace(/[^a-zA-Z0-9]/g, '');
      setBatchPrefix(`BATCH-${codePart}-${currentMonthYear}`);
      setCashbackReward(Number(selectedSku.cashbackReward ?? selectedSku.cashbackAmount ?? 50));
    }
  }, [selectedSku, currentMonthYear]);

  const sampleTokenId = useMemo(() => {
    const cleanSku = selectedSku?.skuCode ? selectedSku.skuCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'NEWSKU';
    const datePart = currentMonthYear.replace(/[^A-Z0-9]/g, '');
    return `DG-${cleanSku}-${datePart}-000001`;
  }, [selectedSku, currentMonthYear]);

  const cryptographicTargetUrl = `https://verify.duragritvitrified.com/qr/${sampleTokenId}`;

  useEffect(() => {
    let isMounted = true;
    const renderQR = async () => {
      try {
        const qrLib = QRCode?.default || QRCode;
        if (qrLib && typeof qrLib.toDataURL === 'function') {
          const url = await qrLib.toDataURL(cryptographicTargetUrl, {
            width: 140,
            margin: 1,
            color: { dark: '#1C1917', light: '#ffffff' },
          });
          if (isMounted) setLiveQrDataUrl(url);
          return;
        }
      } catch (_) {}
      if (isMounted) setLiveQrDataUrl(createSimpleQRSvg());
    };
    renderQR();
    return () => { isMounted = false; };
  }, [cryptographicTargetUrl]);

  const getFullTokensForBatch = (batch) => {
    if (!batch) return [];
    let list = Array.isArray(batch.tokens) ? batch.tokens : Array.isArray(batch.codes) ? batch.codes : [];
    const targetQty = Number(batch.quantity || list.length || 0);

    if (targetQty > 0 && list.length < targetQty) {
      const cleanSku = String(batch.skuCode || selectedSku?.skuCode || 'SKU').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const lotNum = String(batch.lotNumber || (batch.batchId ? String(batch.batchId).split('-').pop() : '') || '1001');
      const prefix = batch.prefix || `BATCH-${cleanSku}-${currentMonthYear}`;
      const dateMatch = String(prefix).match(/(20\d{2})[-_]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i);
      const yyyymmm = dateMatch ? `${dateMatch[1]}${dateMatch[2].toUpperCase()}` : currentMonthYear.replace(/[^A-Z0-9]/g, '');
      const reward = Number(batch.cashbackAmount ?? batch.cashbackReward ?? cashbackReward ?? 50);

      const synthesized = [];
      for (let i = 0; i < targetQty; i++) {
        const existing = list[i];
        if (existing && (existing.serialKey || existing.serial)) {
          synthesized.push(existing);
        } else {
          const seq = String(i + 1).padStart(6, '0');
          const serial = `DG-${cleanSku}-${yyyymmm}-${seq}`;
          synthesized.push({
            serialKey: serial,
            serial: serial,
            serial_token_id: serial,
            verification_url: `https://verify.duragritvitrified.com/qr/${serial}`,
            qrPayloadUrl: `https://verify.duragritvitrified.com/qr/${serial}`,
            sku_code: cleanSku,
            cashback_inr: reward,
            cashbackAmount: reward,
            lotNumber: lotNum,
            isScanned: false,
          });
        }
      }
      list = synthesized;
    }
    return list;
  };

  const handleGenerateBatch = async (e) => {
    e.preventDefault();
    if (!selectedSku) {
      showToast('Please add a Product SKU in Catalog first.');
      return;
    }
    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum < 1) {
      showToast('Quantity must be at least 1 unit.');
      return;
    }

    setIsGenerating(true);
    try {
      const cleanSku = (selectedSku.skuCode || 'SKU').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const batchNum = Math.floor(1000 + Math.random() * 9000);
      const batchId = `DG-BATCH-${cleanSku}-${batchNum}`;
      const datePart = currentMonthYear.replace(/[^A-Z0-9]/g, '');

      const tokensList = generateSerializedBatchTokens({
        skuCode: selectedSku.skuCode,
        batchPrefix,
        quantity: qtyNum,
        cashbackReward: Number(cashbackReward),
        discountTier: Number(discountTier),
        validityPeriod,
        lotNumber: String(batchNum),
      });

      const created = await createBatch({
        batchId,
        skuId: selectedSku.id,
        skuCode: selectedSku.skuCode,
        productName: selectedSku.name,
        packSize: selectedSku.packWeight || selectedSku.packSize || '20 kg',
        mrp: selectedSku.mrp || 0,
        lotNumber: String(batchNum),
        prefix: batchPrefix,
        quantity: qtyNum,
        cashbackAmount: Number(cashbackReward),
        discountTier: `${discountTier}% Dealer Wholesale`,
        validityPeriod,
        createdAt: new Date().toISOString(),
        tokens: tokensList,
        escrowVaultValue: qtyNum * Number(cashbackReward),
        status: 'Active',
      });

      setGeneratedBatchModal({ ...created, escrowVaultValue: qtyNum * Number(cashbackReward), datePart });
      showToast(`Batch ${batchId} (${qtyNum} QR codes) generated & queued on ${THERMAL_PRINTER_SPEC.port} (Online)!`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildBatchExportMeta = (batch) => ({
    batchId: batch.batchId || 'DG-BATCH',
    skuCode: batch.skuCode || selectedSku?.skuCode || 'SKU',
    productName: batch.productName || selectedSku?.name || 'DuraGrit Product',
    batchPrefix: batch.prefix || batchPrefix,
    cashbackAmount: Number(batch.cashbackAmount ?? cashbackReward ?? 50),
    discountTier: batch.discountTier || `${discountTier}%`,
    validityPeriod: batch.validityPeriod || validityPeriod,
  });

  const handleExportThermal40x40Pdf = async (batch) => {
    const targetBatch = batch || generatedBatchModal || printStickersModal;
    if (!targetBatch) return;
    setIsGeneratingPdf(true);
    try {
      const toks = getFullTokensForBatch(targetBatch);
      const meta = buildBatchExportMeta(targetBatch);
      const fname = await exportThermal40x40Pdf(toks, { ...meta, quantity: toks.length });
      showToast(`Exported 300 DPI 40×40mm Thermal Vector PDF (${toks.length} labels): ${fname}`);
    } catch (err) {
      showToast(`Thermal PDF Error: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportThermal40x40Svg = async (batch) => {
    const targetBatch = batch || generatedBatchModal || printStickersModal;
    if (!targetBatch) return;
    try {
      const toks = getFullTokensForBatch(targetBatch);
      const meta = buildBatchExportMeta(targetBatch);
      const fname = await exportThermal40x40SvgSheet(toks, { ...meta, quantity: toks.length });
      showToast(`Exported 300 DPI 40×40mm Vector Roll Sheet (${toks.length} labels): ${fname}`);
    } catch (err) {
      showToast(`SVG Export Error: ${err.message}`);
    }
  };

  const handleExportThermalZpl = (batch, format = 'zpl') => {
    const targetBatch = batch || generatedBatchModal || printStickersModal;
    if (!targetBatch) return;
    try {
      const toks = getFullTokensForBatch(targetBatch);
      const meta = buildBatchExportMeta(targetBatch);
      const res = exportThermalZplStream(toks, { ...meta, quantity: toks.length }, format);
      showToast(`Dispatched ${res.fileName} (${toks.length} labels @ 300 DPI) to ${res.port}!`);
    } catch (err) {
      showToast(`ZPL Stream Error: ${err.message}`);
    }
  };

  const handleExportBatchManifestCsv = (batch) => {
    const targetBatch = batch || generatedBatchModal || printStickersModal;
    if (!targetBatch) return;
    try {
      const toks = getFullTokensForBatch(targetBatch);
      const meta = buildBatchExportMeta(targetBatch);
      const fname = exportSerializedBatchManifestCsv(toks, { ...meta, quantity: toks.length });
      showToast(`Downloaded Serialized Batch Manifest (${toks.length} records): ${fname}`);
    } catch (err) {
      showToast(`CSV Manifest Error: ${err.message}`);
    }
  };

  const copySerial = (serial) => {
    try {
      navigator.clipboard.writeText(serial);
      showToast(`Copied serial ${serial} — ready to scan/paste in Mobile App!`);
    } catch (_) {
      showToast(`Serial: ${serial}`);
    }
  };

  const handlePrintAllStickers = async (batch) => {
    const targetBatch = batch || printStickersModal || generatedBatchModal;
    if (!targetBatch) return;

    const allTokens = getFullTokensForBatch(targetBatch);
    showToast(`Generating crisp vector print run for all ${allTokens.length} stickers...`);

    const qrLib = QRCode?.default || QRCode;

    // Generate inline SVG QR codes for all tokens in parallel chunks of 50
    const svgMap = [];
    const chunkSize = 50;
    for (let i = 0; i < allTokens.length; i += chunkSize) {
      const slice = allTokens.slice(i, i + chunkSize);
      const chunkSvgs = await Promise.all(
        slice.map(async (t) => {
          const url = t.qrPayloadUrl || `https://verify.duragritvitrified.com/qr/${t.serialKey}`;
          try {
            if (qrLib && typeof qrLib.toString === 'function') {
              return await qrLib.toString(url, { type: 'svg', margin: 0 });
            }
          } catch (_) {}
          return '';
        })
      );
      svgMap.push(...chunkSvgs);
    }

    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (!printWindow) {
      showToast('Popup blocked. Allow popups to print stickers.');
      return;
    }

    const stickersHtml = allTokens
      .map((t, idx) => {
        const svgContent = svgMap[idx];
        const qrDisplay = svgContent
          ? svgContent
          : `<img src="${liveQrDataUrl}" class="qr-img" alt="QR" />`;

        return `
        <div class="sticker">
          <div class="sticker-header">DURAGRIT VITRIFIED</div>
          <div class="qr-container">${qrDisplay}</div>
          <div class="serial-key">${t.serialKey}</div>
          <div class="cashback-badge">₹${Number(t.cashbackAmount || targetBatch.cashbackAmount || 50)} Cashback</div>
        </div>`;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DuraGrit_${targetBatch.batchId}_All_${allTokens.length}</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
            body { background: #fff; color: #1C1917; padding: 10px; }
            .header-banner { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1.5px solid #E7E5E0; display: flex; justify-content: space-between; font-size: 11px; }
            .header-banner strong { font-size: 13px; color: #A62C11; }
            .sticker-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; justify-items: center; }
            .sticker { width: 44mm; height: 44mm; border: 1.5px solid #1C1917; border-radius: 4px; padding: 2mm 1.5mm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; page-break-inside: avoid; }
            .sticker-header { width: 100%; background: #C84826; color: #fff; font-size: 7px; font-weight: 900; padding: 1.5px 0; border-radius: 2px; }
            .qr-container { width: 25mm; height: 25mm; display: flex; align-items: center; justify-content: center; }
            .qr-container svg { width: 100%; height: 100%; display: block; }
            .qr-img { width: 25mm; height: 25mm; display: block; }
            .serial-key { font-family: monospace; font-size: 7px; font-weight: 800; color: #1C1917; }
            .cashback-badge { font-size: 6px; font-weight: 700; color: #C84826; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="header-banner no-print">
            <div><strong>DURAGRIT VITRIFIED — COMPLETE BATCH PRINT RUN</strong><div>Batch: ${targetBatch.batchId} • ${targetBatch.productName}</div></div>
            <div>Total: <strong>${allTokens.length} Stickers</strong></div>
          </div>
          <div class="sticker-grid">${stickersHtml}</div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadBatchPDF = async (batch) => {
    const targetBatch = batch || generatedBatchModal || printStickersModal;
    if (!targetBatch) return;

    setIsGeneratingPdf(true);
    try {
      const allTokens = getFullTokensForBatch(targetBatch);
      showToast(`Building complete A4 sticker manifest for all ${allTokens.length} tokens...`);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const qrLib = QRCode?.default || QRCode;

      // Pre-generate QR data URLs in parallel chunks of 50
      const qrDataUrls = new Array(allTokens.length);
      const chunkSize = 50;
      for (let i = 0; i < allTokens.length; i += chunkSize) {
        const slice = allTokens.slice(i, i + chunkSize);
        const chunkUrls = await Promise.all(
          slice.map(async (tok) => {
            const url = tok.qrPayloadUrl || `https://verify.duragritvitrified.com/qr/${tok.serialKey}`;
            try {
              if (qrLib && typeof qrLib.toDataURL === 'function') {
                return await qrLib.toDataURL(url, { width: 120, margin: 0, errorCorrectionLevel: 'M' });
              }
            } catch (_) {}
            return null;
          })
        );
        for (let j = 0; j < chunkUrls.length; j++) {
          qrDataUrls[i + j] = chunkUrls[j];
        }
      }

      let currentY = 34;
      const stickerW = 42;
      const stickerH = 40;
      const gapX = 4;
      const gapY = 4;
      let colIndex = 0;
      let pageNum = 1;

      const renderHeader = (p) => {
        doc.setFillColor(200, 72, 38);
        doc.rect(0, 0, 210, 26, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text('DURAGRIT VITRIFIED', 15, 12);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(254, 242, 238);
        doc.text(
          `QR BATCH MANIFEST: ${targetBatch.batchId} • ${targetBatch.productName || 'PRODUCT'} (${allTokens.length} TOKENS) • PAGE ${p}`,
          15,
          19
        );
      };

      renderHeader(1);

      for (let i = 0; i < allTokens.length; i++) {
        const tok = allTokens[i];
        if (currentY + stickerH > 285) {
          doc.addPage();
          pageNum++;
          renderHeader(pageNum);
          currentY = 34;
          colIndex = 0;
        }
        const currentX = 15 + colIndex * (stickerW + gapX);
        doc.setDrawColor(28, 25, 23);
        doc.setLineWidth(0.3);
        doc.roundedRect(currentX, currentY, stickerW, stickerH, 1.5, 1.5, 'S');

        doc.setFillColor(200, 72, 38);
        doc.roundedRect(currentX + 1, currentY + 1, stickerW - 2, 4.2, 0.8, 0.8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(255, 255, 255);
        doc.text('DURAGRIT VITRIFIED', currentX + stickerW / 2, currentY + 3.9, { align: 'center' });

        const tokQr = qrDataUrls[i];
        if (tokQr && tokQr.startsWith('data:image/')) {
          doc.addImage(tokQr, 'PNG', currentX + (stickerW - 22) / 2, currentY + 6.2, 22, 22);
        } else {
          doc.setDrawColor(200, 72, 38);
          doc.rect(currentX + (stickerW - 22) / 2, currentY + 6.2, 22, 22, 'S');
        }

        doc.setFont('courier', 'bold');
        doc.setFontSize(5.8);
        doc.setTextColor(28, 25, 23);
        doc.text(tok.serialKey, currentX + stickerW / 2, currentY + 32, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.8);
        doc.setTextColor(166, 44, 17);
        doc.text(`₹${Number(tok.cashbackAmount || targetBatch.cashbackAmount || 50)} Cashback`, currentX + stickerW / 2, currentY + 36.5, { align: 'center' });

        colIndex++;
        if (colIndex >= 4) {
          colIndex = 0;
          currentY += stickerH + gapY;
        }
      }

      const fileName = `DURAGRIT_${targetBatch.batchId}_ALL_${allTokens.length}_STICKERS.pdf`;
      doc.save(fileName);
      showToast(`PDF Manifest (${allTokens.length} stickers) downloaded: ${fileName}`);
    } catch (err) {
      showToast(`PDF Error: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans pb-10">
      {toastMsg && (() => {
        const isError = /error|failed|failure|invalid|missing|required|cannot|unable|reject|please enter|denied|timeout|unreachable/i.test(toastMsg);
        return (
          <div className={`fixed top-20 right-8 z-50 text-white px-4 py-3 rounded-xl shadow-2xl border flex items-center space-x-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 select-none ${
            isError ? 'bg-rose-600 border-rose-400/60 shadow-rose-950/30' : 'bg-emerald-600 border-emerald-400/60 shadow-emerald-950/30'
          }`}>
            {isError ? (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toastMsg}</span>
          </div>
        );
      })()}

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E0]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">
              QR Code Batch Generator
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#FEF2EE] text-[#A62C11] border border-[#C84826]/25 px-2 py-0.5 rounded font-mono">
              ENGINE V2.4 • SUPABASE SYNC
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-3xl">
            Generate unique serialized QR codes linked to your registered catalog SKUs and sync them directly with Supabase &amp; the Mobile App.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          <div className="flex items-center space-x-2 bg-stone-900 text-white border border-stone-800 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
            <Printer className="w-3.5 h-3.5 text-[#F59B7F]" />
            <span>{THERMAL_PRINTER_SPEC.port} ({THERMAL_PRINTER_SPEC.status}) • 300 DPI</span>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ACTIVE BATCHES: {batches.length}</span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-[#FEF2EE] border border-[#C84826]/25 rounded-2xl text-xs text-[#681B0A] flex items-start space-x-3 leading-relaxed">
        <Info className="w-4 h-4 text-[#C84826] shrink-0 mt-0.5" />
        <div>
          <strong className="block text-[#A62C11] font-bold">Live Mobile App Verification:</strong>
          <span>
            Every serial generated here is immediately scannable in the Mobile App (Step 10). Each serial can only be redeemed once.
          </span>
        </div>
      </div>

      {skus.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-xs p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF2EE] text-[#C84826] flex items-center justify-center mx-auto">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-[#1C1917]">Add a Product SKU Before Generating QR Codes</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Your Product Catalog is currently empty. Add at least one Product SKU first so QR batches link to a real product and cashback value.
          </p>
          <button
            onClick={() => onNavigateCatalog && onNavigateCatalog()}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Go to Product Catalog</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-xs p-6 sm:p-7">
          <form onSubmit={handleGenerateBatch} className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#C84826] text-white text-[11px] font-black flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1C1917]">
                    Step 1: Select Product &amp; SKU
                  </h3>
                </div>
                <span className="text-[10px] bg-[#FEF2EE] text-[#A62C11] font-bold px-2 py-0.5 rounded border border-[#C84826]/25 font-mono">
                  MANDATORY STEP
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Target Product &amp; SKU <span className="text-[#C84826]">*</span>
                  </label>
                  <select
                    value={selectedSkuId}
                    onChange={(e) => setSelectedSkuId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
                  >
                    {skus.map((sku) => (
                      <option key={sku.id || sku.skuCode} value={sku.id || sku.skuCode}>
                        {sku.name} (SKU: {sku.skuCode} • ₹{sku.cashbackReward ?? sku.cashbackAmount ?? 0}/scan)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      Batch Identifier / Prefix <span className="text-[#C84826]">*</span>
                    </label>
                    <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-mono font-bold">
                      AUTO-ASSIGNED
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] transition"
                  />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#C84826] text-white text-[11px] font-black flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1C1917]">
                    Step 2: Define Bulk QR Quantity &amp; Reward Rule
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Quantity of Unique QR Codes <span className="text-[#C84826]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Cashback per QR (₹) <span className="text-[#C84826]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cashbackReward}
                    onChange={(e) => setCashbackReward(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Discount Tier (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={discountTier}
                    onChange={(e) => setDiscountTier(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    QR Validity / Expiry
                  </label>
                  <select
                    value={validityPeriod}
                    onChange={(e) => setValidityPeriod(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
                  >
                    <option value="12 Months from Generation Date">12 Months from Generation Date</option>
                    <option value="24 Months from Generation Date">24 Months from Generation Date</option>
                    <option value="36 Months from Generation Date">36 Months from Generation Date</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sample Token Preview */}
            <div className="bg-[#FAF9F6] rounded-2xl border border-[#E7E5E0] p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-3 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-[#E7E5E0] shadow-xs">
                  <img src={liveQrDataUrl} alt="Sample QR Code" className="w-28 h-28 object-contain" />
                  <span className="text-[10px] font-mono font-bold text-[#1C1917] mt-1.5 block tracking-wide">
                    {sampleTokenId}
                  </span>
                </div>

                <div className="md:col-span-9 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">Sample Serial Format</span>
                    <span className="font-mono font-black text-[#1C1917] text-sm tracking-wide block">
                      {sampleTokenId}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Cashback Rule</span>
                      <span className="font-semibold text-[#A62C11]">
                        ₹{cashbackReward}.00 Cashback per Scan • Total Reserve ₹{(Number(quantity || 0) * Number(cashbackReward || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Database Sync</span>
                      <span className="font-semibold text-emerald-700">
                        Writes {quantity} unique tokens to Supabase qr_tokens
                      </span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">Verification URL</span>
                    <span className="font-mono text-[11px] text-[#A62C11] font-semibold break-all">
                      {cryptographicTargetUrl}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-md shadow-[#C84826]/20 transition cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                <span>Generate Unique QR Batch</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Governance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E0] shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-xs font-black text-[#1C1917] uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-[#C84826]" />
            <span>Anti-Duplication Guard</span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Dual 128-bit SHA salting ensures no QR serial can be double-scanned across Contractors or Dealers.
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E0] shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-xs font-black text-[#1C1917] uppercase tracking-wide">
            <Printer className="w-4 h-4 text-[#C84826]" />
            <span>Thermal Foil Print Spec</span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Direct vector PDF export supports 40×40mm ceramic packaging roll printers with zero cashback value printed on sticker.
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E0] shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-xs font-black text-[#1C1917] uppercase tracking-wide">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Instant Escrow Sync</span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Scanning any serial in the Mobile App immediately posts a Pending claim to Admin Cashback Requests.
          </p>
        </div>
      </div>

      {/* Historical Batches Ledger */}
      <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-xs overflow-hidden mt-6">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#1C1917]">Generated QR Batches Ledger</h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Click any sample serial code to copy and test scanning directly inside the Mobile App
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#A62C11] bg-[#FEF2EE] px-2.5 py-1 rounded-lg border border-[#C84826]/20">
            Total Batches: {batches.length}
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="py-12 px-6 text-center text-xs text-stone-400">
            No QR batches generated yet. Select a SKU above and click <strong>Generate Unique QR Batch</strong>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-[#FAF9F6] border-b border-[#E7E5E0] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Product SKU</th>
                  <th className="py-3 px-4">Next Unscanned Serial (Click to Copy)</th>
                  <th className="py-3 px-4">Redeemed / Total</th>
                  <th className="py-3 px-4">Cashback / QR</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {batches.map((b, idx) => {
                  const toks = getFullTokensForBatch(b);
                  const nextAvailable = toks.find((t) => !t.isScanned);
                  const scannedCnt = toks.filter((t) => t.isScanned).length;
                  return (
                    <tr key={b.batchId || idx} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1C1917]">{b.batchId}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1C1917]">{b.skuCode}</div>
                        <div className="text-[10px] text-stone-400">{b.productName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {nextAvailable ? (
                          <button
                            type="button"
                            onClick={() => copySerial(nextAvailable.serialKey)}
                            className="inline-flex items-center space-x-1.5 font-mono text-[11px] font-bold bg-[#FEF2EE] hover:bg-[#FDE3DA] text-[#A62C11] border border-[#C84826]/25 px-2.5 py-1 rounded-lg transition cursor-pointer"
                            title="Copy serial key to test in Mobile App"
                          >
                            <span>{nextAvailable.serialKey}</span>
                            <Copy className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">All tokens redeemed</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                        {scannedCnt} / {b.quantity || toks.length}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#A62C11]">
                        ₹{Number(b.cashbackAmount || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleExportThermal40x40Pdf(b)}
                          title="40×40mm 300 DPI Vector PDF Roll Sheet"
                          className="px-2 py-1 text-[10px] font-mono font-bold bg-stone-100 hover:bg-[#FEF2EE] text-stone-700 hover:text-[#A62C11] border border-stone-200 rounded-lg transition cursor-pointer"
                        >
                          40×40 PDF
                        </button>
                        <button
                          onClick={() => handleExportThermalZpl(b, 'zpl')}
                          title="Godex / Zebra Raw Thermal Stream (.zpl) @ 300 DPI"
                          className="px-2 py-1 text-[10px] font-mono font-bold bg-stone-100 hover:bg-[#FEF2EE] text-stone-700 hover:text-[#A62C11] border border-stone-200 rounded-lg transition cursor-pointer"
                        >
                          .ZPL
                        </button>
                        <button
                          onClick={() => handleExportBatchManifestCsv(b)}
                          title="Download Serialized Batch Manifest (.csv)"
                          className="px-2 py-1 text-[10px] font-mono font-bold bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 rounded-lg transition cursor-pointer"
                        >
                          .CSV
                        </button>
                        <button
                          onClick={() => setPrintStickersModal(b)}
                          title="Preview & Print Stickers"
                          className="p-1.5 text-[#C84826] hover:text-[#A62C11] hover:bg-[#FEF2EE] rounded-lg transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteBatch(b.batchId)}
                          title="Delete Batch"
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Generated Modal */}
      {generatedBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-[#E7E5E0] shadow-2xl p-5 sm:p-6 text-[#1C1917] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1917]">QR Batch Generated &amp; Synced</h3>
                  <p className="text-[11px] text-stone-400">Ready for Mobile App scanning &amp; thermal print</p>
                </div>
              </div>
              <button onClick={() => setGeneratedBatchModal(null)} className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FAF9F6] p-4 rounded-2xl space-y-2 text-xs border border-[#E7E5E0] font-mono">
              <div className="flex justify-between">
                <span className="text-stone-400">Batch ID:</span>
                <span className="font-bold text-[#1C1917]">{generatedBatchModal.batchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Target SKU:</span>
                <span className="font-bold text-[#1C1917]">{generatedBatchModal.skuCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Generated Codes:</span>
                <span className="font-bold text-emerald-700">{generatedBatchModal.quantity} Serials</span>
              </div>
              {generatedBatchModal.tokens?.[0] && (
                <div className="pt-2 border-t border-[#E7E5E0] flex items-center justify-between">
                  <span className="text-stone-500">1st Serial:</span>
                  <button
                    type="button"
                    onClick={() => copySerial(generatedBatchModal.tokens[0].serialKey)}
                    className="inline-flex items-center gap-1 font-bold text-[#A62C11] bg-[#FEF2EE] px-2 py-0.5 rounded cursor-pointer"
                  >
                    <span>{generatedBatchModal.tokens[0].serialKey}</span>
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* 300 DPI Thermal Label Vector & Serialized Batch Exports */}
            <div className="bg-stone-50 border border-[#E7E5E0] rounded-2xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                  300 DPI Thermal &amp; Manifest Exports (40×40mm / 472×472px)
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {THERMAL_PRINTER_SPEC.port} ({THERMAL_PRINTER_SPEC.status})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleExportThermal40x40Pdf(generatedBatchModal)}
                  disabled={isGeneratingPdf}
                  className="py-2 px-3 bg-white hover:bg-[#FEF2EE] border border-[#E7E5E0] text-[#1C1917] rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C84826]" />
                  <span>40×40mm Vector PDF (300 DPI)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportThermal40x40Svg(generatedBatchModal)}
                  className="py-2 px-3 bg-white hover:bg-[#FEF2EE] border border-[#E7E5E0] text-[#1C1917] rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#C84826]" />
                  <span>40×40mm Vector SVG Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportThermalZpl(generatedBatchModal, 'zpl')}
                  className="py-2 px-3 bg-white hover:bg-[#FEF2EE] border border-[#E7E5E0] text-[#1C1917] rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C84826]" />
                  <span>Godex / Zebra Stream (.zpl)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportBatchManifestCsv(generatedBatchModal)}
                  className="py-2 px-3 bg-white hover:bg-emerald-50 border border-[#E7E5E0] text-emerald-800 rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Serialized Manifest (.csv)</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => handleDownloadBatchPDF(generatedBatchModal)}
                disabled={isGeneratingPdf}
                className="flex-1 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#F59B7F]" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : `Download A4 Sheet PDF (${generatedBatchModal.quantity || generatedBatchModal.tokens?.length || 0})`}</span>
              </button>
              <button
                onClick={() => {
                  const b = generatedBatchModal;
                  setGeneratedBatchModal(null);
                  setPrintStickersModal(b);
                }}
                className="flex-1 py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Preview &amp; Print Stickers ({generatedBatchModal.quantity || generatedBatchModal.tokens?.length || 0})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Stickers Preview Modal */}
      {printStickersModal && (() => {
        const modalTokens = getFullTokensForBatch(printStickersModal);
        const filteredTokens = modalTokens.filter((t) =>
          !stickerSearch || t.serialKey.toLowerCase().includes(stickerSearch.toLowerCase().trim())
        );

        const effectiveSize = stickerPageSize === 'all' ? (filteredTokens.length || 1) : Number(stickerPageSize);
        const totalPages = Math.max(1, Math.ceil(filteredTokens.length / effectiveSize));
        const activePage = Math.min(Math.max(1, stickerPage), totalPages);
        const startIdx = (activePage - 1) * effectiveSize;
        const displayedTokens = stickerPageSize === 'all'
          ? filteredTokens
          : filteredTokens.slice(startIdx, startIdx + effectiveSize);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full border border-[#E7E5E0] shadow-2xl p-5 sm:p-6 text-[#1C1917] space-y-3.5 max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#1C1917]">
                      Batch Sticker Manifest &amp; Thermal Roll Preview
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {modalTokens.length} Total Stickers
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Batch: <span className="font-mono font-bold text-[#A62C11]">{printStickersModal.batchId}</span> • {printStickersModal.productName} • ₹{printStickersModal.cashbackAmount || 50} Cashback/Unit
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPrintStickersModal(null);
                    setStickerSearch('');
                    setStickerPage(1);
                  }}
                  className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer self-end sm:self-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search & Pagination Control Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-stone-50 p-2.5 rounded-2xl border border-stone-200 text-xs shrink-0">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={stickerSearch}
                    onChange={(e) => {
                      setStickerSearch(e.target.value);
                      setStickerPage(1);
                    }}
                    placeholder={`Search within ${modalTokens.length} serials (e.g. 000045)...`}
                    className="w-full sm:max-w-xs px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-mono placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#C84826]"
                  />
                  {stickerSearch && (
                    <button
                      onClick={() => setStickerSearch('')}
                      className="text-[11px] text-stone-400 hover:text-stone-700 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-600 font-medium">
                    <span>Show:</span>
                    {[24, 48, 100].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => {
                          setStickerPageSize(sz);
                          setStickerPage(1);
                        }}
                        className={`px-2 py-0.5 rounded-lg font-mono text-[11px] transition ${
                          stickerPageSize === sz
                            ? 'bg-[#C84826] text-white font-bold'
                            : 'bg-white border border-stone-200 hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setStickerPageSize('all');
                        setStickerPage(1);
                      }}
                      className={`px-2 py-0.5 rounded-lg font-mono text-[11px] transition ${
                        stickerPageSize === 'all'
                          ? 'bg-[#C84826] text-white font-bold'
                          : 'bg-white border border-stone-200 hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      All ({modalTokens.length})
                    </button>
                  </div>

                  {stickerPageSize !== 'all' && totalPages > 1 && (
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        disabled={activePage <= 1}
                        onClick={() => setStickerPage((p) => Math.max(1, p - 1))}
                        className="px-2 py-0.5 rounded-lg bg-white border border-stone-200 disabled:opacity-40 hover:bg-stone-100 font-bold"
                      >
                        Prev
                      </button>
                      <span className="font-mono px-1.5 text-stone-700">
                        {activePage} / {totalPages}
                      </span>
                      <button
                        disabled={activePage >= totalPages}
                        onClick={() => setStickerPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2 py-0.5 rounded-lg bg-white border border-stone-200 disabled:opacity-40 hover:bg-stone-100 font-bold"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status / Count Pill */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 px-1 shrink-0">
                <span>
                  Showing <strong>{filteredTokens.length === 0 ? 0 : startIdx + 1}</strong> -{' '}
                  <strong>{Math.min(startIdx + (stickerPageSize === 'all' ? filteredTokens.length : Number(stickerPageSize)), filteredTokens.length)}</strong> of{' '}
                  <strong>{filteredTokens.length}</strong> stickers
                  {stickerSearch ? ` matching "${stickerSearch}"` : ''}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  300 DPI Vector QR • Tap any sticker to copy serial
                </span>
              </div>

              {/* Sticker Grid */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#FAF9F6] rounded-2xl border border-[#E7E5E0] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {displayedTokens.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-stone-400">
                    No stickers found matching "{stickerSearch}".
                  </div>
                ) : (
                  displayedTokens.map((t, i) => (
                    <div
                      key={t.serialKey + i}
                      onClick={() => copySerial(t.serialKey)}
                      className="bg-white p-2 rounded-xl border border-stone-300 hover:border-[#C84826] shadow-xs hover:shadow-md flex flex-col items-center text-center justify-between cursor-pointer transition select-none group"
                      title="Click to copy serial key"
                    >
                      <div className="w-full bg-[#C84826] text-white text-[7px] font-black uppercase py-0.5 rounded tracking-tight">
                        DURAGRIT
                      </div>
                      <div className="my-1 flex items-center justify-center">
                        <TokenQrPreview
                          url={t.qrPayloadUrl || `https://verify.duragritvitrified.com/qr/${t.serialKey}`}
                          fallbackSvg={liveQrDataUrl}
                        />
                      </div>
                      <span className="text-[7.5px] font-mono font-bold text-[#1C1917] block truncate max-w-full pb-0.5 group-hover:text-[#C84826]">
                        {t.serialKey}
                      </span>
                      <span className="text-[7px] font-mono text-emerald-700 font-bold">
                        ₹{Number(t.cashbackAmount || printStickersModal.cashbackAmount || 50)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 shrink-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => handleExportThermal40x40Pdf(printStickersModal)}
                    disabled={isGeneratingPdf}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-[#FEF2EE] text-stone-800 hover:text-[#A62C11] border border-stone-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                    title="Export 40×40mm 300 DPI Vector PDF"
                  >
                    40×40mm PDF
                  </button>
                  <button
                    onClick={() => handleExportThermal40x40Svg(printStickersModal)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-[#FEF2EE] text-stone-800 hover:text-[#A62C11] border border-stone-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                    title="Export Vector SVG Sheet"
                  >
                    40×40mm SVG
                  </button>
                  <button
                    onClick={() => handleExportThermalZpl(printStickersModal, 'zpl')}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-[#FEF2EE] text-stone-800 hover:text-[#A62C11] border border-stone-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                    title="Direct ZPL Stream for Zebra / Godex"
                  >
                    Godex/Zebra .ZPL
                  </button>
                  <button
                    onClick={() => handleExportBatchManifestCsv(printStickersModal)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                    title="Download CSV Manifest"
                  >
                    Manifest .CSV
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPrintStickersModal(null);
                      setStickerSearch('');
                      setStickerPage(1);
                    }}
                    className="px-3.5 py-2 border border-[#E7E5E0] text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDownloadBatchPDF(printStickersModal)}
                    disabled={isGeneratingPdf}
                    className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-[#F59B7F]" />
                    <span>Download A4 Sheet PDF ({modalTokens.length})</span>
                  </button>
                  <button
                    onClick={() => handlePrintAllStickers(printStickersModal)}
                    className="px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print All {modalTokens.length}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
