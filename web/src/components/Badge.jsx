import React from 'react';

export const Badge = ({ status, text }) => {
  const label = text || status;

  switch (status?.toLowerCase()) {
    case 'active':
    case 'verified':
    case 'approved':
    case 'disbursed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
          {label}
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          {label}
        </span>
      );
    case 'flagged':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-orange-500"></span>
          {label}
        </span>
      );
    case 'rejected':
    case 'suspended':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
          {label}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
          {label}
        </span>
      );
  }
};
