'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { ComplaintAnalyticsView } from '@/features/admin/components/complaint-analytics-view';
import { WorkloadDistributionView } from '@/features/admin/components/workload-distribution-view';
import { RecurringHotspotsView } from '@/features/admin/components/recurring-hotspots-view';

export default function AdminComplaintsPage() {
  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Complaints SLA & Workload Analytics"
          subheading="Resolution SLA performance, active complaint ageing, staff workload, and location hotspots."
        />

        <div className="space-y-6">
          <ComplaintAnalyticsView />
          <RecurringHotspotsView />
          <WorkloadDistributionView />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
