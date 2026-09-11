'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { AdminKpiCards } from '@/features/admin/components/admin-kpi-cards';
import { ComplaintAnalyticsView } from '@/features/admin/components/complaint-analytics-view';
import { HostelOccupancyView } from '@/features/admin/components/hostel-occupancy-view';
import { WorkloadDistributionView } from '@/features/admin/components/workload-distribution-view';
import { RecurringHotspotsView } from '@/features/admin/components/recurring-hotspots-view';
import { useOverviewAnalytics } from '@/features/admin/hooks/use-admin-queries';

export default function AdminDashboardPage() {
  const { data: overview } = useOverviewAnalytics();

  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Administrator Command Center"
          subheading="Unified operational intelligence across complaints, hostel capacity, facilities, security gates, and academic attendance."
        />

        <div className="space-y-6">
          {/* Executive KPI Row */}
          <AdminKpiCards overview={overview} />

          {/* Complaint SLA & Ageing Visualizations */}
          <ComplaintAnalyticsView />

          {/* Recurring Location & Asset Hotspots */}
          <RecurringHotspotsView />

          {/* Hostel Occupancy Overview */}
          <HostelOccupancyView />

          {/* Staff Workload SLA */}
          <WorkloadDistributionView />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
