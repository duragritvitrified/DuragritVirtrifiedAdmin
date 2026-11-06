import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Tablet,
  ShieldCheck,
  ShieldAlert,
  Search,
  Download,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Wifi,
  Battery,
  Radio,
  Camera,
  ArrowUpRight,
  Send,
  Sparkles,
  Lock,
  HardDrive,
  Cpu,
  Clock,
  Plus,
  Rocket,
  UploadCloud,
  History,
  Check,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import {
  getDeviceInstalls,
  toggleDeviceStatus,
  triggerAppUpdatePush,
  remoteLogoutDevice,
  sendDevicePing,
  registerAppInstall,
  getAppVersionInfo,
  getAppReleases,
  getLatestRelease,
  publishNewRelease
} from '../../services/appInstallService';
import { useData } from '../../context/DataContext';

export function AppInstallReports() {
  const { users = [], vendors = [] } = useData();
  const [installs, setInstalls] = useState([]);
  const [releases, setReleases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [osFilter, setOsFilter] = useState('all');
  const [versionFilter, setVersionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form for pushing a new release
  const [newReleaseForm, setNewReleaseForm] = useState({
    version: '',
    title: '',
    changelog: '',
    isMandatory: true,
    author: 'Corporate Admin'
  });

  const latestRelease = getLatestRelease();
  const versionInfo = getAppVersionInfo();

  useEffect(() => {
    loadData();

    // Listen to cross-tab storage changes (e.g. mobile app updating on port 3001)
    const handleStorageChange = (e) => {
      if (
        e.key === 'duragrit_app_installs_v2' ||
        e.key === 'duragrit_app_releases_v1' ||
        e.key === 'duragrit_ota_client_sync' ||
        e.key === 'duragrit_ota_last_broadcast'
      ) {
        loadData();
      }
    };

    const handleCustomEvent = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('duragrit:ota-update-applied', handleCustomEvent);
    window.addEventListener('duragrit:ota-release-pushed', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('duragrit:ota-update-applied', handleCustomEvent);
      window.removeEventListener('duragrit:ota-release-pushed', handleCustomEvent);
    };
  }, []);

  const loadData = () => {
    const list = getDeviceInstalls();
    setInstalls(Array.isArray(list) ? list : []);
    const rels = getAppReleases();
    setReleases(Array.isArray(rels) ? rels : []);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadData();
      setIsRefreshing(false);
      showToast('Device telemetry & release versions synchronized.');
    }, 350);
  };

  // Pre-fill next suggested version when opening push modal
  const handleOpenPushModal = () => {
    const currentVer = latestRelease?.version || 'v4.8.2';
    // Compute next patch version: v4.8.2 -> v4.8.3
    const match = currentVer.match(/v?(\d+)\.(\d+)\.(\d+)/);
    let nextVer = 'v4.8.3';
    if (match) {
      const major = match[1];
      const minor = match[2];
      const patch = parseInt(match[3], 10) + 1;
      nextVer = `v${major}.${minor}.${patch}`;
    }

    setNewReleaseForm({
      version: nextVer,
      title: 'Performance & Instant UPI Payout Patch',
      changelog: 'Optimized camera scanner focus, accelerated token verification handshake, and real-time bank settlement push alerts.',
      isMandatory: true,
      author: 'Corporate Admin'
    });
    setShowPushModal(true);
  };

  const handlePublishRelease = (e) => {
    e.preventDefault();
    if (!newReleaseForm.version.trim()) {
      showToast('Please enter a valid version tag (e.g. v4.8.3).');
      return;
    }

    const res = publishNewRelease({
      version: newReleaseForm.version,
      title: newReleaseForm.title,
      changelog: newReleaseForm.changelog,
      isMandatory: newReleaseForm.isMandatory,
      author: newReleaseForm.author
    });

    if (res.success) {
      loadData();
      setShowPushModal(false);
      showToast(`🚀 New Version ${res.release.version} deployed! Dispatched OTA push to ${res.affectedDevices} registered devices.`);
    }
  };

  const handleToggleStatus = (installId, e) => {
    if (e) e.stopPropagation();
    const res = toggleDeviceStatus(installId);
    if (res.success) {
      loadData();
      if (selectedDevice && selectedDevice.id === installId) {
        setSelectedDevice(res.record);
      }
      showToast(
        res.record.status === 'Active'
          ? `Device ${res.record.deviceModel} reactivated for ${res.record.userName}.`
          : `Device ${res.record.deviceModel} blocked.`
      );
    }
  };

  const handlePromptUpdate = (installId, e) => {
    if (e) e.stopPropagation();
    const res = triggerAppUpdatePush(installId);
    if (res.success) {
      loadData();
      showToast(res.message);
    }
  };

  const handleRemoteLogout = (installId, e) => {
    if (e) e.stopPropagation();
    const res = remoteLogoutDevice(installId);
    if (res.success) {
      loadData();
      if (selectedDevice && selectedDevice.id === installId) {
        setSelectedDevice(prev => ({ ...prev, status: 'Inactive' }));
      }
      showToast(res.message);
    }
  };

  const handlePing = (installId, e) => {
    if (e) e.stopPropagation();
    const res = sendDevicePing(installId);
    showToast(`${res.message} Latency: ${res.latency}`);
  };

  const handleBulkUpdatePrompt = () => {
    const outdated = installs.filter(i => (i.appVersion || '') !== (latestRelease?.version || ''));
    outdated.forEach(i => triggerAppUpdatePush(i.id));
    loadData();
    showToast(`Upgrade notification dispatched to ${outdated.length} devices.`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Install ID', 'User ID', 'User Name', 'Role', 'Mobile', 'Location',
      'Device Model', 'Brand', 'OS', 'App Version', 'Is Latest', 'Install Source',
      'Install Date', 'Last Active', 'Status', 'QR Scans', 'Cashback Earned'
    ];
    const rows = filteredInstalls.map(i => [
      i.id, i.userId, `"${i.userName}"`, i.userRole, i.userMobile, `"${i.location}"`,
      `"${i.deviceModel}"`, i.deviceBrand, i.os, i.appVersion, (i.appVersion === latestRelease.version) ? 'YES' : 'NO',
      `"${i.installSource}"`, i.installDate, `"${i.lastActive}"`, i.status, i.scansCount, `"${i.cashbackEarned}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `DuraGrit_App_Installs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Installation report downloaded.');
  };

  const [newInstallData, setNewInstallData] = useState({
    userName: '',
    userId: '',
    userRole: 'Contractor',
    userMobile: '',
    userEmail: '',
    location: '',
    deviceModel: '',
    deviceBrand: 'Android',
    os: 'Android 14',
    appVersion: latestRelease?.version || 'v4.8.2',
    installSource: 'Direct APK (duragritvitrified.com)',
    networkType: '5G',
    batteryLevel: '95%'
  });

  const handleCreateInstall = (e) => {
    e.preventDefault();
    if (!newInstallData.userName.trim() || !newInstallData.deviceModel.trim()) {
      showToast('Please enter Partner Name and Device Model.');
      return;
    }
    const created = registerAppInstall({
      ...newInstallData,
      appVersion: newInstallData.appVersion || latestRelease.version,
      userId: newInstallData.userId.trim() || `USR-${Math.floor(1000 + Math.random() * 9000)}`
    });
    loadData();
    setShowRegisterModal(false);
    setNewInstallData({
      userName: '',
      userId: '',
      userRole: 'Contractor',
      userMobile: '',
      userEmail: '',
      location: '',
      deviceModel: '',
      deviceBrand: 'Android',
      os: 'Android 14',
      appVersion: latestRelease.version,
      installSource: 'Direct APK (duragritvitrified.com)',
      networkType: '5G',
      batteryLevel: '95%'
    });
    showToast(`Device registered for ${created.userName} (${created.deviceModel}).`);
  };

  const filteredInstalls = installs.filter(item => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q ||
      (item.userName || '').toLowerCase().includes(q) ||
      (item.userId || '').toLowerCase().includes(q) ||
      (item.userMobile || '').includes(q) ||
      (item.deviceModel || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q) ||
      (item.id || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || (item.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesOs = osFilter === 'all' || (item.os || '').toLowerCase().includes(osFilter.toLowerCase());
    const isLatest = (item.appVersion || '') === (latestRelease?.version || '');
    const matchesVersion = versionFilter === 'all' ||
      (versionFilter === 'latest' && isLatest) ||
      (versionFilter === 'outdated' && !isLatest);
    const matchesRole = roleFilter === 'all' || (item.userRole || '').toLowerCase() === roleFilter.toLowerCase();
    const matchesSource = sourceFilter === 'all' || (item.installSource || '').toLowerCase().includes(sourceFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesOs && matchesVersion && matchesRole && matchesSource;
  });

  // Fleet Adoption Metrics
  const totalFleetCount = installs.length;
  const onLatestCount = installs.filter(i => (i.appVersion || '') === (latestRelease?.version || '')).length;
  const outdatedCount = installs.filter(i => (i.appVersion || '') !== (latestRelease?.version || '')).length;
  const activeNowCount = installs.filter(i => i.status === 'Active').length;
  const blockedCount = installs.filter(i => i.status === 'Blocked').length;
  const androidCount = installs.filter(i => (i.os || '').includes('Android')).length;
  const iosCount = installs.filter(i => (i.os || '').includes('iOS')).length;
  const androidPct = totalFleetCount > 0 ? Math.round((androidCount / (androidCount + iosCount || 1)) * 100) : 0;
  const adoptionPct = totalFleetCount > 0 ? Math.round((onLatestCount / totalFleetCount) * 100) : 100;

  return (
    <div className="space-y-6 select-none font-sans pb-12">
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-[#A62C11] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/20 flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-[#FEF2EE] text-[#C84826] rounded-xl border border-[#F9CEB8]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Mobile App Installations &amp; Device Telemetry
              </h1>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>LIVE DEVICE AUDIT</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit contractor &amp; dealer devices, APK build versions, OS distribution, and active session security.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-3.5 py-2 bg-[#FEF2EE] hover:bg-[#FDE5DC] text-[#C84826] border border-[#F9CEB8] text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Device</span>
          </button>

          {outdatedCount > 0 && (
            <button
              onClick={handleBulkUpdatePrompt}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
              <span>Notify Outdated ({outdatedCount})</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 DEDICATED SECTION: OTA VERSION MANAGEMENT & AUTO-PUSH CONTROL BLOCK    */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-white via-[#FCFBF9] to-[#FEF8F5] border-2 border-[#F9CEB8] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F9CEB8]/60 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#A62C11] text-white rounded-2xl shadow-sm">
              <Rocket className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Over-The-Air (OTA) App Version Management &amp; Auto-Push Console
                </h2>
                <span className="bg-[#A62C11] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  LIVE OTA SYNC
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Push code &amp; feature updates directly to installed contractor and vendor mobile apps. Instant notification delivered with one-click adoption.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Release History ({releases.length})</span>
            </button>

            <button
              onClick={handleOpenPushModal}
              className="px-4 py-2 bg-[#A62C11] hover:bg-[#8B230C] text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Rocket className="w-4 h-4 text-white" />
              <span>Push New Version / OTA Release</span>
            </button>
          </div>
        </div>

        {/* 3 Interactive OTA Status Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Panel 1: Live Production Release Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FEF2EE] rounded-bl-full pointer-events-none -z-0 opacity-60"></div>
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Current Live Release
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                <span>PRODUCTION LIVE</span>
              </span>
            </div>

            <div className="relative z-10 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {latestRelease.version}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                Build #{latestRelease.buildNumber}
              </span>
            </div>

            <div className="relative z-10 bg-[#FAF9F6] border border-stone-200/80 rounded-xl p-2.5 space-y-1">
              <span className="text-[11px] font-bold text-slate-900 block truncate">
                {latestRelease.title || 'Official Production Rollout'}
              </span>
              <p className="text-[10.5px] text-slate-600 leading-relaxed line-clamp-2">
                {latestRelease.changelog || 'Performance optimizations and direct mobile serialization engine sync.'}
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>Deployed: {latestRelease.releaseDate}</span>
              <span>{latestRelease.downloadSize || '18.4 MB'}</span>
            </div>
          </div>

          {/* Panel 2: Live Fleet Adoption Progress Meter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Fleet OTA Adoption Rate
              </span>
              <span className="text-[11px] font-black text-[#A62C11] font-mono">
                {onLatestCount} / {totalFleetCount} Devices
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {adoptionPct}%
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {outdatedCount === 0 ? '✓ 100% Up to Date' : `${outdatedCount} pending upgrade`}
              </span>
            </div>

            {/* Visual Multi-Segment Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex border border-slate-200">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${adoptionPct}%` }}
                  title={`${adoptionPct}% on ${latestRelease.version}`}
                ></div>
                {outdatedCount > 0 && (
                  <div
                    className="bg-amber-400 h-full transition-all duration-500"
                    style={{ width: `${100 - adoptionPct}%` }}
                    title={`${outdatedCount} outdated devices`}
                  ></div>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Latest {latestRelease.version} ({onLatestCount})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Older Versions ({outdatedCount})</span>
                </span>
              </div>
            </div>

            {outdatedCount > 0 ? (
              <button
                onClick={handleBulkUpdatePrompt}
                className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg border border-amber-300 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
                <span>Re-broadcast OTA Alert to Outdated ({outdatedCount})</span>
              </button>
            ) : (
              <div className="py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 text-center flex items-center justify-center space-x-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>All connected fleet devices running latest code!</span>
              </div>
            )}
          </div>

          {/* Panel 3: In-App Code Push Engine & Real-time Synchronization */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Real-time App Push Engine
                </span>
                <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                </span>
              </div>

              <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Channel Protocol:</span>
                  <span className="font-mono font-bold text-slate-800">WebSocket + DOM Broadcast</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Target Fleet:</span>
                  <span className="font-mono font-bold text-slate-800">Contractors &amp; Vendors</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">In-App Prompt:</span>
                  <span className="font-bold text-emerald-600">Instant One-Click Apply</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenPushModal}
              className="w-full py-2 bg-[#FEF2EE] hover:bg-[#FDE5DC] text-[#C84826] border border-[#F9CEB8] text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#C84826]" />
              <span>Deploy Code Update to Active Apps</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Total Installations</span>
            <div className="p-1.5 bg-[#FEF2EE] text-[#C84826] rounded-lg">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalFleetCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Registered Partner Devices</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Active &amp; Online</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {activeNowCount} / {installs.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified Active Sessions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">OS Distribution</span>
            <div className="p-1.5 bg-[#FEF2EE] text-[#C84826] rounded-lg">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{androidPct}%</span>
            <span className="text-[11px] font-bold text-[#C84826] bg-[#FEF2EE] px-1.5 py-0.5 rounded">Android</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{installs.length > 0 ? `${100 - androidPct}% iOS` : 'No devices yet'}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Latest Build ({latestRelease.version})</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{onLatestCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Build #{latestRelease.buildNumber} (Prod)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Security Integrity</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{blockedCount}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{blockedCount > 0 ? 'Blocked Devices' : 'All Clear'}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by User Name, USR-ID, Mobile, Device Model, or City..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#C84826] focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
            >
              <option value="all">Version: All</option>
              <option value="latest">Latest ({latestRelease.version})</option>
              <option value="outdated">Outdated / Pending</option>
            </select>

            <select
              value={osFilter}
              onChange={(e) => setOsFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
            >
              <option value="all">OS: All</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Installation Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">User &amp; Partner ID</th>
                <th className="py-3.5 px-4">Device Model</th>
                <th className="py-3.5 px-4">OS</th>
                <th className="py-3.5 px-4">App Version &amp; Status</th>
                <th className="py-3.5 px-4">Install Date</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInstalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Smartphone className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No mobile app installations recorded yet</p>
                    <p className="text-[11px] mt-0.5">
                      Devices appear here automatically when partners use the mobile app or when registered via &ldquo;Register Device&rdquo;.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInstalls.map((inst) => {
                  const isBlocked = inst.status === 'Blocked';
                  const isActive = inst.status === 'Active';
                  const isLatest = (inst.appVersion || '') === (latestRelease.version || '');

                  return (
                    <tr
                      key={inst.id}
                      onClick={() => setSelectedDevice(inst)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#FEF2EE] text-[#C84826] font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                            {(inst.userName || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{inst.userName}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[#C84826] text-[10.5px] font-bold">{inst.userId}</span>
                              <span className="text-[10px] text-slate-400">• {inst.userRole}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{inst.deviceModel}</span>
                        <span className="text-[10.5px] text-slate-400 font-mono">{inst.networkType || '5G'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10.5px]">
                          {inst.os}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {inst.appVersion || 'v4.8.2'}
                          </span>
                          {isLatest ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                              Latest ✓
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                              <span>Update Pending</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {inst.installDate}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          <span>{inst.lastActive}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isBlocked
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                          {!isLatest && (
                            <button
                              onClick={(e) => handlePromptUpdate(inst.id, e)}
                              title={`Push OTA upgrade prompt for ${latestRelease.version}`}
                              className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition cursor-pointer"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => handlePing(inst.id, e)}
                            title="Ping Device"
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleToggleStatus(inst.id, e)}
                            title={isBlocked ? 'Reactivate Device' : 'Block Device'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-rose-500 hover:bg-rose-50'
                            }`}
                          >
                            {isBlocked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => setSelectedDevice(inst)}
                            title="View Full Telemetry Dossier"
                            className="p-1.5 hover:bg-[#FEF2EE] text-[#C84826] rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
      {/* MODAL 1: PUSH NEW VERSION / OTA RELEASE MODAL                             */}
      {/* ========================================================================= */}
      {showPushModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#A62C11] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Rocket className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-extrabold text-sm">Deploy Over-The-Air (OTA) Release</h3>
                  <p className="text-[11px] text-white/80">Auto-push updates to installed contractor &amp; vendor mobile apps</p>
                </div>
              </div>
              <button
                onClick={() => setShowPushModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishRelease} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="bg-[#FEF2EE] border border-[#F9CEB8] rounded-2xl p-3.5 text-xs text-[#A62C11] flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#C84826]" />
                <p className="leading-relaxed">
                  Publishing this release archives <strong>{latestRelease.version}</strong> and sets the new version as <strong>LIVE</strong>. All active contractor and vendor apps will receive an instant in-app update banner.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-slate-600">
                    Release Version Tag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. v4.8.3"
                    value={newReleaseForm.version}
                    onChange={(e) => setNewReleaseForm({ ...newReleaseForm, version: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-slate-600">
                    Deploying Authority
                  </label>
                  <input
                    type="text"
                    value={newReleaseForm.author}
                    onChange={(e) => setNewReleaseForm({ ...newReleaseForm, author: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-slate-600">
                  Release Headline / Feature Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instant UPI Payout Ledger & Camera Scanner Patch"
                  value={newReleaseForm.title}
                  onChange={(e) => setNewReleaseForm({ ...newReleaseForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-slate-600">
                  Changelog &amp; Release Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="List the key changes, bug fixes, or enhancements applied to this build..."
                  value={newReleaseForm.changelog}
                  onChange={(e) => setNewReleaseForm({ ...newReleaseForm, changelog: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C84826] resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isMandatory"
                  checked={newReleaseForm.isMandatory}
                  onChange={(e) => setNewReleaseForm({ ...newReleaseForm, isMandatory: e.target.checked })}
                  className="w-4 h-4 rounded text-[#A62C11] focus:ring-[#A62C11] cursor-pointer"
                />
                <label htmlFor="isMandatory" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Mandatory Security &amp; Compatibility Release (High Priority)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPushModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#A62C11] hover:bg-[#8B230C] text-white rounded-xl text-xs font-black shadow-md transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Rocket className="w-3.5 h-3.5 text-white" />
                  <span>Push OTA Release Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RELEASE HISTORY & CHANGELOG LOG                                  */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <History className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-extrabold text-sm">OTA Software Release History &amp; Changelogs</h3>
                  <p className="text-[11px] text-slate-400">Chronological ledger of published APK/PWA bundles</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 text-xs">
              {releases.map((rel, idx) => {
                const isLive = rel.status === 'LIVE';
                const adoptedCount = installs.filter(i => (i.appVersion || '') === rel.version).length;

                return (
                  <div
                    key={rel.id || idx}
                    className={`p-4 rounded-2xl border transition ${
                      isLive
                        ? 'bg-[#FEF8F5] border-[#F9CEB8] shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-base font-black text-slate-900">{rel.version}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Build #{rel.buildNumber}</span>
                        <span
                          className={`text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isLive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono'
                              : 'bg-slate-100 text-slate-600 font-mono'
                          }`}
                        >
                          {rel.status}
                        </span>
                      </div>

                      <span className="text-[10.5px] font-mono text-slate-400">
                        {rel.releaseDate}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs mt-1.5">{rel.title}</h4>
                    <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">{rel.changelog}</p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
                      <span>Author: <strong>{rel.author}</strong></span>
                      <span>Active Devices on this build: <strong className="text-slate-900 font-mono">{adoptedCount}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REGISTER NEW DEVICE MODAL                                        */}
      {/* ========================================================================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-[#C84826] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Smartphone className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm">Register Mobile App Installation</h3>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInstall} className="p-5 space-y-3.5 text-xs text-slate-700">
              {vendors.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Select Registered Partner (Optional)</label>
                  <select
                    onChange={(e) => {
                      const found = vendors.find(v => String(v.vendorId || v.id) === e.target.value);
                      if (found) {
                        setNewInstallData(prev => ({
                          ...prev,
                          userName: found.contactPerson || found.companyName,
                          userId: String(found.vendorId || found.id),
                          userRole: found.category || 'Contractor',
                          userMobile: found.phone || found.mobile || '',
                          userEmail: found.email || '',
                          location: found.city ? `${found.city}, ${found.state || 'GJ'}` : (found.location || '')
                        }));
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="">-- Choose from Vendor / Contractor Directory --</option>
                    {vendors.map(v => (
                      <option key={v.id || v.vendorId} value={String(v.vendorId || v.id)}>
                        {v.companyName} - {v.contactPerson || v.category} ({v.phone || v.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Partner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter partner name"
                    value={newInstallData.userName}
                    onChange={(e) => setNewInstallData({ ...newInstallData, userName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">User ID</label>
                  <input
                    type="text"
                    placeholder="Auto if blank"
                    value={newInstallData.userId}
                    onChange={(e) => setNewInstallData({ ...newInstallData, userId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Device Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samsung Galaxy A55"
                    value={newInstallData.deviceModel}
                    onChange={(e) => setNewInstallData({ ...newInstallData, deviceModel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Operating System</label>
                  <select
                    value={newInstallData.os}
                    onChange={(e) => setNewInstallData({ ...newInstallData, os: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Android 14">Android 14</option>
                    <option value="Android 13">Android 13</option>
                    <option value="iOS 17">iOS 17</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm &amp; Register Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VIEW DEVICE DOSSIER MODAL                                        */}
      {/* ========================================================================= */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-black font-mono text-[#F9CEB8]">
                  {(selectedDevice.userName || 'P').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">{selectedDevice.userName}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedDevice.deviceModel} • {selectedDevice.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDevice(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">App Software Version</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-base font-black font-mono text-slate-900">{selectedDevice.appVersion}</span>
                    {selectedDevice.appVersion === latestRelease.version ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Latest ✓</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Pending Update</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Session Status</span>
                  <span className="text-base font-black font-mono text-emerald-700 mt-1 block">
                    {selectedDevice.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block">
                  Hardware &amp; Network Specs
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>OS: <strong>{selectedDevice.os}</strong></div>
                  <div>Network: <strong>{selectedDevice.networkType}</strong></div>
                  <div>Battery: <strong>{selectedDevice.batteryLevel}</strong></div>
                  <div>Storage Free: <strong>{selectedDevice.storageFree}</strong></div>
                  <div>IP Address: <strong className="font-mono">{selectedDevice.ipAddress}</strong></div>
                  <div>UUID: <strong className="font-mono text-[10px]">{selectedDevice.deviceUuid}</strong></div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block">
                  Security Integrity Audit
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-emerald-700 font-semibold">✓ Root Status: Pass (Not Rooted)</div>
                  <div className="text-emerald-700 font-semibold">✓ Mock GPS: Pass (Disabled)</div>
                  <div className="text-emerald-700 font-semibold">✓ Biometrics: Fingerprint Enabled</div>
                  <div className="text-emerald-700 font-semibold">✓ Play Protect Certified</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={(e) => handleToggleStatus(selectedDevice.id, e)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  selectedDevice.status === 'Active'
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                {selectedDevice.status === 'Active' ? 'Deactivate / Block Device' : 'Reactivate Device'}
              </button>

              <button
                onClick={() => setSelectedDevice(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
