'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { AnnouncementList } from '@/features/communication/components/announcement-list';

export default function AnnouncementsPage() {
  return (
    <ProtectedRoute allowedRoles={['student', 'faculty', 'staff', 'warden', 'security', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Campus Notice Board & Institutional Broadcasts"
          subheading="Official notices, academic schedules, hostel guidelines, and administrative updates."
        />

        <AnnouncementList />
      </AppShell>
    </ProtectedRoute>
  );
}
