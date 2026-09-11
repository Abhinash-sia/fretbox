'use client';

import * as React from 'react';
import { AppSidebar } from './app-sidebar';
import { AppNavbar } from './app-navbar';
import { CommandMenu } from '@/components/ui/command-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';

import { AiDrawerProvider } from '@/features/ai/context/ai-drawer-context';
import { AiChatDrawer } from '@/features/ai/components/ai-chat-drawer';
import { OfflineBanner } from '@/components/ui/offline-banner';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <AiDrawerProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* 1. Desktop Sidebar */}
        <AppSidebar className="hidden md:flex shrink-0" />

        {/* 2. Mobile Sidebar Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 border-r-0 w-64">
            <AppSidebar className="w-full h-full" />
          </SheetContent>
        </Sheet>

        {/* 3. Main Content Viewport */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppNavbar
            onOpenCommand={() => setCommandOpen(true)}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* 4. Global Command Palette (Cmd+K) */}
        <CommandMenu
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onSelectAction={() => setCommandOpen(false)}
        />

        {/* 5. Universal Campus AI Assistant Drawer */}
        <AiChatDrawer />

        {/* 6. Accessible Global Offline Banner */}
        <OfflineBanner />
      </div>
    </AiDrawerProvider>
  );
}
