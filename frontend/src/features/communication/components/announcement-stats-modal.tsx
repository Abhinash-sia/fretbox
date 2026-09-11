'use client';

import * as React from 'react';
import { BarChart3, CheckCircle2, Eye, Clock, AlertTriangle, Activity } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { useAnnouncementStats } from '../hooks/use-communication-queries';

interface AnnouncementStatsModalProps {
  announcementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementStatsModal({
  announcementId,
  open,
  onOpenChange,
}: AnnouncementStatsModalProps) {
  const { data: stats, isLoading, isError, refetch } = useAnnouncementStats(announcementId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md select-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Notice Delivery Analytics</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Real-time delivery status, receipt acknowledgments, and read percentages.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Analytics"
            message="Could not retrieve statistics for this announcement."
            onRetry={() => refetch()}
          />
        ) : stats ? (
          <div className="space-y-4 py-2 text-xs">
            {/* Overview Percentage Card */}
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Read Receipt Rate</span>
                <p className="text-xs text-muted-foreground">Percentage of recipients who opened notice</p>
              </div>
              <div className="text-right font-mono font-bold text-xl text-emerald-600 dark:text-emerald-400">
                {stats.readPercentage}%
              </div>
            </div>

            {/* Grid Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Activity className="h-3.5 w-3.5 text-blue-600" />
                  <span>Total Recipients</span>
                </div>
                <span className="font-mono text-base font-bold text-foreground block">
                  {stats.totalRecipients}
                </span>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Realtime Delivered</span>
                </div>
                <span className="font-mono text-base font-bold text-foreground block">
                  {stats.deliveredCount}
                </span>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Eye className="h-3.5 w-3.5 text-purple-600" />
                  <span>Read Count</span>
                </div>
                <span className="font-mono text-base font-bold text-foreground block">
                  {stats.readCount}
                </span>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Pending Delivery</span>
                </div>
                <span className="font-mono text-base font-bold text-foreground block">
                  {stats.pendingCount}
                </span>
              </div>
            </div>

            {/* Failure/Action Row */}
            <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span>Failed Deliveries: {stats.failedCount}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Actioned: {stats.actionCount}
              </Badge>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
