'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { PaymentsDashboard } from '@/features/payments/components/payments-dashboard';

export default function AdminPaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Campus Financial Ledger & Fee Collection"
          subheading="Campus fee dues, payment collection status, and Razorpay gateway compliance overview."
        />
        <PaymentsDashboard role="administrator" />
      </AppShell>
    </ProtectedRoute>
  );
}
