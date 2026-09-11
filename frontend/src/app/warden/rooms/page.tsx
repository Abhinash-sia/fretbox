'use client';

import * as React from 'react';
import { Bed, Filter, Search, Plus } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useRooms } from '@/features/hostel/hooks/use-hostel-queries';
import { AllocateRoomModal } from '@/features/hostel/components/allocate-room-modal';
import { Room } from '@/features/hostel/types/hostel';

export default function WardenRoomsPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [allocateRoomId, setAllocateRoomId] = React.useState<string | null>(null);

  const { data: roomsData, isLoading, isError, refetch } = useRooms({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    limit: 100,
  });

  const filteredRooms = React.useMemo(() => {
    const list = roomsData?.rooms || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((r: Room) => r.roomNumber.toLowerCase().includes(q));
  }, [roomsData?.rooms, searchQuery]);

  return (
    <ProtectedRoute allowedRoles={['warden', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Room Inventory & Occupancy Status"
          subheading="Monitor room capacity, occupancy rates, and maintenance availability."
        >
          <Button variant="emerald" size="sm" onClick={() => setAllocateRoomId('')}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Allocate Student to Room
          </Button>
        </PageHeader>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Rooms"
            message="Could not retrieve room inventory from the backend server."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <Card>
              <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by room number..."
                    className="h-8 text-xs max-w-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-8 w-[140px] rounded-md border border-input bg-background px-2 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="full">Full</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Bed className="h-4 w-4 text-emerald-600" />
                  <span>Residential Rooms Directory ({filteredRooms.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Inspect room floor levels, capacity limits, and current bed allocations.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {filteredRooms.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room Number</TableHead>
                        <TableHead>Floor Level</TableHead>
                        <TableHead>Occupancy / Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRooms.map((r: Room) => (
                        <TableRow key={r._id}>
                          <TableCell className="font-mono text-xs font-bold text-foreground">
                            Room {r.roomNumber}
                          </TableCell>
                          <TableCell className="font-mono text-xs">Floor {r.floorNumber}</TableCell>
                          <TableCell className="font-mono text-xs">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {r.occupancy}
                            </span>{' '}
                            / {r.capacity} beds
                          </TableCell>
                          <TableCell>
                            <StatusIndicator
                              status={
                                r.status === 'available'
                                  ? 'success'
                                  : r.status === 'full'
                                  ? 'info'
                                  : 'warning'
                              }
                              label={r.status.toUpperCase()}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={r.status === 'full' || r.status === 'maintenance'}
                              onClick={() => setAllocateRoomId(r._id)}
                            >
                              Allocate Student
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      title="No Rooms Found"
                      description="No rooms match the selected search filter."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Allocate Modal */}
        {allocateRoomId !== null && (
          <AllocateRoomModal
            open={allocateRoomId !== null}
            onOpenChange={() => setAllocateRoomId(null)}
            preselectedRoomId={allocateRoomId}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
