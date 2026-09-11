'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateGatePass } from '../hooks/use-student-queries';

const gatePassSchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
  destination: z.string().min(2, 'Destination must be at least 2 characters').max(200),
  outDate: z.string().min(1, 'Out date is required'),
  outTime: z.string().min(1, 'Out time is required'),
  returnDate: z.string().min(1, 'Return date is required'),
  returnTime: z.string().min(1, 'Return time is required'),
});

type GatePassFormData = z.infer<typeof gatePassSchema>;

interface GatePassRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getDefaultDates = () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  return {
    outDate: now.toISOString().split('T')[0],
    returnDate: tomorrow.toISOString().split('T')[0],
  };
};

export function GatePassRequestModal({ open, onOpenChange }: GatePassRequestModalProps) {
  const createGatePass = useCreateGatePass();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const initialDates = React.useMemo(() => getDefaultDates(), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GatePassFormData>({
    resolver: zodResolver(gatePassSchema),
    defaultValues: {
      reason: '',
      destination: '',
      outDate: initialDates.outDate,
      outTime: '17:00',
      returnDate: initialDates.returnDate,
      returnTime: '20:00',
    },
  });

  const onSubmit = async (data: GatePassFormData) => {
    setServerError(null);

    const outDateTime = new Date(`${data.outDate}T${data.outTime}:00`).toISOString();
    const expectedReturnDateTime = new Date(`${data.returnDate}T${data.returnTime}:00`).toISOString();

    if (new Date(expectedReturnDateTime) <= new Date(outDateTime)) {
      setServerError('Expected return time must be strictly after out time');
      return;
    }

    try {
      await createGatePass.mutateAsync({
        reason: data.reason,
        destination: data.destination,
        outDateTime,
        expectedReturnDateTime,
      });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to submit gate pass request');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Request Campus Out-Pass</DialogTitle>
              <DialogDescription className="text-xs">
                Submit an out-station or local movement pass for Warden approval.
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
            <label className="font-semibold text-foreground">Destination Location *</label>
            <Input placeholder="e.g. City Mall, Home, Railway Station" {...register('destination')} />
            {errors.destination && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.destination.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Out Date *</label>
              <Input type="date" {...register('outDate')} />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Out Time *</label>
              <Input type="time" {...register('outTime')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Expected Return Date *</label>
              <Input type="date" {...register('returnDate')} />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Expected Return Time *</label>
              <Input type="time" {...register('returnTime')} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Reason for Exit *</label>
            <Textarea
              placeholder="Provide reason for campus departure..."
              rows={2}
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
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={createGatePass.isPending}
            >
              {createGatePass.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                'Submit Pass Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
