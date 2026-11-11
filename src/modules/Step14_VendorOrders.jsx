import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Package,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  Clock,
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
  ShoppingBag,
  Layers,
  ChevronRight,
  AlertCircle,
  Phone,
  ShieldCheck,
  Send,
  Boxes,
  Trash2,
  X
} from 'lucide-react';

export function Step14_VendorOrders({ onBack, onNavigateScan }) {
  const { currentUser } = useAuth();
  const { vendors = [], skus = [], orders = [], createVendorOrder, refreshAllData } = useData();

  // Active view: 'new-order' (default) or 'my-orders'
  const [activeView, setActiveView] = useState('new-order');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Search filter for Product List (Optional quick finder)
  const [productSearch, setProductSearch] = useState('');

  // Selected Products State: { [skuCode]: { selected: boolean, quantity: number, unit: string, sku: object } }
  const [selectedItems, setSelectedItems] = useState({});

  // Order history search & status filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSync = async () => {
    if (!refreshAllData) return;
    setIsSyncing(true);
    try {
      await refreshAllData();
      showToast('✓ Live orders data synchronized with Admin Panel & Database.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Match current authenticated vendor
  const currentDigits = String(currentUser?.mobile || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
  const currentId = String(currentUser?.vendorId || currentUser?.id || currentUser?.userId || '').toLowerCase();
  const currentName = String(currentUser?.companyName || currentUser?.name || '').toLowerCase().trim();

  const matchedVendor = useMemo(() => {
    return (vendors || []).find((v) => {
      const vDigits = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
      const vId = String(v.vendorId || v.id || '').toLowerCase();
      const vName = String(v.companyName || v.name || '').toLowerCase().trim();
      return (
        (vId && currentId && (vId === currentId || currentId.includes(vId) || vId.includes(currentId))) ||
        (currentDigits.length === 10 && vDigits === currentDigits) ||
        (currentName && vName && (currentName === vName || currentName.includes(vName) || vName.includes(currentName)))
      );
    }) || (vendors.length > 0 ? vendors[0] : null);
  }, [vendors, currentId, currentDigits, currentName]);

  const vendorName = matchedVendor?.companyName || matchedVendor?.name || currentUser?.companyName || 'DuraGrit Partner';
  const vendorId = matchedVendor?.vendorId || matchedVendor?.id || 'VND-101';
  const vendorLocation = matchedVendor?.location || matchedVendor?.city || 'Morbi Central Hub, Gujarat';

  // Determine standard unit based on product
  const getProductUnit = (sku) => {
    const pWeight = String(sku.packWeight || sku.packSize || '').toLowerCase();
    const cat = String(sku.category || '').toLowerCase();
    if (pWeight.includes('bag') || cat.includes('adhesive')) return 'Bags';
    if (pWeight.includes('bucket') || cat.includes('grout')) return 'Buckets';
    if (pWeight.includes('can') || pWeight.includes('liter') || cat.includes('waterproof')) return 'Cans';
    if (pWeight.includes('box') || cat.includes('tile')) return 'Boxes';
    return 'Units';
  };

  // All available catalog products (no category tabs, directly accessible)
  const allAvailableSkus = useMemo(() => {
    const list = skus && skus.length > 0 ? skus : [];
    if (!productSearch.trim()) return list;
    const q = productSearch.toLowerCase();
    return list.filter((s) => {
      const sName = String(s.name || '').toLowerCase();
      const sCode = String(s.skuCode || s.id || '').toLowerCase();
      const sCat = String(s.category || '').toLowerCase();
      return sName.includes(q) || sCode.includes(q) || sCat.includes(q);
    });
  }, [skus, productSearch]);

  // Add product to order
  const handleAddProduct = (sku) => {
    const sCode = sku.skuCode || sku.id;
    const unit = getProductUnit(sku);
    const defaultQty = unit === 'Bags' ? 50 : 20;

    setSelectedItems((prev) => ({
      ...prev,
      [sCode]: {
        selected: true,
        quantity: prev[sCode]?.quantity || defaultQty,
        unit,
        sku,
      },
    }));
    showToast(`✓ Added ${sku.name} to order`);
  };

  // Delete product from order
  const handleDeleteProduct = (sCode, productName = '') => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      delete next[sCode];
      return next;
    });
    if (productName) {
      showToast(`✕ Removed ${productName} from order`);
    }
  };

  // Adjust quantity of selected product
  const handleUpdateQuantity = (sCode, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    setSelectedItems((prev) => {
      if (!prev[sCode]) return prev;
      return {
        ...prev,
        [sCode]: {
          ...prev[sCode],
          quantity: qty,
        },
      };
    });
  };

  // Quick increment quantity
  const handleQuickAddQty = (sCode, increment) => {
    setSelectedItems((prev) => {
      if (!prev[sCode]) return prev;
      const current = Number(prev[sCode].quantity || 0);
      return {
        ...prev,
        [sCode]: {
          ...prev[sCode],
          quantity: current + increment,
        },
      };
    });
  };

  // Computed summary of selected items
  const selectedList = useMemo(() => {
    return Object.values(selectedItems).filter((item) => item.selected);
  }, [selectedItems]);

  const totalSelectedSkus = selectedList.length;
  const totalQuantityUnits = selectedList.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Handle Order Submit
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (selectedList.length === 0) {
      showToast('⚠️ Please add at least one product before submitting order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const itemsPayload = selectedList.map((item) => ({
        skuCode: item.sku.skuCode || item.sku.id,
        name: item.sku.name,
        category: item.sku.category || 'Vitrified',
        packSize: item.sku.packWeight || item.sku.packSize || 'Standard',
        quantity: item.quantity,
        unit: item.unit,
        mrp: item.sku.baseMrp || item.sku.mrp || 0,
      }));

      // Auto-bundle default hub & logistics without requiring vendor to fill fields
      const newOrderPayload = {
        id: orderNumber,
        orderNumber,
        vendorId,
        vendorName,
        vendorPhone: matchedVendor?.phone || matchedVendor?.mobile || currentDigits || '8826021114',
        vendorEmail: matchedVendor?.email || currentUser?.email || 'partner@duragrit.com',
        vendorLocation,
        items: itemsPayload,
        totalItems: itemsPayload.length,
        totalQuantity: totalQuantityUnits,
        deliveryHub: 'Morbi Central Hub',
        deliveryAddress: matchedVendor?.address || `${vendorName}, ${vendorLocation}`,
        expectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Quick Mobile Order Indent',
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (createVendorOrder) {
        await createVendorOrder(newOrderPayload);
      }

      showToast(`🎉 Order ${orderNumber} placed successfully!`);
      // Reset form
      setSelectedItems({});
      // Switch to My Orders view so vendor immediately sees their order
      setTimeout(() => {
        setActiveView('my-orders');
      }, 500);
    } catch (err) {
      showToast(`Error placing order: ${err.message || 'Please try again'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter vendor's own orders for "My Orders" tab
  const vendorOrders = useMemo(() => {
    return (orders || []).filter((o) => {
      const oVid = String(o.vendorId || '').toLowerCase();
      const oPhone = String(o.vendorPhone || '').replace(/\D/g, '').slice(-10);
      const oName = String(o.vendorName || '').toLowerCase();
      return (
        (vendorId && oVid === String(vendorId).toLowerCase()) ||
        (currentDigits.length === 10 && oPhone === currentDigits) ||
        (vendorName && oName.includes(vendorName.toLowerCase()))
      );
    });
  }, [orders, vendorId, currentDigits, vendorName]);

  const filteredHistoryOrders = useMemo(() => {
    return vendorOrders.filter((o) => {
      if (historyStatusFilter !== 'All' && o.status !== historyStatusFilter) return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const oNum = String(o.orderNumber || o.id || '').toLowerCase();
        const oHub = String(o.deliveryHub || '').toLowerCase();
        const hasProd = (o.items || []).some((item) =>
          String(item.name || '').toLowerCase().includes(q) ||
          String(item.skuCode || '').toLowerCase().includes(q)
        );
        return oNum.includes(q) || oHub.includes(q) || hasProd;
      }
      return true;
    });
  }, [vendorOrders, historyStatusFilter, historySearch]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Confirmed
          </span>
        );
      case 'Dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3 h-3 text-purple-600" />
            Dispatched
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <X className="w-3 h-3 text-rose-600" />
            Cancelled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto flex-1 flex flex-col font-sans select-none pb-16 text-stone-800 overflow-x-hidden">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-[#A6300F] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-white/20 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3 max-w-[90%]">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="w-full bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-[#ECEAE6] flex items-center justify-between shadow-2xs sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition cursor-pointer shrink-0"
              title="Back"
            >
              ←
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-[13px] font-black text-stone-900 leading-tight truncate">
              Quick Order Indent
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[9px] font-bold text-[#C84826] bg-[#FEF2EE] px-1.5 py-0.2 rounded border border-[#F9CEB8]">
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
          title="Sync with Database"
          className="p-1.5 sm:p-2 rounded-xl bg-[#FEF2EE] hover:bg-[#FCE3D9] text-[#C84826] border border-[#F9CEB8] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="px-3.5 pt-3">
        <div className="grid grid-cols-2 p-1 bg-stone-100/90 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveView('new-order')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'new-order'
                ? 'bg-white text-[#C84826] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order Entry</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('my-orders')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeView === 'my-orders'
                ? 'bg-white text-[#C84826] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>My Orders ({vendorOrders.length})</span>
          </button>
        </div>
      </div>

      <main className="p-3.5 space-y-4 flex-1">
        {/* =================================================================== */}
        {/* VIEW 1: FAST & EASY ORDER ENTRY FORM (ALL PRODUCTS VISIBLE)         */}
        {/* =================================================================== */}
        {activeView === 'new-order' && (
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {/* Multi-Select Products Section */}
            <div className="bg-white rounded-3xl p-4 border border-[#ECEAE6] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                <div>
                  <h2 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span>Products Catalog</span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      ({allAvailableSkus.length} Available)
                    </span>
                  </h2>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Add required products &amp; adjust quantities directly
                  </p>
                </div>

                {totalSelectedSkus > 0 && (
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8]">
                    {totalSelectedSkus} Added • {totalQuantityUnits} Units
                  </span>
                )}
              </div>

              {/* Quick Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Quick search product name or code..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl placeholder:text-stone-400 focus:bg-white focus:border-[#C84826] focus:ring-1 focus:ring-[#C84826] outline-none transition"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* All Products List (No category tabs, direct display) */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {allAvailableSkus.map((sku) => {
                  const sCode = sku.skuCode || sku.id;
                  const isAdded = Boolean(selectedItems[sCode]?.selected);
                  const currentQty = selectedItems[sCode]?.quantity || 50;
                  const unit = getProductUnit(sku);

                  return (
                    <div
                      key={sCode}
                      className={`p-3 rounded-2xl border transition-all ${
                        isAdded
                          ? 'border-2 border-[#C84826] bg-[#FEF2EE]/35 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Product Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[9.5px] font-bold text-[#C84826] bg-[#FEF2EE] px-1.5 py-0.5 rounded border border-[#F9CEB8]/70">
                              {sCode}
                            </span>
                            <span className="text-[9.5px] text-stone-500 font-semibold px-1.5 py-0.5 rounded bg-stone-100">
                              {sku.category || 'Vitrified'}
                            </span>
                            {isAdded && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <Check className="w-2.5 h-2.5 stroke-[3]" /> Added to Order
                              </span>
                            )}
                          </div>

                          <h3 className="text-xs font-black text-stone-900 mt-1 leading-snug">
                            {sku.name}
                          </h3>

                          <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                            Pack: {sku.packWeight || sku.packSize || '20 kg'} • MRP: ₹{sku.baseMrp || sku.mrp || 650}
                          </p>
                        </div>

                        {/* Add / Added Action Button */}
                        <div className="shrink-0 flex items-center">
                          {!isAdded ? (
                            <button
                              type="button"
                              onClick={() => handleAddProduct(sku)}
                              className="px-3 py-1.5 rounded-xl bg-[#FEF2EE] hover:bg-[#FCE3D9] text-[#C84826] border border-[#F9CEB8] text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Add</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(sCode, sku.name)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Delete from Order"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper & Delete Row (Shown when Added) */}
                      {isAdded && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#F9CEB8]/70 flex items-center justify-between flex-wrap gap-2">
                          {/* Stepper Controls */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-stone-700 mr-1">
                              Qty:
                            </span>

                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(sCode, Math.max(1, currentQty - 10))}
                              className="w-7 h-7 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 flex items-center justify-center font-bold active:scale-95 shadow-2xs cursor-pointer"
                              title="Decrease 10"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <input
                              type="number"
                              min="1"
                              value={currentQty}
                              onChange={(e) => handleUpdateQuantity(sCode, e.target.value)}
                              className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border-2 border-[#C84826] rounded-lg text-stone-900 focus:outline-none shadow-2xs"
                            />

                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(sCode, currentQty + 10)}
                              className="w-7 h-7 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 flex items-center justify-center font-bold active:scale-95 shadow-2xs cursor-pointer"
                              title="Increase 10"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            <span className="text-[10.5px] font-mono font-bold text-stone-700 ml-0.5">
                              {unit}
                            </span>
                          </div>

                          {/* Quick Increment Chips & Delete Shortcut */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickAddQty(sCode, 25)}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md border border-stone-200 transition"
                            >
                              +25
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAddQty(sCode, 50)}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md border border-stone-200 transition"
                            >
                              +50
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(sCode, sku.name)}
                              className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition ml-1"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {allAvailableSkus.length === 0 && (
                  <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    No products matched "{productSearch}".
                  </div>
                )}
              </div>
            </div>

            {/* Order Indent Summary Box */}
            <div className="bg-[#1C1917] rounded-3xl p-4 text-white shadow-md space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#FAA322]" />
                  <span className="text-xs font-black uppercase tracking-wider text-stone-200">
                    Order Indent Summary
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#FAA322] bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                  {totalSelectedSkus} SKUs • {totalQuantityUnits} Units
                </span>
              </div>

              {selectedList.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedList.map((item) => {
                    const sCode = item.sku.skuCode || item.sku.id;
                    return (
                      <div
                        key={sCode}
                        className="flex items-center justify-between text-xs py-1 border-b border-stone-800/60"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(sCode, item.sku.name)}
                            className="text-stone-500 hover:text-rose-400 p-0.5 shrink-0"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <span className="truncate font-medium text-stone-300">
                            {item.sku.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-amber-300 shrink-0">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic py-1">
                  No products added yet. Click "+ Add" on the products above to prepare your order.
                </p>
              )}
            </div>

            {/* SEPARATE SUBMIT BUTTON (OUTSIDE & BELOW ORDER SUMMARY) */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting || selectedList.length === 0}
                className="w-full py-3.5 px-4 bg-[#A6300F] hover:bg-[#8B230C] active:scale-[0.99] text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting Order Indent...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Place Order Now ({totalQuantityUnits} Units)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Orders auto-sync directly with DuraGrit Web Admin Console</span>
              </div>
            </div>
          </form>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: MY ORDERS HISTORY (REALTIME STATUS FROM ADMIN PANEL)        */}
        {/* =================================================================== */}
        {activeView === 'my-orders' && (
          <div className="space-y-3">
            {/* Search & Filter Header */}
            <div className="bg-white rounded-2xl p-3 border border-[#ECEAE6] shadow-2xs space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by Order # or SKU..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:bg-white focus:border-[#C84826]"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {['All', 'Pending', 'Confirmed', 'Dispatched', 'Delivered'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setHistoryStatusFilter(st)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 transition ${
                      historyStatusFilter === st
                        ? 'bg-[#C84826] text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Feed */}
            {filteredHistoryOrders.length > 0 ? (
              <div className="space-y-2.5">
                {filteredHistoryOrders.map((ord) => {
                  const items = ord.items || [];
                  const totalUnits = ord.totalQuantity || items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
                  const orderDate = ord.createdAt
                    ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl p-3.5 border border-[#ECEAE6] shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-stone-900">
                              {ord.orderNumber || ord.id}
                            </span>
                            {getStatusBadge(ord.status)}
                          </div>
                          <span className="text-[10px] text-stone-400 mt-0.5 block">
                            Placed on {orderDate}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-[#C84826] font-mono">
                            {totalUnits} Units
                          </span>
                          <span className="text-[9.5px] text-stone-400 block">
                            {items.length} SKUs
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1 bg-stone-50/80 rounded-xl p-2.5 border border-stone-100">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                              <span className="font-mono text-[9px] font-bold text-[#C84826] bg-white px-1 py-0.2 rounded border border-[#F9CEB8]/60 shrink-0">
                                {item.skuCode}
                              </span>
                              <span className="truncate text-stone-700 font-medium">
                                {item.name}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-stone-900 shrink-0">
                              {item.quantity} {item.unit || 'Units'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Admin Notes if provided */}
                      {ord.adminNotes && (
                        <div className="text-[10.5px] text-stone-600 bg-blue-50/70 border border-blue-100 rounded-xl p-2 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-blue-800">Admin Dispatch Note: </span>
                            <span>{ord.adminNotes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center border border-[#ECEAE6] space-y-2">
                <Package className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-bold text-stone-700">No orders found</p>
                <p className="text-[10px] text-stone-400">
                  {historySearch ? 'No orders match your search term' : 'You have not placed any orders yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('new-order')}
                  className="mt-2 px-3 py-1.5 text-xs font-bold text-[#C84826] bg-[#FEF2EE] border border-[#F9CEB8] rounded-xl hover:bg-[#FCE3D9] transition cursor-pointer"
                >
                  Place Your First Order →
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
