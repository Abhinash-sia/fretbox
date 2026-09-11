'use client';

import * as React from 'react';
import { Users, Clock, CheckCircle2, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { useWorkloadAnalytics } from '../hooks/use-admin-queries';

export function WorkloadDistributionView() {
  const { data, isLoading, isError, refetch } = useWorkloadAnalytics();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Workload Analytics"
        message="Could not retrieve ground maintenance staff workload data."
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return null;

  return (
    <Card className="select-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          <span>Staff Complaint Workload & Resolution SLA</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Active task distribution, completed tickets, and average resolution time per staff member.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs select-none">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
              <th className="p-3">Staff Member</th>
              <th className="p-3">Email</th>
              <th className="p-3 text-right">Active Tasks</th>
              <th className="p-3 text-right">Resolved Tickets</th>
              <th className="p-3 text-right">Avg Resolution SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length > 0 ? (
              data.map((item) => (
                <tr key={item.staffId} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-semibold text-foreground">{item.staffName}</td>
                  <td className="p-3 font-mono text-muted-foreground">{item.staffEmail}</td>
                  <td className="p-3 text-right font-mono">
                    <Badge variant={item.activeComplaints > 5 ? 'warning' : 'outline'} className="text-xs">
                      <Wrench className="mr-1 h-3 w-3" /> {item.activeComplaints}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-600 font-semibold">
                    <span className="flex items-center justify-end gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {item.resolvedComplaints}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-foreground">
                    <span className="flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3 text-blue-500" /> {item.averageResolutionHours} hrs
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-xs text-muted-foreground">
                  No staff complaint assignment metrics recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
