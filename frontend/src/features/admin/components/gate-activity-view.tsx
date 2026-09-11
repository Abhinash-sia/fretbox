'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { ShieldCheck, LogIn, LogOut, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { useGateAnalytics } from '../hooks/use-admin-queries';

export function GateActivityView() {
  const { data, isLoading, isError, refetch } = useGateAnalytics();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Gate Analytics"
        message="Could not retrieve security gate activity log analytics."
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-4 select-none">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Total Verifications</span>
              <span className="font-mono text-xl font-bold text-foreground">{data.totalEvents} Scans</span>
              <span className="text-[10px] text-muted-foreground block font-mono">Recorded Gate Verifications</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Activity className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Entry Scans</span>
              <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.entryCount} Entries
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">Inbound Verification</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <LogIn className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Exit Scans</span>
              <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                {data.exitCount} Exits
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">Outbound Verification</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <LogOut className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Event Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-500" />
            <span>Daily Gate Scan Volume Trend</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Volume of QR gate passes verified daily across campus security checkpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-60 pt-2">
          {data.dailyEvents?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyEvents} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No gate scan events recorded in this time range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
