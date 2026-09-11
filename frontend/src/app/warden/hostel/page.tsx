'use client';

import * as React from 'react';
import { Building2, Home } from 'lucide-react';
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
import { useHostels, useHostelBlocks } from '@/features/hostel/hooks/use-hostel-queries';
import { Hostel, HostelBlock } from '@/features/hostel/types/hostel';

export default function WardenHostelPage() {
  const [selectedHostelId, setSelectedHostelId] = React.useState<string | null>(null);

  const { data: hostelsData, isLoading, isError, refetch } = useHostels();
  const hostels = hostelsData?.hostels || [];

  const activeHostelId = selectedHostelId || (hostels.length > 0 ? hostels[0]._id : undefined);

  const { data: blocks, isLoading: loadingBlocks } = useHostelBlocks(activeHostelId);

  return (
    <ProtectedRoute allowedRoles={['warden', 'administrator']}>
      <AppShell>
        <PageHeader
          heading="Hostel Buildings & Residential Blocks"
          subheading="View campus hostels, category classifications, and block structure breakdown."
        />

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Hostels"
            message="Could not retrieve hostel building metadata from the backend server."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>Campus Hostel Directory ({hostels.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Select a hostel to inspect block structure and resident capacity.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {hostels.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hostel Code</TableHead>
                        <TableHead>Hostel Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hostels.map((h: Hostel) => (
                        <TableRow
                          key={h._id}
                          className={activeHostelId === h._id ? 'bg-muted/60' : ''}
                        >
                          <TableCell className="font-mono text-xs font-semibold text-foreground">
                            {h.code}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{h.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {h.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{h.capacity || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={h.isActive ? 'success' : 'secondary'}>
                              {h.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={activeHostelId === h._id ? 'secondary' : 'ghost'}
                              size="sm"
                              onClick={() => setSelectedHostelId(h._id)}
                            >
                              Inspect Blocks
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      title="No Hostels Registered"
                      description="No campus hostels are currently registered in the database."
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blocks Section */}
            {activeHostelId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Home className="h-4 w-4 text-emerald-600" />
                    <span>Hostel Blocks & Floor Structure</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Blocks configured under the selected hostel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingBlocks ? (
                    <div className="p-4">
                      <TableSkeleton rows={3} />
                    </div>
                  ) : blocks && blocks.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Block Code</TableHead>
                          <TableHead>Block Name</TableHead>
                          <TableHead>Floors</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blocks.map((b: HostelBlock) => (
                          <TableRow key={b._id}>
                            <TableCell className="font-mono text-xs font-semibold text-foreground">
                              {b.code}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">{b.name}</TableCell>
                            <TableCell className="font-mono text-xs">{b.floors || 'N/A'}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {b.description || 'No notes'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={b.isActive ? 'success' : 'secondary'}>
                                {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-6">
                      <EmptyState
                        title="No Blocks Configured"
                        description="This hostel currently has no building blocks registered."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
