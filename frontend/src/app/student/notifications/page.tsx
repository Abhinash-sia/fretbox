'use client';

import * as React from 'react';
import { Bell, Megaphone } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationCenter } from '@/features/communication/components/notification-center';
import { AnnouncementList } from '@/features/communication/components/announcement-list';

export default function StudentNotificationsPage() {
  const [activeTab, setActiveTab] = React.useState('notifications');

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <PageHeader
          heading="Campus Notifications & Announcements"
          subheading="Personal operational alerts, ticket updates, and official institutional announcements."
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-3.5 w-3.5" />
              <span>Personal Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-3.5 w-3.5" />
              <span>Campus Notices</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementList />
          </TabsContent>
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  );
}
