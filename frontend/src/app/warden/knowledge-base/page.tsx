'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { AiKnowledgeTable } from '@/features/ai/components/ai-knowledge-table';

export default function WardenKnowledgeBasePage() {
  return (
    <ProtectedRoute allowedRoles={['warden']}>
      <AppShell>
        <PageHeader
          heading="Hostel Knowledge Base Management"
          subheading="Maintain hostel guidelines, curfew timings, and room allocation policies for student AI search."
        />

        <div className="space-y-6">
          <AiKnowledgeTable />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
