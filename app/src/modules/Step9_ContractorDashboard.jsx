import React from 'react';
import { PartnerOverviewDashboard } from '../components/PartnerOverviewDashboard';

export const Step9_ContractorDashboard = ({
  onNavigateScan,
  onNavigateRequests,
  onNavigateDossier,
  onNavigateOrders,
  onLogout
}) => {
  return (
    <PartnerOverviewDashboard
      onNavigateScan={onNavigateScan}
      onNavigateRequests={onNavigateRequests}
      onNavigateDossier={onNavigateDossier}
      onNavigateOrders={onNavigateOrders}
      onLogout={onLogout}
      isVendorMode={false}
    />
  );
};
