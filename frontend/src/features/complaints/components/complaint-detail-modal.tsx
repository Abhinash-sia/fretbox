'use client';

import * as React from 'react';
import { Wrench, UserCheck, Clock, CheckCircle2, Bot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { useComplaintDetails } from '../hooks/use-complaint-queries';
import { ComplaintStatusModal } from './complaint-status-modal';
import { ComplaintAssignModal } from './complaint-assign-modal';
import { ComplaintStatus, ComplaintAudit } from '../types/complaints';

interface ComplaintDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  userRole?: string;
}

export function ComplaintDetailModal({
  open,
  onOpenChange,
  complaintId,
  userRole = 'staff',
}: ComplaintDetailModalProps) {
  const [statusModalOpen, setStatusModalOpen] = React.useState(false);
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);

  const { data, isLoading, isError } = useComplaintDetails(complaintId);

  const canAssign = userRole === 'warden' || userRole === 'administrator';

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return <Badge variant="danger">URGENT</Badge>;
      case 'high':
        return <Badge variant="warning">HIGH</Badge>;
      case 'medium':
        return <Badge variant="info">MEDIUM</Badge>;
      default:
        return <Badge variant="outline">LOW</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return <Badge variant="success">{status.toUpperCase()}</Badge>;
      case 'in_progress':
      case 'assigned':
        return <Badge variant="warning">{status.replace('_', ' ').toUpperCase()}</Badge>;
      default:
        return <Badge variant="info">{status?.toUpperCase() || 'OPEN'}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">Complaint Ticket Details</DialogTitle>
                  <DialogDescription className="text-xs">
                    Full operational history & audit timeline
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                #{complaintId.substring(complaintId.length - 8).toUpperCase()}
              </Badge>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={4} />
            </div>
          ) : isError || !data ? (
            <div className="p-4 text-xs text-rose-600 bg-rose-50 rounded">
              Failed to load ticket audit details from backend server.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs">
              {/* Header Info */}
              <div className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-foreground text-sm">{data.complaint.title}</h4>
                  <div className="flex gap-1.5 shrink-0">
                    {getPriorityBadge(data.complaint.priority)}
                    {getStatusBadge(data.complaint.status)}
                  </div>
                </div>

                <p className="text-muted-foreground bg-muted/60 p-2.5 rounded text-[11px] whitespace-pre-wrap">
                  {data.complaint.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-muted-foreground">Category: </span>
                    <span className="text-foreground font-semibold">{data.complaint.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Student: </span>
                    <span className="text-foreground font-semibold">
                      {data.complaint.studentId?.name || 'Student'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assigned To: </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {data.complaint.assignedToStaffId?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolution Notes */}
              {data.complaint.resolutionNotes && (
                <div className="space-y-1 rounded bg-emerald-50 dark:bg-emerald-950/40 p-3 border border-emerald-200 dark:border-emerald-800">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Resolution Summary
                  </span>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    {data.complaint.resolutionNotes}
                  </p>
                </div>
              )}

              {/* AI Classification Badge if available */}
              {data.complaint.aiClassification && (
                <div className="rounded bg-indigo-50 dark:bg-indigo-950/40 p-2.5 border border-indigo-200 dark:border-indigo-800 flex items-start gap-2">
                  <Bot className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo-900 dark:text-indigo-200 text-xs">
                      AI Categorization & Priority Audit
                    </span>
                    <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-0.5">
                      {data.complaint.aiClassification.reason} (Confidence:{' '}
                      {Math.round(data.complaint.aiClassification.confidence * 100)}%)
                    </p>
                  </div>
                </div>
              )}

              {/* Audit History Timeline */}
              <div className="space-y-2">
                <h5 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Audit Timeline & Status Log ({data.audits.length})</span>
                </h5>

                {data.audits.length > 0 ? (
                  <div className="space-y-2 pl-2 border-l-2 border-muted">
                    {data.audits.map((audit: ComplaintAudit) => (
                      <div key={audit._id} className="relative pl-3 space-y-0.5">
                        <div className="absolute -left-[11px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-foreground capitalize">
                            {audit.action.replace('_', ' ')}
                          </span>
                          <span className="text-muted-foreground font-mono text-[10px]">
                            {new Date(audit.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">
                          Performed by: <span className="font-medium text-foreground">{audit.performedByUserId?.name || 'System'}</span>
                        </p>
                        {audit.notes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-muted/40 p-1.5 rounded">
                            {audit.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-[11px] italic">No audit events logged yet.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 flex-wrap sm:justify-between">
            <div className="flex items-center gap-1.5">
              {canAssign && (
                <Button variant="outline" size="sm" onClick={() => setAssignModalOpen(true)}>
                  <UserCheck className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                  Assign Staff
                </Button>
              )}
              <Button variant="emerald" size="sm" onClick={() => setStatusModalOpen(true)}>
                <Wrench className="mr-1.5 h-3.5 w-3.5" />
                Update Status
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Modal */}
      {statusModalOpen && (
        <ComplaintStatusModal
          open={statusModalOpen}
          onOpenChange={setStatusModalOpen}
          complaintId={complaintId}
          currentStatus={data?.complaint?.status || ('open' as ComplaintStatus)}
          userRole={userRole}
        />
      )}

      {/* Assign Modal */}
      {assignModalOpen && (
        <ComplaintAssignModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          complaintId={complaintId}
        />
      )}
    </>
  );
}
