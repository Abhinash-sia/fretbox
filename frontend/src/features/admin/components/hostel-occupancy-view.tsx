'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, Bed, Users, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { useHostelAnalytics } from '../hooks/use-admin-queries';

export function HostelOccupancyView() {
  const { data, isLoading, isError, refetch } = useHostelAnalytics();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Hostel Analytics"
        message="Could not retrieve hostel occupancy data."
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-4 select-none">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">Total Buildings</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold text-foreground">{data.totalHostels} Hostels</span>
              <Building2 className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">{data.totalBlocks} Blocks</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">Total Rooms</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold text-foreground">{data.totalRooms} Rooms</span>
              <Bed className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">{data.totalCapacity} Total Beds</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">Occupied Beds</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold text-foreground">{data.occupiedBeds} Beds</span>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">{data.availableBeds} Available</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">Overall Occupancy Rate</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.overallOccupancyPercentage}%
              </span>
              <Badge variant="success" className="font-mono text-[10px] px-1 py-0">Active</Badge>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">Campus Capacity Rate</span>
          </CardContent>
        </Card>
      </div>

      {/* Hostel-wise Breakdown Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>Hostel-wise Capacity & Occupancy Breakdown</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Live capacity utilization across all registered hostel buildings.
            </CardDescription>
          </div>

          <Link
            href="/warden/hostel"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline font-mono"
          >
            <span>Manage Hostels</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
                <th className="p-3">Hostel Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Rooms</th>
                <th className="p-3">Total Capacity</th>
                <th className="p-3">Occupied Beds</th>
                <th className="p-3">Available Beds</th>
                <th className="p-3">Occupancy Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.hostelWiseBreakdown?.length > 0 ? (
                data.hostelWiseBreakdown.map((item) => (
                  <tr key={item.hostelId} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{item.hostelName}</td>
                    <td className="p-3 font-mono text-muted-foreground uppercase">{item.hostelCode}</td>
                    <td className="p-3 font-mono">{item.roomCount}</td>
                    <td className="p-3 font-mono">{item.totalCapacity}</td>
                    <td className="p-3 font-mono font-semibold text-foreground">{item.occupiedCount}</td>
                    <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {item.availableBeds}
                    </td>
                    <td className="p-3 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(item.occupancyPercentage, 100)}%` }}
                          />
                        </div>
                        <span>{item.occupancyPercentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">
                    No hostel buildings registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
