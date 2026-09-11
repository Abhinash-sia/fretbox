'use client';

import * as React from 'react';
import { Wrench, Plus } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useStudentComplaints } from '@/features/student/hooks/use-student-queries';
import { ComplaintCreateModal } from '@/features/student/components/complaint-create-modal';
import { ComplaintDetailModal } from '@/features/complaints/components/complaint-detail-modal';

export default function StudentComplaintsPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  const { data: complaints, isLoading, isError, refetch } = useStudentComplaints();

  const filteredComplaints = React.useMemo(() => {
    if (!complaints) return [];
    if (statusFilter === 'ALL') return complaints;
    if (statusFilter === 'OPEN') return complaints.filter((c) => ['OPEN', 'REOPENED'].includes((c.status || '').toUpperCase()));
    if (statusFilter === 'IN_PROGRESS') return complaints.filter((c) => ['IN_PROGRESS', 'ASSIGNED'].includes((c.status || '').toUpperCase()));
    if (statusFilter === 'RESOLVED') return complaints.filter((c) => ['RESOLVED', 'CLOSED'].includes((c.status || '').toUpperCase()));
    return complaints;
  }, [complaints, statusFilter]);

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return <Badge variant="danger">URGENT</Badge>;
      case 'HIGH': return <Badge variant="warning">HIGH</Badge>;
      case 'MEDIUM': return <Badge variant="info">MEDIUM</Badge>;
      default: return <Badge variant="outline">LOW</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <PageHeader
          heading="Hostel & Campus Maintenance Complaints"
          subheading="Report infrastructure or facility issues directly to hostel staff and wardens."
        >
          <Button variant="emerald" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            File New Complaint
          </Button>
        </PageHeader>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Maintenance Complaints"
            message="Could not retrieve tickets from the backend server."
            onRetry={() => refetch()}
          />
        ) : (
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="bg-muted">
                <TabsTrigger value="ALL">All ({complaints?.length || 0})</TabsTrigger>
                <TabsTrigger value="OPEN">Open</TabsTrigger>
                <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
                <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={statusFilter} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Reported Operational Tickets</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Track resolution progress, staff assignments, and audit logs for your submitted issues.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredComplaints.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Filed On</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredComplaints.map((ticket) => (
                          <TableRow key={ticket._id}>
                            <TableCell className="font-mono text-xs font-semibold text-foreground">
                              {ticket._id.substring(ticket._id.length - 8).toUpperCase()}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              <span className="truncate max-w-[200px] block">{ticket.title}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {ticket.category}
                              </Badge>
                            </TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>
                              <StatusIndicator
                                status={ticket.status?.toLowerCase() === 'resolved' || ticket.status?.toLowerCase() === 'closed' ? 'success' : ticket.status?.toLowerCase() === 'in_progress' ? 'warning' : 'info'}
                                label={ticket.status.replace('_', ' ')}
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-[11px]">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedTicketId(ticket._id)}>
                                Details & Audit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-6">
                      <EmptyState
                        title="No Complaints Found"
                        description="You have no maintenance complaints matching the selected filter."
                        actionLabel="File Complaint"
                        onAction={() => setCreateModalOpen(true)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Detailed Audit Ticket Modal */}
        {selectedTicketId && (
          <ComplaintDetailModal
            open={!!selectedTicketId}
            onOpenChange={() => setSelectedTicketId(null)}
            complaintId={selectedTicketId}
            userRole="student"
          />
        )}

        {/* Create Modal */}
        <ComplaintCreateModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      </AppShell>
    </ProtectedRoute>
  );
}
