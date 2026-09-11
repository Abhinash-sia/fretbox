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
import { useComplaintsList } from '@/features/complaints/hooks/use-complaint-queries';
import { ComplaintDetailModal } from '@/features/complaints/components/complaint-detail-modal';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus, Complaint } from '@/features/complaints/types/complaints';

export default function WardenComplaintsPage() {
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const { data: complaintsData, isLoading, isError, refetch } = useComplaintsList({
    status: statusFilter !== 'ALL' ? (statusFilter as ComplaintStatus) : undefined,
    priority: priorityFilter !== 'ALL' ? (priorityFilter as ComplaintPriority) : undefined,
    category: categoryFilter !== 'ALL' ? (categoryFilter as ComplaintCategory) : undefined,
    search: searchQuery.trim() || undefined,
    limit: 100,
  });

  const complaints = complaintsData?.complaints || [];

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return <Badge variant="danger">URGENT</Badge>;
      case 'high':
        return <Badge variant="warning">HIGH</Badge>;
      case 'medium':
        return <Badge variant="info">MEDIUM</Badge>;
      default:
        return <Badge variant="outline">LOW</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['warden', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Hostel Complaints & Maintenance Operations"
          subheading="Assign staff, transition complaint status, and inspect operational resolution timelines."
        />

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Maintenance Complaints"
            message="Could not retrieve complaint tickets from the backend server."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="space-y-4">
            {/* Filter Bar */}
            <Card>
              <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, ticket ID, description..."
                    className="h-8 text-xs max-w-xs"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-8 w-[130px] rounded-md border border-input bg-background px-2 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="reopened">Reopened</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="flex h-8 w-[130px] rounded-md border border-input bg-background px-2 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="flex h-8 w-[140px] rounded-md border border-input bg-background px-2 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="cleanliness">Cleanliness</option>
                    <option value="room">Room</option>
                    <option value="furniture">Furniture</option>
                    <option value="network">Network</option>
                    <option value="water">Water</option>
                    <option value="mess">Mess</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  <span>Maintenance Complaints Log ({complaints.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Inspect ticket details, assign staff members, and track status audit logs.
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
                        <TableHead>Student</TableHead>
                        <TableHead>Assigned Staff</TableHead>
                        <TableHead>Status</TableHead>
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
                            <span className="truncate max-w-[180px] block">{c.title}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {c.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{getPriorityBadge(c.priority)}</TableCell>
                          <TableCell className="text-xs font-medium">{c.studentId?.name || 'Student'}</TableCell>
                          <TableCell className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                            {c.assignedToStaffId?.name || 'Unassigned'}
                          </TableCell>
                          <TableCell>
                            <StatusIndicator
                              status={
                                c.status === 'resolved' || c.status === 'closed'
                                  ? 'success'
                                  : c.status === 'in_progress' || c.status === 'assigned'
                                  ? 'warning'
                                  : 'info'
                              }
                              label={c.status.replace('_', ' ')}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTicketId(c._id)}>
                              Inspect / Manage
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
                      description="No complaint tickets match the selected filters."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Complaint Detail Modal */}
        {selectedTicketId && (
          <ComplaintDetailModal
            open={!!selectedTicketId}
            onOpenChange={() => setSelectedTicketId(null)}
            complaintId={selectedTicketId}
            userRole="warden"
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
