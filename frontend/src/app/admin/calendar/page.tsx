'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { UnsupportedFeatureCard } from '@/features/student/components/unsupported-feature-card';

export default function AdminCalendarPage() {
  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Campus & Institutional Calendar"
          subheading="Master academic schedule, examination windows, and official institutional holidays."
        />
        <UnsupportedFeatureCard
          featureName="Academic Calendar Feed"
          backendPhase="Backend Phase B10.1 Calendar Integration"
          description="Academic calendar event feed APIs are not yet exposed to the frontend gateway."
        />
      </AppShell>
    </ProtectedRoute>
  );
}
