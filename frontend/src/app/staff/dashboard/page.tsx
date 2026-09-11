'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  ListCheck,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { useAuth } from '@/components/providers/auth-provider';
import { useComplaintsList } from '@/features/complaints/hooks/use-complaint-queries';
import { ComplaintDetailModal } from '@/features/complaints/components/complaint-detail-modal';
import { Complaint } from '@/features/complaints/types/complaints';

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const staffUserId = user?.id;

  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);

  const { data: myComplaints, isLoading: loadingComplaints } = useComplaintsList({
    assignedToStaffId: staffUserId,
    limit: 10,
  });

  const assignedCount = myComplaints?.total || 0;
  const inProgressCount = React.useMemo(() => {
    return (myComplaints?.complaints || []).filter((c: Complaint) => c.status === 'in_progress' || c.status === 'assigned').length;
  }, [myComplaints]);

  const resolvedCount = React.useMemo(() => {
    return (myComplaints?.complaints || []).filter((c: Complaint) => c.status === 'resolved' || c.status === 'closed').length;
  }, [myComplaints]);

  return (
    <ProtectedRoute allowedRoles={['staff', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Staff Operations & Workplace Tasks"
          subheading="Manage assigned maintenance complaints, perform status updates, and inspect facility assets."
        />

        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Total Assigned Tasks
                  </p>
                  <h3 className="text-2xl font-bold text-foreground mt-0.5">{assignedCount}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Assigned Maintenance Tickets</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <ListCheck className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    In Progress Work
                  </p>
                  <h3 className="text-2xl font-bold text-foreground mt-0.5">{inProgressCount}</h3>
                  <p className="text-[10px] text-amber-600 font-medium mt-1">Active Ground Operations</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Resolved Tasks
                  </p>
                  <h3 className="text-2xl font-bold text-foreground mt-0.5">{resolvedCount}</h3>
                  <p className="text-[10px] text-emerald-600 font-medium mt-1">Completed Maintenance Fixes</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Work Queue */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-600" />
                    <span>My Assigned Maintenance Work Queue</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tickets currently assigned to your staff profile for investigation and resolution.
                  </CardDescription>
                </div>
                <Link href="/staff/complaints">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Queue <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingComplaints ? (
                <div className="p-4">
                  <TableSkeleton rows={4} />
                </div>
              ) : myComplaints?.complaints && myComplaints.complaints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myComplaints.complaints.map((c: Complaint) => (
                      <TableRow key={c._id}>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {c._id.substring(c._id.length - 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <span className="truncate max-w-[200px] block">{c.title}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {c.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.priority === 'urgent' ? 'danger' : 'outline'}>
                            {c.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusIndicator
                            status={
                              c.status === 'resolved' || c.status === 'closed'
                                ? 'success'
                                : c.status === 'in_progress'
                                ? 'warning'
                                : 'info'
                            }
                            label={c.status.replace('_', ' ')}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="emerald" size="sm" onClick={() => setSelectedTicketId(c._id)}>
                            Inspect / Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600 mb-1" />
                  No maintenance tasks assigned to your profile currently.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Modal */}
        {selectedTicketId && (
          <ComplaintDetailModal
            open={!!selectedTicketId}
            onOpenChange={() => setSelectedTicketId(null)}
            complaintId={selectedTicketId}
            userRole="staff"
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
