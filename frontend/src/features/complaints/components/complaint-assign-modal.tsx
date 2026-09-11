'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCheck } from 'lucide-react';
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
import { useAssignComplaint } from '../hooks/use-complaint-queries';

const assignSchema = z.object({
  assignedToStaffId: z
    .string({ message: 'Staff User ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid 24-character MongoDB ObjectId'),
  notes: z.string().optional(),
});

type AssignFormValues = z.infer<typeof assignSchema>;

interface ComplaintAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
}

export function ComplaintAssignModal({
  open,
  onOpenChange,
  complaintId,
}: ComplaintAssignModalProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const assignMutation = useAssignComplaint();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      assignedToStaffId: '',
      notes: '',
    },
  });

  const onSubmit = async (data: AssignFormValues) => {
    setServerError(null);
    try {
      await assignMutation.mutateAsync({
        id: complaintId,
        input: {
          assignedToStaffId: data.assignedToStaffId,
          notes: data.notes,
        },
      });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to assign complaint to staff');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Assign Complaint to Staff</DialogTitle>
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
            <label className="font-semibold text-foreground">Staff / Warden User ID</label>
            <Input
              {...register('assignedToStaffId')}
              placeholder="e.g. 64a041d17f82ba1c8d001234"
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Enter the staff or warden MongoDB User ID to assign ownership.
            </p>
            {errors.assignedToStaffId && (
              <p className="text-[11px] text-rose-600">{errors.assignedToStaffId.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Assignment Notes</label>
            <Textarea
              {...register('notes')}
              placeholder="Instructions or scope of maintenance work..."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald" size="sm" disabled={assignMutation.isPending}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign Staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
