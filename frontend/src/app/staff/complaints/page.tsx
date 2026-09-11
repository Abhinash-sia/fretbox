'use client';

import * as React from 'react';
import { Wrench, Filter, Search } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useAuth } from '@/components/providers/auth-provider';
import { useComplaintsList } from '@/features/complaints/hooks/use-complaint-queries';
import { ComplaintDetailModal } from '@/features/complaints/components/complaint-detail-modal';
import { ComplaintStatus, Complaint } from '@/features/complaints/types/complaints';

export default function StaffComplaintsPage() {
  const { user } = useAuth();
  const staffUserId = user?.id;

  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const { data: complaintsData, isLoading, isError, refetch } = useComplaintsList({
    assignedToStaffId: staffUserId,
    status: statusFilter !== 'ALL' ? (statusFilter as ComplaintStatus) : undefined,
    search: searchQuery.trim() || undefined,
    limit: 100,
  });

  const complaints = complaintsData?.complaints || [];

  return (
    <ProtectedRoute allowedRoles={['staff', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Assigned Complaints Work Queue"
          subheading="Inspect work orders, record resolution notes, and update ground maintenance status."
        />

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Work Queue"
            message="Could not retrieve assigned maintenance tasks from the backend server."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assigned tasks..."
                    className="h-8 text-xs max-w-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-8 w-[140px] rounded-md border border-input bg-background px-2 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  <span>My Workplace Tasks ({complaints.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Ground maintenance tickets assigned to your user context.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {complaints.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Filed Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complaints.map((c: Complaint) => (
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
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="emerald" size="sm" onClick={() => setSelectedTicketId(c._id)}>
                              Inspect / Work
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      title="No Assigned Tasks"
                      description="You currently have no assigned maintenance complaints matching the selected filter."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal */}
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
