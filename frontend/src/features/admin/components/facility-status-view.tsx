'use client';

import * as React from 'react';
import Link from 'next/link';
import { Box, Wrench, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { useFacilityAnalytics } from '../hooks/use-admin-queries';

export function FacilityStatusView() {
  const { data, isLoading, isError, refetch } = useFacilityAnalytics();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Facility Analytics"
        message="Could not retrieve facility asset operational condition."
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-4 select-none">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">Total Assets</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold text-foreground">{data.totalAssets}</span>
              <Box className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">Registered Infrastructure</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">Active / Good</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.activeAssets}
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">Operational</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">In Maintenance</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
                {data.maintenanceAssets}
              </span>
              <Wrench className="h-4 w-4 text-amber-500" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">Under Repair</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">Inactive / Retired</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
                {data.inactiveAssets}
              </span>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground block">Out of Service</span>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Category Breakdown & Top Complaint Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Box className="h-4 w-4 text-emerald-600" />
              <span>Asset Category Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Count of registered equipment by domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {Object.entries(data.categoryBreakdown || {}).length > 0 ? (
              Object.entries(data.categoryBreakdown).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between border-b border-border/50 pb-1.5 font-mono">
                  <span className="text-muted-foreground uppercase">{cat}</span>
                  <Badge variant="outline" className="text-xs">{count} Assets</Badge>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No categories recorded.</span>
            )}
          </CardContent>
        </Card>

        {/* Top Complaint Assets Hotspots */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span>Top Maintenance Issue Assets</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Facility assets generating the highest complaint volume.
              </CardDescription>
            </div>

            <Link href="/warden/facilities" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline font-mono">
              <span>View Assets</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
                  <th className="p-2.5">Asset Name</th>
                  <th className="p-2.5">Tag</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-right">Complaints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.topComplaintAssets?.length > 0 ? (
                  data.topComplaintAssets.map((asset) => (
                    <tr key={asset.assetId} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 font-semibold text-foreground">{asset.assetName}</td>
                      <td className="p-2.5 font-mono text-muted-foreground uppercase">{asset.assetTag}</td>
                      <td className="p-2.5 uppercase font-mono text-muted-foreground">{asset.category}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {asset.complaintCount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground">
                      No high-issue assets recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
