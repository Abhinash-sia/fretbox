'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateComplaintStatus } from '../hooks/use-complaint-queries';
import { ComplaintStatus } from '../types/complaints';

const statusSchema = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened']),
  notes: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

type StatusFormValues = z.infer<typeof statusSchema>;

interface ComplaintStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  currentStatus: ComplaintStatus;
  userRole?: string;
}

export function ComplaintStatusModal({
  open,
  onOpenChange,
  complaintId,
  currentStatus,
  userRole = 'staff',
}: ComplaintStatusModalProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const updateStatusMutation = useUpdateComplaintStatus();

  const isStudent = userRole === 'student';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: isStudent ? 'closed' : currentStatus,
      notes: '',
      resolutionNotes: '',
    },
  });

  const selectedStatus = useWatch({ control, name: 'status' });

  const onSubmit = async (data: StatusFormValues) => {
    setServerError(null);
    try {
      await updateStatusMutation.mutateAsync({
        id: complaintId,
        input: {
          status: data.status as ComplaintStatus,
          notes: data.notes,
          resolutionNotes: data.resolutionNotes,
        },
      });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to update complaint status');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Update Complaint Status</DialogTitle>
              <DialogDescription className="text-xs">
                Ticket ID: {complaintId.substring(complaintId.length - 8).toUpperCase()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 text-xs">
          {serverError && (
            <div className="rounded bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {serverError}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Target Status</label>
            {isStudent ? (
              <select
                {...register('status')}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="closed">Closed (Mark Resolved)</option>
                <option value="reopened">Reopened (Issue Persists)</option>
              </select>
            ) : (
              <select
                {...register('status')}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="reopened">Reopened</option>
              </select>
            )}
            {errors.status && <p className="text-[11px] text-rose-600">{errors.status.message}</p>}
          </div>

          {selectedStatus === 'resolved' && (
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Resolution Notes</label>
              <Input
                {...register('resolutionNotes')}
                placeholder="Describe how the maintenance issue was fixed"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Audit / Update Notes</label>
            <Textarea
              {...register('notes')}
              placeholder="Optional notes for operational audit timeline..."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Save Status Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
