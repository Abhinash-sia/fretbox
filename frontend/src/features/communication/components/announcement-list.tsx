'use client';

import * as React from 'react';
import { Megaphone, Plus, BarChart3, Send, XCircle, Calendar, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useAuth } from '@/components/providers/auth-provider';
import {
  useAnnouncements,
  usePublishAnnouncement,
  useCancelAnnouncement,
} from '../hooks/use-communication-queries';
import { AnnouncementItem } from '../types/communication';
import { AnnouncementCreateModal } from './announcement-create-modal';
import { AnnouncementStatsModal } from './announcement-stats-modal';

export function AnnouncementList() {
  const { role } = useAuth();
  const isWardenOrAdmin = role === 'warden' || role === 'administrator';

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [selectedStatsId, setSelectedStatsId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isError, refetch } = useAnnouncements({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 10,
  });

  const publishMutation = usePublishAnnouncement();
  const cancelMutation = useCancelAnnouncement();

  const announcements = data?.announcements || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };

  const handlePublish = async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
    } catch {
      // Handled by mutation
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this announcement?')) return;
    try {
      await cancelMutation.mutateAsync(id);
    } catch {
      // Handled by mutation
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success" className="font-mono text-[10px] uppercase">Published</Badge>;
      case 'draft':
        return <Badge variant="warning" className="font-mono text-[10px] uppercase">Draft</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="font-mono text-[10px] uppercase">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline" className="font-mono text-[10px] uppercase">Expired</Badge>;
      default:
        return <Badge variant="secondary" className="font-mono text-[10px] uppercase">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="font-mono text-[10px] uppercase">Urgent</Badge>;
      case 'high':
        return <Badge variant="warning" className="font-mono text-[10px] uppercase">High</Badge>;
      default:
        return <Badge variant="outline" className="font-mono text-[10px] uppercase">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold text-xs text-foreground">Institutional Notice Board</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isWardenOrAdmin && (
            <>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 font-sans text-xs text-foreground focus:outline-none"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Compose Notice
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Notice List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Official Campus Announcements</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Broadcast messages issued by administration and hostel wardens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : isError ? (
            <ErrorState
              title="Failed to Load Announcements"
              message="Could not retrieve campus announcements."
              onRetry={() => refetch()}
            />
          ) : announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((item: AnnouncementItem) => {
                const authorName = typeof item.createdBy === 'object' ? item.createdBy?.name : undefined;
                const authorRole = typeof item.createdBy === 'object' ? item.createdBy?.role : undefined;

                return (
                  <div
                    key={item._id}
                    className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-2xs hover:border-border/80 transition-colors"
                  >
                    {/* Notice Title Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-sm md:text-base">
                            {item.title}
                          </span>
                          {getPriorityBadge(item.priority)}
                          {getStatusBadge(item.status)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString()
                            : new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Notice Content Body */}
                    <p className="text-xs md:text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                      {item.body}
                    </p>

                    {/* Footer Metadata & Warden/Admin Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-border/40 font-mono text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-3 flex-wrap">
                        {authorName && (
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-emerald-600" />
                            Issued by: {authorName} ({authorRole || 'Authority'})
                          </span>
                        )}
                        {item.target?.all ? (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/30 text-emerald-600">
                            Audience: Campus-wide
                          </Badge>
                        ) : item.target?.roles?.length ? (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            Target: {item.target.roles.join(', ')}
                          </Badge>
                        ) : null}
                      </div>

                      {/* Administrative Operational Controls */}
                      {isWardenOrAdmin && (
                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => handlePublish(item._id)}
                              disabled={publishMutation.isPending}
                            >
                              <Send className="mr-1 h-3 w-3" /> Publish
                            </Button>
                          )}

                          {item.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                              onClick={() => handleCancel(item._id)}
                              disabled={cancelMutation.isPending}
                            >
                              <XCircle className="mr-1 h-3 w-3" /> Cancel
                            </Button>
                          )}

                          {item.status === 'published' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] border-border text-foreground hover:bg-muted"
                              onClick={() => setSelectedStatsId(item._id)}
                            >
                              <BarChart3 className="mr-1 h-3 w-3 text-emerald-600" /> Delivery Stats
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-xs">
                  <span className="text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total notices)
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
              title="No Campus Announcements"
              description="No institution-wide notices match the selected criteria."
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {createModalOpen && (
        <AnnouncementCreateModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />
      )}

      {selectedStatsId && (
        <AnnouncementStatsModal
          announcementId={selectedStatsId}
          open={!!selectedStatsId}
          onOpenChange={(open) => {
            if (!open) setSelectedStatsId(null);
          }}
        />
      )}
    </div>
  );
}
