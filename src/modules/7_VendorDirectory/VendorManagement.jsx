import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import {
  sendVendorVerificationEmail,
  sendVendorOnboardingCredentialsEmail,
} from '../../services/emailService';
import {
  Lock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Edit2,
  ShieldCheck,
  Building2,
  CheckCircle,
  Plus,
  Minus,
  FileText,
  MapPin,
  Phone,
  Trash2,
  Search,
  Truck,
  Package,
  FlaskConical,
  Printer,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  Link,
  X,
  Save,
  RotateCcw,
  Zap,
  IndianRupee,
  Clock,
  Database,
  Store,
  Smartphone,
  Key,
  Award,
  Upload,
  CreditCard,
  QrCode,
  ExternalLink,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const ITEMS_PER_PAGE = 8;

const CATEGORY_CONFIG = {
  Contractor: { color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', icon: Award },
  Distributor: { color: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-600', icon: Building2 },
  Retailer: { color: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-600', icon: Store },
  Dealer: { color: 'bg-cyan-50 text-cyan-800 border-cyan-200', dot: 'bg-cyan-600', icon: ShieldCheck },
  'Raw Material': { color: 'bg-[#FEF2EE] text-[#C84826] border-[#F9CEB8]', dot: 'bg-[#C84826]', icon: FlaskConical },
  Packaging: { color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', icon: Package },
  Printing: { color: 'bg-purple-50 text-purple-800 border-purple-200', dot: 'bg-purple-600', icon: Printer },
  Logistics: { color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500', icon: Truck },
};

const CATEGORIES = [
  'Contractor',
  'Distributor',
  'Retailer',
  'Dealer',
  'Raw Material',
  'Packaging',
  'Printing',
  'Logistics',
];

const EMPTY_FORM = () => ({
  avatarUrl: '',
  profileImage: '',
  companyName: '',
  contactPerson: '',
  phone: '',
  email: '',
  category: 'Contractor',
  materialLine: '',
  status: 'INACTIVE', // Requires Admin Approval & Email Verify
  emailVerified: 'Pending',
  credentialsSent: false,
  tierLevel: 'Tier 2 Gold',
  kycStatus: 'Verified',

  // Address & Territory
  address: '',
  city: '',
  state: 'Gujarat',
  pincode: '',
  location: 'Morbi Central Hub',
  territory: 'Morbi Central Hub',

  // Bank & UPI Settlement
  beneficiaryName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upi: '',
  passbookUrl: '',
  paymentQrUrl: '',

  // KYC & Statutory
  gstin: '',
  pan: '',
  aadhaar: '',
  gstUrl: '',
  panUrl: '',
  aadhaarUrl: '',

  // Commercials
  activePurchaseOrders: '1',
  poValueLakhs: '',
  passkey: `Dura#${Math.floor(1000 + Math.random() * 9000)}`,
  linkedUserId: '',
});

const SECTION_VARIANTS = {
  brand: {
    container: 'bg-gradient-to-r from-[#FEF2EE] via-[#FFF8F5] to-white border-[#F9CEB8] text-[#A62C11] hover:bg-[#FDE5DC]/70',
    iconBox: 'bg-[#A62C11] text-white',
    title: 'text-[#A62C11]',
    subtitle: 'text-[#C84826]/80',
    toggleActive: 'bg-[#A62C11] border-[#A62C11] text-white',
    badge: 'bg-[#A62C11] text-white',
  },
  credentials: {
    container: 'bg-gradient-to-r from-amber-50 via-orange-50/60 to-white border-amber-300 text-amber-950 hover:bg-amber-100/70',
    iconBox: 'bg-amber-600 text-white',
    title: 'text-amber-950',
    subtitle: 'text-amber-800',
    toggleActive: 'bg-amber-600 border-amber-600 text-white',
    badge: 'bg-amber-600 text-white',
  },
  blue: {
    container: 'bg-gradient-to-r from-sky-50 via-blue-50/60 to-white border-sky-200 text-sky-950 hover:bg-sky-100/70',
    iconBox: 'bg-sky-600 text-white',
    title: 'text-sky-950',
    subtitle: 'text-sky-700',
    toggleActive: 'bg-sky-600 border-sky-600 text-white',
    badge: 'bg-sky-600 text-white',
  },
  emerald: {
    container: 'bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border-emerald-200 text-emerald-950 hover:bg-emerald-100/70',
    iconBox: 'bg-emerald-600 text-white',
    title: 'text-emerald-950',
    subtitle: 'text-emerald-700',
    toggleActive: 'bg-emerald-600 border-emerald-600 text-white',
    badge: 'bg-emerald-600 text-white',
  },
  purple: {
    container: 'bg-gradient-to-r from-purple-50 via-indigo-50/60 to-white border-purple-200 text-purple-950 hover:bg-purple-100/70',
    iconBox: 'bg-purple-600 text-white',
    title: 'text-purple-950',
    subtitle: 'text-purple-700',
    toggleActive: 'bg-purple-600 border-purple-600 text-white',
    badge: 'bg-purple-600 text-white',
  },
  slate: {
    container: 'bg-gradient-to-r from-slate-100 via-slate-50 to-white border-slate-300 text-slate-800 hover:bg-slate-200/70',
    iconBox: 'bg-slate-700 text-white',
    title: 'text-slate-800',
    subtitle: 'text-slate-500',
    toggleActive: 'bg-slate-700 border-slate-700 text-white',
    badge: 'bg-slate-700 text-white',
  },
};

function SectionHeader({
  title,
  subtitle,
  sectionKey,
  open,
  onToggle,
  icon: Icon,
  variant = 'brand',
  badge = null,
}) {
  const theme = SECTION_VARIANTS[variant] || SECTION_VARIANTS.brand;
  return (
    <button
      type="button"
      onClick={() => onToggle(sectionKey)}
      className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl border shadow-2xs transition-all cursor-pointer group ${theme.container}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-1.5 rounded-lg shrink-0 ${theme.iconBox}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black uppercase tracking-wide ${theme.title}`}>
              {title}
            </span>
            {badge && (
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${theme.badge}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <div className={`text-[10px] font-medium leading-tight mt-0.5 ${theme.subtitle}`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div
        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
          open ? theme.toggleActive : 'border-slate-300 bg-white text-slate-500 group-hover:border-slate-400'
        }`}
      >
        {open ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
      </div>
    </button>
  );
}

function FieldRow({ label, required, error, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide">
          {label}
          {required && <span className="text-[#C84826] ml-0.5">*</span>}
        </label>
        {required && (
          <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider">
            COMPULSORY
          </span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const getInputCls = (hasError) =>
  `w-full border rounded-lg px-3 py-2 text-xs transition-all bg-white placeholder-slate-400 focus:outline-none ${
    hasError
      ? 'border-2 border-rose-500 bg-rose-50/50 text-rose-950 ring-4 ring-rose-500/20 focus:ring-rose-500/30'
      : 'border-slate-200 text-slate-800 focus:ring-2 focus:ring-[#C84826]/25 focus:border-[#C84826]'
  }`;
const getSelectCls = (hasError) => `${getInputCls(hasError)} cursor-pointer`;
const inputCls = getInputCls(false);
const selectCls = getSelectCls(false);

function KpiCard({ label, value, sub, icon: Icon, accent, isAlert }) {
  return (
    <div
      className={`bg-white border rounded-xl p-4 shadow-xs transition-colors ${
        isAlert ? 'border-[#C84826] border-b-2' : 'border-slate-200/90 hover:border-[#F9CEB8]'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div className={`text-2xl font-black mt-2 font-mono ${isAlert ? 'text-[#C84826]' : 'text-slate-900'}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">{sub}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const isPendingKyc = status === 'Pending KYC';
  const isActive = status === 'ACTIVE' || status === 'Active';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border font-mono ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : isPendingKyc
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? 'bg-emerald-500' : isPendingKyc ? 'bg-amber-500' : 'bg-rose-500'
        }`}
      />
      {status || 'ACTIVE'}
    </span>
  );
}

// =========================================================================
// RELEASE PAYOUT MODAL
// =========================================================================
function ReleasePayoutModal({ vendor, onClose, onConfirm }) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('UPI');
  const [utr, setUtr] = useState(`NPCI-RTGS-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [note, setNote] = useState('Milestone settlement release');
  const [error, setError] = useState('');

  const total = parseFloat(vendor.totalPayoutLakhs ?? vendor.poValueLakhs ?? 0);
  const released = parseFloat(vendor.releasedPayoutLakhs ?? 0);
  const pending = parseFloat(vendor.pendingPayoutLakhs ?? Math.max(0, total - released));

  const amt = parseFloat(amount) || 0;
  const newReleased = released + amt;
  const newPending = Math.max(0, total - newReleased);

  const handleConfirm = () => {
    if (amt <= 0) {
      setError('Please enter an amount greater than 0.');
      return;
    }
    if (pending > 0 && amt > pending) {
      setError(`Amount cannot exceed pending balance (₹ ${pending.toFixed(2)} L).`);
      return;
    }
    onConfirm({ amount: amt, mode, utr, note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FAF9F6]">
          <div>
            <span className="text-[10px] font-mono font-black text-[#C84826] uppercase tracking-wide">
              NPCI Escrow Settlement
            </span>
            <h2 className="text-sm font-black text-slate-800">{vendor.companyName}</h2>
            <p className="text-[10px] text-slate-400 font-mono">ID: {vendor.vendorId} • Bank: {vendor.bankName || 'Direct UPI'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Total Limit</div>
              <div className="text-base font-black text-slate-800 font-mono">₹{total.toFixed(1)}L</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-center">
              <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wide mb-1">Released</div>
              <div className="text-base font-black text-emerald-700 font-mono">₹{released.toFixed(1)}L</div>
            </div>
            <div className="bg-[#FEF2EE] rounded-xl p-3 border border-[#F9CEB8] text-center">
              <div className="text-[9px] font-black text-[#C84826] uppercase tracking-wide mb-1">Pending</div>
              <div className="text-base font-black text-[#A62C11] font-mono">₹{pending.toFixed(1)}L</div>
            </div>
          </div>

          <FieldRow label="Tranche Amount (₹ Lakhs)" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder={pending > 0 ? `Max ₹${pending.toFixed(1)}L` : 'Enter amount in Lakhs'}
                className={`${inputCls} pl-7 font-mono`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">L</span>
            </div>
            {error && (
              <p className="text-rose-600 text-[10px] mt-1 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3 h-3" />
                {error}
              </p>
            )}
          </FieldRow>

          <FieldRow label="Payment Rail / Mode">
            <select value={mode} onChange={(e) => setMode(e.target.value)} className={selectCls}>
              <option value="UPI">UPI — Instant Payout (VPA: {vendor.upi || 'Direct Phone'})</option>
              <option value="RTGS">RTGS — Real Time Gross Settlement</option>
              <option value="NEFT">NEFT — National Electronic Fund Transfer</option>
              <option value="IMPS">IMPS — Immediate Payment Service</option>
            </select>
          </FieldRow>

          <FieldRow label="UTR / Reference ID">
            <input value={utr} onChange={(e) => setUtr(e.target.value)} className={`${inputCls} font-mono`} />
          </FieldRow>

          <FieldRow label="Release Note / Remark">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. PO Milestone Tranche"
              className={inputCls}
            />
          </FieldRow>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-[#C84826] text-white text-xs font-bold hover:bg-[#A62C11] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm Payout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// VIEW DOSSIER MODAL
// =========================================================================
function ViewModal({ vendor, onClose, onEdit, onReleasePayout, onResendVerification }) {
  const [sections, setSections] = useState({
    identity: true,
    credentials: true,
    address: true,
    banking: true,
    kyc: true,
    payout: false,
  });
  const [showPasskey, setShowPasskey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const toggle = (k) => setSections((p) => ({ ...p, [k]: !p[k] }));
  const cat = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG.Contractor;

  const handleCopyCredentials = () => {
    const portalUrl = typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
      ? `${window.location.origin}/app/?app=vendor`
      : 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor';
    const text = `DuraGrit Partner Login Credentials:\nPortal URL: ${portalUrl}\nLogin ID (Mobile): ${vendor.phone || vendor.mobile || vendor.vendorId}\nTemporary Password: ${vendor.passkey || vendor.tempPassword || 'Dura#2026'}\nStatus: ${vendor.status || 'ACTIVE'}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FEF2EE] border border-[#F9CEB8] text-[#C84826] flex items-center justify-center font-bold text-base shadow-xs overflow-hidden shrink-0">
              {vendor.avatarUrl || vendor.profileImage ? (
                <img
                  src={vendor.avatarUrl || vendor.profileImage}
                  alt={vendor.companyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-6 h-6 text-[#C84826]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black text-[#C84826] bg-[#FEF2EE] border border-[#F9CEB8] px-2 py-0.5 rounded">
                  {vendor.vendorId}
                </span>
                <StatusPill status={vendor.status || 'ACTIVE'} />
              </div>
              <h2 className="text-base font-black text-slate-900 mt-0.5">{vendor.companyName}</h2>
              <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border mt-0.5 ${cat.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} /> {vendor.category}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReleasePayout(vendor)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C84826] text-white text-xs font-bold hover:bg-[#A62C11] transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3" /> Payout
            </button>
            <button
              onClick={() => onEdit(vendor)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3">
          {/* 1. Identity & Firm Profile */}
          <SectionHeader
            title="1. Partner Identity & Firm Profile"
            subtitle="Company name, contact person, category & tier"
            sectionKey="identity"
            open={sections.identity}
            onToggle={toggle}
            icon={Building2}
            variant="brand"
            badge="PROFILE"
          />
          {sections.identity && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">PARTNER ID</span>
                  <span className="font-mono font-black text-slate-900 text-xs">{vendor.vendorId}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">TIER CLASSIFICATION</span>
                  <span className="font-bold text-slate-800">{vendor.tierLevel || 'Tier 2 Gold'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">CONTACT PERSON</span>
                  <span className="font-bold text-slate-800">{vendor.contactPerson || vendor.name || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">MOBILE PHONE</span>
                  <span className="font-mono font-bold text-slate-800">{vendor.phone || vendor.mobile || '—'}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">EMAIL ADDRESS</span>
                <span className="text-slate-700">{vendor.email || '—'}</span>
              </div>
            </div>
          )}

          {/* 2. Mobile App Login Credentials & Access Control */}
          <SectionHeader
            title="2. Mobile App Login Credentials & Access Status"
            subtitle="Field scanner login ID, passkey & active/deactive status"
            sectionKey="credentials"
            open={sections.credentials}
            onToggle={toggle}
            icon={Lock}
            variant="credentials"
            badge="APP ACCESS"
          />
          {sections.credentials && (
            <div className="bg-[#FFFDF5] rounded-xl border border-amber-200 p-4 space-y-3 text-xs shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Account Status:</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border ${
                    vendor.status === 'INACTIVE'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${vendor.status === 'INACTIVE' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                    <span>{vendor.status === 'INACTIVE' ? 'DEACTIVATED (Login Blocked)' : 'ACTIVE (Mobile Login Allowed)'}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied Details!' : 'Copy Login Details'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">
                    MOBILE LOGIN ID (FOR MOBILE APP)
                  </span>
                  <div className="font-mono font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>{vendor.phone || vendor.mobile || vendor.vendorId}</span>
                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">MOBILE ID</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block">
                      SECURITY PASSKEY / PASSWORD
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasskey(!showPasskey)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPasskey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="font-mono font-black text-[#A62C11] text-xs">
                    {showPasskey ? (vendor.passkey || vendor.tempPassword || 'Dura#2026') : '••••••••••••'}
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-amber-200/80 mt-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">
                  EMAIL VERIFICATION STATUS
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {vendor.emailVerified === 'Verified' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 w-fit">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified by Partner via Email Link</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 w-fit">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pending Partner Verification</span>
                      </span>
                      {vendor.email && onResendVerification && (
                        <button
                          type="button"
                          onClick={() => onResendVerification(vendor)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Resend Verification Email</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[9.5px] text-slate-400 italic block mt-1.5">
                  * Note: Only the vendor can verify their email address by clicking the link in the verification email. Admin cannot manually verify.
                </span>
              </div>

              <div className="text-[11px] text-slate-600 pt-1 flex items-center justify-between border-t border-amber-200/50">
                <span>Field App Access: <strong>{vendor.category === 'Contractor' ? 'Tile Contractor / Scanner' : vendor.category}</strong></span>
                <span className="font-mono text-[10px] text-slate-400">Portal: /app/?app=vendor</span>
              </div>
            </div>
          )}

          {/* 3. Business Address & Territory */}
          <SectionHeader
            title="3. Business Address & Operating Territory"
            subtitle="Street address, city, state & territory hub"
            sectionKey="address"
            open={sections.address}
            onToggle={toggle}
            icon={MapPin}
            variant="blue"
          />
          {sections.address && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2 text-xs">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">STREET ADDRESS</span>
                <span className="text-slate-800">{vendor.address || 'Not specified'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">CITY</span>
                  <span className="font-bold text-slate-800">{vendor.city || '—'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">STATE</span>
                  <span className="font-bold text-slate-800">{vendor.state || 'Gujarat'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">PINCODE</span>
                  <span className="font-mono font-bold text-slate-800">{vendor.pincode || '—'}</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">OPERATING TERRITORY / HUB</span>
                <span className="font-bold text-[#C84826] bg-[#FEF2EE] px-2 py-0.5 rounded border border-[#C84826]/20 inline-block font-mono text-[11px]">
                  {vendor.territory || vendor.location || 'Morbi Central Hub'}
                </span>
              </div>
            </div>
          )}

          {/* 4. Bank & UPI Settlement */}
          <SectionHeader
            title="4. Bank & UPI Settlement Details"
            subtitle="Direct payout accounts & instant UPI verification"
            sectionKey="banking"
            open={sections.banking}
            onToggle={toggle}
            icon={CreditCard}
            variant="emerald"
            badge="FAST PAYOUT"
          />
          {sections.banking && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">BANK NAME</span>
                  <span className="font-bold text-slate-800">{vendor.bankName || 'Not Linked'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">ACCOUNT NUMBER</span>
                  <span className="font-mono font-bold text-slate-800">{vendor.accountNumber || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">IFSC CODE</span>
                  <span className="font-mono font-bold text-slate-800">{vendor.ifscCode || '—'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">INSTANT UPI ID / VPA</span>
                  <span className="font-mono font-bold text-emerald-700">{vendor.upi || 'Not linked'}</span>
                </div>
              </div>

              {(vendor.paymentQrUrl || vendor.passbookUrl) && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  {vendor.paymentQrUrl && (
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">UPI PAYMENT QR</span>
                      <img src={vendor.paymentQrUrl} alt="UPI QR" className="h-28 w-28 object-contain border border-slate-200 rounded-lg bg-white p-1" />
                    </div>
                  )}
                  {vendor.passbookUrl && (
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">PASSBOOK / CHEQUE</span>
                      <img src={vendor.passbookUrl} alt="Passbook" className="h-28 w-auto object-contain border border-slate-200 rounded-lg bg-white p-1" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. KYC & Statutory Docs */}
          <SectionHeader
            title="5. KYC & Statutory Verification"
            subtitle="GSTIN, PAN & Aadhaar details"
            sectionKey="kyc"
            open={sections.kyc}
            onToggle={toggle}
            icon={ShieldCheck}
            variant="purple"
          />
          {sections.kyc && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">GSTIN NUMBER</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800">{vendor.gstin || 'Unregistered'}</span>
                    {vendor.gstin && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">PAN NUMBER</span>
                  <span className="font-mono font-bold text-slate-800">{vendor.pan || '—'}</span>
                </div>
              </div>

              {vendor.aadhaar && (
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">AADHAAR (LAST 4 DIGITS)</span>
                  <span className="font-mono text-slate-800">•••• •••• {vendor.aadhaar.slice(-4)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">Statutory Compliance Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                  {vendor.kycStatus || 'Verified'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// ADD / EDIT VENDOR MODAL (MULTI-SECTION ACCORDION)
// =========================================================================
function VendorFormModal({ vendor, onClose, onSave }) {
  const isEdit = !!vendor;
  const modalScrollRef = React.useRef(null);
  const [form, setForm] = useState(
    isEdit
      ? {
          ...vendor,
          avatarUrl: vendor.avatarUrl || vendor.profileImage || '',
          profileImage: vendor.avatarUrl || vendor.profileImage || '',
          status: vendor.status || 'ACTIVE',
          passkey: vendor.passkey || vendor.tempPassword || 'Dura#2026',
          poValueLakhs: String(vendor.poValueLakhs ?? vendor.totalPayoutLakhs ?? ''),
          activePurchaseOrders: String(vendor.activePurchaseOrders ?? 1),
          appRole: vendor.appRole || (vendor.category === 'Distributor' ? 'Distributor' : vendor.category === 'Dealer' ? 'Dealer' : 'Contractor'),
        }
      : EMPTY_FORM()
  );

  const [formErrors, setFormErrors] = useState({});
  const [formAlert, setFormAlert] = useState('');

  const [sections, setSections] = useState({
    basic: true,
    credentials: true, // Dedicated Section for Login ID, Password, Active/Deactive
    address: true,
    banking: false,
    kyc: false,
    commercials: false,
  });

  const [showPasskey, setShowPasskey] = useState(false);
  const [copiedDossier, setCopiedDossier] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (k) => setSections((p) => ({ ...p, [k]: !p[k] }));
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (formErrors[k]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const regenPassword = () => set('passkey', `Dura#${Math.floor(1000 + Math.random() * 9000)}`);

  const generateFormatGstin = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const pan =
      Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * letters.length)]).join('') +
      Math.floor(1000 + Math.random() * 9000) +
      letters[Math.floor(Math.random() * letters.length)];
    set('gstin', `24${pan}1Z5`);
  };

  const handleFileUpload = (e, fieldKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      set(fieldKey, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validateCompulsoryFields = () => {
    const errors = {};
    const missing = [];

    // 1. Company Name
    if (!form.companyName?.trim()) {
      errors.companyName = 'Firm / Company Name is compulsory';
      missing.push('Firm / Company Name');
    }

    // 2. Contact Person
    if (!form.contactPerson?.trim()) {
      errors.contactPerson = 'Contact Person Full Name is compulsory';
      missing.push('Contact Person Full Name');
    }

    // 3. Mobile Number (10 digits)
    const phoneClean = String(form.phone || '').replace(/\D/g, '').slice(-10);
    if (!phoneClean || phoneClean.length !== 10) {
      errors.phone = 'Valid 10-digit Mobile Number is compulsory';
      missing.push('Mobile Phone Number');
    }

    // 4. Email ID (Compulsory)
    const emailStr = String(form.email || '').trim();
    if (!emailStr) {
      errors.email = 'Business Email ID is compulsory for verification & credentials';
      missing.push('Business Email Address');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      errors.email = 'Please enter a valid email format (e.g. partner@example.com)';
      missing.push('Valid Email Format');
    }

    // 5. Passkey / Password (at least 4 characters)
    if (!form.passkey?.trim() || form.passkey.trim().length < 4) {
      errors.passkey = 'Login Password / Passkey must be at least 4 characters';
      missing.push('Login Password / Passkey');
    }

    // 6. City / Hub
    if (!form.city?.trim()) {
      errors.city = 'City / Hub is compulsory';
      missing.push('City / Hub');
    }

    // 7. State / Region
    if (!form.state?.trim()) {
      errors.state = 'State / Region is compulsory';
      missing.push('State / Region');
    }

    return { isValid: missing.length === 0, errors, missing };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors, missing } = validateCompulsoryFields();

    if (!isValid) {
      setFormErrors(errors);
      setFormAlert(`⚠️ Missing Compulsory Field(s): ${missing.join(', ')}. Please fill all highlighted fields below.`);

      // Auto-open sections containing missing fields
      setSections((prev) => ({
        ...prev,
        basic: prev.basic || Boolean(errors.companyName || errors.contactPerson || errors.phone || errors.email),
        credentials: prev.credentials || Boolean(errors.passkey),
        address: prev.address || Boolean(errors.city || errors.state),
      }));

      // Scroll modal to top so alert banner is prominent
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setFormErrors({});
    setFormAlert('');
    setSaving(true);
    const loc = form.city && form.state ? `${form.city.trim()}, ${form.state.trim()}` : form.location;
    const poVal = parseFloat(form.poValueLakhs) || 0;

    await onSave({
      ...form,
      avatarUrl: form.avatarUrl || '',
      profileImage: form.avatarUrl || '',
      companyName: form.companyName.trim(),
      name: form.companyName.trim(),
      contactPerson: form.contactPerson?.trim() || form.companyName.trim(),
      phone: form.phone?.replace(/\D/g, '').slice(-10) || '',
      mobile: form.phone?.replace(/\D/g, '').slice(-10) || '',
      email: form.email?.trim() || '',
      status: form.status || 'ACTIVE',
      gstin: (form.gstin || '').toUpperCase().trim(),
      location: loc || form.territory || 'Morbi Central Hub',
      territory: form.territory || loc || 'Morbi Central Hub',
      poValueLakhs: poVal,
      totalPayoutLakhs: poVal,
      activePurchaseOrders: parseInt(form.activePurchaseOrders, 10) || (poVal > 0 ? 1 : 0),
      tempPassword: form.passkey,
      passkey: form.passkey,
      appRole: form.appRole || (form.category === 'Distributor' ? 'Distributor' : form.category === 'Dealer' ? 'Dealer' : 'Contractor'),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div ref={modalScrollRef} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-black text-slate-800">
              {isEdit ? `Edit Partner — ${vendor.vendorId}` : 'Add External Partner / Vendor'}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Syncs immediately across Supabase, Admin Panel &amp; Mobile App (:3001).
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
          {/* Form Alert for Missing Compulsory Fields */}
          {formAlert && (
            <div className="bg-rose-50 border-2 border-rose-400 text-rose-950 rounded-xl p-3.5 flex items-start gap-3 shadow-xs animate-in fade-in">
              <div className="p-1 rounded-full bg-rose-600 text-white shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs font-black uppercase tracking-wide text-rose-950">
                  Required Fields Missing / Incomplete:
                </div>
                <div className="text-xs text-rose-800 font-semibold mt-1 leading-relaxed">
                  {formAlert}
                </div>
              </div>
            </div>
          )}
          {/* 1. Basic Identity & Firm Profile */}
          <SectionHeader
            title="1. Basic Identity, Profile Icon &amp; Firm Profile"
            subtitle="Company name, logo icon, category, contact person & mobile phone"
            sectionKey="basic"
            open={sections.basic}
            onToggle={toggle}
            icon={Building2}
            variant="brand"
            badge="REQUIRED"
          />
          {sections.basic && (
            <div className="space-y-3 pl-1 pt-1">
              {/* Profile Icon / Company Logo Upload Box */}
              <div className="bg-white border border-[#F9CEB8]/70 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-3.5 shadow-2xs">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FEF2EE] to-[#FDE5DC] border-2 border-dashed border-[#F9CEB8] flex items-center justify-center overflow-hidden shadow-2xs">
                    {form.avatarUrl ? (
                      <img
                        src={form.avatarUrl}
                        alt="Vendor Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-400">
                        <Building2 className="w-6 h-6 text-[#C84826]" />
                        <span className="text-[8px] font-bold text-stone-400 uppercase mt-0.5">LOGO</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wide text-stone-800">
                      Partner Profile Icon / Company Logo
                    </label>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                      Mobile App Icon
                    </span>
                  </div>
                  <p className="text-[10.5px] text-stone-500 mt-0.5">
                    This logo/image will show directly on the contractor's Mobile App (:3001) header &amp; account dossier.
                  </p>

                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <label className="px-3 py-1.5 bg-[#FEF2EE] hover:bg-[#FDE5DC] text-[#C84826] border border-[#F9CEB8] rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{form.avatarUrl ? 'Change Profile Logo' : 'Upload Profile Logo / Icon'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'avatarUrl')}
                      />
                    </label>
                    {form.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => set('avatarUrl', '')}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Firm / Company Name" required error={formErrors.companyName}>
                  <input
                    required
                    className={getInputCls(formErrors.companyName)}
                    placeholder="e.g. Ramesh Tiling Works"
                    value={form.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Contact Person Full Name" required error={formErrors.contactPerson}>
                  <input
                    required
                    className={getInputCls(formErrors.contactPerson)}
                    placeholder="e.g. Ramesh Patel"
                    value={form.contactPerson}
                    onChange={(e) => set('contactPerson', e.target.value)}
                  />
                </FieldRow>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Partner Category / Type" required>
                  <select
                    className={selectCls}
                    value={form.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      set('category', cat);
                      if (!form.appRole) {
                        set('appRole', cat === 'Distributor' ? 'Distributor' : cat === 'Dealer' ? 'Dealer' : 'Contractor');
                      }
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="Mobile Phone Number (Primary Login ID)" required error={formErrors.phone}>
                  <input
                    required
                    type="tel"
                    maxLength={10}
                    className={`${getInputCls(formErrors.phone)} font-mono font-bold text-slate-900`}
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
                  />
                </FieldRow>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Business Email Address" required error={formErrors.email}>
                  <input
                    required
                    type="email"
                    className={getInputCls(formErrors.email)}
                    placeholder="partner@example.com (Compulsory)"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Tier Classification">
                  <select
                    className={selectCls}
                    value={form.tierLevel}
                    onChange={(e) => set('tierLevel', e.target.value)}
                  >
                    <option value="Tier 1 Platinum">Tier 1 Platinum (Top Tier)</option>
                    <option value="Tier 2 Gold">Tier 2 Gold (Standard Applicator)</option>
                    <option value="Tier 3 Silver">Tier 3 Silver (Associate)</option>
                  </select>
                </FieldRow>
              </div>
            </div>
          )}

          {/* 2. DEDICATED SECTION: Vendor Mobile App Login Credentials & Access Control */}
          <SectionHeader
            title="2. Vendor Mobile App Login Credentials & Access Control"
            subtitle="Security passkey, mobile login ID, active/deactive status & app permissions"
            sectionKey="credentials"
            open={sections.credentials}
            onToggle={toggle}
            icon={Lock}
            variant="credentials"
            badge="SECURITY & ACCESS"
          />
          {sections.credentials && (
            <div className="bg-[#FFFDF5] border border-amber-200/80 rounded-2xl p-4 space-y-4 shadow-2xs">
              {/* ACTIVE / DEACTIVE ACCOUNT STATUS SELECTOR */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Vendor Account Status &amp; Mobile App Permission *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => set('status', 'ACTIVE')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      form.status === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <div>
                        <div className="text-xs font-black text-slate-900">ACTIVE</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Mobile App &amp; Scanner Enabled</div>
                      </div>
                    </div>
                    {form.status === 'ACTIVE' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => set('status', 'INACTIVE')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      form.status === 'INACTIVE'
                        ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <div className="text-xs font-black text-slate-900">DEACTIVE</div>
                        <div className="text-[10px] text-rose-700 font-semibold">Login Blocked &amp; Payouts Paused</div>
                      </div>
                    </div>
                    {form.status === 'INACTIVE' && <Check className="w-4 h-4 text-rose-600" />}
                  </button>
                </div>
              </div>

              {/* LOGIN ID & PASSWORD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Vendor Mobile Login ID
                  </label>
                  <div className="relative">
                    <input
                      readOnly
                      className={`${inputCls} bg-slate-100 font-mono font-bold text-slate-900 pr-16`}
                      value={form.phone ? form.phone : (form.vendorId || 'Enter Phone in Section 1')}
                      placeholder="Mobile Phone will be used"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                      LOGIN ID
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Contractor logs into Mobile App (:3001) using this mobile number.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                      Login Password / Passkey <span className="text-[#C84826]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={regenPassword}
                      className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Generate New</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPasskey ? 'text' : 'password'}
                      className={`${getInputCls(formErrors.passkey)} font-mono font-bold text-[#C84826] pr-10`}
                      value={form.passkey}
                      onChange={(e) => set('passkey', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasskey(!showPasskey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.passkey ? (
                    <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{formErrors.passkey}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Temporary password given to contractor for first-time mobile login.
                    </p>
                  )}
                </div>
              </div>

              {/* FIELD APP ROLE & ACCESS PERMISSION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldRow label="Mobile Field App Access Role">
                  <select
                    className={selectCls}
                    value={form.appRole || (form.category === 'Distributor' ? 'Distributor' : form.category === 'Dealer' ? 'Dealer' : 'Contractor')}
                    onChange={(e) => set('appRole', e.target.value)}
                  >
                    <option value="Contractor">Tile Contractor / Applicator (Scan QR &amp; UPI Cashback)</option>
                    <option value="Dealer">Authorized Dealer (Carton Inward &amp; Retail Audit)</option>
                    <option value="Distributor">Regional Distributor (Secondary Dispatch)</option>
                    <option value="Vendor">Supply Chain Vendor (PO &amp; Material Dispatch)</option>
                  </select>
                </FieldRow>

                <FieldRow label="Mobile Scanner Status">
                  <div className="flex items-center h-[38px] px-3 bg-white border border-slate-200 rounded-lg justify-between">
                    <span className="text-xs text-slate-700 font-medium">QR Camera Scanner</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      form.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {form.status === 'ACTIVE' ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </FieldRow>
              </div>

              {/* QUICK COPY CREDENTIALS CARD */}
              <div className="bg-white border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>Mobile App Login:</span>
                    <code className="text-[#C84826] font-mono font-bold">{form.phone || '98XXXXXXXX'}</code>
                    <span>• Password:</span>
                    <code className="text-[#C84826] font-mono font-bold">{form.passkey}</code>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    URL: <span className="font-mono text-slate-600">http://localhost:3001</span> (or Android APK)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = `DuraGrit Partner Login Credentials:\nPortal: http://localhost:3001\nLogin ID / Mobile: ${form.phone || form.vendorId}\nTemporary Password: ${form.passkey}\nRole: ${form.category}`;
                    navigator.clipboard.writeText(text);
                    setCopiedDossier(true);
                    setTimeout(() => setCopiedDossier(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                >
                  {copiedDossier ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDossier ? 'Copied Credentials!' : 'Copy Credentials'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Business Address & Operating Territory */}
          <SectionHeader
            title="3. Business Address & Operating Territory"
            subtitle="Operating territory, street, city, state & pincode"
            sectionKey="address"
            open={sections.address}
            onToggle={toggle}
            icon={MapPin}
            variant="blue"
          />
          {sections.address && (
            <div className="space-y-3 pl-1 pt-1">
              <FieldRow label="Street Address / Workshop Location">
                <input
                  className={inputCls}
                  placeholder="Street / GIDC Industrial Area"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </FieldRow>

              <div className="grid grid-cols-3 gap-3">
                <FieldRow label="City / Hub" required error={formErrors.city}>
                  <input
                    required
                    className={getInputCls(formErrors.city)}
                    placeholder="e.g. Morbi"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="State / Region" required error={formErrors.state}>
                  <input
                    required
                    className={getInputCls(formErrors.state)}
                    placeholder="e.g. Gujarat"
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Pincode">
                  <input
                    maxLength={6}
                    className={`${inputCls} font-mono`}
                    placeholder="363642"
                    value={form.pincode}
                    onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))}
                  />
                </FieldRow>
              </div>

              <FieldRow label="Operating Territory / Depot Hub">
                <select
                  className={selectCls}
                  value={form.territory}
                  onChange={(e) => set('territory', e.target.value)}
                >
                  <option value="Morbi Central Hub">Morbi Central Hub (Depot 04)</option>
                  <option value="Gujarat Regional Hub">Gujarat Regional Hub</option>
                  <option value="North NCR Hub">North NCR Regional Depot (DEL-HQ-09)</option>
                  <option value="South Zone Hub">South Zone Central Logistics</option>
                  <option value="Western Coast Depot">Western Coast Depot</option>
                </select>
              </FieldRow>
            </div>
          )}

          {/* 4. Bank & UPI Settlement */}
          <SectionHeader
            title="4. Bank & UPI Settlement Details"
            subtitle="Direct contractor cashback payouts & PO RTGS settlements"
            sectionKey="banking"
            open={sections.banking}
            onToggle={toggle}
            icon={CreditCard}
            variant="emerald"
            badge="FAST PAYOUT"
          />
          {sections.banking && (
            <div className="space-y-3 pl-1 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Beneficiary Name">
                  <input
                    className={inputCls}
                    placeholder="Account Holder Name"
                    value={form.beneficiaryName || form.contactPerson}
                    onChange={(e) => set('beneficiaryName', e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Bank Name">
                  <input
                    className={inputCls}
                    placeholder="e.g. HDFC Bank, SBI"
                    value={form.bankName}
                    onChange={(e) => set('bankName', e.target.value)}
                  />
                </FieldRow>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Bank Account Number">
                  <input
                    className={`${inputCls} font-mono`}
                    placeholder="Account Number"
                    value={form.accountNumber}
                    onChange={(e) => set('accountNumber', e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="IFSC Code">
                  <input
                    className={`${inputCls} font-mono uppercase`}
                    placeholder="HDFC0001234"
                    value={form.ifscCode}
                    onChange={(e) => set('ifscCode', e.target.value.toUpperCase())}
                  />
                </FieldRow>
              </div>

              <FieldRow label="Direct Instant UPI ID / VPA (Recommended)">
                <div className="relative">
                  <input
                    className={`${inputCls} font-mono text-emerald-800`}
                    placeholder="e.g. partner@okhdfcbank or 9820144521@upi"
                    value={form.upi}
                    onChange={(e) => set('upi', e.target.value.trim())}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    NPCI Fast Rail
                  </span>
                </div>
              </FieldRow>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Upload UPI Payment QR
                  </label>
                  <label className="border border-dashed border-slate-300 rounded-lg p-2 flex items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer text-xs text-slate-500">
                    <QrCode className="w-4 h-4 text-[#C84826]" />
                    <span>{form.paymentQrUrl ? 'Change QR Image' : 'Select QR Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'paymentQrUrl')}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Upload Passbook / Cheque
                  </label>
                  <label className="border border-dashed border-slate-300 rounded-lg p-2 flex items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer text-xs text-slate-500">
                    <Upload className="w-4 h-4 text-[#C84826]" />
                    <span>{form.passbookUrl ? 'Change Document' : 'Select Passbook'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'passbookUrl')}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 5. KYC & Statutory Verification */}
          <SectionHeader
            title="5. KYC & Statutory Verification"
            subtitle="GSTIN, PAN & Aadhaar identification"
            sectionKey="kyc"
            open={sections.kyc}
            onToggle={toggle}
            icon={ShieldCheck}
            variant="purple"
          />
          {sections.kyc && (
            <div className="space-y-3 pl-1 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    GSTIN Number (15 Characters)
                  </label>
                  <button
                    type="button"
                    onClick={generateFormatGstin}
                    className="text-[10px] font-bold text-[#C84826] hover:underline cursor-pointer"
                  >
                    Generate Test GSTIN
                  </button>
                </div>
                <input
                  maxLength={15}
                  className={`${inputCls} font-mono uppercase`}
                  placeholder="24ABCDE1234F1Z5"
                  value={form.gstin}
                  onChange={(e) => set('gstin', e.target.value.toUpperCase().trim())}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="PAN Number (10 Characters)">
                  <input
                    maxLength={10}
                    className={`${inputCls} font-mono uppercase`}
                    placeholder="ABCDE1234F"
                    value={form.pan}
                    onChange={(e) => set('pan', e.target.value.toUpperCase().trim())}
                  />
                </FieldRow>

                <FieldRow label="Aadhaar Number (Optional / Masons)">
                  <input
                    maxLength={12}
                    className={`${inputCls} font-mono`}
                    placeholder="12-digit Aadhaar"
                    value={form.aadhaar}
                    onChange={(e) => set('aadhaar', e.target.value.replace(/\D/g, ''))}
                  />
                </FieldRow>
              </div>

              <FieldRow label="KYC Verification Status">
                <select
                  className={selectCls}
                  value={form.kycStatus}
                  onChange={(e) => set('kycStatus', e.target.value)}
                >
                  <option value="Verified">Verified (Active Escrow Approval)</option>
                  <option value="Pending KYC">Pending KYC Verification</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </FieldRow>
            </div>
          )}

          {/* 6. Commercials & PO Limits */}
          <SectionHeader
            title="6. Commercials & Purchase Orders (Optional)"
            subtitle="Trade credit, PO values & supply line"
            sectionKey="commercials"
            open={sections.commercials}
            onToggle={toggle}
            icon={FileText}
            variant="slate"
          />
          {sections.commercials && (
            <div className="space-y-3 pl-1 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Active Purchase Orders / Batches">
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    placeholder="e.g. 1"
                    value={form.activePurchaseOrders}
                    onChange={(e) => set('activePurchaseOrders', e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Total PO / Credit Limit (₹ Lakhs)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      step="0.1"
                      className={`${inputCls} pl-7 font-mono`}
                      placeholder="e.g. 5.0"
                      value={form.poValueLakhs}
                      onChange={(e) => set('poValueLakhs', e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">L</span>
                  </div>
                </FieldRow>
              </div>

              <FieldRow label="Material / Specialty Line">
                <input
                  className={inputCls}
                  placeholder="e.g. Vitrified Adhesive Application, Epoxy Grouting"
                  value={form.materialLine}
                  onChange={(e) => set('materialLine', e.target.value)}
                />
              </FieldRow>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#C84826] text-white text-xs font-bold hover:bg-[#A62C11] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : isEdit ? 'Update Partner' : 'Save Partner'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// MAIN VENDOR MANAGEMENT COMPONENT
// =========================================================================
export function VendorManagement() {
  const { vendors = [], addVendor, updateVendor, deleteVendor, releaseVendorPayout, dbStatus, refreshAllData } = useData();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [viewingVendor, setViewingVendor] = useState(null);
  const [payoutVendor, setPayoutVendor] = useState(null);
  const [copiedId, setCopiedId] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [resendingEmailId, setResendingEmailId] = useState(null);
  const [alertToast, setAlertToast] = useState(null); // { type: 'success' | 'warning' | 'info', msg: string }

  // Auto-dismiss alert banner
  useEffect(() => {
    if (!alertToast) return;
    const timer = setTimeout(() => setAlertToast(null), 7000);
    return () => clearTimeout(timer);
  }, [alertToast]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRefresh = async () => {
    if (!refreshAllData) return;
    setIsSyncing(true);
    try {
      await refreshAllData();
    } finally {
      setIsSyncing(false);
    }
  };

  // ── QUICK APPROVE / TOGGLE STATUS ──────────────────────────────────────────
  const handleToggleStatus = async (vendor) => {
    const isCurrentlyActive = vendor.status === 'ACTIVE' || vendor.status === 'Active';
    const nextStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const nextActive = !isCurrentlyActive;

    await updateVendor(vendor.id || vendor.vendorId, {
      status: nextStatus,
      accountStatus: nextActive ? 'Active' : 'Suspended',
      active: nextActive,
    });

    if (!nextActive) {
      setAlertToast({
        type: 'warning',
        msg: `⛔ Partner ${vendor.companyName} DEACTIVATED. Mobile app login & scanner access is now locked.`,
      });
    } else {
      // If activating and partner has email, auto dispatch Email 2 (Credentials + APK)
      if (vendor.email) {
        try {
          await sendVendorOnboardingCredentialsEmail({
            vendorId: vendor.vendorId || vendor.id,
            recipientName: vendor.companyName || vendor.contactPerson,
            recipientEmail: vendor.email,
            mobile: vendor.phone || vendor.mobile,
            role: vendor.category || 'Tile Contractor / Applicator',
            passkey: vendor.passkey || vendor.tempPassword || 'Dura#2026',
            hub: vendor.territory || vendor.location || 'Morbi Central Hub',
            apkUrl: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:3002' : `${window.location.origin}/app/?app=vendor`,
            pwaUrl: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:3002' : `${window.location.origin}/app/?app=vendor`,
          });
          await updateVendor(vendor.id || vendor.vendorId, {
            credentialsSent: true,
            credentialsSentAt: new Date().toISOString(),
          });
          setAlertToast({
            type: 'success',
            msg: `✅ Partner ${vendor.companyName} ACTIVATED! Onboarding credentials & APK setup guide sent to ${vendor.email}.`,
          });
        } catch (_) {
          setAlertToast({
            type: 'success',
            msg: `✅ Partner ${vendor.companyName} ACTIVATED! Mobile App login enabled.`,
          });
        }
      } else {
        setAlertToast({
          type: 'success',
          msg: `✅ Partner ${vendor.companyName} ACTIVATED! Mobile App login enabled. (Add email to auto-dispatch credentials)`,
        });
      }
    }
  };

  // ── QUICK APPROVE BUTTON ───────────────────────────────────────────────────
  const handleQuickApprove = async (vendor) => {
    await updateVendor(vendor.id || vendor.vendorId, {
      status: 'ACTIVE',
      accountStatus: 'Active',
      active: true,
    });

    if (vendor.email) {
      try {
        await sendVendorOnboardingCredentialsEmail({
          vendorId: vendor.vendorId || vendor.id,
          recipientName: vendor.companyName || vendor.contactPerson,
          recipientEmail: vendor.email,
          mobile: vendor.phone || vendor.mobile,
          role: vendor.category || 'Tile Contractor / Applicator',
          passkey: vendor.passkey || vendor.tempPassword || 'Dura#2026',
          hub: vendor.territory || vendor.location || 'Morbi Central Hub',
          apkUrl: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:3002' : `${window.location.origin}/app/?app=vendor`,
          pwaUrl: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:3002' : `${window.location.origin}/app/?app=vendor`,
        });
        await updateVendor(vendor.id || vendor.vendorId, {
          credentialsSent: true,
          credentialsSentAt: new Date().toISOString(),
        });
        setAlertToast({
          type: 'success',
          msg: `🚀 Partner ${vendor.companyName} Approved & Activated! Credentials & APK instructions dispatched to ${vendor.email}.`,
        });
      } catch (_) {
        setAlertToast({
          type: 'success',
          msg: `✅ Partner ${vendor.companyName} Approved & Activated!`,
        });
      }
    } else {
      setAlertToast({
        type: 'success',
        msg: `✅ Partner ${vendor.companyName} Approved & Activated! Mobile App access enabled.`,
      });
    }
  };

  // ── RESEND EMAIL VERIFICATION (ONLY VENDOR CAN VERIFY VIA LINK) ────────────
  const handleResendVerificationEmail = async (vendor) => {
    if (!vendor.email) {
      alert('Please add a valid email address to this partner first.');
      return;
    }
    const targetId = vendor.id || vendor.vendorId;
    setResendingEmailId(targetId);
    try {
      const res = await sendVendorVerificationEmail({
        vendorId: vendor.vendorId || vendor.id,
        recipientName: vendor.companyName || vendor.contactPerson,
        recipientEmail: vendor.email,
        mobile: vendor.phone || vendor.mobile,
        role: vendor.category,
      });
      await updateVendor(targetId, {
        verificationToken: res.token,
        verifyLink: res.verifyLink,
        verificationSentAt: new Date().toISOString(),
        emailVerified: 'Pending',
      });
      setAlertToast({
        type: 'info',
        msg: `📧 Verification email sent to ${vendor.email}! Only the vendor can verify by clicking the verification link in their email.`,
      });
    } catch (err) {
      setAlertToast({
        type: 'error',
        msg: `Failed to dispatch verification email: ${err.message}`,
      });
    } finally {
      setResendingEmailId(null);
    }
  };

  // ── SEND / RESEND CREDENTIALS & APK DOSSIER ────────────────────────────────
  const handleSendCredentialsDossier = async (vendor) => {
    if (!vendor.email) {
      alert('Please add a valid email address to this partner first.');
      return;
    }
    await sendVendorOnboardingCredentialsEmail({
      vendorId: vendor.vendorId || vendor.id,
      recipientName: vendor.companyName || vendor.contactPerson,
      recipientEmail: vendor.email,
      mobile: vendor.phone || vendor.mobile,
      role: vendor.category || 'Tile Contractor / Applicator',
      passkey: vendor.passkey || vendor.tempPassword || 'Dura#2026',
      hub: vendor.territory || vendor.location || 'Morbi Central Hub',
      apkUrl: (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') ? `${window.location.origin}/app/?app=vendor` : 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor',
      pwaUrl: (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') ? `${window.location.origin}/app/?app=vendor` : 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor',
    });
    await updateVendor(vendor.id || vendor.vendorId, {
      credentialsSent: true,
      credentialsSentAt: new Date().toISOString(),
    });
    setAlertToast({
      type: 'success',
      msg: `🚀 Credentials dossier & APK instructions dispatched to ${vendor.email}!`,
    });
  };

  // KPI Calculations
  const totalVendors = vendors.length;
  const contractorsCount = vendors.filter((v) => v.category === 'Contractor').length;
  const tradePartnersCount = vendors.filter((v) => ['Distributor', 'Retailer', 'Dealer'].includes(v.category)).length;
  const suppliersCount = vendors.filter((v) => ['Raw Material', 'Packaging', 'Printing', 'Logistics'].includes(v.category)).length;
  const totalPOLakhs = vendors.reduce(
    (sum, v) => sum + parseFloat(v.totalPayoutLakhs ?? v.poValueLakhs ?? 0),
    0
  );

  // Filtered List
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (v.companyName || '').toLowerCase().includes(q) ||
        (v.contactPerson || '').toLowerCase().includes(q) ||
        (v.phone || v.mobile || '').includes(q) ||
        (v.city || '').toLowerCase().includes(q) ||
        (v.gstin || '').toLowerCase().includes(q) ||
        (v.vendorId || '').toLowerCase().includes(q);

      const matchCat = selectedCategory === 'all' || v.category === selectedCategory;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && (v.status === 'ACTIVE' || v.status === 'Active')) ||
        (selectedStatus === 'pending' && (v.status === 'Pending KYC' || v.status === 'INACTIVE' || v.status === 'Pending')) ||
        (selectedStatus === 'suspended' && (v.status === 'INACTIVE' || v.status === 'Suspended'));

      return matchSearch && matchCat && matchStatus;
    });
  }, [vendors, search, selectedCategory, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE) || 1;
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSaveVendor = async (data) => {
    if (editingVendor) {
      await updateVendor(editingVendor.id || editingVendor.vendorId, data);
      setAlertToast({
        type: 'success',
        msg: `Partner ${data.companyName} updated successfully.`,
      });
    } else {
      const newPayload = {
        ...data,
        status: data.status || 'INACTIVE', // Requires Admin Approval
        emailVerified: 'Pending',
        credentialsSent: false,
      };
      const created = await addVendor(newPayload);

      // Automatically dispatch Email 1 (Verification Link) if email is present
      if (data.email) {
        try {
          const res = await sendVendorVerificationEmail({
            vendorId: created.vendorId || created.id,
            recipientName: created.companyName || created.contactPerson,
            recipientEmail: data.email,
            mobile: created.phone || created.mobile,
            role: created.category,
          });
          await updateVendor(created.vendorId || created.id, {
            verificationToken: res.token,
            verifyLink: res.verifyLink,
            verificationSentAt: new Date().toISOString(),
          });
          setAlertToast({
            type: 'info',
            msg: `📧 Partner registered! Email verification link sent to ${data.email}. Once verified, approve to dispatch APK credentials.`,
          });
        } catch (_) {
          setAlertToast({
            type: 'info',
            msg: `Partner registered. Email verification pending dispatch.`,
          });
        }
      } else {
        setAlertToast({
          type: 'info',
          msg: `Partner registered without email. Add an email to send verification link & APK credentials.`,
        });
      }
    }
    setEditingVendor(null);
    setShowFormModal(false);
  };

  const handleDeleteVendor = async (v) => {
    if (window.confirm(`Are you sure you want to delete ${v.companyName} (${v.vendorId})?`)) {
      await deleteVendor(v.id || v.vendorId);
    }
  };

  const handleReleasePayoutConfirm = async ({ amount, mode, utr, note }) => {
    if (!payoutVendor) return;
    await releaseVendorPayout(payoutVendor.id || payoutVendor.vendorId, amount, utr, mode, note);
    setPayoutVendor(null);
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div>
          <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-1">
            DuraGrit ERP / Supply Chain / External Partners &amp; Vendors
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <span>External Partner &amp; Vendor Directory</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FEF2EE] text-[#C84826] border border-[#C84826]/30 font-mono">
              ALL PARTNERS &amp; APPLICATORS
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage Contractors, Tile Applicators, Retailers, Dealers, Distributors, and Supply Vendors with complete Bank/UPI &amp; KYC records.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            className="p-2 border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-600 cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#C84826]' : ''}`} />
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{dbStatus?.online ? 'Supabase Live Sync' : 'Local Dev Sync'}</span>
          </span>
        </div>
      </div>

      {/* Real-time Alert Toast Banner */}
      {alertToast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in transition-all ${
            alertToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : alertToast.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alertToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : alertToast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <Mail className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span className="text-xs font-bold">{alertToast.msg}</span>
          </div>
          <button
            onClick={() => setAlertToast(null)}
            className="text-stone-400 hover:text-stone-700 text-sm font-bold px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Contractors &amp; Masons"
          value={contractorsCount}
          sub="Tile applicators in field"
          icon={Award}
          accent="bg-emerald-600"
        />
        <KpiCard
          label="Dealers &amp; Retailers"
          value={tradePartnersCount}
          sub="Distribution network"
          icon={Store}
          accent="bg-blue-600"
        />
        <KpiCard
          label="Supply &amp; Logistics"
          value={suppliersCount}
          sub="Raw materials &amp; fleet"
          icon={Truck}
          accent="bg-purple-600"
        />
        <KpiCard
          label="Active Trade Limit"
          value={`₹${totalPOLakhs.toFixed(1)}L`}
          sub="Total credit allocation"
          icon={IndianRupee}
          accent="bg-[#C84826]"
          isAlert={true}
        />
      </div>

      {/* Control Bar: Filters & Add Partner Button */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, contact, phone, GSTIN..."
              className="w-full pl-9 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C84826]"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-stone-50 text-stone-700 cursor-pointer focus:outline-none font-bold"
          >
            <option value="all">All Partner Types</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-stone-50 text-stone-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="pending">Pending KYC</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setEditingVendor(null);
            setShowFormModal(true);
          }}
          className="w-full md:w-auto bg-[#C84826] hover:bg-[#A62C11] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>+ Add External Partner</span>
        </button>
      </div>

      {/* Main Vendor & Partner Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Partner ID</th>
                <th className="py-3 px-4">Firm / Company &amp; Contact</th>
                <th className="py-3 px-4">Type / Role</th>
                <th className="py-3 px-4">Email Verification</th>
                <th className="py-3 px-4 text-center">App Login &amp; Status</th>
                <th className="py-3 px-4">Credentials &amp; APK</th>
                <th className="py-3 px-4">Portal Passkey / UPI</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    <Store className="w-8 h-8 mx-auto mb-2 opacity-30 text-stone-500" />
                    <p className="font-semibold text-stone-600">No external partners found</p>
                    <p className="text-[11px] mt-0.5">Click &quot;+ Add External Partner&quot; to register Contractors, Dealers, or Suppliers.</p>
                  </td>
                </tr>
              ) : (
                paginatedVendors.map((vendor) => {
                  const cat = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG.Contractor;
                  const isPassVisible = showPasswordMap[vendor.vendorId];
                  return (
                    <tr key={vendor.vendorId} className="hover:bg-stone-50/80 transition-colors">
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {vendor.vendorId}
                      </td>

                      {/* Firm & Contact with Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                            {vendor.avatarUrl || vendor.profileImage ? (
                              <img
                                src={vendor.avatarUrl || vendor.profileImage}
                                alt={vendor.companyName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900">{vendor.companyName}</div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-medium text-stone-700">{vendor.contactPerson || vendor.name}</span>
                              <span className="text-stone-300">•</span>
                              <span className="font-mono">{vendor.phone || vendor.mobile}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${cat.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                          <span>{vendor.category}</span>
                        </span>
                      </td>

                      {/* Email Verification */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5">
                          {vendor.emailVerified === 'Verified' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 w-fit">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Verified by Partner</span>
                              </span>
                              {vendor.emailVerifiedAt && (
                                <div className="text-[9px] text-emerald-700 font-mono">
                                  {new Date(vendor.emailVerifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300 w-fit">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Verification</span>
                              </span>

                              {vendor.email ? (
                                <button
                                  type="button"
                                  onClick={() => handleResendVerificationEmail(vendor)}
                                  disabled={resendingEmailId === (vendor.id || vendor.vendorId)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs hover:shadow-xs transition cursor-pointer w-fit disabled:opacity-50"
                                  title="Send verification email with 1-click link to partner's inbox. Only the partner can verify."
                                >
                                  <Send className="w-2.5 h-2.5" />
                                  <span>
                                    {resendingEmailId === (vendor.id || vendor.vendorId)
                                      ? 'Sending...'
                                      : vendor.verificationSentAt
                                        ? 'Resend Verification Email'
                                        : 'Send Verification Email'}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVendor(vendor);
                                    setShowFormModal(true);
                                  }}
                                  className="text-[9.5px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                                  title="Add partner email address to send verification link"
                                >
                                  + Add Email Address
                                </button>
                              )}

                              <div className="text-[9px] text-stone-400 italic">
                                * Vendor must click link in email (Admin cannot verify)
                              </div>
                            </div>
                          )}
                          <div className="text-[10px] text-stone-400 font-mono truncate max-w-[140px]" title={vendor.email}>
                            {vendor.email || <span className="text-stone-300 italic">No email</span>}
                          </div>
                        </div>
                      </td>

                      {/* App Login & Status (Quick Approve / Deactivate) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <StatusPill status={vendor.status || 'ACTIVE'} />

                          {vendor.status === 'ACTIVE' || vendor.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(vendor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shadow-2xs"
                              title="Deactivate Partner — Blocks Mobile App Login"
                            >
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickApprove(vendor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
                              title="Approve Partner & Enable Mobile App Access"
                            >
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              <span>Approve &amp; Activate</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Credentials & APK Dossier */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {vendor.credentialsSent ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-300 w-fit">
                                <Send className="w-2.5 h-2.5 text-blue-600" />
                                <span>Dossier Sent</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSendCredentialsDossier(vendor)}
                                className="block text-[9.5px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                                title="Resend login credentials & APK instructions"
                              >
                                🔄 Resend Dossier
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendCredentialsDossier(vendor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition cursor-pointer w-fit"
                              title="Send Credentials + Android APK & iPhone PWA Links"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Send Credentials</span>
                            </button>
                          )}
                          <div className="text-[9.5px] text-stone-400">
                            APK: <code className="font-mono text-[9px] text-stone-600">v4.2.1</code>
                          </div>
                        </div>
                      </td>

                      {/* Passkey / UPI */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 font-bold text-stone-800">
                            {isPassVisible ? vendor.passkey || vendor.tempPassword : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(vendor.vendorId)}
                            className="p-1 hover:bg-stone-200 rounded text-stone-500 cursor-pointer"
                            title={isPassVisible ? 'Hide' : 'Show'}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(vendor.passkey || vendor.tempPassword, `pass-${vendor.vendorId}`)}
                            className="p-1 hover:bg-stone-200 rounded text-stone-500 cursor-pointer"
                            title="Copy Passkey"
                          >
                            {copiedId === `pass-${vendor.vendorId}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {vendor.upi ? (
                          <div className="text-[10px] text-emerald-700 font-bold truncate max-w-[130px]">
                            UPI: {vendor.upi}
                          </div>
                        ) : vendor.accountNumber ? (
                          <div className="text-[10px] text-stone-500">
                            A/C: ••••{vendor.accountNumber.slice(-4)}
                          </div>
                        ) : null}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingVendor(vendor)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                          title="View Full Dossier"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVendor(vendor);
                            setShowFormModal(true);
                          }}
                          className="p-1.5 text-stone-500 hover:text-[#C84826] hover:bg-stone-100 rounded-lg transition cursor-pointer"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayoutVendor(vendor)}
                          className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Release Payout"
                        >
                          <Zap className="w-3.5 h-3.5 text-[#C84826]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(vendor)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Partner"
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-[#FAF9F6] border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <div>
              Showing Page <span className="font-bold text-stone-800">{currentPage}</span> of{' '}
              <span className="font-bold text-stone-800">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2 py-1 border border-stone-200 rounded bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2 py-1 border border-stone-200 rounded bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        <VendorFormModal
          vendor={editingVendor}
          onClose={() => {
            setShowFormModal(false);
            setEditingVendor(null);
          }}
          onSave={handleSaveVendor}
        />
      )}

      {viewingVendor && (
        <ViewModal
          vendor={viewingVendor}
          onClose={() => setViewingVendor(null)}
          onEdit={(v) => {
            setViewingVendor(null);
            setEditingVendor(v);
            setShowFormModal(true);
          }}
          onReleasePayout={(v) => {
            setViewingVendor(null);
            setPayoutVendor(v);
          }}
          onResendVerification={handleResendVerificationEmail}
        />
      )}

      {payoutVendor && (
        <ReleasePayoutModal
          vendor={payoutVendor}
          onClose={() => setPayoutVendor(null)}
          onConfirm={handleReleasePayoutConfirm}
        />
      )}
    </div>
  );
}
