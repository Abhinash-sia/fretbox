'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { AiKnowledgeTable } from '@/features/ai/components/ai-knowledge-table';

export default function AdminKnowledgeBasePage() {
  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Campus Knowledge Base Management"
          subheading="Maintain official campus rulebooks, policies, and FAQs grounded in Gemini AI RAG response pipeline."
        />

        <div className="space-y-6">
          <AiKnowledgeTable />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
