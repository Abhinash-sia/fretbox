'use client';

import * as React from 'react';
import { Wrench, Plus, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useStudentComplaints } from '@/features/student/hooks/use-student-queries';
import { ComplaintCreateModal } from '@/features/student/components/complaint-create-modal';
import { Complaint } from '@/features/student/types/student';

export default function StudentComplaintsPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  const { data: complaints, isLoading, isError, refetch } = useStudentComplaints();

  const filteredComplaints = React.useMemo(() => {
    if (!complaints) return [];
    if (statusFilter === 'ALL') return complaints;
    if (statusFilter === 'OPEN') return complaints.filter((c) => c.status === 'OPEN' || c.status === 'REOPENED');
    if (statusFilter === 'IN_PROGRESS') return complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED');
    if (statusFilter === 'RESOLVED') return complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED');
    return complaints;
  }, [complaints, statusFilter]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
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
                    Track resolution progress and staff assignments for your submitted issues.
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
                                status={ticket.status === 'RESOLVED' ? 'success' : ticket.status === 'IN_PROGRESS' ? 'warning' : 'info'}
                                label={ticket.status.replace('_', ' ')}
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-[11px]">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>
                                Details
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

        {/* Ticket Details Dialog */}
        {selectedTicket && (
          <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold">
                    Complaint Ticket Details
                  </DialogTitle>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    ID: {selectedTicket._id.substring(selectedTicket._id.length - 8).toUpperCase()}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  Filed on {new Date(selectedTicket.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div>
                  <h4 className="font-semibold text-foreground">{selectedTicket.title}</h4>
                  <p className="mt-1 text-muted-foreground bg-muted/60 p-2.5 rounded text-[11px] whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-muted/40 p-2.5 rounded">
                  <div>
                    <span className="text-muted-foreground">Category: </span>
                    <span className="text-foreground font-semibold">{selectedTicket.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority: </span>
                    <span className="text-foreground font-semibold">{selectedTicket.priority}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{selectedTicket.status}</span>
                  </div>
                </div>

                {selectedTicket.resolutionNotes && (
                  <div className="space-y-1 rounded bg-emerald-50 dark:bg-emerald-950/40 p-2.5 border border-emerald-200 dark:border-emerald-800">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-emerald-600" />
                      Resolution Notes
                    </span>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      {selectedTicket.resolutionNotes}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Create Modal */}
        <ComplaintCreateModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      </AppShell>
    </ProtectedRoute>
  );
}
