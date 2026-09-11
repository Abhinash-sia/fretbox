'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { PredictionDashboard } from '@/features/prediction/components/prediction-dashboard';

export default function AdminPredictionsPage() {
  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Complaint Demand Forecasting"
          subheading="Scikit-learn time-series demand predictions & workload forecasting for campus operational management."
        />

        <PredictionDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}
