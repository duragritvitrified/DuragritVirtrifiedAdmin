import React from 'react';
import { useData } from '../context/DataContext';

export const TopStatusBar = ({ currentTab, activeStation = 'Scanner Terminal #03' }) => {
  const { dbStatus } = useData();

  const getStepInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          step: 'EXECUTIVE OVERVIEW',
          title: 'Live Enterprise Telemetry & Analytics Hub',
          station: 'Morbi Master Kiln Sync #01',
        };
      case 'master-workflow':
        return { step: '14-STEP WORKFLOW', title: 'Supply Chain QR Traceability Pipeline: Active', station: 'DuraGrit Central Orchestrator' };
      case 'users':
        return { step: 'STEP 05 / 14', title: 'User & Partner Directory Stream: Active', station: 'Identity KYC Gateway' };
      case 'cashback':
        return { step: 'STEP 06 / 14', title: 'Cashback & Instant Payout Stream: Active', station: 'NPCI IMPS Switch #02' };
      case 'reports':
        return { step: 'STEP 07 / 14', title: 'BI Telemetry & Territory Analytics: Active', station: 'Executive Data Engine' };
      case 'catalog':
        return { step: 'STEP 02 / 14', title: 'Product Catalog & SKU Master: Active', station: 'Central SKU Directory' };
      case 'qr-generator':
        return { step: 'STEP 04 / 14', title: 'Cryptographic QR Code Batch Engine: Active', station: 'Roll Feeder High-Speed Sync' };
      case 'batch-registry':
        return { step: 'STEP 09 / 14', title: 'Roll Feeder High-Speed Sync Stream: Active', station: 'Feeder Roll Line #14' };
      case 'dispatch':
        return { step: 'STEP 10 / 14', title: 'Outbound Logistics & RFID Gate Pass: Active', station: 'Central Freight Gate #02' };
      case 'inward':
        return { step: 'STEP 11 / 14', title: 'Dealer Inward Verification Stream: Active', station: activeStation };
      case 'redemption':
        return { step: 'STEP 12 / 14', title: 'Contractor UPI Redemption Gateway: Active', station: 'NPCI Real-Time Rail #01' };
      case 'escrow':
        return { step: 'STEP 13 / 14', title: 'Anti-Fraud & Geofence Quarantine Stream: Active', station: 'AI Escrow Sentinel' };
      case 'settlement':
        return { step: 'STEP 14 / 14', title: 'Executive Ledger & Fiscal Close Stream: Active', station: 'EOD HSM Fiscal Core' };
      case 'vendor-manage':
        return { step: 'STEP 07 / 14', title: 'Vendor Directory & Supply Chain Registry: Active', station: 'Registry Node IN-CENTRAL-01' };
      default:
        return { step: 'LIVE PORTAL', title: 'DuraGrit Enterprise QR Stream: Active', station: activeStation };
    }
  };

  const info = getStepInfo();

  return (
    <div className="bg-[#1C1917] text-stone-300 text-xs px-4 sm:px-6 py-1.5 flex items-center justify-between border-b border-[#A62C11]/40 shrink-0 select-none overflow-hidden">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 truncate">
        <span className="inline-flex items-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
          <span className="font-semibold text-white truncate">{info.title}</span>
          <span className="text-stone-400 ml-1 hidden lg:inline">
            ({dbStatus?.connected ? 'Supabase Realtime Synced' : 'Live Sync Active'})
          </span>
        </span>
        <span className="text-stone-600 hidden md:inline">|</span>
        <span className="text-stone-300 hidden md:inline shrink-0">
          Station: <span className="text-[#F59B7F] font-semibold">{info.station}</span>
        </span>
      </div>
      <div className="flex items-center space-x-2 shrink-0 ml-3">
        <span className="bg-[#C84826] text-white font-black px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] tracking-wide uppercase shadow-xs whitespace-nowrap">
          {info.step}
        </span>
      </div>
    </div>
  );
};
