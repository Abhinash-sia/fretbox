'use client';

import * as React from 'react';
import { Box, Filter, Search, Plus } from 'lucide-react';
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
import { useFacilityAssets } from '@/features/facilities/hooks/use-facilities-queries';
import { CreateAssetModal } from '@/features/facilities/components/create-asset-modal';
import { FacilityAsset, AssetCategory, AssetStatus } from '@/features/facilities/types/facilities';

export default function StaffFacilitiesPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [assetToEdit, setAssetToEdit] = React.useState<FacilityAsset | null>(null);

  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const { data: assetsData, isLoading, isError, refetch } = useFacilityAssets({
    category: categoryFilter !== 'ALL' ? (categoryFilter as AssetCategory) : undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as AssetStatus) : undefined,
    search: searchQuery.trim() || undefined,
    limit: 100,
  });

  const assets = assetsData?.assets || [];

  const getConditionBadge = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'critical':
        return <Badge variant="danger">CRITICAL</Badge>;
      case 'poor':
        return <Badge variant="warning">POOR</Badge>;
      case 'fair':
        return <Badge variant="info">FAIR</Badge>;
      default:
        return <Badge variant="success">GOOD</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['staff', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Facility Asset Inspection & Maintenance"
          subheading="Inspect equipment conditions, report damaged assets, and log maintenance updates."
        >
          <Button variant="emerald" size="sm" onClick={() => { setAssetToEdit(null); setCreateModalOpen(true); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Report / Register Asset
          </Button>
        </PageHeader>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Facility Assets"
            message="Could not retrieve facility inventory from backend server."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search asset tag, location..."
                    className="h-8 text-xs max-w-xs"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="flex h-8 w-[140px] rounded-md border border-input bg-background px-2 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="room">Room</option>
                    <option value="furniture">Furniture</option>
                    <option value="appliance">Appliance</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-8 w-[140px] rounded-md border border-input bg-background px-2 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Box className="h-4 w-4 text-emerald-600" />
                  <span>Inspected Facility Assets ({assets.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Inspect equipment status and log maintenance condition updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {assets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Tag</TableHead>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assets.map((a: FacilityAsset) => (
                        <TableRow key={a._id}>
                          <TableCell className="font-mono text-xs font-bold text-foreground">
                            {a.assetTag}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{a.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {a.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {a.locationText || 'General Hostel'}
                          </TableCell>
                          <TableCell>
                            <StatusIndicator
                              status={
                                a.status === 'active'
                                  ? 'success'
                                  : a.status === 'maintenance'
                                  ? 'warning'
                                  : 'danger'
                              }
                              label={a.status.toUpperCase()}
                            />
                          </TableCell>
                          <TableCell>{getConditionBadge(a.condition)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setAssetToEdit(a); setCreateModalOpen(true); }}
                            >
                              Update Status
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      title="No Facility Assets Found"
                      description="No assets match the selected filter."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal */}
        {(createModalOpen || assetToEdit) && (
          <CreateAssetModal
            open={createModalOpen || !!assetToEdit}
            onOpenChange={(val) => {
              setCreateModalOpen(val);
              if (!val) setAssetToEdit(null);
            }}
            assetToEdit={assetToEdit}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
