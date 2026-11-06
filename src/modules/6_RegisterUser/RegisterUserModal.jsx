import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { useData } from '../../context/DataContext';
import { UserPlus, Check } from 'lucide-react';

export const RegisterUserModal = ({ isOpen, onClose }) => {
  const { registerUser } = useData();

  const [formData, setFormData] = useState({
    fullLegalName: '', mobileLoginId: '', role: 'Contractor', streetAddress: '', state: 'Maharashtra', accountStatus: 'Active'
  });

  const [notification, setNotification] = useState('');

  const indianStates = [
    'Maharashtra', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Delhi NCR', 'Karnataka', 'Tamil Nadu', 'Punjab', 'Madhya Pradesh', 'West Bengal', 'Haryana', 'Kerala'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullLegalName || !formData.mobileLoginId) return;

    registerUser(formData);
    setNotification('User profile registered and onboarded into DuraGrit Network!');
    setTimeout(() => {
      setNotification('');
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New User / Applicator"
      subtitle="Onboard contractors, dealers,  and masons with direct KYC attribution"
      maxWidth="max-w-xl"
    >
      {notification && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Full Legal Name (as per Aadhaar/PAN) *
          </label>
          <input
            type="text"
            required
            value={formData.fullLegalName}
            onChange={(e) => setFormData({ ...formData, fullLegalName: e.target.value })}
            placeholder="e.g. Rameshwar Prasad Sharma"
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mobile Login ID (10-Digit) *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={formData.mobileLoginId}
              onChange={(e) => setFormData({ ...formData, mobileLoginId: e.target.value })}
              placeholder="e.g. 9820144521"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              User Role Classification *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
            >
              <option value="Contractor">Contractor (Gold Applicator)</option>
              <option value="Dealer">Dealer (Authorized Partner)</option>
              <option value="Mason">Mason (Individual Tier 1)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Street Address / Workshop Location *
          </label>
          <textarea
            rows="2"
            required
            value={formData.streetAddress}
            onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
            placeholder="Shop / Site address with landmark..."
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              State / Region *
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
            >
              {indianStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Account Status *
            </label>
            <select
              value={formData.accountStatus}
              onChange={(e) => setFormData({ ...formData, accountStatus: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none"
            >
              <option value="Active">Active (Instant Scan Enabled)</option>
              <option value="Suspended">Suspended (Under Review)</option>
            </select>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end space-x-3">
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
            <UserPlus className="w-4 h-4" />
            <span>Complete Registration</span>
          </button>
        </div>

      </form>
    </Modal>
  );
};
