'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Wrench } from 'lucide-react';
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
import { useCreateComplaint } from '../hooks/use-student-queries';
import { ComplaintCategory, ComplaintPriority } from '../types/student';

const complaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.enum(['PLUMBING', 'ELECTRICAL', 'CARPENTRY', 'INTERNET', 'CLEANLINESS', 'ACADEMIC', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

interface ComplaintCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComplaintCreateModal({ open, onOpenChange }: ComplaintCreateModalProps) {
  const createComplaint = useCreateComplaint();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'PLUMBING',
      priority: 'MEDIUM',
    },
  });

  const onSubmit = async (data: ComplaintFormData) => {
    setServerError(null);
    try {
      await createComplaint.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category as ComplaintCategory,
        priority: data.priority as ComplaintPriority,
      });
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to submit complaint');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base">File Campus Maintenance Ticket</DialogTitle>
              <DialogDescription className="text-xs">
                Submit an operational complaint to the hostel warden & facility team.
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
            <label className="font-semibold text-foreground">Issue Title *</label>
            <Input placeholder="e.g. Bathroom tap leaking in Room 302" {...register('title')} />
            {errors.title && <p className="text-[11px] text-rose-600 font-medium">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Category *</label>
              <select
                {...register('category')}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="CARPENTRY">Carpentry</option>
                <option value="INTERNET">Internet & Wi-Fi</option>
                <option value="CLEANLINESS">Housekeeping</option>
                <option value="ACADEMIC">Academic</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Priority</label>
              <select
                {...register('priority')}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Detailed Description *</label>
            <Textarea
              placeholder="Describe the issue, exact location, and urgency details..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.description.message}</p>
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
              disabled={createComplaint.isPending}
            >
              {createComplaint.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Complaint'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
