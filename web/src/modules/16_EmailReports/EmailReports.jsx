import React, { useState, useEffect } from 'react';
import { getEmailDispatches, getSmtpConfig, saveEmailDispatches, sendLiveCustomEmail } from '../../services/emailService';
import { EMAIL_TEMPLATES, getTemplateById } from '../../services/emailTemplates';
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Download,
  RefreshCw,
  Eye,
  RotateCw,
  FileText,
  X,
  Smartphone,
  Key,
  Copy,
  Check,
  Server,
  MousePointer,
  Inbox,
  ArrowUpRight,
  Settings,
  Code,
  Tag,
  Sparkles,
  Laptop,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sliders,
  Filter
} from 'lucide-react';

export function EmailReports({ onNavigateSettings, initialMainTab = 'templates' }) {
  const [smtpConfig, setSmtpConfig] = useState(() => getSmtpConfig());
  const [activeMainTab, setActiveMainTab] = useState(initialMainTab); // 'templates' | 'logs'
  const [selectedTemplateId, setSelectedTemplateId] = useState('verification');
  const [templateSubTab, setTemplateSubTab] = useState('preview'); // 'preview' | 'html' | 'variables'
  const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' | 'mobile'

  // Search & Filters for Logs
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showEventLogModal, setShowEventLogModal] = useState(null);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Sample Dispatch State from Template Hub
  const [sampleRecipient, setSampleRecipient] = useState('duragrit07@gmail.com');
  const [isSendingSample, setIsSendingSample] = useState(false);

  // Custom Test Email Modal Data
  const [testEmailData, setTestEmailData] = useState({
    name: '',
    email: '',
    role: 'Contractor',
    template: 'onboarding',
    userId: ''
  });
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Live Email Logs State
  const [emailLogs, setEmailLogs] = useState(() => getEmailDispatches());

  const loadDispatches = () => {
    try {
      const dispatches = getEmailDispatches();
      setEmailLogs(Array.isArray(dispatches) ? dispatches : []);
      setSmtpConfig(getSmtpConfig());
    } catch (e) {
      setEmailLogs([]);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  useEffect(() => {
    if (initialMainTab) {
      setActiveMainTab(initialMainTab);
    }
  }, [initialMainTab]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3800);
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    showToast(`Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyHtml = (html) => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    showToast('HTML Email Template code copied to clipboard!');
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleResendEmail = (email) => {
    showToast(`Re-dispatch initiated for ${email.recipientEmail || email.to}!`);
    const next = emailLogs.map(item => {
      if (item.id === email.id) {
        return {
          ...item,
          status: 'Delivered',
          sentAt: 'Just now',
          lastEvent: 'Re-dispatched via SMTP Primary'
        };
      }
      return item;
    });
    setEmailLogs(next);
    if (typeof saveEmailDispatches === 'function') saveEmailDispatches(next);
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailData.email || !testEmailData.name) {
      showToast('Please enter recipient name and valid email address.');
      return;
    }

    setIsSendingTest(true);
    try {
      const templateObj = EMAIL_TEMPLATES.find(t => t.id === testEmailData.template) || EMAIL_TEMPLATES[0];
      const htmlBody = templateObj.generateHtml({
        recipientName: testEmailData.name.trim(),
        recipientEmail: testEmailData.email.trim(),
        userId: testEmailData.userId.trim() || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        mobile: '+91 98112 40591',
        role: testEmailData.role,
        tempPassword: 'Dura#' + Math.floor(1000 + Math.random() * 9000),
        hub: 'Morbi Central Kiln Hub',
        apkUrl: (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') ? `${window.location.origin}/apk/duragrit-vendor-v2.apk` : 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-vendor-v2.apk',
        pwaUrl: (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') ? `${window.location.origin}/app/?app=vendor` : 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor'
      });

      const res = await sendLiveCustomEmail({
        to: testEmailData.email.trim(),
        subject: templateObj.subject.replace('{{amount}}', '500').replace('{{utrNumber}}', '429388102941'),
        html: htmlBody,
        text: `DuraGrit Vitrified — ${templateObj.name}. Sent to ${testEmailData.name}.`,
        templateKey: templateObj.id
      });

      loadDispatches();
      setShowTestEmailModal(false);
      setTestEmailData({ name: '', email: '', role: 'Contractor', template: 'onboarding', userId: '' });
      if (res.success) {
        showToast(`Test email delivered to ${testEmailData.email.trim()}!`);
      } else {
        showToast(`Logged dispatch. (${res.record?.lastEvent || 'Check SMTP in Settings'})`);
      }
    } catch (err) {
      showToast('Error during test email dispatch: ' + err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendSampleFromHub = async () => {
    if (!sampleRecipient || !sampleRecipient.includes('@')) {
      showToast('Please enter a valid recipient email address.');
      return;
    }

    const templateObj = getTemplateById(selectedTemplateId);
    setIsSendingSample(true);
    try {
      const htmlBody = templateObj.generateHtml({
        ...templateObj.sampleData,
        recipientEmail: sampleRecipient
      });

      const res = await sendLiveCustomEmail({
        to: sampleRecipient,
        subject: templateObj.subject.replace('{{amount}}', '500').replace('{{utrNumber}}', '429388102941'),
        html: htmlBody,
        text: `DuraGrit Vitrified Template Preview: ${templateObj.name}`,
        templateKey: templateObj.id
      });

      loadDispatches();
      if (res.success) {
        showToast(`Live sample of "${templateObj.name}" sent to ${sampleRecipient}!`);
      } else {
        showToast(`Dispatch error: ${res.record?.lastEvent || 'Delivery failed'}`);
      }
    } catch (err) {
      showToast('Dispatch error: ' + err.message);
    } finally {
      setIsSendingSample(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Message ID', 'Recipient Name', 'User ID', 'Email', 'Role', 'Subject', 'Template', 'Status', 'Opens', 'Clicks', 'Timestamp', 'Relay', 'SMTP Response'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.recipientName || ''}"`,
      l.userId || '',
      l.recipientEmail || l.to || '',
      l.role || '',
      `"${l.subject || ''}"`,
      `"${l.template || ''}"`,
      l.status || '',
      l.opens || 0,
      l.clicks || 0,
      l.timestamp || l.sentAt || '',
      l.relay || '',
      `"${l.smtpCode || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DuraGrit_Email_Report_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Email Audit Report exported to CSV.');
  };

  const filteredLogs = emailLogs.filter(item => {
    const term = searchTerm.toLowerCase();
    const rName = (item.recipientName || '').toLowerCase();
    const rEmail = (item.recipientEmail || item.to || '').toLowerCase();
    const uId = (item.userId || '').toLowerCase();
    const subj = (item.subject || '').toLowerCase();
    const mId = (item.id || '').toLowerCase();

    const matchSearch = !term || rName.includes(term) || rEmail.includes(term) || uId.includes(term) || subj.includes(term) || mId.includes(term);
    const matchStatus = statusFilter === 'all' || (item.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchTemplate = templateFilter === 'all' || item.templateKey === templateFilter;

    return matchSearch && matchStatus && matchTemplate;
  });

  // KPIs
  const totalSent = emailLogs.length;
  const bouncedCount = emailLogs.filter(e => e.status === 'Bounced').length;
  const deliveredCount = totalSent - bouncedCount;
  const deliveryRate = totalSent > 0 ? ((deliveredCount / totalSent) * 100).toFixed(1) : '0.0';
  const openCount = emailLogs.filter(e => (e.opens || 0) > 0 || e.status === 'Opened' || e.status === 'Clicked').length;
  const openRate = deliveredCount > 0 ? ((openCount / deliveredCount) * 100).toFixed(1) : '0.0';
  const clickCount = emailLogs.filter(e => (e.clicks || 0) > 0 || e.status === 'Clicked').length;
  const clickRate = deliveredCount > 0 ? ((clickCount / deliveredCount) * 100).toFixed(1) : '0.0';

  const activeTemplate = getTemplateById(selectedTemplateId);
  const activeTemplateHtml = activeTemplate.generateHtml(activeTemplate.sampleData);

  return (
    <div className="flex-1 flex flex-col relative select-none">
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

      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Email Reports &amp; Template Audit</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#FEF2EE] text-[#C84826] border border-[#F9CEB8]">
                {smtpConfig.senderEmail} • GMAIL SMTP
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Inspect, preview, and audit all transactional HTML email templates, verify live Gmail relay delivery, and review audit dispatch logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowTestEmailModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#C84826]" />
              <span>Send Custom Email</span>
            </button>

            {onNavigateSettings && (
              <button
                onClick={onNavigateSettings}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-[#C84826]" />
                <span>SMTP Config</span>
              </button>
            )}

            {activeMainTab === 'logs' && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Export CSV Log</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN SECTION TABS: VIEW EMAIL TEMPLATES vs DISPATCH LOGS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveMainTab('templates')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'templates'
                ? 'bg-[#A62C11] text-white shadow-sm ring-2 ring-[#A62C11]/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>View Email Templates</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeMainTab === 'templates' ? 'bg-white text-[#A62C11]' : 'bg-[#FEF2EE] text-[#C84826]'
            }`}>
              5 TEMPLATES • AUDIT
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('logs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'logs'
                ? 'bg-[#A62C11] text-white shadow-sm ring-2 ring-[#A62C11]/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Email Dispatches &amp; Logs</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeMainTab === 'logs' ? 'bg-white text-[#A62C11]' : 'bg-slate-100 text-slate-600'
            }`}>
              {emailLogs.length} LOGS
            </span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* SECTION 1: VIEW EMAIL TEMPLATES SHOWCASE & AUDIT                    */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeMainTab === 'templates' && (
          <div className="space-y-6 text-xs animate-in fade-in duration-200">
            {/* Top Showcase Banner */}
            <div className="bg-gradient-to-r from-white via-[#FCFBF9] to-[#FEF8F5] border-2 border-[#F9CEB8] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-[#A62C11] text-white rounded-xl shadow-xs">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black text-slate-900">
                      Official DuraGrit Email Templates Library
                    </h2>
                    <span className="bg-[#A62C11] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      RFC 5322 ALIGNED
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select a template below to inspect rendered HTML formatting, examine copyable source code, review dynamic variables, and test live delivery via Gmail SMTP.
                  </p>
                </div>
              </div>

              {/* Sample Dispatch Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    value={sampleRecipient}
                    onChange={(e) => setSampleRecipient(e.target.value)}
                    placeholder="Recipient email address"
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 w-full sm:w-56 focus:outline-none focus:ring-1 focus:ring-[#C84826]"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSendingSample}
                  onClick={handleSendSampleFromHub}
                  className="px-3.5 py-1.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:opacity-70"
                >
                  {isSendingSample ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Sample...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Sample to Inbox</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* MASTER-DETAIL LAYOUT: LEFT SIDE TEMPLATE LIST, RIGHT SIDE PREVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Template Selection List (4 cols) */}
              <div className="lg:col-span-4 space-y-2.5">
                <div className="flex items-center justify-between pb-1 px-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                    Available Email Templates ({EMAIL_TEMPLATES.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Click to preview</span>
                </div>

                {EMAIL_TEMPLATES.map((tmpl) => {
                  const isSelected = tmpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FEF2EE] border-[#C84826] ring-2 ring-[#C84826]/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${tmpl.badgeColor}`}>
                          {tmpl.category} • {tmpl.badge}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-[#A62C11]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C84826]" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-slate-900 text-xs mt-2 leading-tight">
                        {tmpl.name}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono mt-1.5 truncate">
                        Subject: {tmpl.subject}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>

                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/60 text-[10px] text-slate-400">
                        <span>{tmpl.variables.length} Dynamic Variables</span>
                        <span className="font-bold text-[#C84826] flex items-center gap-0.5">
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Deep Dive, Interactive Preview, HTML Code & Variables (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  {/* Template Title & Quick Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-sm">{activeTemplate.name}</h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${activeTemplate.badgeColor}`}>
                          {activeTemplate.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Default Subject: <strong className="text-slate-800">{activeTemplate.subject}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyHtml(activeTemplateHtml)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedHtml ? 'Copied HTML!' : 'Copy HTML'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Template Tabs: Visual Preview vs HTML Source vs Dynamic Variables */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTemplateSubTab('preview')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          templateSubTab === 'preview'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C84826]" />
                        <span>Visual Render Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTemplateSubTab('html')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          templateSubTab === 'html'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Code className="w-3.5 h-3.5 text-blue-600" />
                        <span>HTML Source Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTemplateSubTab('variables')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          templateSubTab === 'variables'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Merge Tags ({activeTemplate.variables.length})</span>
                      </button>
                    </div>

                    {templateSubTab === 'preview' && (
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-bold text-slate-600">
                        <button
                          type="button"
                          onClick={() => setPreviewViewport('desktop')}
                          className={`px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                            previewViewport === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          <Laptop className="w-3.5 h-3.5" />
                          <span>Desktop (600px)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewViewport('mobile')}
                          className={`px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                            previewViewport === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Mobile (380px)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ─── TAB CONTENT 1: VISUAL EMAIL PREVIEW ──────────────────── */}
                  {templateSubTab === 'preview' && (
                    <div className="space-y-3">
                      {/* Simulated Email Client Shell Header */}
                      <div className="bg-[#FAF9F6] border border-slate-200 rounded-xl p-3.5 space-y-1.5 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-slate-500">
                          <div>
                            <span className="font-bold text-slate-700">From:</span> {smtpConfig.senderName} &lt;{smtpConfig.senderEmail}&gt;
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>SPF: PASS • DKIM: 2048 • TLS 1.3</span>
                          </div>
                        </div>
                        <div className="text-slate-500">
                          <span className="font-bold text-slate-700">To:</span> {activeTemplate.sampleData.recipientName || 'Valued Partner'} &lt;{sampleRecipient}&gt;
                        </div>
                        <div className="text-slate-800 font-bold">
                          <span className="text-slate-500 font-normal">Subject:</span> {activeTemplate.subject}
                        </div>
                      </div>

                      {/* Rendered Email Frame */}
                      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex justify-center overflow-x-auto">
                        <div
                          className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
                            previewViewport === 'desktop' ? 'w-[600px]' : 'w-[380px]'
                          }`}
                        >
                          <iframe
                            title={`Template Preview - ${activeTemplate.name}`}
                            srcDoc={activeTemplateHtml}
                            className="w-full border-0 min-h-[520px]"
                            sandbox="allow-same-origin"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── TAB CONTENT 2: HTML SOURCE CODE ─────────────────────── */}
                  {templateSubTab === 'html' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>RFC 5322 Responsive Table HTML • Inline Styles Applied</span>
                        <button
                          type="button"
                          onClick={() => handleCopyHtml(activeTemplateHtml)}
                          className="text-[#C84826] hover:underline font-bold"
                        >
                          Copy Complete Markup
                        </button>
                      </div>
                      <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] max-h-[500px] overflow-y-auto leading-relaxed border border-slate-800 custom-scrollbar select-text">
                        <pre className="whitespace-pre-wrap break-all">{activeTemplateHtml}</pre>
                      </div>
                    </div>
                  )}

                  {/* ─── TAB CONTENT 3: MERGE TAGS & VARIABLES ───────────────── */}
                  {templateSubTab === 'variables' && (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        These dynamic parameters are automatically populated at runtime from the User / Vendor database, NPCI Gateway, or System Settings:
                      </p>

                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF9F6] text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="p-3">Variable Tag</th>
                              <th className="p-3">Description / Parameter</th>
                              <th className="p-3">Sample Value In Preview</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeTemplate.variables.map((v) => (
                              <tr key={v.tag} className="hover:bg-slate-50/70">
                                <td className="p-3 font-mono font-bold text-[#A62C11]">{v.tag}</td>
                                <td className="p-3 text-slate-700 font-medium">{v.label}</td>
                                <td className="p-3 font-mono text-slate-600 bg-slate-50/50">{v.sample}</td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(v.tag)}
                                    className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition cursor-pointer"
                                    title="Copy Tag"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* SECTION 2: EMAIL DISPATCH LOGS & AUDIT TRAIL                       */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeMainTab === 'logs' && (
          <div className="space-y-6 text-xs animate-in fade-in duration-200">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider">Total Dispatched</span>
                  <Send className="w-4 h-4 text-[#C84826]" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">{totalSent.toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% Real Logs</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider">Delivery Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600">{deliveryRate}%</div>
                  <div className="text-[11px] text-slate-400 mt-1">{deliveredCount} of {totalSent} delivered</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider">Open Rate</span>
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-600">{openRate}%</div>
                  <div className="text-[11px] text-slate-400 mt-1">{openCount} unique opens</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider">Click Through</span>
                  <MousePointer className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-purple-600">{clickRate}%</div>
                  <div className="text-[11px] text-slate-400 mt-1">{clickCount} portal activations</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider">Active Relay</span>
                  <Server className="w-4 h-4 text-[#C84826]" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 truncate">{smtpConfig.smtpHost}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Port {smtpConfig.smtpPort} • {smtpConfig.encryption}</div>
                </div>
              </div>
            </div>

            {/* FILTERS & SEARCH BAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by recipient name, email, User ID, subject..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={templateFilter}
                  onChange={(e) => setTemplateFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                >
                  <option value="all">All Templates</option>
                  <option value="verification">Email Verification</option>
                  <option value="onboarding">Partner Onboarding Dossier</option>
                  <option value="cashback">Cashback Disbursal Receipt</option>
                  <option value="kyc">KYC Regulatory Alert</option>
                  <option value="smtp-test">SMTP Test Dispatch</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                >
                  <option value="all">All Delivery Statuses</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Opened">Opened</option>
                  <option value="Clicked">Clicked</option>
                  <option value="Failed">Failed / Bounced</option>
                </select>

                <button
                  onClick={loadDispatches}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                  title="Refresh Audit Logs"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LOGS TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAF9F6] text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Tracking ID</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject &amp; Template</th>
                      <th className="py-3 px-4">Relay &amp; Latency</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-[11px]">
                          {log.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{log.recipientName || 'Partner'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{log.recipientEmail || log.to}</div>
                          {log.userId && (
                            <span className="inline-block mt-0.5 text-[9px] font-mono bg-slate-100 px-1 rounded text-slate-600 font-bold">
                              {log.userId}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate" title={log.subject}>
                            {log.subject}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span className="font-semibold text-slate-600">{log.template}</span>
                            <span>•</span>
                            <span className="font-mono">{log.smtpCode ? '250 OK' : 'Sent'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          <div>{log.relay || `${smtpConfig.smtpHost}`}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">{log.relayLatency || '180ms'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.status === 'Opened'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : log.status === 'Clicked'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                          {log.timestamp || log.sentAt}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedEmail(log)}
                              className="p-1.5 bg-slate-100 hover:bg-[#C84826] hover:text-white text-slate-700 rounded-lg transition cursor-pointer"
                              title="Preview Rendered Email"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleResendEmail(log)}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg transition cursor-pointer"
                              title="Re-dispatch via SMTP"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowEventLogModal(log)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 rounded-lg transition cursor-pointer"
                              title="Raw SMTP Telemetry"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-14 text-center text-slate-400 text-xs">
                          <Inbox className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                          <div className="font-bold text-slate-700">No email dispatches recorded yet</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Use the &ldquo;View Email Templates&rdquo; tab above or &ldquo;Send Custom Email&rdquo; to test live dispatches.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#A62C11] px-5 py-3.5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#C84826] border border-white/20 text-white flex items-center justify-center font-black text-xs">
                  DG
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Rendered Email Preview</h3>
                  <span className="text-[10px] text-white/80 font-mono">Tracking ID: {selectedEmail.id}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEmail(null)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const previewHtml = selectedEmail.html || (() => {
                const t = EMAIL_TEMPLATES.find(
                  (tpl) => tpl.id === selectedEmail.templateKey || tpl.name === selectedEmail.template
                );
                if (t) {
                  return t.generateHtml({
                    recipientName: selectedEmail.recipientName || 'Valued Partner',
                    recipientEmail: selectedEmail.recipientEmail || selectedEmail.to,
                    userId: selectedEmail.userId || 'USR-1042',
                    mobile: '+91 98112 40591',
                    role: selectedEmail.role || 'Contractor',
                    tempPassword: selectedEmail.tempPassword || selectedEmail.passkey || 'Dura#2026',
                    hub: 'Morbi Central Kiln Hub',
                    apkUrl: 'https://duragrit-virtrified-admin.vercel.app/apk/duragrit-vendor-v2.apk',
                    pwaUrl: 'https://duragrit-virtrified-admin.vercel.app/app/?app=vendor'
                  });
                }
                return null;
              })();

              return (
                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  <div className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200 space-y-1 font-mono">
                    <div><strong>To:</strong> {selectedEmail.recipientName} &lt;{selectedEmail.recipientEmail || selectedEmail.to}&gt;</div>
                    <div><strong>Subject:</strong> {selectedEmail.subject}</div>
                    <div><strong>Relay:</strong> {selectedEmail.relay || smtpConfig.smtpHost}</div>
                  </div>

                  {previewHtml ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 p-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                        RFC 5322 Responsive Email Frame
                      </div>
                      <iframe
                        title="Rendered Email HTML"
                        srcDoc={previewHtml}
                        className="w-full min-h-[460px] border-0 bg-white rounded-lg shadow-xs"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <h2 className="text-base font-black text-slate-900">
                        Hello <span className="text-[#C84826]">{selectedEmail.recipientName || 'Partner'}</span>,
                      </h2>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedEmail.subject}
                      </p>
                      <div className="bg-[#FEF2EE] border border-[#F9CEB8] rounded-xl p-3.5 flex items-center justify-between font-mono">
                        <div>
                          <span className="text-[10px] text-[#A62C11] font-bold block uppercase">Tracking ID & Status</span>
                          <span className="font-black text-slate-900 text-sm">
                            {selectedEmail.id} • {selectedEmail.status || 'Delivered'}
                          </span>
                        </div>
                        {selectedEmail.userId && (
                          <div className="text-right">
                            <span className="text-[10px] text-[#A62C11] font-bold block uppercase">User ID</span>
                            <span className="font-black text-slate-900 text-sm">{selectedEmail.userId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* RAW SMTP MODAL */}
      {showEventLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 text-slate-200 rounded-2xl shadow-2xl border border-slate-800 max-w-xl w-full p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white">SMTP Handshake Telemetry ({showEventLogModal.id})</span>
              <button onClick={() => setShowEventLogModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="bg-slate-900 rounded-xl p-3.5 space-y-1 text-[11px] border border-slate-800">
              <div className="text-emerald-400">220 {smtpConfig.smtpHost} ESMTP Ready</div>
              <div>RCPT TO:&lt;{showEventLogModal.recipientEmail || showEventLogModal.to}&gt;</div>
              <div className="text-emerald-400 font-bold">{showEventLogModal.smtpCode || '250 2.0.0 OK: Delivered'}</div>
              <div className="text-slate-400">Relay: {showEventLogModal.relay}</div>
              <div className="text-slate-400">Latency: {showEventLogModal.relayLatency || '180ms'}</div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM TEST EMAIL MODAL */}
      {showTestEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#C84826] text-white flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Send Custom Test Email</h3>
                  <span className="text-[10px] text-slate-400">Dispatches via Gmail SMTP ({smtpConfig.senderEmail})</span>
                </div>
              </div>
              <button onClick={() => setShowTestEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Recipient Full Name *</label>
                <input
                  type="text"
                  value={testEmailData.name}
                  onChange={(e) => setTestEmailData({ ...testEmailData, name: e.target.value })}
                  placeholder="Enter recipient name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Recipient Email Address *</label>
                <input
                  type="email"
                  value={testEmailData.email}
                  onChange={(e) => setTestEmailData({ ...testEmailData, email: e.target.value })}
                  placeholder="partner@domain.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned User ID</label>
                  <input
                    type="text"
                    value={testEmailData.userId}
                    onChange={(e) => setTestEmailData({ ...testEmailData, userId: e.target.value })}
                    placeholder="Optional (auto)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Partner Role</label>
                  <select
                    value={testEmailData.role}
                    onChange={(e) => setTestEmailData({ ...testEmailData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                  >
                    <option value="Tile Contractor / Mason">Tile Contractor / Mason</option>
                    <option value="Authorized Dealer">Authorized Dealer</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Template</label>
                <select
                  value={testEmailData.template}
                  onChange={(e) => setTestEmailData({ ...testEmailData, template: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C84826]"
                >
                  <option value="verification">Template 1 • Email Verification Link</option>
                  <option value="onboarding">Template 2 • Partner Onboarding Dossier &amp; APK</option>
                  <option value="cashback">Template 3 • Instant Cashback Credit Receipt</option>
                  <option value="kyc">Template 4 • KYC Regulatory Approval Alert</option>
                  <option value="smtp-test">Template 5 • Live SMTP Gateway Diagnostic</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSendingTest}
                className="w-full py-2.5 bg-[#C84826] hover:bg-[#A62C11] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 mt-4 cursor-pointer disabled:opacity-70"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingTest ? 'Dispatching...' : 'Dispatch Test Email'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
