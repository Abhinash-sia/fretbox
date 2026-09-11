'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bed } from 'lucide-react';
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
import { useAllocateRoom } from '../hooks/use-hostel-queries';

const allocateSchema = z.object({
  studentId: z
    .string({ message: 'Student User ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid 24-character MongoDB ObjectId'),
  roomId: z
    .string({ message: 'Room ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid 24-character MongoDB ObjectId'),
  remarks: z.string().optional(),
});

type AllocateFormValues = z.infer<typeof allocateSchema>;

interface AllocateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRoomId?: string;
}

export function AllocateRoomModal({
  open,
  onOpenChange,
  preselectedRoomId = '',
}: AllocateRoomModalProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const allocateMutation = useAllocateRoom();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AllocateFormValues>({
    resolver: zodResolver(allocateSchema),
    defaultValues: {
      studentId: '',
      roomId: preselectedRoomId,
      remarks: '',
    },
  });

  const onSubmit = async (data: AllocateFormValues) => {
    setServerError(null);
    try {
      await allocateMutation.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to allocate student to room');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Bed className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Allocate Room to Student</DialogTitle>
              <DialogDescription className="text-xs">
                Assign student room allocation record
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
            <label className="font-semibold text-foreground">Student User ID</label>
            <Input
              {...register('studentId')}
              placeholder="e.g. 64a041d17f82ba1c8d005678"
              className="font-mono text-xs"
            />
            {errors.studentId && (
              <p className="text-[11px] text-rose-600">{errors.studentId.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Room ID</label>
            <Input
              {...register('roomId')}
              placeholder="e.g. 64a041d17f82ba1c8d009012"
              className="font-mono text-xs"
            />
            {errors.roomId && (
              <p className="text-[11px] text-rose-600">{errors.roomId.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Allocation Remarks</label>
            <Textarea
              {...register('remarks')}
              placeholder="Optional allocation notes (academic year, semester, special requests)..."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald" size="sm" disabled={allocateMutation.isPending}>
              {allocateMutation.isPending ? 'Allocating...' : 'Submit Allocation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
