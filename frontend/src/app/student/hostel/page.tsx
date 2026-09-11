'use client';

import * as React from 'react';
import { Building2, Bed, ShieldCheck, MapPin } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useStudentAllocation } from '@/features/student/hooks/use-student-queries';

export default function StudentHostelPage() {
  const { data: allocation, isLoading, isError, refetch } = useStudentAllocation();

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <PageHeader
          heading="Hostel & Room Allocation"
          subheading="Official residential hostel premises, room assignment, and bed occupancy status."
        />

        {isLoading ? (
          <CardSkeleton />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Hostel Allocation"
            message="Could not retrieve room allocation details from the backend server."
            onRetry={() => refetch()}
          />
        ) : allocation ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Room Assignment Details */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Hostel Assignment</span>
                  </CardTitle>
                  <Badge variant="success" className="font-mono text-[10px] uppercase">
                    {allocation.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Allocated on {new Date(allocation.allocatedAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="rounded-lg bg-muted/60 p-3 space-y-2">
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Hostel Building:
                    </span>
                    <span className="font-bold text-foreground">
                      {allocation.hostelId?.name || 'N/A'} ({allocation.hostelId?.code || 'N/A'})
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Block Name & Code:
                    </span>
                    <span className="font-semibold text-foreground">
                      Block {allocation.blockId?.name} ({allocation.blockId?.code})
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Bed className="h-3.5 w-3.5" /> Room Number:
                    </span>
                    <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                      {allocation.roomId?.roomNumber || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Floor Level:</span>
                    <span className="font-mono text-foreground font-semibold">
                      Floor {allocation.roomId?.floorNumber ?? 0}
                    </span>
                  </div>
                </div>

                {allocation.remarks && (
                  <div className="p-2.5 rounded bg-muted/40 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Warden Remarks: </span>
                    {allocation.remarks}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Residential Policy & Guidelines */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Hostel Guidelines</span>
                </CardTitle>
                <CardDescription className="text-xs">Residential rules and student responsibilities.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="p-2.5 rounded bg-muted/40 space-y-1">
                  <p className="font-semibold text-foreground text-[11px]">Room Maintenance</p>
                  <p className="text-[11px]">Students are responsible for maintaining cleanliness and proper care of assigned room furniture and electrical fixtures.</p>
                </div>
                <div className="p-2.5 rounded bg-muted/40 space-y-1">
                  <p className="font-semibold text-foreground text-[11px]">Night Curfew</p>
                  <p className="text-[11px]">Hostel entry gates close at 10:00 PM. Gate passes are strictly mandatory for out-station or late entry.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState
            title="No Active Hostel Room Allocation"
            description="You are currently not assigned to any residential hostel or room block."
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
