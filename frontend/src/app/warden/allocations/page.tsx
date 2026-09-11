'use client';

import * as React from 'react';
import { Users, Plus, LogOut } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useAllocations } from '@/features/hostel/hooks/use-hostel-queries';
import { AllocateRoomModal } from '@/features/hostel/components/allocate-room-modal';
import { VacateRoomModal } from '@/features/hostel/components/vacate-room-modal';
import { StudentAllocation } from '@/features/hostel/types/hostel';

export default function WardenAllocationsPage() {
  const [allocateOpen, setAllocateOpen] = React.useState(false);
  const [vacateTarget, setVacateTarget] = React.useState<{ id: string; name: string } | null>(null);

  const { data: allocationsData, isLoading, isError, refetch } = useAllocations({ limit: 100 });
  const allocations = allocationsData?.allocations || [];

  return (
    <ProtectedRoute allowedRoles={['warden', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Student Room Allocations"
          subheading="View, assign, and vacate resident student room bed allocations."
        >
          <Button variant="emerald" size="sm" onClick={() => setAllocateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Room Allocation
          </Button>
        </PageHeader>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Allocations"
            message="Could not retrieve room allocations from the backend server."
            onRetry={() => refetch()}
          />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span>Active & Vacated Resident Allocations ({allocations.length})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Active room assignments and historical vacation records.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {allocations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Room Assigned</TableHead>
                      <TableHead>Allocated On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((a: StudentAllocation) => (
                      <TableRow key={a._id}>
                        <TableCell className="font-medium text-foreground">
                          {a.studentId?.name || 'Resident Student'}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          Room {a.roomId?.roomNumber || 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(a.allocatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.status === 'active' ? 'success' : 'secondary'}>
                            {a.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.remarks || 'No remarks'}
                        </TableCell>
                        <TableCell className="text-right">
                          {a.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => setVacateTarget({ id: a._id, name: a.studentId?.name || 'Student' })}
                            >
                              <LogOut className="mr-1 h-3 w-3" />
                              Vacate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6">
                  <EmptyState
                    title="No Allocations Found"
                    description="No student room allocations currently exist in the database."
                    actionLabel="Allocate Room"
                    onAction={() => setAllocateOpen(true)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        {allocateOpen && (
          <AllocateRoomModal open={allocateOpen} onOpenChange={setAllocateOpen} />
        )}

        {vacateTarget && (
          <VacateRoomModal
            open={!!vacateTarget}
            onOpenChange={() => setVacateTarget(null)}
            allocationId={vacateTarget.id}
            studentName={vacateTarget.name}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
