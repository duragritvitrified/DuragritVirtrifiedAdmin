import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  sendVerificationEmail,
  sendOnboardingEmail,
  getAutoEmailSetting,
} from '../../services/emailService';
import {
  Lock,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Edit2,
  ShieldCheck,
  UserCheck,
  Building2,
  Plus,
  Trash2,
  Search,
  Users,
  Shield,
  Briefcase,
  Mail,
  Phone,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const INTERNAL_ROLES = [
  'Super Admin',
  'Admin',
  'Operations Manager',
  'Field Officer',
  'Dispatch Manager',
  'Auditor / Accounts',
  'Support Executive',
];

const DEPARTMENTS = [
  'Executive Headquarters',
  'Morbi Production Plant',
  'Ahmedabad Regional Office',
  'North Logistics Hub',
  'Quality & Dispatch Desk',
  'Finance & Auditing',
];

export function UserManagement() {
  const {
    users = [],
    registerUser,
    updateUser,
    toggleUserActive,
    deleteUser,
    dbStatus,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [autoEmailOnAdd, setAutoEmailOnAdd] = useState(getAutoEmailSetting());

  // Filter only internal staff/users (or users that are not external vendors/contractors if distinguished)
  const internalUsersList = useMemo(() => {
    return (users || [])
      .filter((u) => {
        // Treat as internal if explicitly internal or has an internal role or role is not Vendor
        return (
          u.isInternal ||
          ['Admin', 'Super Admin', 'Staff', 'Operations', 'Operations Manager', 'Field Officer', 'Dispatch Manager', 'Auditor / Accounts', 'Support Executive'].includes(u.role) ||
          !u.category // default fallback
        );
      })
      .map((u) => {
        const cleanId = String(u.id || u.userId || '').replace(/^USR-/i, '');
        const pass = u.passkey || u.tempPassword || u.password || `Dura#${cleanId || '1001'}`;
        const isAct = u.active !== false && u.isActive !== false && u.accountStatus !== 'Suspended' && u.status !== 'Inactive';

        return {
          ...u,
          id: cleanId,
          userId: `USR-${cleanId}`,
          tempPassword: pass,
          passkey: pass,
          name: u.name || u.fullLegalName || 'Internal Staff',
          email: u.email || '',
          mobile: u.mobile || u.phone || '',
          role: u.role || 'Staff',
          department: u.department || u.location || 'Executive Headquarters',
          isActive: isAct,
          status: isAct ? 'Active' : 'Suspended',
          createdAt: u.createdAt || u.registeredDate || new Date().toISOString(),
        };
      });
  }, [users]);

  // Next unique numeric ID starting cleanly at USR-1001
  const nextGeneratedNumericId = useMemo(() => {
    if (internalUsersList.length === 0) return 1001;
    const maxNum = internalUsersList.reduce((max, u) => {
      const num = parseInt(u.id, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 1000);
    return maxNum + 1;
  }, [internalUsersList]);
  const nextGeneratedId = `USR-${nextGeneratedNumericId}`;

  const emptyAddForm = () => ({
    name: '',
    mobile: '',
    email: '',
    role: 'Operations Manager',
    department: 'Morbi Production Plant',
    status: 'Active',
    password: `Dura#${Math.floor(1000 + Math.random() * 9000)}`,
  });

  const [formData, setFormData] = useState(emptyAddForm);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    mobile: '',
    email: '',
    role: 'Staff',
    department: 'Executive Headquarters',
    status: 'Active',
    tempPassword: '',
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3800);
  };

  const handleCopy = (text, fieldKey) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedField(''), 2200);
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswordMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleRegenerateAddPassword = () => {
    const newPass = `Dura#${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData((prev) => ({ ...prev, password: newPass }));
    showToast(`Generated new passkey: ${newPass}`);
  };

  const handleRegenerateEditPassword = () => {
    const newPass = `Dura#${Math.floor(1000 + Math.random() * 9000)}`;
    setEditFormData((prev) => ({ ...prev, tempPassword: newPass }));
    showToast(`Generated new passkey: ${newPass}`);
  };

  const handleToggleActive = async (user) => {
    const wasActive = user.isActive !== false;
    await toggleUserActive(user.id);
    showToast(
      !wasActive
        ? `✓ ${user.name} (USR-${user.id}) reactivated.`
        : `✕ ${user.name} (USR-${user.id}) suspended.`
    );
  };

  const handleOpenEdit = (user) => {
    setEditFormData({
      id: user.id,
      name: user.name || '',
      mobile: user.mobile || '',
      email: user.email || '',
      role: user.role || 'Operations Manager',
      department: user.department || 'Executive Headquarters',
      status: user.isActive ? 'Active' : 'Suspended',
      tempPassword: user.tempPassword || `Dura#${user.id}`,
    });
    setEditUserOpen(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      showToast('Please enter full legal name.');
      return;
    }
    const cleanDigits = String(editFormData.mobile || '').replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.');
      return;
    }

    await updateUser(editFormData.id, {
      name: editFormData.name.trim(),
      mobile: cleanDigits,
      email: editFormData.email.trim(),
      role: editFormData.role,
      department: editFormData.department,
      status: editFormData.status,
      active: editFormData.status === 'Active',
      isActive: editFormData.status === 'Active',
      tempPassword: editFormData.tempPassword,
      passkey: editFormData.tempPassword,
      isInternal: true,
    });

    showToast(`✓ Updated credentials for ${editFormData.name}`);
    setEditUserOpen(false);
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete internal user ${user.name} (USR-${user.id})?`)) {
      return;
    }
    await deleteUser(user.id);
    showToast(`Deleted internal user ${user.name}`);
  };

  const handleSaveNewUser = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Please enter the full legal name.');
      return;
    }
    const cleanDigits = String(formData.mobile || '').replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.');
      return;
    }

    const generatedPassword = formData.password || `Dura#${cleanDigits.slice(-4) || '2026'}`;

    const created = await registerUser({
      name: formData.name.trim(),
      mobile: cleanDigits,
      email: formData.email.trim(),
      role: formData.role,
      department: formData.department,
      status: formData.status || 'Active',
      active: formData.status !== 'Suspended',
      isActive: formData.status !== 'Suspended',
      tempPassword: generatedPassword,
      passkey: generatedPassword,
      isInternal: true,
      emailVerified: 'Pending',
    });

    if (autoEmailOnAdd && formData.email) {
      try {
        await sendVerificationEmail({
          userId: `USR-${created.id}`,
          recipientName: created.name,
          recipientEmail: formData.email.trim(),
          mobile: cleanDigits,
        });
        showToast(`Verification link sent to ${formData.email.trim()}. Credentials will auto-dispatch upon verification.`);
      } catch (err) {
        console.error('Email dispatch error:', err);
      }
    }

    showToast(`✓ Internal User ${created.name} (ID: USR-${created.id}) created successfully.`);
    setFormData(emptyAddForm());
    setAddUserOpen(false);
  };

  // Filtered internal users
  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return internalUsersList.filter((user) => {
      const matchesSearch =
        !q ||
        (user.name || '').toLowerCase().includes(q) ||
        (user.email || '').toLowerCase().includes(q) ||
        String(user.mobile || '').includes(q) ||
        (user.role || '').toLowerCase().includes(q) ||
        (user.department || '').toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'suspended' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [internalUsersList, searchTerm, roleFilter, statusFilter]);

  // KPI Calculations
  const totalInternal = internalUsersList.length;
  const activeCount = internalUsersList.filter((u) => u.isActive).length;
  const adminCount = internalUsersList.filter((u) => ['Admin', 'Super Admin'].includes(u.role)).length;
  const suspendedCount = internalUsersList.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-6 pb-12 font-sans select-none text-slate-800">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#C84826] text-white px-4 py-2.5 rounded-xl shadow-xl border border-stone-200/40 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Breadcrumb & Live Sync Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div>
          <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-1">
            DuraGrit ERP / Access Control / Internal User Management
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <span>Internal User &amp; Staff Directory</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-mono">
              ROLE BASED ACCESS
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage DuraGrit enterprise personnel, department designations, and system administration privileges.
          </p>
        </div>

        {/* Database Status Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{dbStatus?.online ? 'Supabase Live Connected' : 'Local Dev Storage'}</span>
          </span>
        </div>
      </div>

      {/* Architecture Notice Banner */}
      <div className="bg-[#FEF2EE] border border-[#C84826]/20 rounded-xl p-3.5 flex items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#C84826] shrink-0" />
          <span className="text-[#A62C11] font-medium">
            <strong>Internal Team Directory:</strong> Only internal administrative and operational personnel are listed here. External trade partners (Contractors, Tile Applicators, Retailers, Dealers &amp; Distributors) with bank settlement &amp; KYC details are managed under <strong>5. Vendor Manage</strong>.
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Internal Staff</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{totalInternal}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">Assigned to system operations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Active Accounts</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Authenticated &amp; login enabled</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Admin &amp; Managers</div>
          <div className="text-2xl font-black text-[#C84826] mt-1">{adminCount}</div>
          <div className="text-[10px] text-[#C84826]/80 mt-0.5">High privilege personnel</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Suspended</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{suspendedCount}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">Blocked from login access</div>
        </div>
      </div>

      {/* Control Bar: Filters, Search & Register Button */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, mobile, role..."
              className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C84826]"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-stone-50 text-stone-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Roles</option>
            {INTERNAL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-stone-50 text-stone-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setFormData(emptyAddForm());
            setAddUserOpen(true);
          }}
          className="w-full md:w-auto bg-[#C84826] hover:bg-[#A62C11] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>+ Add Internal User</span>
        </button>
      </div>

      {/* Internal Users Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Staff Member &amp; Contact</th>
                <th className="py-3 px-4">Internal Role &amp; Dept</th>
                <th className="py-3 px-4">Portal Passkey</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-stone-500" />
                    <p className="font-semibold text-stone-600">No internal users found</p>
                    <p className="text-[11px] mt-0.5">Click &quot;+ Add Internal User&quot; to register new team members.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isVisible = showPasswordMap[user.id];
                  return (
                    <tr key={user.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* User ID */}
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {user.userId}
                      </td>

                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{user.name}</div>
                        <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>+91 {user.mobile}</span>
                        </div>
                        {user.email && (
                          <div className="text-[10.5px] text-stone-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" />
                            <span>{user.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Role & Dept */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#FEF2EE] text-[#A62C11] border border-[#C84826]/20">
                          <Briefcase className="w-3 h-3" />
                          <span>{user.role}</span>
                        </span>
                        <div className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-stone-400" />
                          <span>{user.department}</span>
                        </div>
                      </td>

                      {/* Passkey */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 font-bold text-stone-800">
                            {isVisible ? user.tempPassword : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 hover:bg-stone-200 rounded text-stone-500 cursor-pointer"
                            title={isVisible ? 'Hide' : 'Show'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(user.tempPassword, `pass-${user.id}`)}
                            className="p-1 hover:bg-stone-200 rounded text-stone-500 cursor-pointer"
                            title="Copy Passkey"
                          >
                            {copiedField === `pass-${user.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold cursor-pointer transition ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          <span>{user.isActive ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-stone-500 text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-stone-500 hover:text-[#C84826] hover:bg-stone-100 rounded-lg transition cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD INTERNAL USER MODAL */}
      {/* ========================================================================= */}
      {addUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F6] border-b border-stone-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-stone-900">Register Internal Staff Member</h3>
                <p className="text-xs text-stone-500">Internal operational role &amp; access credentials</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#FEF2EE] text-[#C84826] px-2 py-0.5 rounded border border-[#C84826]/30">
                {nextGeneratedId}
              </span>
            </div>

            <form onSubmit={handleSaveNewUser} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Full Legal Name <span className="text-[#C84826]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C84826]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Mobile Login ID <span className="text-[#C84826]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mobile: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="10-digit mobile"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C84826] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Work Email Address <span className="text-[#C84826]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@duragrit.com"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C84826]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Internal Designation / Role <span className="text-[#C84826]">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 text-stone-800 cursor-pointer focus:outline-none"
                  >
                    {INTERNAL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Department / Plant <span className="text-[#C84826]">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 text-stone-800 cursor-pointer focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700">
                    Security Passkey / Password <span className="text-[#C84826]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateAddPassword}
                    className="text-[10px] text-[#C84826] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#C84826]"
                  />
                </div>
              </div>

              {/* Send Email Notification Toggle */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <label className="text-stone-600 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoEmailOnAdd}
                    onChange={(e) => setAutoEmailOnAdd(e.target.checked)}
                    className="rounded text-[#C84826] focus:ring-[#C84826]"
                  />
                  <span>Send verification email (Credentials will auto-dispatch upon verification)</span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddUserOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Save Internal User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT INTERNAL USER MODAL */}
      {/* ========================================================================= */}
      {editUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F6] border-b border-stone-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-stone-900">Edit Internal Staff Member</h3>
                <p className="text-xs text-stone-500">Update role privileges and security passkey</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                USR-{editFormData.id}
              </span>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C84826]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mobile Login ID *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editFormData.mobile}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        mobile: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C84826] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C84826]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Internal Role *</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 text-stone-800 cursor-pointer focus:outline-none"
                  >
                    {INTERNAL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Department / Branch *</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 text-stone-800 cursor-pointer focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-700">Security Passkey *</label>
                  <button
                    type="button"
                    onClick={handleRegenerateEditPassword}
                    className="text-[10px] text-[#C84826] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Regenerate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editFormData.tempPassword}
                  onChange={(e) => setEditFormData({ ...editFormData, tempPassword: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#C84826]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Account Access Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 text-stone-800 cursor-pointer focus:outline-none"
                >
                  <option value="Active">Active (Permit Login)</option>
                  <option value="Suspended">Suspended (Block Login)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditUserOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-stone-600 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Update Internal User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
