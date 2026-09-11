'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { NotificationCenter } from '@/features/communication/components/notification-center';

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={['student', 'faculty', 'staff', 'warden', 'security', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Campus Notifications & Operational Alerts"
          subheading="Personal alerts, complaint status transitions, gate pass verifications, and system events."
        />

        <NotificationCenter />
      </AppShell>
    </ProtectedRoute>
  );
}
