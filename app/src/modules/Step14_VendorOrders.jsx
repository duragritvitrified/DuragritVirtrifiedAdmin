import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  QrCode,
  MapPin,
  Layers
} from 'lucide-react';

export function Step14_VendorOrders({ onBack, onNavigateScan }) {
  const { currentUser } = useAuth();
  const { vendors = [], skus = [], refreshAllData } = useData();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'production' | 'dispatched' | 'settled'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleSync = async () => {
    if (!refreshAllData) return;
    setIsSyncing(true);
    try {
      await refreshAllData();
      showToast('✓ Live PO & Orders data synced with Admin Panel.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Match live partner from vendors list
  const currentDigits = String(currentUser?.mobile || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
  const currentId = String(currentUser?.vendorId || currentUser?.id || currentUser?.userId || '').toLowerCase();
  const currentName = String(currentUser?.companyName || currentUser?.name || '').toLowerCase().trim();

  const matchedVendor = (vendors || []).find((v) => {
    const vDigits = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
    const vId = String(v.vendorId || v.id || '').toLowerCase();
    const vName = String(v.companyName || v.name || '').toLowerCase().trim();
    return (
      (vId && currentId && (vId === currentId || currentId.includes(vId) || vId.includes(currentId))) ||
      (currentDigits.length === 10 && vDigits === currentDigits) ||
      (currentName && vName && (currentName === vName || currentName.includes(vName) || vName.includes(currentName)))
    );
  }) || (vendors.length > 0 ? vendors[0] : null);

  const poVal = Number(matchedVendor?.poValueLakhs ?? 5.5);
  const relVal = Number(matchedVendor?.releasedPayoutLakhs ?? 1.5);
  const escrowVal = Math.max(0, Number((poVal - relVal).toFixed(2)));
  const vendorName = matchedVendor?.companyName || matchedVendor?.name || currentUser?.companyName || 'DuraGrit Authorized Partner';
  const vendorId = matchedVendor?.vendorId || matchedVendor?.id || 'VND-101';

  // Construct structured PO orders list for this vendor
  const baseOrders = [
    {
      id: 'PO-DG-2026-001',
      poNumber: 'PO-MORBI-8821',
      productName: 'DuraGrit DA 777 High Polymer Adhesive',
      skuCode: 'DA-777',
      category: 'Adhesives',
      quantity: '500 Bags (10 MT)',
      packSize: '20 kg Kraft Bag',
      orderValue: '₹2,50,000',
      valueNum: 250000,
      status: 'Settled',
      stage: 'settled',
      orderDate: '08 Nov 2026',
      deliveryDate: '10 Nov 2026',
      destination: 'Yard Hub 04 - Morbi GIDC',
      transporter: 'Morbi Express Freightlines',
      lrNumber: 'LR-998231',
      payoutStatus: 'Released via NPCI RTGS',
      payoutAmount: '₹2,50,000',
      utr: 'NPCI-RTGS-88492011',
      notes: 'Kiln batch inspection passed. All 500 carton dual QR tokens registered.'
    },
    {
      id: 'PO-DG-2026-002',
      poNumber: 'PO-MORBI-8822',
      productName: 'DuraGrit Premium Epoxy Grout 2K',
      skuCode: 'EG-200',
      category: 'Grouts',
      quantity: '250 Buckets (1.25 MT)',
      packSize: '5 kg Plastic Bucket',
      orderValue: '₹1,75,000',
      valueNum: 175000,
      status: 'Dispatched',
      stage: 'dispatched',
      orderDate: '09 Nov 2026',
      deliveryDate: '11 Nov 2026 (In Transit)',
      destination: 'Ahmedabad Ring Road Depot',
      transporter: 'Gujarat Fast Logistics',
      lrNumber: 'LR-998450',
      payoutStatus: 'Escrow Locked (Release upon Yard QC)',
      payoutAmount: '₹1,75,000',
      utr: 'Pending Delivery QC',
      notes: 'Consignment en route. Anti-counterfeit serial tags loaded.'
    },
    {
      id: 'PO-DG-2026-003',
      poNumber: 'PO-MORBI-8823',
      productName: 'DuraGrit SBR LatexFibre Waterproofing Primer',
      skuCode: 'WP-SBR',
      category: 'Waterproofing',
      quantity: '150 Cans (3000 Liters)',
      packSize: '20 Liter Steel Drum',
      orderValue: '₹1,25,000',
      valueNum: 125000,
      status: 'In Production',
      stage: 'production',
      orderDate: '10 Nov 2026',
      deliveryDate: '13 Nov 2026 (Scheduled)',
      destination: 'Surat Industrial Depot Hub',
      transporter: 'Morbi Central Fleet #07',
      lrNumber: 'LR-PENDING',
      payoutStatus: 'Milestone 1 Sanctioned',
      payoutAmount: '₹1,25,000',
      utr: 'Scheduled for Release',
      notes: 'Polymer compounding stage active. Quality test report pending.'
    }
  ];

  // Incorporate vendor's real payoutHistory if available
  const customPayoutOrders = (matchedVendor?.payoutHistory || []).map((p, idx) => ({
    id: p.id || `PO-HIST-${idx + 1}`,
    poNumber: p.id || `PO-HIST-${idx + 1}`,
    productName: 'Material PO Milestone Settlement',
    skuCode: 'PO-RELEASE',
    category: 'Supply Escrow',
    quantity: 'Supply Milestone Complete',
    packSize: 'Full Batch Lot',
    orderValue: `₹${(Number(p.amountLakhs || 0) * 100000).toLocaleString('en-IN')}`,
    valueNum: Number(p.amountLakhs || 0) * 100000,
    status: 'Settled',
    stage: 'settled',
    orderDate: p.releasedAt || 'Recent',
    deliveryDate: p.releasedAt || 'Completed',
    destination: 'Direct Bank Settlement (RTGS/UPI)',
    transporter: 'NPCI Core Banking Settlement',
    lrNumber: p.utr || 'UTR-SETTLED',
    payoutStatus: `Released via ${p.mode || 'RTGS'}`,
    payoutAmount: `₹${(Number(p.amountLakhs || 0) * 100000).toLocaleString('en-IN')}`,
    utr: p.utr || 'NPCI-DISBURSED',
    notes: p.note || 'Milestone payout disbursed to partner account.'
  }));

  const allOrders = [...baseOrders, ...customPayoutOrders];

  const filteredOrders = allOrders.filter((o) => {
    if (activeTab === 'production' && o.stage !== 'production') return false;
    if (activeTab === 'dispatched' && o.stage !== 'dispatched') return false;
    if (activeTab === 'settled' && o.stage !== 'settled') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.poNumber.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.destination.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-[480px] mx-auto flex-1 flex flex-col font-sans select-none pb-14 text-stone-800 overflow-x-hidden">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#A6300F] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-white/20 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3 max-w-[90%]">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Sticky Header */}
      <div className="w-full bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-[#ECEAE6] flex items-center justify-between shadow-2xs sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition cursor-pointer shrink-0"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-[#FEF2EE] text-[#A6300F] border border-[#F9CEB8] flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-[13px] font-black text-stone-900 leading-tight truncate">
              Material Supply PO Orders
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[9px] sm:text-[9.5px] font-bold text-[#A6300F] bg-[#FEF2EE] px-1.5 py-0.2 rounded border border-[#F9CEB8]">
                {vendorId}
              </span>
              <span className="text-[10px] text-stone-500 truncate font-medium">
                {vendorName}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          title="Live Sync with Database"
          className="p-1.5 sm:p-2 rounded-xl bg-[#FEF2EE] hover:bg-[#FCE3D9] text-[#A6300F] border border-[#F9CEB8] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A6300F] ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <main className="p-3.5 space-y-3.5 flex-1">
        {/* KPI Financial Overview Matrix */}
        <section className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 rounded-3xl p-4 text-white shadow-md space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A6300F]/20 rounded-bl-full pointer-events-none"></div>

          <div className="flex items-center justify-between relative z-10 pb-1 border-b border-stone-800">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-200">
                PO Escrow Ledger
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              {allOrders.length} Total Orders
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 relative z-10 font-mono text-center">
            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-2.5">
              <span className="text-[8.5px] sm:text-[9px] font-sans font-bold text-stone-400 uppercase block">
                PO Sanctioned
              </span>
              <span className="text-sm sm:text-base font-black text-white block mt-0.5">
                ₹{poVal.toFixed(1)}L
              </span>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-2.5">
              <span className="text-[8.5px] sm:text-[9px] font-sans font-bold text-emerald-400 uppercase block">
                Released Payout
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-400 block mt-0.5">
                ₹{relVal.toFixed(1)}L
              </span>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-2.5">
              <span className="text-[8.5px] sm:text-[9px] font-sans font-bold text-amber-400 uppercase block">
                In Escrow Lock
              </span>
              <span className="text-sm sm:text-base font-black text-amber-400 block mt-0.5">
                ₹{escrowVal.toFixed(1)}L
              </span>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO #, Product, Destination..."
            className="w-full bg-white pl-9 pr-3.5 py-2.5 rounded-2xl border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A6300F]/30 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All (${allOrders.length})` },
            { id: 'production', label: `In Production (${allOrders.filter((o) => o.stage === 'production').length})` },
            { id: 'dispatched', label: `Dispatched (${allOrders.filter((o) => o.stage === 'dispatched').length})` },
            { id: 'settled', label: `Settled (${allOrders.filter((o) => o.stage === 'settled').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#A6300F] text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Card Feed */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-2 shadow-xs">
              <Package className="w-8 h-8 text-stone-300 mx-auto" />
              <h3 className="font-extrabold text-sm text-stone-800">No Orders Found</h3>
              <p className="text-xs text-stone-500">
                {searchQuery ? 'No purchase orders match your search keyword.' : 'No orders in this status category.'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSettled = order.stage === 'settled';
              const isDispatched = order.stage === 'dispatched';

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs hover:shadow-xs transition active:scale-[0.99] cursor-pointer space-y-2.5 relative overflow-hidden"
                >
                  {/* Status Indicator Stripe */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isSettled ? 'bg-emerald-500' : isDispatched ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                  ></div>

                  {/* Top Bar: PO Number & Status Badge */}
                  <div className="flex items-center justify-between pl-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10.5px] font-black text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {order.poNumber}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        {order.orderDate}
                      </span>
                    </div>

                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                        isSettled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isDispatched
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Product Title & Pack Info */}
                  <div className="pl-1">
                    <h4 className="font-extrabold text-xs text-stone-900 leading-tight">
                      {order.productName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                      <span>{order.quantity}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-[#A6300F]">{order.orderValue}</span>
                    </div>
                  </div>

                  {/* Destination Yard Pill */}
                  <div className="pl-1 flex items-center justify-between text-[10.5px] bg-stone-50 p-2 rounded-xl border border-stone-150">
                    <span className="flex items-center gap-1 text-stone-600 truncate mr-2">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{order.destination}</span>
                    </span>
                    <span className="text-[#A6300F] font-bold shrink-0 flex items-center gap-0.5">
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="font-mono text-[10px] font-black text-[#A6300F] bg-[#FEF2EE] px-2 py-0.5 rounded border border-[#F9CEB8]">
                  {selectedOrder.poNumber}
                </span>
                <h3 className="text-sm font-extrabold text-stone-900 mt-1">
                  Purchase Order Specification
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="text-[10px] font-bold text-stone-400 uppercase">Product Description</div>
                <div className="font-extrabold text-stone-900">{selectedOrder.productName}</div>
                <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1 border-t border-stone-200/60">
                  <span>Batch Quantity:</span>
                  <span className="font-mono font-bold text-stone-900">{selectedOrder.quantity}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-600">
                  <span>Gross PO Value:</span>
                  <span className="font-mono font-bold text-[#A6300F]">{selectedOrder.orderValue}</span>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-sans">Status:</span>
                  <span className="font-bold text-emerald-700">{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-sans">Order Placed:</span>
                  <span className="text-stone-800">{selectedOrder.orderDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-sans">Delivery Hub:</span>
                  <span className="text-stone-800 text-right truncate max-w-[180px]">{selectedOrder.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-sans">Freight LR #:</span>
                  <span className="text-stone-800">{selectedOrder.lrNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-sans">Settlement UTR:</span>
                  <span className="text-emerald-700 font-bold select-all">{selectedOrder.utr}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-[11px] text-amber-900">
                  <span className="font-bold block">Production Note:</span>
                  <p className="mt-0.5">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  if (onNavigateScan) onNavigateScan();
                }}
                className="flex-1 py-2.5 bg-[#A6300F] hover:bg-[#8B230C] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Inward Carton</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`✓ PO slip copied for ${selectedOrder.poNumber}.`);
                  setSelectedOrder(null);
                }}
                className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

