'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { AiKnowledgeTable } from '@/features/ai/components/ai-knowledge-table';
import { useAiDrawer } from '@/features/ai/context/ai-drawer-context';

function AiAssistantLaunchButton() {
  const { openDrawer: openAiDrawer } = useAiDrawer();

  return (
    <Button onClick={() => openAiDrawer()} size="sm" className="gap-1.5">
      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
      <span>Launch AI Assistant</span>
    </Button>
  );
}

export default function AdminAiPage() {
  return (
    <ProtectedRoute allowedRoles={['administrator', 'warden']}>
      <AppShell>
        <PageHeader
          heading="Campus AI & RAG Knowledge Hub"
          subheading="Manage authoritative campus knowledge base documents and test Gemini RAG synthesis across operational domains."
        >
          <AiAssistantLaunchButton />
        </PageHeader>

        <div className="space-y-6">
          <AiKnowledgeTable />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
