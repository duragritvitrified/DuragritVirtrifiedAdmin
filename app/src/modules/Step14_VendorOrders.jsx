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
  Boxes
} from 'lucide-react';

export function Step14_VendorOrders({ onBack, onNavigateScan }) {
  const { currentUser } = useAuth();
  const { vendors = [], skus = [], orders = [], createVendorOrder, refreshAllData } = useData();

  // Active view: 'new-order' (default) or 'my-orders'
  const [activeView, setActiveView] = useState('new-order');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Search & Category Filters for Product Multi-Select
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Selected Products State: { [skuCode]: { selected: boolean, quantity: number, unit: string, sku: object } }
  const [selectedItems, setSelectedItems] = useState({});

  // Delivery / Dispatch Form State
  const [deliveryHub, setDeliveryHub] = useState('Yard Hub 04 - Morbi GIDC');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [orderNotes, setOrderNotes] = useState('');

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
      showToast('✓ Live orders data synchronized with Admin Panel.');
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
  const vendorLocation = matchedVendor?.location || matchedVendor?.city || 'Morbi Hub, Gujarat';

  // Prefill default delivery address if empty
  React.useEffect(() => {
    if (!deliveryAddress && (matchedVendor?.address || matchedVendor?.location)) {
      setDeliveryAddress(matchedVendor.address || `${matchedVendor.companyName || vendorName}, ${vendorLocation}`);
    }
    if (!contactPhone && (matchedVendor?.phone || matchedVendor?.mobile || currentUser?.mobile)) {
      setContactPhone(matchedVendor?.phone || matchedVendor?.mobile || currentUser?.mobile || '');
    }
  }, [matchedVendor, deliveryAddress, contactPhone, vendorLocation, vendorName, currentUser]);

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set(['All']);
    skus.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [skus]);

  // Filtered SKUs for multi-select
  const filteredSkus = useMemo(() => {
    return skus.filter((s) => {
      if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        const sName = String(s.name || '').toLowerCase();
        const sCode = String(s.skuCode || s.id || '').toLowerCase();
        const sCat = String(s.category || '').toLowerCase();
        return sName.includes(q) || sCode.includes(q) || sCat.includes(q);
      }
      return true;
    });
  }, [skus, selectedCategory, productSearch]);

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

  // Toggle SKU selection
  const handleToggleProduct = (sku) => {
    const sCode = sku.skuCode || sku.id;
    setSelectedItems((prev) => {
      const existing = prev[sCode];
      if (existing?.selected) {
        // Deselect
        const next = { ...prev };
        delete next[sCode];
        return next;
      } else {
        // Select with default quantity of 50 bags or 20 buckets/cans
        const unit = getProductUnit(sku);
        const defaultQty = unit === 'Bags' ? 50 : 20;
        return {
          ...prev,
          [sCode]: {
            selected: true,
            quantity: defaultQty,
            unit,
            sku,
          },
        };
      }
    });
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
      showToast('⚠️ Please select at least one product to place an order.');
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
      }));

      const newOrderPayload = {
        id: orderNumber,
        orderNumber,
        vendorId,
        vendorName,
        vendorPhone: contactPhone || matchedVendor?.phone || currentDigits || '',
        vendorEmail: matchedVendor?.email || currentUser?.email || '',
        vendorLocation,
        items: itemsPayload,
        totalItems: itemsPayload.length,
        totalQuantity: totalQuantityUnits,
        deliveryHub,
        deliveryAddress: deliveryAddress || `${vendorName}, ${vendorLocation}`,
        expectedDate,
        notes: orderNotes.trim(),
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
      setOrderNotes('');
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
              Vendor Material Indent
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
            <span>Place New Order</span>
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
        {/* VIEW 1: PLACE NEW ORDER FORM (MULTI-PRODUCT INDENT)                */}
        {/* =================================================================== */}
        {activeView === 'new-order' && (
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {/* Step 1: Multi-Select Products Card */}
            <div className="bg-white rounded-3xl p-4 border border-[#ECEAE6] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#FEF2EE] text-[#C84826] flex items-center justify-center text-xs font-black">
                    1
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-stone-900">Select Products (Multi-Select)</h2>
                    <p className="text-[10px] text-stone-500">Tap products to add &amp; specify required quantities</p>
                  </div>
                </div>
                {totalSelectedSkus > 0 && (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8]">
                    {totalSelectedSkus} Selected ({totalQuantityUnits} Units)
                  </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search tile adhesives, grouts, primers..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl placeholder:text-stone-400 focus:bg-white focus:border-[#C84826] focus:ring-1 focus:ring-[#C84826] outline-none transition"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 transition ${
                      selectedCategory === cat
                        ? 'bg-[#C84826] text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Products List */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredSkus.map((sku) => {
                  const sCode = sku.skuCode || sku.id;
                  const isSelected = Boolean(selectedItems[sCode]?.selected);
                  const currentQty = selectedItems[sCode]?.quantity || 50;
                  const unit = getProductUnit(sku);

                  return (
                    <div
                      key={sCode}
                      className={`p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-2 border-[#C84826] bg-[#FEF2EE]/40 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Checkbox & Product Info */}
                        <div
                          onClick={() => handleToggleProduct(sku)}
                          className="flex items-start gap-2.5 flex-1 cursor-pointer select-none"
                        >
                          <div
                            className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition shrink-0 ${
                              isSelected
                                ? 'bg-[#C84826] border-[#C84826] text-white shadow-xs'
                                : 'border-stone-300 bg-stone-50'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] font-bold text-[#C84826] bg-[#FEF2EE] px-1 rounded border border-[#F9CEB8]/70">
                                {sCode}
                              </span>
                              <span className="text-[9.5px] text-stone-500 font-medium">
                                {sku.category || 'Vitrified'}
                              </span>
                            </div>
                            <h3 className="text-xs font-black text-stone-900 mt-0.5 leading-snug">
                              {sku.name}
                            </h3>
                            <p className="text-[10px] text-stone-500 font-medium">
                              Packaging: {sku.packWeight || sku.packSize || '20 kg'} • Base MRP: ₹{sku.baseMrp || sku.mrp || 650}
                            </p>
                          </div>
                        </div>

                        {/* Quick Selection Toggle Badge */}
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(sku)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 cursor-pointer transition ${
                            isSelected
                              ? 'bg-[#C84826] text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : '+ Select'}
                        </button>
                      </div>

                      {/* Quantity Stepper (Shown only when selected) */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-[#F9CEB8]/60 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-stone-700">
                            Order Quantity:
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(sCode, currentQty - 10)}
                              className="w-7 h-7 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <input
                              type="number"
                              min="1"
                              value={currentQty}
                              onChange={(e) => handleUpdateQuantity(sCode, e.target.value)}
                              className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border border-[#C84826] rounded-lg text-stone-900 focus:outline-none"
                            />

                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(sCode, currentQty + 10)}
                              className="w-7 h-7 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 flex items-center justify-center font-bold active:scale-95 shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            <span className="text-[10.5px] font-mono font-semibold text-stone-600 min-w-[45px]">
                              {unit}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredSkus.length === 0 && (
                  <div className="p-6 text-center text-xs text-stone-400">
                    No products matched your search.
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Logistics & Dispatch Details Card */}
            <div className="bg-white rounded-3xl p-4 border border-[#ECEAE6] shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-stone-100">
                <div className="w-6 h-6 rounded-md bg-[#FEF2EE] text-[#C84826] flex items-center justify-center text-xs font-black">
                  2
                </div>
                <div>
                  <h2 className="text-xs font-black text-stone-900">Delivery &amp; Logistics</h2>
                  <p className="text-[10px] text-stone-500">Destination Yard Hub and Site Address</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Fulfillment Kiln Yard / Logistics Hub <span className="text-[#C84826]">*</span>
                  </label>
                  <select
                    value={deliveryHub}
                    onChange={(e) => setDeliveryHub(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900 outline-none focus:bg-white focus:border-[#C84826]"
                    required
                  >
                    <option value="Yard Hub 04 - Morbi GIDC">Yard Hub 04 - Morbi GIDC (Main Kiln Hub)</option>
                    <option value="Ahmedabad Ring Road Depot">Ahmedabad Ring Road Depot</option>
                    <option value="Surat Industrial Depot Hub">Surat Industrial Depot Hub</option>
                    <option value="Rajkot Regional Logistics Yard">Rajkot Regional Logistics Yard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Delivery Site / Godown Address <span className="text-[#C84826]">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full godown or unloading site address"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900 outline-none focus:bg-white focus:border-[#C84826]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Contact Mobile <span className="text-[#C84826]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 outline-none focus:bg-white focus:border-[#C84826]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Required By Date
                    </label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 outline-none focus:bg-white focus:border-[#C84826]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Special Dispatch Instructions / Transporter Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Call yard in-charge on arrival; morning dispatch slot requested."
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:bg-white focus:border-[#C84826] resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Step 3: Order Review & Submit */}
            <div className="bg-[#1C1917] rounded-3xl p-4 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#FAA322]" />
                  <span className="text-xs font-black uppercase tracking-wider text-stone-200">
                    Order Indent Summary
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#FAA322] bg-white/10 px-2 py-0.5 rounded-full font-bold">
                  {totalSelectedSkus} SKUs • {totalQuantityUnits} Units
                </span>
              </div>

              {selectedList.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedList.map((item) => (
                    <div
                      key={item.sku.skuCode || item.sku.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-stone-800/60"
                    >
                      <span className="truncate pr-2 font-medium text-stone-300">
                        {item.sku.name}
                      </span>
                      <span className="font-mono font-bold text-amber-300 shrink-0">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic py-1">
                  No products selected yet. Select products above to complete order.
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || selectedList.length === 0}
                className="w-full py-3 px-4 bg-[#C84826] hover:bg-[#b03d1e] active:scale-[0.99] text-white text-xs font-bold rounded-2xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting Order Indent...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Material Order ({totalQuantityUnits} Units)</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 font-medium pt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Orders auto-sync directly to DuraGrit Production Console</span>
              </div>
            </div>
          </form>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: MY ORDERS HISTORY (STATUS TRACKING)                         */}
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

            {/* Orders List */}
            <div className="space-y-3">
              {filteredHistoryOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-4 border border-[#ECEAE6] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-stone-900">
                          {ord.orderNumber || ord.id}
                        </span>
                        {getStatusBadge(ord.status)}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>
                          {ord.createdAt
                            ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Recent'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono font-bold bg-[#FEF2EE] text-[#C84826] px-2 py-0.5 rounded-full border border-[#F9CEB8]">
                      {ord.totalQuantity || ord.items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) || 0} Units
                    </span>
                  </div>

                  {/* Items Breakdown */}
                  <div className="bg-stone-50 rounded-2xl p-2.5 space-y-1.5 border border-stone-100">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                      Ordered Products ({ord.items?.length || 0})
                    </span>
                    {(ord.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-0.5"
                      >
                        <span className="font-medium text-stone-800 truncate pr-2">
                          {item.name || item.productName || item.skuCode}
                        </span>
                        <span className="font-mono font-bold text-[#C84826] shrink-0">
                          {item.quantity} {item.unit || 'Units'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Logistics Info */}
                  <div className="text-[10.5px] text-stone-600 space-y-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">
                        <strong>Hub:</strong> {ord.deliveryHub || 'Yard Hub 04 - Morbi GIDC'}
                      </span>
                    </div>
                    {ord.deliveryAddress && (
                      <div className="text-stone-500 text-[10px] pl-5 truncate">
                        {ord.deliveryAddress}
                      </div>
                    )}
                    {ord.notes && (
                      <div className="text-amber-800 bg-amber-50/70 p-2 rounded-xl text-[10px] border border-amber-200/60 mt-1">
                        <strong>Notes:</strong> {ord.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredHistoryOrders.length === 0 && (
                <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FEF2EE] text-[#C84826] mx-auto flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-800">No Orders Placed Yet</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      You haven't placed any material orders with this status.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('new-order')}
                    className="px-4 py-2 bg-[#C84826] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Place Your First Order</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
