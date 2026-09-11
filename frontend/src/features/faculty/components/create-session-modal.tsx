'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Calendar } from 'lucide-react';
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
import { useCreateAttendanceSession } from '../hooks/use-faculty-queries';
import { Course, ClassSection } from '../types/faculty';

const createSessionSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  classSectionId: z.string().min(1, 'Class section is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  topic: z.string().optional(),
});

type SessionFormData = z.infer<typeof createSessionSchema>;

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  sections: ClassSection[];
  onSessionCreated?: (sessionId: string, classSectionId: string) => void;
}

export function CreateSessionModal({
  open,
  onOpenChange,
  courses,
  sections,
  onSessionCreated,
}: CreateSessionModalProps) {
  const createSessionMutation = useCreateAttendanceSession();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const getDefaultDate = () => new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      courseId: courses[0]?._id || '',
      classSectionId: sections[0]?._id || '',
      date: getDefaultDate(),
      startTime: '09:00',
      endTime: '10:00',
      topic: '',
    },
  });

  const onSubmit = async (data: SessionFormData) => {
    setServerError(null);
    try {
      const created = await createSessionMutation.mutateAsync({
        courseId: data.courseId,
        classSectionId: data.classSectionId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        topic: data.topic,
      });
      reset();
      onOpenChange(false);
      if (onSessionCreated && created && created._id) {
        onSessionCreated(created._id, data.classSectionId);
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to create attendance session');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base">Create Attendance Session</DialogTitle>
              <DialogDescription className="text-xs">
                Schedule an academic lecture or lab session to record student attendance.
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
            <label className="font-semibold text-foreground">Course / Subject *</label>
            <select
              {...register('courseId')}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            {errors.courseId && <p className="text-[11px] text-rose-600">{errors.courseId.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Class Section *</label>
            <select
              {...register('classSectionId')}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  Section {s.name}
                </option>
              ))}
            </select>
            {errors.classSectionId && <p className="text-[11px] text-rose-600">{errors.classSectionId.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Session Date *</label>
            <Input type="date" {...register('date')} />
            {errors.date && <p className="text-[11px] text-rose-600">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Start Time *</label>
              <Input type="time" {...register('startTime')} />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">End Time *</label>
              <Input type="time" {...register('endTime')} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Lecture Topic / Unit (Optional)</label>
            <Input placeholder="e.g. Binary Search Trees & Graph Traversal" {...register('topic')} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald" size="sm" disabled={createSessionMutation.isPending}>
              {createSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating...
                </>
              ) : (
                'Create & Proceed to Rollcall'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
