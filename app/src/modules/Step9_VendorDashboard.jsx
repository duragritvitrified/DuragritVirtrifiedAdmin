import React from 'react';
import { PartnerOverviewDashboard } from '../components/PartnerOverviewDashboard';

export const Step9_VendorDashboard = ({
  vendorId,
  onNavigateScan,
  onNavigateRequests,
  onNavigateDossier,
  onNavigateOrders,
  onNavigateGifts,
  onLogout
}) => {
  return (
    <PartnerOverviewDashboard
      onNavigateScan={onNavigateScan}
      onNavigateRequests={onNavigateRequests}
      onNavigateDossier={onNavigateDossier}
      onNavigateOrders={onNavigateOrders}
      onNavigateGifts={onNavigateGifts}
      onLogout={onLogout}
      isVendorMode={true}
    />
  );
};
