'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Megaphone, Send } from 'lucide-react';
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
import {
  useCreateAnnouncement,
  usePublishAnnouncement,
} from '../hooks/use-communication-queries';
import { PriorityLevel } from '../types/communication';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150, 'Title too long'),
  body: z.string().min(10, 'Body content must be at least 10 characters'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  targetAll: z.boolean(),
  publishImmediately: z.boolean(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AnnouncementCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementCreateModal({ open, onOpenChange }: AnnouncementCreateModalProps) {
  const createMutation = useCreateAnnouncement();
  const publishMutation = usePublishAnnouncement();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      body: '',
      priority: 'normal',
      targetAll: true,
      publishImmediately: true,
    },
  });

  const onSubmit = async (values: AnnouncementFormValues) => {
    try {
      const created = await createMutation.mutateAsync({
        title: values.title,
        body: values.body,
        priority: values.priority as PriorityLevel,
        target: { all: values.targetAll },
      });

      if (values.publishImmediately && created._id) {
        await publishMutation.mutateAsync(created._id);
      }

      reset();
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md select-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-bold">
            <Megaphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Compose Institutional Notice</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Issue an official announcement to campus students, faculty, or staff.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Notice Title *</label>
            <Input
              {...register('title')}
              placeholder="e.g. Mandatory Hostel Inspection / Scheduled Maintenance"
              className="text-xs"
            />
            {errors.title && (
              <p className="text-[10px] text-rose-600 font-mono">{errors.title.message}</p>
            )}
          </div>

          {/* Priority Select */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Priority Level *</label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value}
                  onChange={field.onChange}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-sans text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Broadcast</option>
                </select>
              )}
            />
          </div>

          {/* Body Content */}
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Announcement Content *</label>
            <Textarea
              {...register('body')}
              rows={4}
              placeholder="Write the full details of the notice here..."
              className="text-xs resize-none"
            />
            {errors.body && (
              <p className="text-[10px] text-rose-600 font-mono">{errors.body.message}</p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center space-x-2">
              <Controller
                name="targetAll"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="targetAll"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded-xs border-input bg-background accent-emerald-600 cursor-pointer"
                  />
                )}
              />
              <label htmlFor="targetAll" className="text-xs text-foreground cursor-pointer select-none">
                Target all campus members (Campus-wide)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="publishImmediately"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="publishImmediately"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 rounded-xs border-input bg-background accent-emerald-600 cursor-pointer"
                  />
                )}
              />
              <label htmlFor="publishImmediately" className="text-xs text-foreground font-semibold cursor-pointer select-none">
                Publish and dispatch notifications immediately
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting || createMutation.isPending || publishMutation.isPending}
            >
              {createMutation.isPending || publishMutation.isPending ? (
                'Processing...'
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Submit Notice
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
