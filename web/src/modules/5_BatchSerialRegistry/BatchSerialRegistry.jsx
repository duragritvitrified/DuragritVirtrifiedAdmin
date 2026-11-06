import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { QrCode, Search, Download, RefreshCw, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

export function BatchSerialRegistry() {
  const { batches = [], skus = [], refreshAllData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMsg, setToastMsg] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const normalizedBatches = useMemo(() => {
    return batches.map((b) => {
      const tokens = b.tokens || b.codes || [];
      const qty = Number(b.quantity || tokens.length || 0);
      const scanned = Number(
        b.scannedCount ?? tokens.filter((t) => t.isScanned || t.status === 'Redeemed').length
      );
      const matchedSku = skus.find((s) => s.skuCode === b.skuCode || s.name === b.productName);
      const cashbackPerUnit = Number(
        b.cashbackPerUnit ?? b.cashbackAmount ?? matchedSku?.cashbackAmount ?? 0
      );
      const firstSerial = tokens[0]?.serialKey || tokens[0]?.serial || '—';
      const lastSerial = tokens[tokens.length - 1]?.serialKey || tokens[tokens.length - 1]?.serial || firstSerial;

      return {
        ...b,
        batchId: b.batchId || b.batchCode || b.id,
        productName: b.productName || matchedSku?.name || 'DuraGrit Product',
        skuCode: b.skuCode || matchedSku?.skuCode || '—',
        qty,
        scanned,
        progressPct: qty > 0 ? Math.min(100, Math.round((scanned / qty) * 100)) : 0,
        cashbackPerUnit,
        escrowTotal: qty * cashbackPerUnit,
        firstSerial,
        lastSerial,
        status: b.status || 'Active',
        createdFormatted: b.createdAt
          ? new Date(b.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : b.mfgDate || 'Live',
      };
    });
  }, [batches, skus]);

  const filteredBatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return normalizedBatches.filter((b) => {
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchesSearch =
        !q ||
        String(b.batchId).toLowerCase().includes(q) ||
        String(b.productName).toLowerCase().includes(q) ||
        String(b.skuCode).toLowerCase().includes(q) ||
        String(b.firstSerial).toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [normalizedBatches, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalSerials = normalizedBatches.reduce((sum, b) => sum + b.qty, 0);
    const totalScanned = normalizedBatches.reduce((sum, b) => sum + b.scanned, 0);
    const totalEscrow = normalizedBatches.reduce((sum, b) => sum + b.escrowTotal, 0);
    return {
      batchCount: normalizedBatches.length,
      totalSerials,
      totalScanned,
      scanRate: totalSerials > 0 ? ((totalScanned / totalSerials) * 100).toFixed(1) : '0.0',
      totalEscrow,
    };
  }, [normalizedBatches]);

  const handleExportManifestPDF = () => {
    if (normalizedBatches.length === 0) {
      showToast('No QR batches available to export yet. Generate a QR batch first.');
      return;
    }
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFillColor(200, 72, 38);
      doc.rect(0, 0, 210, 24, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('DURAGRIT VITRIFIED - BATCH SERIAL REGISTRY', 15, 13);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(254, 242, 238);
      doc.text('LIVE SERIALIZED QR PRODUCTION MANIFEST', 15, 19);

      let y = 34;
      normalizedBatches.slice(0, 22).forEach((item, idx) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. ${item.batchId} — ${item.productName} (${item.skuCode})`, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(
          `   Qty: ${item.qty} QRs | Scanned: ${item.scanned} | Cashback: INR ${item.cashbackPerUnit}/pc | Status: ${item.status}`,
          15,
          y + 4.5
        );
        y += 11;
      });

      doc.save(`DuraGrit_Batch_Serial_Registry_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('Batch Serial Registry PDF exported.');
    } catch (e) {
      showToast('PDF export failed: ' + e.message);
    }
  };

  const handleSync = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
    showToast('Batch Serial Registry synchronized with Supabase.');
  };

  return (
    <div className="space-y-6 relative">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#A62C11] uppercase tracking-wider bg-[#FEF2EE] border border-[#F9CEB8] px-2.5 py-1 rounded-full mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84826]" />
            BATCH SERIAL REGISTRY • LIVE PRODUCTION LEDGER
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            QR Batch Serial Registry &amp; Print Feeder Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live registry of all serialized QR batches minted in Admin Panel and synchronized with Mobile App &amp; Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C84826]' : ''}`} />
            Sync Registry
          </button>
          <button
            onClick={handleExportManifestPDF}
            className="inline-flex items-center gap-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Manifest (PDF)
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Serials Minted</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF2EE] text-[#C84826] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.totalSerials.toLocaleString('en-IN')} <span className="text-xs font-medium text-slate-400">QRs</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">{stats.batchCount} Active Production Batches</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Batches</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF2EE] text-[#C84826] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.batchCount} <span className="text-xs font-medium text-slate-400">Lots</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Bound to {skus.length} Product SKUs</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Redeemed / Scanned</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.totalScanned.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-semibold text-emerald-600">({stats.scanRate}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Real-time field scan activation</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Batch Reward Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">₹{stats.totalEscrow.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">100% SHA-256 Serialized</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Batch ID, Product Name, SKU, or Serial..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#C84826]"
          />
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Active', 'Depleted'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#C84826] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Batch ID &amp; Created</th>
                <th className="py-3.5 px-4">Product SKU</th>
                <th className="py-3.5 px-4">Sample Serial &amp; Qty</th>
                <th className="py-3.5 px-4">Cashback / Escrow</th>
                <th className="py-3.5 px-4">Scan Progress</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No QR Batches Minted Yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Create a Product in Catalog and mint a QR Batch in QR Generator to populate this registry.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr key={b.batchId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">{b.batchId}</div>
                      <div className="text-[11px] text-slate-400">{b.createdFormatted}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{b.productName}</div>
                      <div className="font-mono text-[11px] text-slate-400">SKU: {b.skuCode}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-slate-800">{b.firstSerial}</div>
                      <div className="text-[11px] text-slate-500">{b.qty.toLocaleString('en-IN')} QR Codes</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#C84826]">₹{b.cashbackPerUnit} / pack</div>
                      <div className="text-[11px] text-slate-500">Pool: ₹{b.escrowTotal.toLocaleString('en-IN')}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-32 bg-slate-100 rounded-full h-1.5 mb-1 overflow-hidden">
                        <div className="bg-[#C84826] h-1.5 rounded-full" style={{ width: `${b.progressPct}%` }} />
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        {b.scanned} / {b.qty} Scanned ({b.progressPct}%)
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
