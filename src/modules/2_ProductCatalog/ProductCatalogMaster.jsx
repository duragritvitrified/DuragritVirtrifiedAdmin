import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { ProductPackagingVisual } from './ProductPackagingVisual';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  exportFilteredCatalogCsv,
  THERMAL_PRINTER_SPEC,
} from '../../utils/thermalPrintExport';
import {
  Plus, Search, Download, Printer, ArrowLeft, RotateCcw,
  Package, QrCode, Wallet, TrendingUp, ShieldCheck, Check,
  Edit3, Trash2, Upload, AlertCircle,
  CheckCircle2, AlertTriangle, X
} from 'lucide-react';

export function ProductCatalogMaster({ onNavigateQR }) {
  const { skus = [], batches = [], claims = [], addSKU, updateSKU, deleteSKU } = useData();

  const [viewMode, setViewMode] = useState('list');
  const [editingSku, setEditingSku] = useState(null);
  const [skuToDelete, setSkuToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const initialForm = {
    name: '',
    skuCode: '',
    category: 'High-Polymer Adhesive',
    spec: 'Type 4 Vitrified',
    packWeight: '20 kg Kraft Bag',
    description: '',
    base: '',
    mrp: '',
    cashbackReward: '',
    rewardNote: 'Tier 1 Mason direct',
    initialBatchQuantity: 100,
    packAssetType: 'kraft-bag',
    imageUrl: '',
    imageFileName: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      setFormData((prev) => ({
        ...prev,
        imageUrl: dataUrl,
        imageFileName: file.name,
      }));
      showToast(`Product packaging image loaded: ${file.name}`);
    };
    reader.onerror = () => {
      showToast('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const categoriesList = [
    'All Categories (Adhesives, Grouts, Primers)',
    'High-Polymer Adhesive',
    'Standard Vitrified Adhesive',
    'Ceramic Tile Adhesive',
    'Masonry & Screed',
    'Epoxy Reactive Grout',
    'Polymer Modified Grout',
    'Liquid Bonding Agent',
    'Waterproofing Slurry',
  ];

  const handleOpenAdd = () => {
    setEditingSku(null);
    setFormData(initialForm);
    setViewMode('add');
  };

  const handleOpenEdit = (sku) => {
    setEditingSku(sku);
    setFormData({
      name: sku.name || '',
      skuCode: sku.skuCode || '',
      category: sku.category || 'High-Polymer Adhesive',
      spec: sku.spec || 'Type 4 Vitrified',
      packWeight: sku.packWeight || sku.packSize || '20 kg Bag',
      description: sku.description || '',
      base: sku.base || sku.dealerPrice || Math.round((sku.mrp || 0) * 0.75),
      mrp: sku.mrp || '',
      cashbackReward: sku.cashbackReward ?? sku.cashbackAmount ?? '',
      rewardNote: sku.rewardNote || 'Tier 1 Mason direct',
      initialBatchQuantity: sku.minBatchQty || 100,
      packAssetType: 'kraft-bag',
      imageUrl: sku.imageUrl || sku.image || sku.packRender || '',
      imageFileName: sku.imageFileName || '',
    });
    setViewMode('edit');
  };

  const handleResetForm = () => {
    setFormData(initialForm);
    showToast('Form cleared.');
  };

  const persistCurrentSkuForm = async () => {
    if (!formData.name.trim() || !formData.skuCode.trim()) {
      showToast('Please enter both Product Name and SKU Code.');
      return null;
    }

    const mrpVal = Number(formData.mrp || 0);
    const baseVal = Number(formData.base || Math.round(mrpVal * 0.75));
    const rewardVal = Number(formData.cashbackReward || 0);
    const savedPayload = {
      ...formData,
      mrp: mrpVal,
      base: baseVal,
      dealerPrice: baseVal,
      cashbackAmount: rewardVal,
      cashbackReward: rewardVal,
      packSize: formData.packWeight,
      minBatchQty: Number(formData.initialBatchQuantity) || 100,
      status: 'Active',
    };

    if (editingSku) {
      await updateSKU(editingSku.id || editingSku.skuCode, savedPayload);
      showToast(`SKU ${formData.skuCode} updated & synced to Supabase.`);
    } else {
      await addSKU(savedPayload);
      showToast(`Product ${formData.skuCode} added & synced to Supabase!`);
    }
    return savedPayload;
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const saved = await persistCurrentSkuForm();
    if (!saved) return;
    setViewMode('list');
  };

  const handleSaveAndGenerateQR = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const saved = await persistCurrentSkuForm();
    if (!saved) return;
    try {
      localStorage.setItem('duragrit_pending_qr_sku', JSON.stringify(saved));
    } catch (_) {}
    showToast(`SKU ${saved.skuCode} saved — routing to Step 04 QR Batch Print Queue (PRN-PORT-08)...`);
    if (onNavigateQR) {
      onNavigateQR(saved);
    } else {
      setViewMode('list');
    }
  };

  const handleExportCatalogCsv = () => {
    const targetList = filteredProducts.length > 0 ? filteredProducts : skus;
    if (targetList.length === 0) {
      showToast('No products in catalog yet. Add a product first to export.');
      return;
    }
    const filename = exportFilteredCatalogCsv(targetList, batches);
    showToast(`Exported ${targetList.length} filtered SKUs to ${filename}`);
  };

  const handleConfirmDelete = async () => {
    if (!skuToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSKU(skuToDelete.id || skuToDelete.skuCode);
      showToast(`Deleted SKU ${skuToDelete.skuCode} from Catalog & Supabase.`);
      setSkuToDelete(null);
    } catch (err) {
      showToast(`Failed to delete SKU: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setSkuToDelete(null);
  };

  const handleExportCatalog = () => {
    if (skus.length === 0) {
      showToast('No products in catalog yet. Add a product first to export.');
      return;
    }
    showToast('Generating official DuraGrit Product Catalog PDF export...');
    setTimeout(() => {
      try {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        doc.setFillColor(200, 72, 38); // PDF Red #C84826
        doc.rect(0, 0, 297, 24, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text('DURAGRIT VITRIFIED', 15, 12);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(254, 242, 238);
        doc.text('CENTRAL PRODUCT CATALOG & TECHNICAL SKU DIRECTORY', 15, 18);

        doc.setFontSize(8);
        doc.text(
          `EXPORT DATE: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • TOTAL SKUS: ${skus.length}`,
          297 - 15,
          18,
          { align: 'right' }
        );

        const tableBody = skus.map((s) => {
          const skuBatches = batches.filter((b) => b.skuCode === s.skuCode);
          return [
            s.skuCode,
            s.name,
            s.category || 'Adhesives',
            s.packWeight || s.packSize || '20 kg',
            `INR ${s.base || s.dealerPrice || Math.round((s.mrp || 0) * 0.75)}`,
            `INR ${s.mrp || 0}`,
            `INR ${s.cashbackReward ?? s.cashbackAmount ?? 0}`,
            s.rewardNote || 'Tier 1 Standard',
            `${skuBatches.length} Batches`,
            s.status || 'Active',
          ];
        });

        doc.autoTable({
          startY: 30,
          head: [['SKU Code', 'Product Name', 'Category', 'Pack Size', 'Base (INR)', 'MRP (INR)', 'Reward', 'Tier', 'Batches', 'Status']],
          body: tableBody,
          theme: 'striped',
          headStyles: { fillColor: [166, 44, 17], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
          bodyStyles: { fontSize: 7.5, textColor: [28, 25, 23] },
          alternateRowStyles: { fillColor: [250, 249, 246] },
          margin: { left: 15, right: 15 },
        });

        doc.save(`DuraGrit_Product_Catalog_${new Date().toISOString().slice(0, 10)}.pdf`);
        showToast('Catalog PDF exported successfully.');
      } catch (err) {
        showToast('Error generating PDF: ' + err.message);
      }
    }, 300);
  };

  const filteredProducts = useMemo(() => {
    return skus.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.skuCode || '').toLowerCase().includes(q) ||
        (item.spec && item.spec.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'All' ||
        selectedCategory === 'All Categories (Adhesives, Grouts, Primers)' ||
        item.category === selectedCategory;

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && item.status !== 'Inactive' && item.status !== 'Discontinued') ||
        (statusFilter === 'Inactive' && (item.status === 'Inactive' || item.status === 'Discontinued'));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [skus, searchQuery, selectedCategory, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const currentItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Live Dynamic KPIs (Zero Fake Numbers)
  const totalActiveSkus = skus.length;
  const totalActiveBatches = batches.length;
  const totalCirculationTokens = batches.reduce((sum, b) => sum + Number(b.quantity || (b.tokens || []).length || 0), 0);
  const avgCashback = skus.length > 0
    ? (skus.reduce((sum, s) => sum + Number(s.cashbackReward ?? s.cashbackAmount ?? 0), 0) / skus.length).toFixed(2)
    : '0.00';
  const totalDisbursed = claims
    .filter((c) => c.status === 'Disbursed')
    .reduce((sum, c) => sum + Number(c.disbursedAmount || c.amount || 0), 0);

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'High-Polymer Adhesive':
      case 'Standard Vitrified Adhesive':
      case 'Ceramic Tile Adhesive':
        return { dot: 'bg-[#C84826]' };
      case 'Epoxy Reactive Grout':
      case 'Polymer Modified Grout':
        return { dot: 'bg-[#A62C11]' };
      case 'Liquid Bonding Agent':
      case 'Primers':
        return { dot: 'bg-amber-600' };
      case 'Waterproofing Slurry':
      case 'Waterproofing':
        return { dot: 'bg-emerald-600' };
      default:
        return { dot: 'bg-stone-500' };
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

      {viewMode === 'list' && (
        <>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-1 border-b border-[#E7E5E0]">
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">
                  Product Catalog &amp; Module
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#FEF2EE] text-[#A62C11] border border-[#C84826]/25 px-2 py-0.5 rounded font-mono">
                  SKU DIRECTORY 2.4
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-3xl">
                Manage tile adhesives, grouts, surface primers, tier pricing, and contractor QR cashback payout rules synced live with Supabase.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => onNavigateQR && onNavigateQR()}
                className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-[#E7E5E0] hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#C84826]" />
                <span>Batch QR Print</span>
              </button>

              <button
                onClick={handleExportCatalogCsv}
                className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-[#E7E5E0] hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                title="Export current filtered SKUs as CSV"
              >
                <Download className="w-4 h-4 text-[#C84826]" />
                <span>↓ Export Catalog</span>
              </button>

              <button
                onClick={handleExportCatalog}
                className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#E7E5E0] hover:bg-stone-50 text-stone-600 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                title="Export official PDF catalog"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                <span>PDF</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center space-x-2 px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-md shadow-[#C84826]/20 transition cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Product</span>
              </button>
            </div>
          </div>

          {/* Top 4 Live KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E7E5E0] shadow-xs flex flex-col justify-between min-h-[135px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Total Active SKUs
                  </span>
                  <div className="text-2xl font-black text-[#1C1917] mt-1 font-mono tracking-tight">
                    {totalActiveSkus} SKUs
                  </div>
                </div>
                <div className="p-2.5 bg-[#FEF2EE] text-[#C84826] rounded-xl">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-100 text-xs text-stone-500 font-medium flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Live Supabase Catalog</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E7E5E0] shadow-xs flex flex-col justify-between min-h-[135px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Active QR Batches
                  </span>
                  <div className="text-2xl font-black text-[#1C1917] mt-1 font-mono tracking-tight">
                    {totalActiveBatches} Batches
                  </div>
                </div>
                <div className="p-2.5 bg-[#FEF2EE] text-[#C84826] rounded-xl">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-100 text-xs text-stone-500 font-medium">
                <strong className="text-[#1C1917] font-mono">{totalCirculationTokens.toLocaleString('en-IN')}</strong> unit tokens generated
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E7E5E0] shadow-xs flex flex-col justify-between min-h-[135px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Avg. Cashback / Scan
                  </span>
                  <div className="text-2xl font-black text-[#1C1917] mt-1 font-mono tracking-tight">
                    ₹ {avgCashback}
                  </div>
                </div>
                <div className="p-2.5 bg-[#FEF2EE] text-[#C84826] rounded-xl">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-100 text-xs text-stone-500 font-medium">
                Direct instant payout to verified partners
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#C84826]/25 shadow-xs flex flex-col justify-between min-h-[135px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#C84826] uppercase tracking-wider">
                    Disbursed Total
                  </span>
                  <div className="text-2xl font-black text-[#A62C11] mt-1 font-mono tracking-tight">
                    ₹ {totalDisbursed.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-2 text-[#C84826]">
                  <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-100 text-xs font-semibold text-emerald-700 flex items-center space-x-1">
                <span>Live Settled Claims</span>
              </div>
            </div>
          </section>

          {/* Search & Category Filter Toolbar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E7E5E0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 w-full">
              <div className="relative w-full sm:w-auto sm:min-w-[220px] flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search product name, SKU code..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
                />
              </div>

              <div className="relative w-full sm:w-auto sm:min-w-[170px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
                >
                  {categoriesList.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="relative min-w-[130px]">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
                >
                  <option value="All">Active Status (All)</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-semibold text-stone-400 shrink-0 self-center">
              Showing <span className="text-[#1C1917] font-bold">{currentItems.length}</span> of{' '}
              <span className="text-[#1C1917] font-bold">{filteredProducts.length}</span> products
            </div>
          </div>

          {/* Product Catalog Data Table */}
          <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-xs overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF2EE] text-[#C84826] flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-[#1C1917]">No Products in Catalog Yet</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  All sample data has been cleared. Click <strong>+ Add New Product</strong> to register your first SKU and sync it simultaneously with Supabase and the Mobile App.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-sm transition cursor-pointer mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Product</span>
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-xs border-collapse">
                    <thead className="bg-[#FAF9F6] border-b border-[#E7E5E0] text-[11px] font-black uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="py-3.5 px-4 w-16 text-center">Unit</th>
                        <th className="py-3.5 px-4 min-w-[220px]">SKU &amp; Product Specification</th>
                        <th className="py-3.5 px-4 min-w-[170px]">Category &amp; Packaging</th>
                        <th className="py-3.5 px-4 min-w-[130px]">Base / MRP</th>
                        <th className="py-3.5 px-4 min-w-[155px]">Cashback / QR</th>
                        <th className="py-3.5 px-4 min-w-[130px]">Active Batches</th>
                        <th className="py-3.5 px-4 text-right min-w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                      {currentItems.map((prod, idx) => {
                        const theme = getCategoryTheme(prod.category);
                        const skuBatches = batches.filter((b) => b.skuCode === prod.skuCode);
                        const skuTokensCount = skuBatches.reduce((sum, b) => sum + Number(b.quantity || (b.tokens || []).length || 0), 0);
                        return (
                          <tr key={prod.id || prod.skuCode || idx} className="hover:bg-[#FAF9F6] transition-colors">
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center">
                                <ProductPackagingVisual
                                  skuCode={prod.skuCode}
                                  category={prod.category}
                                  packWeight={prod.packWeight || prod.packSize}
                                  imageUrl={prod.imageUrl || prod.image || prod.packRender}
                                  className="w-12 h-14"
                                />
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-black text-[#1C1917] bg-stone-100 border border-stone-300 px-2 py-0.5 rounded text-[11px]">
                                  {prod.skuCode}
                                </span>
                                {prod.spec && (
                                  <span className="text-[10px] font-semibold text-stone-600 bg-[#FAF9F6] border border-[#E7E5E0] px-1.5 py-0.5 rounded">
                                    {prod.spec}
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-[#1C1917] text-xs mt-1 leading-snug">
                                {prod.name}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-stone-800 flex items-center space-x-1.5">
                                <span className={`w-2 h-2 rounded-full ${theme.dot}`}></span>
                                <span>{prod.category}</span>
                              </div>
                              <div className="text-[11px] text-stone-400 mt-0.5">
                                {prod.packWeight || prod.packSize}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-black text-[#1C1917] font-mono whitespace-nowrap">
                                ₹ {prod.base || prod.dealerPrice || Math.round((prod.mrp || 0) * 0.75)}{' '}
                                <span className="text-[10px] font-normal text-stone-400 font-sans">/ bag</span>
                              </div>
                              <div className="text-[11px] text-stone-400 font-mono whitespace-nowrap">
                                ₹ {prod.mrp || 0} MRP
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black font-mono bg-[#FEF2EE] text-[#A62C11] border border-[#C84826]/25 whitespace-nowrap shrink-0">
                                ₹ {prod.cashbackReward ?? prod.cashbackAmount ?? 0} / scan
                              </span>
                              <span className="block text-[10px] text-stone-400 mt-0.5 whitespace-nowrap">
                                {prod.rewardNote || 'Tier 1 Mason direct'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-[#1C1917] font-mono whitespace-nowrap">
                                {skuBatches.length} Batches
                              </div>
                              <div className="text-[11px] text-stone-400 font-mono whitespace-nowrap">
                                {skuTokensCount.toLocaleString('en-IN')} tokens
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => handleOpenEdit(prod)}
                                title="Edit SKU parameters"
                                className="p-1.5 text-stone-500 hover:text-[#1C1917] hover:bg-stone-100 rounded-lg transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  try {
                                    localStorage.setItem('duragrit_pending_qr_sku', JSON.stringify(prod));
                                  } catch (_) {}
                                  if (onNavigateQR) onNavigateQR(prod);
                                }}
                                title="Generate QR code batch for this SKU"
                                className="p-1.5 text-[#C84826] hover:text-[#A62C11] hover:bg-[#FEF2EE] rounded-lg transition cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSkuToDelete(prod)}
                                title="Delete SKU"
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

                {/* Pagination Controls */}
                <div className="p-4 bg-[#FAF9F6] border-t border-[#E7E5E0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 font-semibold">
                  <div>
                    Showing <strong className="text-[#1C1917] font-mono">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                    <strong className="text-[#1C1917] font-mono">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> of{' '}
                    <strong className="text-[#1C1917] font-mono">{filteredProducts.length}</strong> products
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="px-2.5 py-1 rounded-lg border border-[#E7E5E0] bg-white hover:bg-stone-100 disabled:opacity-40 transition cursor-pointer"
                    >
                      &lt; Previous
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                          currentPage === i + 1
                            ? 'bg-[#C84826] text-white shadow-xs'
                            : 'bg-white border border-[#E7E5E0] text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className="px-2.5 py-1 rounded-lg border border-[#E7E5E0] bg-white hover:bg-stone-100 disabled:opacity-40 transition cursor-pointer"
                    >
                      Next &gt;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* VIEW B: ADD / EDIT PRODUCT SKU (STEP 03 / 14) */}
      {(viewMode === 'add' || viewMode === 'edit') && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E5E0]">
            <div>
              <div className="flex items-center space-x-2 text-xs text-stone-400 font-medium">
                <span>DuraGrit ERP</span>
                <span>/</span>
                <span>Product Catalog</span>
                <span>/</span>
                <span className="text-[#C84826] font-bold">
                  {viewMode === 'add' ? 'Add New SKU' : 'Edit SKU Parameters'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#1C1917] tracking-tight mt-1">
                {viewMode === 'add' ? 'Add New Product SKU' : `Edit ${formData.skuCode} Specification`}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure basic item info, SKU code, category, MRP, and cashback per QR scan.
              </p>
            </div>

            <button
              onClick={() => setViewMode('list')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white border border-[#E7E5E0] hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Product List</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <form onSubmit={handleSaveProduct} className="bg-white rounded-2xl border border-[#E7E5E0] shadow-xs p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h2 className="text-sm font-black text-[#1C1917] uppercase tracking-wide">
                      Product Information &amp; Specifications
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Enter statutory SKU parameters, packaging weights, and QR reward disbursement values.
                    </p>
                  </div>
                  <span className="text-[10px] bg-[#FEF2EE] text-[#A62C11] px-2 py-0.5 rounded font-mono font-bold">
                    SUPABASE SYNC
                  </span>
                </div>

                {/* Row 1: Product Name & SKU Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Product Name <span className="text-[#C84826]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. DTA 999 Premium Tile Adhesive"
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-700">
                        SKU Code <span className="text-[#C84826]">*</span>
                      </label>
                      <span className="text-[10px] text-[#A62C11] font-mono font-bold">
                        e.g. DTA-999
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.skuCode}
                      onChange={(e) => setFormData({ ...formData, skuCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. DTA-999"
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Row 2: Category & Size/Pack Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Product Category <span className="text-[#C84826]">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
                    >
                      <option value="High-Polymer Adhesive">High-Polymer Adhesive</option>
                      <option value="Standard Vitrified Adhesive">Standard Vitrified Adhesive</option>
                      <option value="Ceramic Tile Adhesive">Ceramic Tile Adhesive</option>
                      <option value="Masonry & Screed">Masonry &amp; Screed</option>
                      <option value="Epoxy Reactive Grout">Epoxy Reactive Grout</option>
                      <option value="Polymer Modified Grout">Polymer Modified Grout</option>
                      <option value="Liquid Bonding Agent">Liquid Bonding Agent</option>
                      <option value="Waterproofing Slurry">Waterproofing Slurry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Size / Pack Weight <span className="text-[#C84826]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.packWeight}
                      onChange={(e) => setFormData({ ...formData, packWeight: e.target.value })}
                      placeholder="e.g. 20 kg Kraft Bag"
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Row 3: Base Price, MRP & Cashback Reward */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Dealer Base Price (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.base}
                      onChange={(e) => setFormData({ ...formData, base: e.target.value })}
                      placeholder="e.g. 550"
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Retail MRP (₹) <span className="text-[#C84826]">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                      placeholder="e.g. 750"
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Cashback Reward / QR (₹) <span className="text-[#C84826]">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.cashbackReward}
                      onChange={(e) => setFormData({ ...formData, cashbackReward: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Row 4: Description */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Detailed Description &amp; Technical Application
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter application guidelines, surface preparation, mixing ratio..."
                    className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-[#1C1917] font-medium focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
                  />
                </div>

                {/* Product Packaging Image Upload with Browse & Drag-Drop */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Product Packaging Visual / Image
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processImageFile(file);
                      e.target.value = '';
                    }}
                  />

                  {formData.imageUrl ? (
                    <div className="border border-stone-200 bg-[#FAF9F6] rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                          <img
                            src={formData.imageUrl}
                            alt="Product Packaging Render"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{formData.imageFileName || 'Custom Packaging Render Loaded'}</span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5 font-mono">
                            Packaging visual linked to SKU: {formData.skuCode || 'Pending Code'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, imageUrl: '', imageFileName: '' }));
                            showToast('Packaging image removed.');
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer ${
                        isDragging
                          ? 'border-[#C84826] bg-[#FEF2EE] ring-2 ring-[#C84826]/30'
                          : 'border-[#E7E5E0] hover:border-[#C84826] bg-[#FAF9F6] hover:bg-[#FAF9F6]/80'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FEF2EE] flex items-center justify-center mx-auto text-[#C84826] mb-2 shadow-2xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-stone-700">
                        Drag &amp; drop product packaging render here, or{' '}
                        <span className="text-[#C84826] font-bold underline hover:text-[#A62C11]">
                          browse
                        </span>
                      </p>
                      <p className="text-[10px] text-stone-400 mt-1 font-mono">
                        Supports high-res PNG, JPEG, JPG, WEBP up to 5MB
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">DuraGrit Live Supabase Sync Active</span>
                    <span className="text-[11px] text-emerald-700 block mt-0.5">
                      Saving this SKU immediately publishes it to Supabase and makes it selectable in QR Batch Generator &amp; Mobile App verification.
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-stone-500 hover:text-stone-800 font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear form</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="px-4 py-2 border border-[#E7E5E0] hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      {viewMode === 'edit' ? 'Update SKU Only' : 'Save Product Only'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAndGenerateQR}
                      className="flex items-center space-x-1.5 px-5 py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-black rounded-xl shadow-md shadow-[#C84826]/20 transition cursor-pointer active:scale-98"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Save Product &amp; Generate QR Rules</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Live Pack Asset Preview & QR Security Governance Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-xs p-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <span className="text-xs font-black text-[#1C1917] uppercase tracking-wider">
                    Pack Asset Preview
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full font-mono">
                    Ready for Sync
                  </span>
                </div>

                <div className="mt-4 bg-[#1C1917] rounded-2xl p-5 text-white shadow-inner relative overflow-hidden flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-[#F59B7F] border-b border-white/10 pb-2 mb-3">
                    <span className="font-bold">DURAGRIT VITRIFIED</span>
                    <span>{formData.packWeight || '20 kg'}</span>
                  </div>

                  <div className="flex items-center justify-center my-2 p-2 bg-stone-800/80 rounded-xl border border-white/10 shadow-lg">
                    <ProductPackagingVisual
                      skuCode={formData.skuCode || 'NEW-SKU'}
                      category={formData.category}
                      packWeight={formData.packWeight}
                      imageUrl={formData.imageUrl}
                      className="w-24 h-28"
                    />
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-2 font-bold">
                    PREVIEW: {formData.skuCode || 'SKU-CODE'}
                  </span>

                  <div className="w-full mt-3 pt-3 border-t border-white/10 text-left space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Assigned Series:</span>
                      <span className="text-white font-bold">{formData.category.slice(0, 20)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Retail MRP:</span>
                      <span className="text-white font-semibold font-mono">₹ {formData.mrp || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Cashback Reward:</span>
                      <span className="text-[#F59B7F] font-bold font-mono">₹ {formData.cashbackReward || 0} / scan</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Security Governance Card (Step 03 Blueprint Specification) */}
              <div className="bg-white rounded-2xl border border-[#E7E5E0] shadow-xs p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#C84826]" />
                    <span className="text-xs font-black text-[#1C1917] uppercase tracking-wider">
                      QR Security Governance
                    </span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-black px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{THERMAL_PRINTER_SPEC.port} ({THERMAL_PRINTER_SPEC.status})</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E7E5E0] flex items-start space-x-2.5">
                    <Printer className="w-4 h-4 text-[#C84826] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1C1917] block">
                        Thermal Foil Print Spec ({THERMAL_PRINTER_SPEC.mediaSpec})
                      </span>
                      <span className="text-[11px] text-stone-500 block mt-0.5 font-mono">
                        40×40mm Die-Cut Roll • {THERMAL_PRINTER_SPEC.dpi} DPI (12 dots/mm) • 472×472px
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Token Signature</span>
                      <span className="font-mono font-bold text-stone-800">128-bit SHA-256</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[10px] text-stone-400 font-bold uppercase block">Print Queue Port</span>
                      <span className="font-mono font-bold text-emerald-700">PRN-PORT-08</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#FEF2EE] rounded-2xl border border-[#C84826]/25 p-4 text-xs text-[#681B0A] space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-[#A62C11]">
                  <AlertCircle className="w-4 h-4 text-[#C84826] shrink-0" />
                  <span>Direct Print Queue Handshake</span>
                </div>
                <p className="text-[11px] leading-relaxed font-medium">
                  Clicking <strong>Save Product &amp; Generate QR Rules</strong> persists this SKU and forwards its payload directly into the Step 04 QR Batch Generator print queue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DELETE PRODUCT CONFIRMATION MODAL ("Are you sure?" Alert Pop-up)     */}
      {/* ===================================================================== */}
      {skuToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden font-sans relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Danger Gradient Stripe */}
            <div className="h-2 w-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-500"></div>

            <div className="p-6 space-y-4">
              {/* Header with Danger Warning Icon */}
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-stone-900 font-serif leading-snug">
                      Delete Product SKU?
                    </h3>
                    <button
                      onClick={handleCancelDelete}
                      className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                      title="Cancel & Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Are you sure you want to delete this product from the catalog?
                  </p>
                </div>
              </div>

              {/* Product SKU Details Card Preview */}
              <div className="bg-[#FAF9F6] rounded-2xl p-3.5 border border-[#ECEAE6] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">SKU Code</span>
                  <span className="font-mono font-black text-xs text-[#8B0000] bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    {skuToDelete.skuCode}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Product Name</span>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm block leading-tight mt-0.5">
                    {skuToDelete.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200/70 text-[11px]">
                  <div>
                    <span className="text-stone-400 text-[10px] block font-medium">Category:</span>
                    <span className="font-semibold text-stone-700 truncate block">{skuToDelete.category || 'Adhesive'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block font-medium">Pack Weight:</span>
                    <span className="font-semibold text-stone-700">{skuToDelete.packWeight || '20 kg'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block font-medium">Retail MRP:</span>
                    <span className="font-mono font-bold text-stone-900">₹ {skuToDelete.mrp || 0}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block font-medium">QR Cashback:</span>
                    <span className="font-mono font-bold text-emerald-700">₹ {skuToDelete.cashbackReward || 0} / scan</span>
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="flex items-start space-x-2 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This will remove the product SKU permanently from the Catalog Master and Supabase database.
                </span>
              </div>

              {/* Action Buttons: Yes, Delete vs No, Cancel */}
              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Product'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
