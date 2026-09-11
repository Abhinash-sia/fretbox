'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, FileCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCorrectAttendanceRecord } from '../hooks/use-faculty-queries';
import { AttendanceStatus } from '../types/faculty';

const correctSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  reason: z.string().min(3, 'Reason must be at least 3 characters long'),
});

type CorrectFormData = z.infer<typeof correctSchema>;

interface CorrectAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string;
  currentStatus?: AttendanceStatus;
  studentName?: string;
}

export function CorrectAttendanceModal({
  open,
  onOpenChange,
  recordId,
  currentStatus = 'PRESENT',
  studentName = 'Student',
}: CorrectAttendanceModalProps) {
  const correctMutation = useCorrectAttendanceRecord();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CorrectFormData>({
    resolver: zodResolver(correctSchema),
    defaultValues: {
      status: currentStatus,
      reason: '',
    },
  });

  const onSubmit = async (data: CorrectFormData) => {
    setServerError(null);
    try {
      await correctMutation.mutateAsync({
        recordId,
        status: data.status as AttendanceStatus,
        reason: data.reason,
      });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to correct attendance record');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Correct Attendance Record</DialogTitle>
              <DialogDescription className="text-xs">
                Submit an audited attendance status correction for {studentName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2 text-xs">
          {serverError && (
            <div className="rounded bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Updated Attendance Status *</label>
            <select
              {...register('status')}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="ABSENT">ABSENT</option>
              <option value="EXCUSED">EXCUSED</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Audit Reason for Correction *</label>
            <Textarea
              placeholder="e.g. Student presented valid medical leave certificate approved by Warden."
              rows={3}
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald" size="sm" disabled={correctMutation.isPending}>
              {correctMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving Correction...
                </>
              ) : (
                'Save Audited Correction'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
