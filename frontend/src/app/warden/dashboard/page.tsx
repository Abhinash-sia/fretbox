'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Building2,
  Bed,
  Users,
  Wrench,
  Box,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
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
import { useHostels, useRooms, useAllocations } from '@/features/hostel/hooks/use-hostel-queries';
import { useComplaintMetrics, useComplaintsList } from '@/features/complaints/hooks/use-complaint-queries';
import { ComplaintDetailModal } from '@/features/complaints/components/complaint-detail-modal';
import { Room } from '@/features/hostel/types/hostel';
import { Complaint } from '@/features/complaints/types/complaints';

export default function WardenDashboardPage() {
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);

  const { data: hostelsData } = useHostels();
  const { data: roomsData } = useRooms({ limit: 100 });
  const { data: allocationsData } = useAllocations({ limit: 100 });
  const { data: metrics } = useComplaintMetrics();
  const { data: urgentComplaints, isLoading: loadingComplaints } = useComplaintsList({ priority: 'urgent', limit: 5 });

  const totalHostels = hostelsData?.total || 0;
  const activeAllocations = allocationsData?.total || 0;

  const totalCapacity = React.useMemo(() => {
    if (!roomsData?.rooms) return 0;
    return roomsData.rooms.reduce((acc: number, r: Room) => acc + (r.capacity || 0), 0);
  }, [roomsData]);

  const totalOccupancy = React.useMemo(() => {
    if (!roomsData?.rooms) return 0;
    return roomsData.rooms.reduce((acc: number, r: Room) => acc + (r.occupancy || 0), 0);
  }, [roomsData]);

  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <ProtectedRoute allowedRoles={['warden', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Warden Hostel & Campus Operations Dashboard"
          subheading="Monitor room occupancy, student allocations, facility assets, and urgent complaint queues."
        />

        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Total Hostels
                  </p>
                  <h3 className="text-2xl font-bold text-foreground mt-0.5">{totalHostels}</h3>
                  <p className="text-[10px] text-emerald-600 font-medium mt-1">Campus Residential Buildings</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Building2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Room Occupancy
                  </p>
                  <h3 className="text-2xl font-bold text-foreground mt-0.5">
                    {totalOccupancy} / {totalCapacity}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-medium mt-1">{occupancyRate}% Occupied</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Bed className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Active Allocations
                  </p>
                  <h3 className="text-2xl font-bold text-foreground mt-0.5">{activeAllocations}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Assigned Resident Students</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Open Complaints
                  </p>
                  <h3 className="text-2xl font-bold text-foreground mt-0.5">
                    {(metrics?.statusCounts?.open || 0) + (metrics?.statusCounts?.in_progress || 0)}
                  </h3>
                  <p className="text-[10px] text-amber-600 font-medium mt-1">
                    {metrics?.ageingBuckets?.pendingOver72h || 0} Over 72h Pending
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Wrench className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operational Ageing & Category Metrics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Urgent & High Priority Maintenance Tickets</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Requires immediate warden assignment or staff resolution dispatch
                    </CardDescription>
                  </div>
                  <Link href="/warden/complaints">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingComplaints ? (
                  <div className="p-4">
                    <TableSkeleton rows={3} />
                  </div>
                ) : urgentComplaints?.complaints && urgentComplaints.complaints.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {urgentComplaints.complaints.map((c: Complaint) => (
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
                          <TableCell className="text-xs">{c.studentId?.name || 'Student'}</TableCell>
                          <TableCell>
                            <StatusIndicator
                              status={c.status === 'resolved' ? 'success' : c.status === 'in_progress' ? 'warning' : 'danger'}
                              label={c.status.replace('_', ' ')}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTicketId(c._id)}>
                              Inspect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600 mb-1" />
                    No urgent maintenance complaints currently pending.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ageing Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Complaint Ageing Overview</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Turnaround SLA tracking across all hostel issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="rounded border bg-muted/30 p-2.5 flex items-center justify-between">
                  <span className="font-medium text-foreground">Pending &lt; 24h</span>
                  <Badge variant="success">{metrics?.ageingBuckets?.pendingUnder24h || 0}</Badge>
                </div>
                <div className="rounded border bg-muted/30 p-2.5 flex items-center justify-between">
                  <span className="font-medium text-foreground">Pending 24h - 72h</span>
                  <Badge variant="warning">{metrics?.ageingBuckets?.pending24to72h || 0}</Badge>
                </div>
                <div className="rounded border bg-muted/30 p-2.5 flex items-center justify-between">
                  <span className="font-medium text-foreground">Pending &gt; 72h (Overdue)</span>
                  <Badge variant="danger">{metrics?.ageingBuckets?.pendingOver72h || 0}</Badge>
                </div>

                <div className="pt-2 border-t text-[11px] text-muted-foreground flex justify-between">
                  <span>Average Resolution SLA:</span>
                  <span className="font-mono font-bold text-foreground">
                    {metrics?.averageResolutionTimeHours || 0} hours
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/warden/hostel">
              <Button variant="outline" className="w-full justify-start h-12 gap-3 text-xs">
                <Building2 className="h-4 w-4 text-blue-600" />
                <div className="text-left">
                  <div className="font-bold">Hostels & Blocks</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Manage residential structures</div>
                </div>
              </Button>
            </Link>

            <Link href="/warden/rooms">
              <Button variant="outline" className="w-full justify-start h-12 gap-3 text-xs">
                <Bed className="h-4 w-4 text-emerald-600" />
                <div className="text-left">
                  <div className="font-bold">Room Inventory</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Capacity & maintenance status</div>
                </div>
              </Button>
            </Link>

            <Link href="/warden/allocations">
              <Button variant="outline" className="w-full justify-start h-12 gap-3 text-xs">
                <Users className="h-4 w-4 text-purple-600" />
                <div className="text-left">
                  <div className="font-bold">Student Allocations</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Allocate & vacate room beds</div>
                </div>
              </Button>
            </Link>

            <Link href="/warden/facilities">
              <Button variant="outline" className="w-full justify-start h-12 gap-3 text-xs">
                <Box className="h-4 w-4 text-amber-600" />
                <div className="text-left">
                  <div className="font-bold">Facility Assets</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Track electrical & plumbing assets</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

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
