'use client';

import * as React from 'react';
import { QrCode, Plus } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useStudentGatePasses, useCancelGatePass } from '@/features/student/hooks/use-student-queries';
import { GatePassRequestModal } from '@/features/student/components/gate-pass-request-modal';
import { GatePass } from '@/features/student/types/student';

export default function StudentGatePassPage() {
  const [requestModalOpen, setRequestModalOpen] = React.useState(false);
  const [selectedPass, setSelectedPass] = React.useState<GatePass | null>(null);

  const { data: gatePasses, isLoading, isError, refetch } = useStudentGatePasses();
  const cancelPassMutation = useCancelGatePass();

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this gate pass request?')) {
      try {
        await cancelPassMutation.mutateAsync(id);
      } catch {
        // Error handled in mutation state
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="success">APPROVED</Badge>;
      case 'PENDING': return <Badge variant="warning">PENDING WARDEN</Badge>;
      case 'REJECTED': return <Badge variant="danger">REJECTED</Badge>;
      case 'CANCELLED': return <Badge variant="outline">CANCELLED</Badge>;
      case 'USED': return <Badge variant="info">USED / CHECKED OUT</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <PageHeader
          heading="Campus Movement & Gate Passes"
          subheading="Local exit and out-station movement passes verified at security gates."
        >
          <Button variant="emerald" size="sm" onClick={() => setRequestModalOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Request Gate Pass
          </Button>
        </PageHeader>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Gate Passes"
            message="Could not retrieve gate pass history from the backend server."
            onRetry={() => refetch()}
          />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <QrCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>My Out-Pass Requests</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Active pass tokens can be scanned by Security Guards at campus entry/exit gates.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {gatePasses && gatePasses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destination</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Out Date & Time</TableHead>
                      <TableHead>Expected Return</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gatePasses.map((pass) => (
                      <TableRow key={pass._id}>
                        <TableCell className="font-semibold text-foreground">
                          {pass.destination}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          <span className="truncate max-w-[180px] block">{pass.reason}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {new Date(pass.outDateTime).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {new Date(pass.expectedReturnDateTime).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(pass.status)}</TableCell>
                        <TableCell className="text-right">
                          {pass.status === 'PENDING' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              onClick={() => handleCancel(pass._id)}
                              disabled={cancelPassMutation.isPending}
                            >
                              Cancel
                            </Button>
                          ) : pass.status === 'APPROVED' ? (
                            <Button variant="outline" size="sm" onClick={() => setSelectedPass(pass)}>
                              View QR Token
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-mono">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6">
                  <EmptyState
                    title="No Gate Passes Requested"
                    description="You have no active or historical campus exit pass requests."
                    actionLabel="Request Gate Pass"
                    onAction={() => setRequestModalOpen(true)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected Approved Pass Dialog */}
        {selectedPass && (
          <Dialog open={!!selectedPass} onOpenChange={() => setSelectedPass(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  <span>Approved Gate Pass Token</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Present this verified token to Security Guards at campus gates.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-sm font-bold border border-emerald-500/30">
                  {selectedPass.passToken ? selectedPass.passToken.substring(0, 8) : 'VERIFIED'}
                </div>

                <div className="rounded-md bg-muted/60 p-3 text-left space-y-1 font-mono text-[11px]">
                  <div><span className="text-muted-foreground">Destination:</span> {selectedPass.destination}</div>
                  <div><span className="text-muted-foreground">Out Time:</span> {new Date(selectedPass.outDateTime).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Expected Return:</span> {new Date(selectedPass.expectedReturnDateTime).toLocaleString()}</div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setSelectedPass(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Request Modal */}
        <GatePassRequestModal open={requestModalOpen} onOpenChange={setRequestModalOpen} />
      </AppShell>
    </ProtectedRoute>
  );
}
