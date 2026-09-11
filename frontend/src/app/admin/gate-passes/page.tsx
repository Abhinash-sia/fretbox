'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { GateActivityView } from '@/features/admin/components/gate-activity-view';

export default function AdminGatePassesPage() {
  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Security Gate Verification & Traffic Analytics"
          subheading="QR Gate verification volume, daily traffic trends, and inbound/outbound scan distribution."
        />

        <GateActivityView />
      </AppShell>
    </ProtectedRoute>
  );
}
