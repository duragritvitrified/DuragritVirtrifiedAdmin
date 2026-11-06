import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { RegisterUserModal } from '../6_RegisterUser/RegisterUserModal';
import { Badge } from '../../components/Badge';
import { 
  Users, UserPlus,  Search, Filter,  Phone, MapPin,  Award, CheckCircle,  Clock, Eye,  Edit3, Coins
} from 'lucide-react';

export const UserDirectory = () => {
  const { users } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedKyc, setSelectedKyc] = useState('All');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullLegalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.mobileLoginId.includes(searchTerm);
    const matchesRole = selectedRole === 'All' || user.role === selectedRole;
    const matchesKyc = selectedKyc === 'All' || user.kycStatus === selectedKyc;
    return matchesSearch && matchesRole && matchesKyc;
  });

  const totalUsersDisplay = 1428 + users.length - 6; // strictly reflect 1,428+ contractors/dealers
  const totalVerified = Math.round(totalUsersDisplay * 0.88);
  const totalEscrowPool = 248500;

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span>User Management Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
              {totalUsersDisplay}+ Registered Users
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Contractors, authorized tile dealers, and certified masons under DuraGrit Retail program.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="duragrit-btn-primary flex items-center space-x-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New User</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Total Enrolled Users</span>
            <Users className="w-4 h-4 text-[#8B0000]" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{totalUsersDisplay}</div>
          <span className="text-[11px] text-emerald-600 font-medium">● Network growing across 12 states</span>
        </div>

        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>KYC Verified Applicators</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{totalVerified}</div>
          <span className="text-[11px] text-gray-500 font-medium">88% Aadhaar/UPI Verified</span>
        </div>

        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Active Escrow Rewards Pool</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">, {totalEscrowPool.toLocaleString()}</div>
          <span className="text-[11px] text-amber-700 font-medium">Available for instant UPI disbursement</span>
        </div>

        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Top Tier Applicators</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">412</div>
          <span className="text-[11px] text-amber-600 font-semibold">Gold Applicator Tier 2</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="duragrit-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by legal name or 10-digit mobile..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B0000] outline-none font-medium"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedRole}
            onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none font-medium"
          >
            <option value="All">All Roles (1,428+)</option>
            <option value="Contractor">Contractors</option>
            <option value="Dealer">Dealers</option>
            <option value="Mason">Masons</option>
          </select>

          <select
            value={selectedKyc}
            onChange={(e) => { setSelectedKyc(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none font-medium"
          >
            <option value="All">All KYC Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="duragrit-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">Full Legal Name</th>
                <th className="px-4 py-3.5">Mobile Login ID</th>
                <th className="px-4 py-3.5">Role Classification</th>
                <th className="px-4 py-3.5">Tier Status</th>
                <th className="px-4 py-3.5">State & Address</th>
                <th className="px-4 py-3.5 text-center">KYC Status</th>
                <th className="px-4 py-3.5 text-right">Earned / Escrow</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{u.fullLegalName}</div>
                    <div className="text-[10px] text-gray-400">Enrolled: {u.registeredDate || '2025-10-14'}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-800">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{u.mobileLoginId}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-gray-100 text-gray-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center text-[11px] font-semibold text-amber-800">
                      <Award className="w-3 h-3 text-amber-500 mr-1" />
                      {u.tierLevel || 'Tier 1'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-gray-700 text-xs">
                      <MapPin className="w-3 h-3 text-gray-400 mr-1 shrink-0" />
                      <span className="font-semibold">{u.state}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate max-w-xs">{u.streetAddress}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge status={u.kycStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-bold text-emerald-700">, {u.rewardBalance?.toLocaleString() || 0}</div>
                    <div className="text-[10px] text-amber-600 font-medium">Escrow: , {u.escrowBalance || 0}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => setViewingUser(u)}
                        className="p-1 rounded text-gray-500 hover:text-[#8B0000] hover:bg-red-50 transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => alert(`Editing profile for ${u.fullLegalName}`)}
                        className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        title="Edit User"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <strong className="text-gray-800">{filteredUsers.length}</strong> active profiles
          </div>
          <div className="text-[11px] text-gray-400">
            Total active DB counter: <strong>{totalUsersDisplay}</strong> registered contractors & dealers
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">User Profile Dossier</h3>
              <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Full Legal Name:</span>
                <span className="font-bold text-gray-900">{viewingUser.fullLegalName}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Mobile Login ID:</span>
                <span className="font-mono font-bold text-gray-900">{viewingUser.mobileLoginId}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Role:</span>
                <span className="font-semibold text-gray-900">{viewingUser.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Applicator Tier:</span>
                <span className="font-bold text-amber-800">{viewingUser.tierLevel}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">KYC Status:</span>
                <Badge status={viewingUser.kycStatus} />
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Address:</span>
                <span className="text-gray-700 text-right">{viewingUser.streetAddress}, {viewingUser.state}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Lifetime QR Scans:</span>
                <span className="font-bold text-gray-900">{viewingUser.scansCount || 0} scans</span>
              </div>
            </div>
            <button
              onClick={() => setViewingUser(null)}
              className="w-full duragrit-btn-primary mt-4 text-xs"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      {/* Register User Modal */}
      <RegisterUserModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

    </div>
  );
};
