'use client';

import * as React from 'react';
import { Loader2, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { useSectionEnrollments, useMarkSessionAttendance } from '../hooks/use-faculty-queries';
import { AttendanceStatus } from '../types/faculty';

interface MarkAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  classSectionId: string;
}

export function MarkAttendanceModal({
  open,
  onOpenChange,
  sessionId,
  classSectionId,
}: MarkAttendanceModalProps) {
  const { data: enrollments, isLoading } = useSectionEnrollments(classSectionId);
  const markAttendanceMutation = useMarkSessionAttendance();

  const [attendanceState, setAttendanceState] = React.useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});
  const [serverError, setServerError] = React.useState<string | null>(null);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: { status, remarks: prev[studentId]?.remarks || '' },
    }));
  };

  const handleBatchStatus = (status: AttendanceStatus) => {
    if (!enrollments) return;
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    enrollments.forEach((e) => {
      updated[e.studentId._id] = {
        status,
        remarks: attendanceState[e.studentId._id]?.remarks || '',
      };
    });
    setAttendanceState(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!enrollments || enrollments.length === 0) {
      setServerError('No students enrolled in this section');
      return;
    }

    const records = enrollments.map((item) => {
      const studentId = item.studentId._id;
      const state = attendanceState[studentId];
      return {
        studentId,
        status: state?.status || ('PRESENT' as AttendanceStatus),
        remarks: state?.remarks || '',
      };
    });

    try {
      await markAttendanceMutation.mutateAsync({
        sessionId,
        records,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to mark attendance records');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base">Record Class Attendance Rollcall</DialogTitle>
                <DialogDescription className="text-xs">
                  Mark student attendance for session ID: {sessionId.substring(sessionId.length - 8).toUpperCase()}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => handleBatchStatus('PRESENT')}
              >
                <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" /> All Present
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => handleBatchStatus('ABSENT')}
              >
                <XCircle className="mr-1 h-3 w-3 text-rose-600" /> All Absent
              </Button>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-3 pt-2 text-xs">
          {serverError && (
            <div className="rounded bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium">
              {serverError}
            </div>
          )}

          <div className="flex-1 overflow-y-auto border rounded-md">
            {isLoading ? (
              <div className="p-4">
                <TableSkeleton rows={5} />
              </div>
            ) : enrollments && enrollments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Attendance Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((item) => {
                    const studentId = item.studentId._id;
                    const currentStatus = attendanceState[studentId]?.status || 'PRESENT';

                    return (
                      <TableRow key={item._id}>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {item.rollNumber}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {item.studentId.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as AttendanceStatus[]).map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleStatusChange(studentId, status)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors border ${
                                    currentStatus === status
                                      ? status === 'PRESENT'
                                        ? 'bg-emerald-600 text-white border-emerald-700'
                                        : status === 'LATE'
                                        ? 'bg-amber-500 text-white border-amber-600'
                                        : status === 'ABSENT'
                                        ? 'bg-rose-600 text-white border-rose-700'
                                        : 'bg-blue-600 text-white border-blue-700'
                                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                  }`}
                                >
                                  {status.substring(0, 3)}
                                </button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center">
                <EmptyState
                  title="No Students Enrolled"
                  description="There are no active student enrollments found in this class section."
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={markAttendanceMutation.isPending || !enrollments || enrollments.length === 0}
            >
              {markAttendanceMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                'Save Attendance Records'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
