import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { useData } from '../../context/DataContext';
import { Layers, ShieldCheck,  QrCode, Sparkles,  Check, AlertCircle } from 'lucide-react';

export const AddProductModal = ({ isOpen, onClose }) => {
  const { addSKU } = useData();

  const [formData, setFormData] = useState({
    name: '', skuCode: 'DG-ERP-ADH-029', category: 'Adhesives', packWeight: '20 Kg Bag', description: '', mrp: 750, cashbackReward: 50, initialBatchQuantity: 1000, securityGovernance: {
      singleUseDualStage: true, geoFencing: true, thermalFoilSpec: 'TF-256-UV Foil'
    }
  });

  const [notification, setNotification] = useState('');

  const handleCategoryChange = (cat) => {
    const prefix = cat === 'Adhesives' ? 'ADH' : cat === 'Grouts' ? 'GRT' : cat === 'Primers' ? 'PRM' : 'WPF';
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData(prev => ({
      ...prev, category: cat, skuCode: `DG-ERP-${prefix}-${randomNum}`
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.skuCode) return;

    addSKU(formData);
    setNotification('SKU successfully created with Initial QR Batch serialization!');
    setTimeout(() => {
      setNotification('');
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New SKU / Product Line"
      subtitle="Configure enterprise specifications, packaging sizes, and QR security governance"
      maxWidth="max-w-2xl"
    >
      {notification && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Row 1: Name & SKU Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Product Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. DuraGrit MaxFlex White Adhesive"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              SKU Code (ERP Format) *
            </label>
            <input
              type="text"
              required
              value={formData.skuCode}
              onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none font-mono"
            />
          </div>
        </div>

        {/* Row 2: Category & Pack Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Category Classification *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
            >
              <option value="Adhesives">Adhesives (Polymer / Ready-Mix)</option>
              <option value="Grouts">Grouts (Epoxy / Cementitious)</option>
              <option value="Primers">Primers (SBR / Acrylic)</option>
              <option value="Waterproofing">Waterproofing (2K Elastomeric)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Size / Packaging Weight *
            </label>
            <input
              type="text"
              required
              value={formData.packWeight}
              onChange={(e) => setFormData({ ...formData, packWeight: e.target.value })}
              placeholder="e.g. 20 Kg Bag, 5 Ltr Can"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Detailed Description & Technical Specs
          </label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="High tensile polymer modified adhesive suitable for vitreous floor and wall tiles..."
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
          ></textarea>
        </div>

        {/* Row 3: MRP, Cashback,  Initial Batch */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200">
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1">
              MRP (, ) *
            </label>
            <input
              type="number"
              required
              min="50"
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1">
              Cashback Reward / QR (₹25-₹68) *
            </label>
            <input
              type="number"
              required
              min="25"
              max="150"
              value={formData.cashbackReward}
              onChange={(e) => setFormData({ ...formData, cashbackReward: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1">
              Initial QR Batch (Qty)
            </label>
            <input
              type="number"
              value={formData.initialBatchQuantity}
              onChange={(e) => setFormData({ ...formData, initialBatchQuantity: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-medium"
            />
          </div>
        </div>

        {/* QR Security Governance Section */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>QR Security Governance Specs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.securityGovernance.singleUseDualStage}
                onChange={(e) => setFormData({
                  ...formData, securityGovernance: { ...formData.securityGovernance, singleUseDualStage: e.target.checked }
                })}
                className="rounded text-[#8B0000] focus:ring-[#8B0000]"
              />
              <span className="text-gray-700 font-medium">Single-Use Dual Stage Verification</span>
            </label>

            <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.securityGovernance.geoFencing}
                onChange={(e) => setFormData({
                  ...formData, securityGovernance: { ...formData.securityGovernance, geoFencing: e.target.checked }
                })}
                className="rounded text-[#8B0000] focus:ring-[#8B0000]"
              />
              <span className="text-gray-700 font-medium">Geo-Fencing Radius Guard (50km)</span>
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Thermal Foil Print Specification
            </label>
            <select
              value={formData.securityGovernance.thermalFoilSpec}
              onChange={(e) => setFormData({
                ...formData, securityGovernance: { ...formData.securityGovernance, thermalFoilSpec: e.target.value }
              })}
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none"
            >
              <option value="TF-256-UV Foil">TF-256-UV Foil (Ultra-Violent Reactive Security Foil)</option>
              <option value="TF-128-Holo">TF-128-Holo (Prismatic 3D Holographic Film)</option>
              <option value="TF-512-Crypto">TF-512-Crypto (Micro-Perforated Tamper Evident Void Strip)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="duragrit-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="duragrit-btn-primary flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Register SKU & Serialize Batch</span>
          </button>
        </div>

      </form>
    </Modal>
  );
};
