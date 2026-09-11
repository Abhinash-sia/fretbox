'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { HostelOccupancyView } from '@/features/admin/components/hostel-occupancy-view';

export default function AdminHostelsPage() {
  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Hostel Occupancy & Capacity Analytics"
          subheading="Campus building occupancy rates, room capacity metrics, and block utilization."
        />

        <HostelOccupancyView />
      </AppShell>
    </ProtectedRoute>
  );
}
