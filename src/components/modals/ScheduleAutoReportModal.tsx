import React, { useState, useEffect } from 'react';
import { Calendar, Mail, FileText, Filter, CheckCircle2, X, ShieldCheck, Clock } from 'lucide-react';

export const AUTO_REPORT_STORAGE_KEY = 'duragrit_auto_report_schedule_v1';

export interface AutoReportScheduleConfig {
  enabled: boolean;
  cadence: string;
  recipientEmails: string;
  format: string;
  channelFilter: string;
  updatedAt: string;
}

const DEFAULT_SCHEDULE_CONFIG: AutoReportScheduleConfig = {
  enabled: true,
  cadence: 'Monthly on 1st at 09:00 IST',
  recipientEmails: 'admin@duragritvitrified.com',
  format: 'PDF + CSV',
  channelFilter: 'All Channels: UPI Escrow & NEFT',
  updatedAt: new Date().toISOString(),
};

export function loadAutoReportSchedule(): AutoReportScheduleConfig {
  try {
    const raw = localStorage.getItem(AUTO_REPORT_STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SCHEDULE_CONFIG, ...parsed };
  } catch (_) {
    return DEFAULT_SCHEDULE_CONFIG;
  }
}

interface ScheduleAutoReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: AutoReportScheduleConfig) => void;
}

export const ScheduleAutoReportModal: React.FC<ScheduleAutoReportModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [config, setConfig] = useState<AutoReportScheduleConfig>(() => loadAutoReportSchedule());

  useEffect(() => {
    if (isOpen) {
      setConfig(loadAutoReportSchedule());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AutoReportScheduleConfig = {
      ...config,
      recipientEmails: config.recipientEmails.trim() || 'admin@duragritvitrified.com',
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(AUTO_REPORT_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
    if (onSaved) onSaved(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#A62C11] to-[#C84826] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/15 rounded-xl">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight">
                Schedule Automated Reconciliation Report
              </h3>
              <p className="text-[11px] text-white/80">
                Statutory Ledger Dispatch • Key: {AUTO_REPORT_STORAGE_KEY}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs text-slate-700">
          <div className="flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-emerald-950 block">Automated Dispatch Scheduler</span>
                <span className="text-[11px] text-emerald-700">
                  Delivers audited Sec 194C TDS &amp; NPCI ISO 27001 ledger automatically
                </span>
              </div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all relative peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* 1. Cadence */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C84826]" />
              <span>Report Cadence</span>
            </label>
            <select
              value={config.cadence}
              onChange={(e) => setConfig({ ...config, cadence: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
            >
              <option value="Monthly on 1st at 09:00 IST">Monthly on 1st at 09:00 IST</option>
              <option value="Weekly Digest">Weekly Digest (Every Monday at 09:00 IST)</option>
              <option value="Bi-Weekly Reconciliation">Bi-Weekly (1st &amp; 16th at 09:00 IST)</option>
            </select>
          </div>

          {/* 2. Recipient Official Emails */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Mail className="w-3.5 h-3.5 text-[#C84826]" />
              <span>Recipient Official Emails</span>
            </label>
            <input
              type="text"
              required
              value={config.recipientEmails}
              onChange={(e) => setConfig({ ...config, recipientEmails: e.target.value })}
              placeholder="admin@duragritvitrified.com, accounts@duragritvitrified.com"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#C84826]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Separate multiple executive email addresses with commas.
            </span>
          </div>

          {/* 3. Format & 4. Channel Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-[#C84826]" />
                <span>Attachment Format</span>
              </label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value })}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
              >
                <option value="PDF + CSV">PDF + CSV (Audited Bundle)</option>
                <option value="Audited PDF Only">Audited PDF Ledger Only</option>
                <option value="Reconciliation CSV Only">Reconciliation CSV Only</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <Filter className="w-3.5 h-3.5 text-[#C84826]" />
                <span>Channel Filter</span>
              </label>
              <select
                value={config.channelFilter}
                onChange={(e) => setConfig({ ...config, channelFilter: e.target.value })}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C84826] cursor-pointer"
              >
                <option value="All Channels: UPI Escrow & NEFT">All Channels: UPI Escrow &amp; NEFT</option>
                <option value="UPI Instant Escrow Only">UPI Instant Escrow Only</option>
                <option value="NEFT / Bank Transfer Only">NEFT / Bank Transfer Only</option>
              </select>
            </div>
          </div>

          {/* Statutory Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#C84826] shrink-0 mt-0.5" />
            <span>
              Preferences are persisted in <code className="font-mono font-bold text-slate-800">{AUTO_REPORT_STORAGE_KEY}</code> with zero database migration overhead.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 bg-[#C84826] hover:bg-[#A62C11] text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Auto-Report Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

