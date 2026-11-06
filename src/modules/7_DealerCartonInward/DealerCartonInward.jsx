import React, { useState, useMemo } from 'react';
import { QrCode, Search, RefreshCw, CheckCircle2, ShieldCheck, Store } from 'lucide-react';
import { useData } from '../../context/DataContext';

export function DealerCartonInward() {
  const { batches = [], vendors = [], refreshAllData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const inwardList = useMemo(() => {
    return batches.map((b, idx) => {
      const tokens = b.tokens || b.codes || [];
      const qty = Number(b.quantity || tokens.length || 0);
      const scanned = Number(
        b.scannedCount ?? tokens.filter((t) => t.isScanned || t.status === 'Redeemed').length
      );
      const vendor = vendors[idx % Math.max(1, vendors.length)] || null;
      const cashback = Number(b.cashbackPerUnit ?? b.cashbackAmount ?? 0);
      return {
        id: b.batchId || b.batchCode || b.id,
        dealerName: b.vendorName || vendor?.firmName || vendor?.name || 'Authorized Dealer Network',
        city: vendor?.city || vendor?.location || 'Morbi Hub',
        productName: b.productName || 'DuraGrit Pack',
        skuCode: b.skuCode || '—',
        qty,
        scanned,
        pct: qty > 0 ? Math.min(100, Math.round((scanned / qty) * 100)) : 0,
        escrowPool: qty * cashback,
      };
    });
  }, [batches, vendors]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return inwardList;
    return inwardList.filter(
      (item) =>
        String(item.id).toLowerCase().includes(q) ||
        String(item.dealerName).toLowerCase().includes(q) ||
        String(item.productName).toLowerCase().includes(q)
    );
  }, [inwardList, searchQuery]);

  const totals = useMemo(() => {
    return {
      totalBoxes: inwardList.reduce((s, i) => s + i.qty, 0),
      totalScanned: inwardList.reduce((s, i) => s + i.scanned, 0),
      totalEscrow: inwardList.reduce((s, i) => s + i.escrowPool, 0),
    };
  }, [inwardList]);

  const handleSync = async () => {
    setIsRefreshing(true);
    await refreshAllData();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#A62C11] uppercase tracking-wider bg-[#FEF2EE] border border-[#F9CEB8] px-2.5 py-1 rounded-full mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84826]" />
            DEALER CARTON INWARD &amp; BARCODE VERIFICATION
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dealer Carton Inward &amp; Scan Activation Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor dealer-side batch inwarding and contractor scan unlock progress in real time.
          </p>
        </div>

        <button
          onClick={handleSync}
          className="inline-flex items-center gap-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Sync Inward Status
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Units Inwarded</span>
            <Store className="w-4 h-4 text-[#C84826]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totals.totalBoxes.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">{inwardList.length} Active Batches</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Redeemed by Contractors</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totals.totalScanned.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified QR serials</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unlocked Cashback Pool</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{totals.totalEscrow.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Ready for Mobile App scans</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Batch ID, Dealer Name, or Product..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#C84826]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Batch ID</th>
                <th className="py-3.5 px-4">Dealer / Hub</th>
                <th className="py-3.5 px-4">Product &amp; Qty</th>
                <th className="py-3.5 px-4">Scan Reconciliation</th>
                <th className="py-3.5 px-4">Cashback Pool</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No Inward Batches Recorded Yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Mint a QR Batch in QR Generator to track dealer inward and scan progress here.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{item.dealerName}</div>
                      <div className="text-[11px] text-slate-500">{item.city}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.productName}</div>
                      <div className="text-[11px] text-slate-500">{item.qty.toLocaleString('en-IN')} Packs • {item.skuCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-32 bg-slate-100 rounded-full h-1.5 mb-1 overflow-hidden">
                        <div className="bg-[#C84826] h-1.5 rounded-full" style={{ width: `${item.pct}%` }} />
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {item.scanned} / {item.qty} Redeemed ({item.pct}%)
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#C84826]">
                      ₹{item.escrowPool.toLocaleString('en-IN')}
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
