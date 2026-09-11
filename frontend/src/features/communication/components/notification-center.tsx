'use client';

import * as React from 'react';
import { Bell, Check, CheckCheck, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAsActioned,
} from '../hooks/use-communication-queries';
import { NotificationItem } from '../types/communication';

export function NotificationCenter() {
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, refetch } = useNotifications({
    unreadOnly,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    page,
    limit: 15,
  });

  const markReadMutation = useMarkAsRead();
  const markActionedMutation = useMarkAsActioned();

  const notifications = data?.notifications || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch {
      // Error state managed by mutation
    }
  };

  const handleMarkActioned = async (id: string) => {
    try {
      await markActionedMutation.mutateAsync(id);
    } catch {
      // Error state managed by mutation
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'announcement':
        return (
          <Badge variant="outline" className="font-mono text-[10px] uppercase border-emerald-500/30 text-emerald-600">
            Notice
          </Badge>
        );
      case 'complaint':
        return (
          <Badge variant="outline" className="font-mono text-[10px] uppercase border-amber-500/30 text-amber-600">
            Complaint
          </Badge>
        );
      case 'gate_pass':
        return (
          <Badge variant="outline" className="font-mono text-[10px] uppercase border-blue-500/30 text-blue-600">
            Gate Pass
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            System
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="font-mono text-[10px] uppercase">Urgent</Badge>;
      case 'high':
        return <Badge variant="warning" className="font-mono text-[10px] uppercase">High</Badge>;
      default:
        return <Badge variant="secondary" className="font-mono text-[10px] uppercase">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border">
        <Tabs
          value={unreadOnly ? 'unread' : 'all'}
          onValueChange={(val) => {
            setUnreadOnly(val === 'unread');
            setPage(1);
          }}
        >
          <TabsList className="bg-background border border-border">
            <TabsTrigger value="all" className="text-xs">
              All Alerts
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread Only
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            className="h-8 rounded-md border border-input bg-background px-2 font-sans text-xs text-foreground focus:outline-none"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Notification Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Personal & System Alerts</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Operational status notifications, ticket lifecycle updates, and direct notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : isError ? (
            <ErrorState
              title="Failed to Load Notifications"
              message="Could not connect to communication service."
              onRetry={() => refetch()}
            />
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((item: NotificationItem) => (
                <div
                  key={item._id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border p-4 transition-colors ${
                    !item.readAt
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-xs md:text-sm">
                        {item.title}
                      </span>
                      {getTypeBadge(item.type)}
                      {getPriorityBadge(item.priority)}
                      {!item.readAt && (
                        <Badge variant="success" className="font-mono text-[9px] px-1 py-0">
                          NEW
                        </Badge>
                      )}
                      {item.actionAt && (
                        <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 border-blue-500/30 text-blue-600">
                          ACTIONED
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {item.body}
                    </p>
                    <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground pt-1">
                      <span>Created: {new Date(item.createdAt).toLocaleString()}</span>
                      {item.readAt && (
                        <span>Read: {new Date(item.readAt).toLocaleString()}</span>
                      )}
                      {item.actionAt && (
                        <span>Actioned: {new Date(item.actionAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!item.readAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                        onClick={() => handleMarkRead(item._id)}
                        disabled={markReadMutation.isPending}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Mark Read
                      </Button>
                    )}

                    {!item.actionAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs border-border"
                        onClick={() => handleMarkActioned(item._id)}
                        disabled={markActionedMutation.isPending}
                      >
                        <CheckCheck className="mr-1 h-3.5 w-3.5 text-blue-600" /> Action
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-xs">
                  <span className="text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={page >= pagination.pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title={unreadOnly ? 'No Unread Notifications' : 'No Notifications Found'}
              description={
                unreadOnly
                  ? 'All notifications have been read and actioned.'
                  : 'You have no notifications or alerts at this time.'
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
