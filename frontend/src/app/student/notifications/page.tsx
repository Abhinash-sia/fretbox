'use client';

import * as React from 'react';
import { Bell, Check, Megaphone } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import {
  useStudentNotifications,
  useStudentAnnouncements,
  useMarkNotificationRead,
} from '@/features/student/hooks/use-student-queries';

export default function StudentNotificationsPage() {
  const [activeTab, setActiveTab] = React.useState('notifications');

  const { data: notifications, isLoading: notifLoading, isError: notifError, refetch: refetchNotifs } = useStudentNotifications();
  const { data: announcements, isLoading: annLoading, isError: annError, refetch: refetchAnns } = useStudentAnnouncements();
  const markReadMutation = useMarkNotificationRead();

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch {
      // Error handled by mutation state
    }
  };

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
              <span>Personal Notifications ({notifications?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-3.5 w-3.5" />
              <span>Campus Notices ({announcements?.length || 0})</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Personal Operational Alerts</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Updates regarding your complaints, gate passes, and room allocations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {notifLoading ? (
                  <TableSkeleton rows={4} />
                ) : notifError ? (
                  <ErrorState
                    title="Failed to Load Notifications"
                    message="Could not retrieve notifications from the server."
                    onRetry={() => refetchNotifs()}
                  />
                ) : notifications && notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`flex items-start justify-between rounded-lg border p-3.5 transition-colors ${
                        notif.isRead
                          ? 'border-border/60 bg-card text-muted-foreground'
                          : 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                      }`}
                    >
                      <div className="space-y-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-xs">{notif.title}</span>
                          {!notif.isRead && (
                            <Badge variant="success" className="font-mono text-[9px] px-1 py-0">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed">{notif.body}</p>
                        <p className="font-mono text-[10px] text-muted-foreground pt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {!notif.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700"
                          onClick={() => handleMarkRead(notif._id)}
                          disabled={markReadMutation.isPending}
                        >
                          <Check className="mr-1 h-3 w-3" /> Mark Read
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState title="No Personal Notifications" description="You have no notifications or alerts at this time." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campus Announcements */}
          <TabsContent value="announcements">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Institutional Announcements</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Broadcast notices published by campus administration and wardens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {annLoading ? (
                  <TableSkeleton rows={4} />
                ) : annError ? (
                  <ErrorState
                    title="Failed to Load Announcements"
                    message="Could not retrieve notices from the server."
                    onRetry={() => refetchAnns()}
                  />
                ) : announcements && announcements.length > 0 ? (
                  announcements.map((notice) => (
                    <div key={notice._id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="font-bold text-foreground text-sm">{notice.title}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : 'Published'}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                        {notice.content}
                      </p>
                      {notice.authorId?.name && (
                        <p className="font-mono text-[10px] text-muted-foreground text-right pt-1">
                          Author: {notice.authorId.name}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState title="No Campus Notices" description="No institution-wide notices have been published recently." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  );
}
