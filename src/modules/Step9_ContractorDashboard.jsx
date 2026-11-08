import React from 'react';
import { PartnerOverviewDashboard } from '../components/PartnerOverviewDashboard';

export const Step9_ContractorDashboard = ({
  onNavigateScan,
  onNavigateRequests,
  onNavigateDossier,
  onLogout
}) => {
  return (
    <PartnerOverviewDashboard
      onNavigateScan={onNavigateScan}
      onNavigateRequests={onNavigateRequests}
      onNavigateDossier={onNavigateDossier}
      onLogout={onLogout}
      isVendorMode={false}
    />
  );
};
