'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { UnsupportedFeatureCard } from '@/features/student/components/unsupported-feature-card';

export default function FacultyCalendarPage() {
  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <AppShell>
        <PageHeader
          heading="Academic Calendar & Event Schedule"
          subheading="Semester schedules, evaluation deadlines, and official institutional holidays."
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
