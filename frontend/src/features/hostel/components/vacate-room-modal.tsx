'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVacateRoom } from '../hooks/use-hostel-queries';

const vacateSchema = z.object({
  remarks: z.string().optional(),
});

type VacateFormValues = z.infer<typeof vacateSchema>;

interface VacateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocationId: string;
  studentName?: string;
}

export function VacateRoomModal({
  open,
  onOpenChange,
  allocationId,
  studentName = 'Student',
}: VacateRoomModalProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const vacateMutation = useVacateRoom();

  const { register, handleSubmit, reset } = useForm<VacateFormValues>({
    resolver: zodResolver(vacateSchema),
    defaultValues: {
      remarks: '',
    },
  });

  const onSubmit = async (data: VacateFormValues) => {
    setServerError(null);
    try {
      await vacateMutation.mutateAsync({
        allocationId,
        input: { remarks: data.remarks },
      });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to vacate room allocation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white">
              <LogOut className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Vacate Room Allocation</DialogTitle>
              <DialogDescription className="text-xs">
                Vacating allocation for <span className="font-semibold">{studentName}</span>
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

          <p className="text-muted-foreground text-xs leading-relaxed">
            Are you sure you want to mark this allocation as <span className="font-bold text-rose-600">VACATED</span>? This will free up room capacity for reallocation.
          </p>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Vacation Remarks</label>
            <Textarea
              {...register('remarks')}
              placeholder="Reason for room vacation (course completion, room transfer, hostel exit)..."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" size="sm" disabled={vacateMutation.isPending}>
              {vacateMutation.isPending ? 'Vacating...' : 'Confirm Room Vacation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
