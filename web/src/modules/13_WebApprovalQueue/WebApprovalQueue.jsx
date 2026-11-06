import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Badge } from '../../components/Badge';
import { 
  CheckCircle2, Clock,  Filter, Search,  Zap, ShieldCheck,  ArrowUpRight, ExternalLink,  Coins, CheckCheck,  AlertTriangle, RefreshCw
} from 'lucide-react';

export const WebApprovalQueue = () => {
  const { claims, approveClaim,  flagClaim } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [selectedClaimIds, setSelectedClaimIds] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Filtering
  const filteredClaims = claims.filter(c => {
    const matchesSearch = c.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.serialKey.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct === 'All' || c.productName.includes(selectedProduct);
    const matchesMethod = selectedMethod === 'All' || c.payoutMethod === selectedMethod;
    return matchesSearch && matchesProduct && matchesMethod;
  });

  const pendingCount = claims.filter(c => c.status === 'Pending').length;
  const disbursedTotal = claims.filter(c => c.status === 'Disbursed').reduce((acc, c) => acc + c.amount, 18450);

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedClaimIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const pendingIds = filteredClaims.filter(c => c.status === 'Pending').map(c => c.id);
    if (selectedClaimIds.length === pendingIds.length) {
      setSelectedClaimIds([]);
    } else {
      setSelectedClaimIds(pendingIds);
    }
  };

  // Bulk Approval with NPCI Instant Disbursement
  const handleBulkApprove = async () => {
    if (selectedClaimIds.length === 0) return;
    setIsBulkProcessing(true);

    for (const claimId of selectedClaimIds) {
      await approveClaim(claimId);
    }

    setBulkSuccessMsg(`Successfully disbursed ${selectedClaimIds.length} claims via NPCI Instant Gateway!`);
    setSelectedClaimIds([]);
    setIsBulkProcessing(false);

    setTimeout(() => setBulkSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span>QR Cashback Requests Approval Queue</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
              {pendingCount} Awaiting Authorization
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Bulk authorization engine integrated with NPCI automated escrow disbursement gateway.
          </p>
        </div>

        {selectedClaimIds.length > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={isBulkProcessing}
            className="duragrit-btn-primary flex items-center space-x-2 shrink-0 bg-emerald-700 hover:bg-emerald-800"
          >
            {isBulkProcessing ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Bulk Disburse ({selectedClaimIds.length} Selected)</span>
              </>
            )}
          </button>
        )}
      </div>

      {bulkSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bulkSuccessMsg}</span>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Pending Authorization Queue</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{pendingCount} Requests</div>
          <span className="text-[11px] text-gray-500 font-medium">Avg approval cycle: 14 mins</span>
        </div>

        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Disbursed Cashback Pool</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">, {disbursedTotal.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 font-medium">100% NPCI IMPS Settled</span>
        </div>

        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>NPCI Gateway Node</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-gray-900 mt-2">NPCI-BBPS-ESCROW-04</div>
          <span className="text-[11px] text-gray-500">256-Bit Cryptographic Pipe Active</span>
        </div>

        <div className="duragrit-card p-4">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>VPA Instant Validation</span>
            <CheckCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">99.8%</div>
          <span className="text-[11px] text-emerald-700 font-medium">Auto-verified UPI VPA</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="duragrit-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Claim #,  Contractor name, or Serial Key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#8B0000]"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none"
          >
            <option value="All">All Products</option>
            <option value="UltraFix">UltraFix Adhesives</option>
            <option value="SuperBond">SuperBond Grouts</option>
            <option value="Primer">SBR Primers</option>
          </select>

          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg outline-none"
          >
            <option value="All">All Payout Methods</option>
            <option value="UPI">UPI Instant VPA</option>
            <option value="NEFT">NEFT Direct</option>
            <option value="IMPS">IMPS Bank</option>
          </select>
        </div>
      </div>

      {/* Approval Queue Data Table */}
      <div className="duragrit-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedClaimIds.length > 0 &&
                      selectedClaimIds.length === filteredClaims.filter(c => c.status === 'Pending').length
                    }
                    className="rounded text-[#8B0000] focus:ring-[#8B0000]"
                  />
                </th>
                <th className="px-4 py-3.5">Claim ID</th>
                <th className="px-4 py-3.5">Contractor / Applicator</th>
                <th className="px-4 py-3.5">Product & Serial Key</th>
                <th className="px-4 py-3.5">Payout Method / VPA</th>
                <th className="px-4 py-3.5 text-right">Cashback Amount</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 text-center">
                    {claim.status === 'Pending' && (
                      <input
                        type="checkbox"
                        checked={selectedClaimIds.includes(claim.id)}
                        onChange={() => handleToggleSelect(claim.id)}
                        className="rounded text-[#8B0000] focus:ring-[#8B0000]"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">
                    {claim.claimNumber}
                    <div className="text-[10px] text-gray-400 font-normal">{claim.submittedAt}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{claim.userName}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{claim.userMobile}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{claim.productName}</div>
                    <div className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                      {claim.serialKey}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-gray-800 text-xs">{claim.vpaOrIfsc}</span>
                    <div className="text-[10px] text-emerald-600 font-medium">NPCI Instant Auto-Disburse</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-black text-amber-800">, {claim.amount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge status={claim.status} />
                    {claim.npciRrn && (
                      <div className="text-[9px] font-mono text-gray-400 mt-0.5">
                        RRN: {claim.npciRrn}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {claim.status === 'Pending' ? (
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => approveClaim(claim.id)}
                          className="px-2.5 py-1 rounded bg-[#8B0000] hover:bg-[#700000] text-white text-[11px] font-bold shadow-sm transition-all"
                        >
                          Disburse
                        </button>
                        <button
                          onClick={() => flagClaim(claim.id)}
                          className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 text-[11px]"
                        >
                          Flag
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
