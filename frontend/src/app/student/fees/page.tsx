'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { UnsupportedFeatureCard } from '@/features/student/components/unsupported-feature-card';

export default function StudentFeesPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <PageHeader
          heading="Student Fees & Payment Records"
          subheading="Tuition fees, hostel charges, and Razorpay payment architecture status."
        />
        <UnsupportedFeatureCard
          featureName="Fee Management & Razorpay Payment"
          backendPhase="Backend Phase B10.2 / Frontend Phase F11"
          description="The student fee calculation and payment gateway backend architecture is scheduled for Phase B10.2 / F11 integration."
        />
      </AppShell>
    </ProtectedRoute>
  );
}
