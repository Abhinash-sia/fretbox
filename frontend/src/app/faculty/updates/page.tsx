'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { UnsupportedFeatureCard } from '@/features/student/components/unsupported-feature-card';

export default function FacultyUpdatesPage() {
  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <AppShell>
        <PageHeader
          heading="Class Updates & Student Broadcast Messaging"
          subheading="Direct messaging and section-wide update announcements."
        />
        <UnsupportedFeatureCard
          featureName="Faculty Class Broadcast Messaging"
          backendPhase="Backend Class Messaging API Pending"
          description="Direct class messaging and section-wide update endpoints are not yet provisioned in the backend server."
        />
      </AppShell>
    </ProtectedRoute>
  );
}
