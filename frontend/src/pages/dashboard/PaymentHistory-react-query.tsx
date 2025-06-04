import React from 'react';
import PaymentHistory from './PaymentHistory';

// React Query version of PaymentHistory - currently wraps the existing component
const PaymentHistoryReactQuery: React.FC = () => {
  return <PaymentHistory />;
};

export default PaymentHistoryReactQuery;
