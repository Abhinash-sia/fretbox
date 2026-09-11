'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { FacilityStatusView } from '@/features/admin/components/facility-status-view';

export default function AdminFacilitiesPage() {
  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Facilities & Asset Infrastructure Analytics"
          subheading="Campus equipment operational condition, maintenance counts, and high-issue asset hotspots."
        />

        <FacilityStatusView />
      </AppShell>
    </ProtectedRoute>
  );
}
