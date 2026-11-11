import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Building2,
  Calendar,
  FileText,
  MapPin,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  X,
  Printer,
  Phone,
  Mail,
  Boxes,
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';

export function OrdersManagement() {
  const { orders = [], vendors = [], skus = [], updateOrderStatus, refreshAllData, dbStatus } = useData();

  // View mode: 'all' (tabular list) | 'vendor-grouped' (grouped by vendor)
  const [viewMode, setViewMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  React.useEffect(() => {
    if (selectedOrder) {
      setAdminNoteInput(selectedOrder.adminNotes || '');
    }
  }, [selectedOrder?.id]);

  React.useEffect(() => {
    refreshAllData?.();
    const interval = setInterval(() => {
      refreshAllData?.();
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSync = async () => {
    if (!refreshAllData) return;
    setIsSyncing(true);
    try {
      await refreshAllData();
      showToast('✓ Live orders data synchronized with Supabase.');
    } finally {
      setIsSyncing(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'Pending').length;
    const confirmed = orders.filter((o) => o.status === 'Confirmed').length;
    const dispatched = orders.filter((o) => o.status === 'Dispatched').length;
    const delivered = orders.filter((o) => o.status === 'Delivered').length;
    const totalUnits = orders.reduce((sum, o) => {
      const q = o.totalQuantity ?? (o.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
      return sum + Number(q || 0);
    }, 0);
    return { total, pending, confirmed, dispatched, delivered, totalUnits };
  }, [orders]);

  // Distinct vendors with orders
  const vendorOptions = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      const vId = o.vendorId || 'UNKNOWN';
      if (!map.has(vId)) {
        map.set(vId, o.vendorName || vId);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      if (vendorFilter !== 'All' && o.vendorId !== vendorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const oNum = String(o.orderNumber || o.id || '').toLowerCase();
        const vName = String(o.vendorName || '').toLowerCase();
        const vId = String(o.vendorId || '').toLowerCase();
        const vPhone = String(o.vendorPhone || '').toLowerCase();
        const hub = String(o.deliveryHub || '').toLowerCase();
        const hasSku = (o.items || []).some(
          (i) =>
            String(i.name || '').toLowerCase().includes(q) ||
            String(i.skuCode || '').toLowerCase().includes(q)
        );
        return (
          oNum.includes(q) ||
          vName.includes(q) ||
          vId.includes(q) ||
          vPhone.includes(q) ||
          hub.includes(q) ||
          hasSku
        );
      }
      return true;
    });
  }, [orders, statusFilter, vendorFilter, searchQuery]);

  // Vendor-wise grouped orders data
  const vendorGroupedOrders = useMemo(() => {
    const groups = new Map();
    filteredOrders.forEach((o) => {
      const vKey = o.vendorId || o.vendorName || 'UNKNOWN';
      if (!groups.has(vKey)) {
        groups.set(vKey, {
          vendorId: o.vendorId,
          vendorName: o.vendorName || 'DuraGrit Partner',
          vendorPhone: o.vendorPhone || '',
          vendorLocation: o.vendorLocation || '',
          orders: [],
          totalUnits: 0,
          latestOrderDate: o.createdAt || null,
        });
      }
      const g = groups.get(vKey);
      g.orders.push(o);
      const q = o.totalQuantity ?? (o.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
      g.totalUnits += Number(q || 0);
      if (o.createdAt && (!g.latestOrderDate || new Date(o.createdAt) > new Date(g.latestOrderDate))) {
        g.latestOrderDate = o.createdAt;
      }
    });
    return Array.from(groups.values());
  }, [filteredOrders]);

  // Handle status update
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!updateOrderStatus) return;
    try {
      await updateOrderStatus(orderId, newStatus, adminNoteInput);
      showToast(`✓ Order ${orderId} marked as ${newStatus}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus, adminNotes: adminNoteInput }));
      }
      setTimeout(() => refreshAllData?.(), 300);
    } catch (err) {
      showToast(`Error: ${err.message || 'Status update failed'}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Confirmed
          </span>
        );
      case 'Dispatched':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-purple-600" />
            Dispatched
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Delivered
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <X className="w-3.5 h-3.5 text-rose-600" />
            Cancelled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-12 font-sans select-none">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#1C1917] text-white px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center space-x-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#ECEAE6] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-serif">
                  Vendor Orders Management
                </h1>
                <span className="text-[10px] font-mono font-bold bg-[#FEF2EE] text-[#C84826] px-2 py-0.5 rounded-full border border-[#F9CEB8]">
                  Step 08 of 14
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Live purchase indents placed by authorized vendors, multi-SKU product breakdowns &amp; dispatch fulfillment.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition cursor-pointer active:scale-95 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C84826] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase font-mono block">Total Orders</span>
          <div className="text-2xl font-black text-stone-900 mt-1 font-serif">{stats.total}</div>
          <span className="text-[10px] text-stone-400 font-medium">All-time indents</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase font-mono block">Pending Review</span>
          <div className="text-2xl font-black text-amber-800 mt-1 font-serif">{stats.pending}</div>
          <span className="text-[10px] text-amber-600 font-medium">Requires confirmation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase font-mono block">Confirmed</span>
          <div className="text-2xl font-black text-blue-800 mt-1 font-serif">{stats.confirmed}</div>
          <span className="text-[10px] text-blue-600 font-medium">In factory queue</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-purple-700 uppercase font-mono block">Dispatched</span>
          <div className="text-2xl font-black text-purple-800 mt-1 font-serif">{stats.dispatched}</div>
          <span className="text-[10px] text-purple-600 font-medium">En route / transit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase font-mono block">Delivered</span>
          <div className="text-2xl font-black text-emerald-800 mt-1 font-serif">{stats.delivered}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Fulfilled to yard</span>
        </div>

        <div className="bg-gradient-to-br from-[#1C1917] to-stone-900 text-white p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-amber-300 uppercase font-mono block">Total Volume</span>
          <div className="text-2xl font-black text-white mt-1 font-mono">{stats.totalUnits.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-stone-400 font-medium">Bags, Buckets &amp; Cans</span>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#ECEAE6] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Switcher */}
          <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'all'
                  ? 'bg-white text-[#C84826] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Orders ({filteredOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('vendor-grouped')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'vendor-grouped'
                  ? 'bg-white text-[#C84826] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Vendor-Wise Grouped ({vendorGroupedOrders.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Vendor Name, Phone, or SKU..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 outline-none focus:bg-white focus:border-[#C84826] focus:ring-1 focus:ring-[#C84826] transition font-medium"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
          <span className="text-[11px] font-bold text-stone-500 uppercase font-mono mr-1">Status:</span>
          {['All', 'Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === st
                  ? 'bg-[#C84826] text-white font-bold shadow-2xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {st}
            </button>
          ))}

          {vendorOptions.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase font-mono">Vendor:</span>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="px-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-medium outline-none focus:border-[#C84826]"
              >
                <option value="All">All Vendors ({vendorOptions.length})</option>
                {vendorOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: ALL ORDERS TABULAR LIST                                       */}
      {/* ===================================================================== */}
      {viewMode === 'all' && (
        <div className="bg-white rounded-3xl border border-[#ECEAE6] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50/90 text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200 font-mono">
                  <th className="py-3 px-4">Order ID &amp; Date</th>
                  <th className="py-3 px-4">Vendor Partner</th>
                  <th className="py-3 px-4">Ordered Products</th>
                  <th className="py-3 px-4">Delivery Destination</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredOrders.map((ord) => {
                  const totalUnits =
                    ord.totalQuantity ??
                    (ord.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-stone-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOrder(ord)}
                    >
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-stone-900 flex items-center gap-1.5">
                          <span>{ord.orderNumber || ord.id}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>
                            {ord.createdAt
                              ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recent'}
                          </span>
                        </div>
                      </td>

                      {/* Vendor Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 leading-tight">
                          {ord.vendorName || 'DuraGrit Partner'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[9px] font-bold text-[#C84826] bg-[#FEF2EE] px-1.5 py-0.2 rounded border border-[#F9CEB8]">
                            {ord.vendorId || 'VND'}
                          </span>
                          {ord.vendorPhone && (
                            <span className="text-[10px] text-stone-500 font-mono">
                              +91 {ord.vendorPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Ordered Products Summary */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">
                            {ord.items?.length || 1} Products
                          </span>
                          <span className="text-[10.5px] font-mono font-bold bg-[#FEF2EE] text-[#C84826] px-1.5 py-0.2 rounded">
                            {totalUnits} Units
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 truncate max-w-xs mt-0.5">
                          {(ord.items || [])
                            .map((i) => `${i.name || i.skuCode} (${i.quantity} ${i.unit || 'Units'})`)
                            .join(', ')}
                        </div>
                      </td>

                      {/* Delivery Hub */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-stone-800 font-semibold truncate max-w-xs">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{ord.deliveryHub || 'Yard Hub 04 - Morbi GIDC'}</span>
                        </div>
                        {ord.deliveryAddress && (
                          <div className="text-[10px] text-stone-500 truncate max-w-xs pl-4">
                            {ord.deliveryAddress}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(ord.status)}
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                            className="text-[10px] font-bold bg-white border border-stone-200 rounded-md px-1.5 py-0.5 text-stone-700 outline-none focus:border-[#C84826] cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="px-3 py-1.5 bg-[#FEF2EE] hover:bg-[#FCE3D9] text-[#C84826] border border-[#F9CEB8] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No vendor material orders found matching your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: VENDOR-WISE GROUPED VIEW                                      */}
      {/* ===================================================================== */}
      {viewMode === 'vendor-grouped' && (
        <div className="space-y-4">
          {vendorGroupedOrders.map((vg) => (
            <div
              key={vg.vendorId || vg.vendorName}
              className="bg-white rounded-3xl border border-[#ECEAE6] shadow-sm overflow-hidden"
            >
              {/* Vendor Group Header */}
              <div className="bg-stone-50/90 p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 text-[#C84826] flex items-center justify-center font-bold shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-stone-900 leading-tight">
                        {vg.vendorName}
                      </h2>
                      <span className="font-mono text-[9px] font-bold text-[#C84826] bg-[#FEF2EE] px-1.5 py-0.2 rounded border border-[#F9CEB8]">
                        {vg.vendorId || 'VND'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2 font-medium">
                      {vg.vendorPhone && <span>📞 +91 {vg.vendorPhone}</span>}
                      {vg.vendorLocation && <span>📍 {vg.vendorLocation}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 font-sans block">Total Indent Volume</span>
                    <span className="font-black text-[#C84826] text-sm">
                      {vg.totalUnits.toLocaleString('en-IN')} Units
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-900 text-white rounded-full font-bold text-[11px]">
                    {vg.orders.length} {vg.orders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>
              </div>

              {/* Vendor's Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white text-stone-500 font-bold uppercase text-[9.5px] border-b border-stone-100 font-mono">
                    <tr>
                      <th className="py-2.5 px-4">Order ID &amp; Date</th>
                      <th className="py-2.5 px-4">Ordered Products Breakdown</th>
                      <th className="py-2.5 px-4">Delivery Hub</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {vg.orders.map((ord) => {
                      const totalUnits =
                        ord.totalQuantity ??
                        (ord.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);

                      return (
                        <tr key={ord.id} className="hover:bg-stone-50/60 transition">
                          <td className="py-3 px-4 font-mono">
                            <span className="font-bold text-stone-900">{ord.orderNumber || ord.id}</span>
                            <span className="text-[10px] text-stone-400 block">
                              {ord.createdAt
                                ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Recent'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {(ord.items || []).map((i, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md"
                                >
                                  <strong>{i.name || i.skuCode}:</strong> {i.quantity} {i.unit || 'Units'}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-stone-700 font-medium">
                            {ord.deliveryHub || 'Yard Hub 04 - Morbi GIDC'}
                          </td>

                          <td className="py-3 px-4">
                            {getStatusBadge(ord.status)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              className="px-2.5 py-1 bg-[#FEF2EE] hover:bg-[#FCE3D9] text-[#C84826] border border-[#F9CEB8] rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {vendorGroupedOrders.length === 0 && (
            <div className="bg-white p-12 text-center text-stone-400 rounded-3xl border border-stone-200">
              No vendor orders found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW DETAILS MODAL (FULL PRODUCTS BREAKDOWN & STATUS ACTIONS)         */}
      {/* ===================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-stone-900 font-mono">
                      {selectedOrder.orderNumber || selectedOrder.id}
                    </h2>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Placed on{' '}
                    {selectedOrder.createdAt
                      ? new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recent'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Vendor & Contact Profile Block */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                  Ordering Vendor Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px]">Company Name</span>
                    <strong className="text-stone-900 text-sm">{selectedOrder.vendorName || 'Authorized Partner'}</strong>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[9px] font-bold text-[#C84826] bg-[#FEF2EE] px-1.5 py-0.2 rounded border border-[#F9CEB8]">
                        {selectedOrder.vendorId || 'VND-101'}
                      </span>
                      {selectedOrder.vendorLocation && (
                        <span className="text-stone-500 text-[11px]">{selectedOrder.vendorLocation}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-stone-400 block text-[10px]">Direct Contact</span>
                    {selectedOrder.vendorPhone && (
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <a href={`tel:${selectedOrder.vendorPhone}`} className="hover:text-[#C84826] font-mono font-bold">
                          +91 {selectedOrder.vendorPhone}
                        </a>
                      </div>
                    )}
                    {selectedOrder.vendorEmail && (
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <a href={`mailto:${selectedOrder.vendorEmail}`} className="hover:text-[#C84826]">
                          {selectedOrder.vendorEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Logistics */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono block">
                  Logistics &amp; Delivery Destination
                </span>
                <div className="flex items-start gap-2 text-stone-800">
                  <MapPin className="w-4 h-4 text-[#C84826] shrink-0 mt-0.5" />
                  <div>
                    <strong>Fulfillment Hub:</strong> {selectedOrder.deliveryHub || 'Yard Hub 04 - Morbi GIDC'}
                    {selectedOrder.deliveryAddress && (
                      <div className="text-stone-600 text-[11px] mt-0.5">
                        <strong>Site Address:</strong> {selectedOrder.deliveryAddress}
                      </div>
                    )}
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-800 text-[11px] mt-2">
                    <strong>Vendor Notes / Instructions:</strong> {selectedOrder.notes}
                  </div>
                )}
              </div>

              {/* Itemized Products Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900 uppercase tracking-wider font-serif">
                    Itemized Products Indent
                  </span>
                  <span className="text-xs font-mono font-bold text-[#C84826]">
                    {selectedOrder.items?.length || 0} Products •{' '}
                    {selectedOrder.totalQuantity ??
                      (selectedOrder.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0)}{' '}
                    Total Units
                  </span>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[9.5px] font-mono border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Product Name &amp; Description</th>
                        <th className="py-2.5 px-3">SKU Code</th>
                        <th className="py-2.5 px-3">Pack Specs</th>
                        <th className="py-2.5 px-3 text-right">Quantity Ordered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(selectedOrder.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/60">
                          <td className="py-2.5 px-3">
                            <strong className="text-stone-900 block">{item.name || item.productName}</strong>
                            <span className="text-[10px] text-stone-400">{item.category || 'Vitrified'}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#C84826]">
                            {item.skuCode}
                          </td>
                          <td className="py-2.5 px-3 text-stone-500">
                            {item.packSize || 'Standard'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 text-sm">
                            {item.quantity} <span className="text-xs text-stone-500">{item.unit || 'Units'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Update Action Bar */}
              <div className="bg-[#1C1917] rounded-2xl p-4 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 font-mono block">
                    Update Order Fulfillment Status
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Syncs to Vendor Mobile App automatically
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="Dispatch / Fulfillment Note for Vendor (e.g. Dispatched via Truck GJ-36, LR #492)..."
                    className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 outline-none focus:border-amber-400 transition"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Confirmed')}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Order</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Dispatched')}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Mark Dispatched</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mark Delivered</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}
                    className="px-3.5 py-1.5 bg-stone-800 hover:bg-rose-700 text-stone-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ml-auto"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Order Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

