'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { apiClient } from '@/lib/api/api-client';

interface GateEvent {
  _id: string;
  eventType: string;
  timestamp: string;
  gateId: string;
  gatePassId?: string;
  studentId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  securityUserId?: {
    _id?: string;
    name?: string;
  };
}

export default function SecurityEventsPage() {
  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ['gate-events'],
    queryFn: async () => {
      const response = await apiClient.request<GateEvent[] | { events: GateEvent[] }>('/gate-events');
      return Array.isArray(response) ? response : (response as { events: GateEvent[] }).events || [];
    },
  });

  return (
    <ProtectedRoute allowedRoles={['security', 'administrator', 'warden']}>
      <AppShell>
        <PageHeader
          heading="Gate Scan Events & Verification Log"
          subheading="Audit log of entry and exit scan events recorded at campus security gates."
        >
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh Log
          </Button>
        </PageHeader>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Gate Scan Events"
            message="Could not retrieve recent gate event logs from the backend."
            onRetry={() => refetch()}
          />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Recorded Gate Scans</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time security scan events verified against backend gate-pass authorization records.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {events && events.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Verified By</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event._id}>
                        <TableCell>
                          <Badge variant={event.eventType === 'EXIT' ? 'warning' : 'success'}>
                            {event.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-foreground">
                          {event.gateId || 'main-gate'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {event.studentId?.name || 'Student'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {event.securityUserId?.name || 'Security Officer'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6">
                  <EmptyState
                    title="No Gate Events Logged"
                    description="No campus gate entry/exit scans have been recorded yet."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
