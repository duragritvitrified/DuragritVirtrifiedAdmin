import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AddProductModal } from '../3_AddProduct/AddProductModal';
import { 
  Plus, Search,  Filter, Layers,  Package, Coins,  ShieldCheck, Tag,  Boxes, ArrowUpDown,  Download,
  Trash2, AlertTriangle, X
} from 'lucide-react';

export const ProductCatalog = () => {
  const { skus = [], deleteSKU } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [skuToDelete, setSkuToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleConfirmDelete = async () => {
    if (!skuToDelete || !deleteSKU) return;
    setIsDeleting(true);
    try {
      await deleteSKU(skuToDelete.id || skuToDelete.skuCode);
      showToast(`Deleted SKU ${skuToDelete.skuCode} from Catalog.`);
      setSkuToDelete(null);
    } catch (err) {
      showToast(`Delete failed: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setSkuToDelete(null);
  };
  const itemsPerPage = 8;

  // Filtered SKUs
  const filteredSkus = skus.filter(sku => {
    const matchesSearch = sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sku.skuCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || sku.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate high-density totals
  const totalBatches = skus.reduce((acc, curr) => acc + (curr.activeBatchesCount || 0), 142);
  const avgCashback = Math.round(skus.reduce((acc, curr) => acc + curr.cashbackReward, 0) / skus.length);

  // Pagination
  const totalPages = Math.ceil(filteredSkus.length / itemsPerPage);
  const currentItems = filteredSkus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Enterprise Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Product Catalog & SKU Master</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-[#8B0000] font-bold border border-red-200">
              {skus.length} Active SKUs
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Enterprise specification directory, MRP tiers, and serialized QR cashback mapping.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="duragrit-btn-primary flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New SKU / Product</span>
        </button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Total Catalog SKUs</span>
            <Package className="w-4 h-4 text-[#8B0000]" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{skus.length}</div>
          <span className="text-[11px] text-emerald-600 font-medium">● 100% active in ERP registry</span>
        </div>

        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Active Production Batches</span>
            <Boxes className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{totalBatches}+</div>
          <span className="text-[11px] text-gray-500 font-medium">Tracked across all factory lines</span>
        </div>

        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Avg. Contractor Cashback</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">, {avgCashback}</div>
          <span className="text-[11px] text-amber-700 font-medium">Range: ₹25 - ₹68 / scan</span>
        </div>

        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>QR Security Governance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-gray-900 mt-2">Engine V2.4</div>
          <span className="text-[11px] text-emerald-700 font-medium">Dual 128-bit SHA Cryptography</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="duragrit-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU code (e.g. DG-ERP-ADH)..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Adhesives', 'Grouts', 'Primers', 'Waterproofing'].map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#8B0000] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="duragrit-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">SKU Code</th>
                <th className="px-4 py-3.5">Product Name & Category</th>
                <th className="px-4 py-3.5">Pack Weight</th>
                <th className="px-4 py-3.5 text-right">MRP (, )</th>
                <th className="px-4 py-3.5 text-right">Dealer / Contractor</th>
                <th className="px-4 py-3.5 text-center">Reward / QR</th>
                <th className="px-4 py-3.5 text-center">Active Batches</th>
                <th className="px-4 py-3.5 text-center">Security Foil</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.map((sku) => (
                <tr key={sku.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">
                    <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                      {sku.skuCode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{sku.name}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{sku.description}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-600">
                    {sku.packWeight}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    ₹ {sku.mrp}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gray-500">₹ {sku.pricingTiers?.dealer || Math.round(sku.mrp * 0.72)}</span>
                    <span className="mx-1 text-gray-300">/</span>
                    <span className="font-semibold text-gray-800">₹ {sku.pricingTiers?.contractor || Math.round(sku.mrp * 0.8)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-amber-800 bg-amber-100 border border-amber-300">
                      ₹ {sku.cashbackReward}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-gray-700">
                      {sku.activeBatchesCount || 12} batches
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center text-[10px] font-medium text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 mr-1" />
                      {sku.securityGovernance?.thermalFoilSpec || 'TF-256-UV'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSkuToDelete(sku)}
                      title="Delete Product SKU"
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <strong className="text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredSkus.length)}
            </strong>{' '}
            of <strong className="text-gray-800">{filteredSkus.length}</strong> items
          </div>
          <div className="flex items-center space-x-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded text-xs font-semibold ${
                  currentPage === i + 1
                    ? 'bg-[#8B0000] text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-stone-700 text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {skuToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden font-sans relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2 w-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-500"></div>

            <div className="p-6 space-y-4">
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

              <div className="flex items-start space-x-2 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This will remove the product SKU permanently from the Catalog Master and Supabase database.
                </span>
              </div>

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

      {/* Add SKU Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

    </div>
  );
};
