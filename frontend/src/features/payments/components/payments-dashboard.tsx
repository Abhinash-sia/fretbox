'use client';

import * as React from 'react';
import { useMyFees, usePaymentHistory } from '../hooks/use-payment-queries';
import { FeeSummary } from './fee-summary';
import { FeeBreakdown } from './fee-breakdown';
import { PaymentHistory } from './payment-history';
import { PaymentUnsupportedCard } from './payment-unsupported-card';
import { FeeItem } from '../types/payments';

interface PaymentsDashboardProps {
  role?: 'student' | 'administrator' | 'warden';
}

export function PaymentsDashboard({ role = 'student' }: PaymentsDashboardProps) {
  const { data: fees = [], isLoading: isLoadingFees } = useMyFees();
  const { data: history = [], isLoading: isLoadingHistory } = usePaymentHistory();

  const handlePayFee = (fee: FeeItem) => {
    // In production with B10.2 backend, triggers createPaymentOrder & opens Razorpay checkout SDK modal
    alert(`Initiating backend Razorpay order for ${fee.title} (₹${fee.amount}). Backend verification pending B10.2.`);
  };

  const hasData = fees.length > 0 || history.length > 0;

  return (
    <div className="space-y-6">
      {hasData ? (
        <>
          <FeeSummary fees={fees} />
          <FeeBreakdown fees={fees} isLoading={isLoadingFees} onPayFee={handlePayFee} role={role} />
          <PaymentHistory history={history} isLoading={isLoadingHistory} />
        </>
      ) : (
        <PaymentUnsupportedCard role={role} />
      )}
    </div>
  );
}
