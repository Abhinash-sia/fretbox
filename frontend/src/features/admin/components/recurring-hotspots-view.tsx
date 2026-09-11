'use client';

import * as React from 'react';
import { AlertTriangle, MapPin, Box, Flame } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { useRecurringIssues } from '../hooks/use-admin-queries';

export function RecurringHotspotsView() {
  const { data, isLoading, isError, refetch } = useRecurringIssues({ windowDays: 30, limit: 5 });

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Recurring Hotspots"
        message="Could not retrieve recurring issue location data."
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
      {/* Location Hotspots */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-500" />
            <span>Recurring Location Hotspots</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Hostel rooms generating frequent complaint submissions in last {data.windowDays} days.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
                <th className="p-2.5">Hostel</th>
                <th className="p-2.5">Block / Room</th>
                <th className="p-2.5">Categories</th>
                <th className="p-2.5 text-right">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.locationHotspots?.length > 0 ? (
                data.locationHotspots.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 font-semibold text-foreground">{item.hostelName || 'Hostel'}</td>
                    <td className="p-2.5 font-mono text-muted-foreground">
                      {item.blockName} {item.roomNumber ? `— Room ${item.roomNumber}` : ''}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-muted-foreground">
                      {item.categories?.join(', ')}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      <Badge variant="destructive" className="text-[10px]">
                        <Flame className="mr-1 h-3 w-3" /> {item.count}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground">
                    No recurring location hotspots detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Asset Hotspots */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <Box className="h-4 w-4 text-amber-500" />
            <span>Recurring Asset Hotspots</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Infrastructure equipment experiencing recurring breakdowns.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
                <th className="p-2.5">Asset Name</th>
                <th className="p-2.5">Tag</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5 text-right">Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.assetHotspots?.length > 0 ? (
                data.assetHotspots.map((asset) => (
                  <tr key={asset.assetId} className="hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 font-semibold text-foreground">{asset.assetName}</td>
                    <td className="p-2.5 font-mono text-muted-foreground uppercase">{asset.assetTag}</td>
                    <td className="p-2.5 font-mono text-muted-foreground uppercase">{asset.category}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      <Badge variant="warning" className="text-[10px]">
                        <AlertTriangle className="mr-1 h-3 w-3" /> {asset.count}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground">
                    No recurring asset breakdowns recorded.
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
