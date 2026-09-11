'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { UnsupportedFeatureCard } from '@/features/student/components/unsupported-feature-card';

export default function StudentTimetablePage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <PageHeader
          heading="Weekly Academic Timetable"
          subheading="Class schedules, lecture halls, and lab section time slots."
        />
        <UnsupportedFeatureCard
          featureName="Timetable Schedule Service"
          backendPhase="Backend Timetable API Pending"
          description="Dedicated timetable schedule query APIs are not yet provisioned in the backend server."
        />
      </AppShell>
    </ProtectedRoute>
  );
}
