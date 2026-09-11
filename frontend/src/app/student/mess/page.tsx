'use client';

import * as React from 'react';
import { Utensils, Star, Send, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CardSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useStudentMessMenus, useSubmitMessFeedback } from '@/features/student/hooks/use-student-queries';
import { MessMenu } from '@/features/student/types/student';

export default function StudentMessPage() {
  const [selectedMenu, setSelectedMenu] = React.useState<MessMenu | null>(null);
  const [rating, setRating] = React.useState<number>(5);
  const [comments, setComments] = React.useState<string>('');

  const { data: menus, isLoading, isError, refetch } = useStudentMessMenus();
  const feedbackMutation = useSubmitMessFeedback();

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenu) return;

    try {
      await feedbackMutation.mutateAsync({
        menuId: selectedMenu._id,
        rating,
        comments,
      });
      setSelectedMenu(null);
      setComments('');
      setRating(5);
    } catch {
      // Error handled in mutation state
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <PageHeader
          heading="Campus Mess Schedule & Feedback"
          subheading="Daily dining menu items, meal schedules, and student mess feedback submissions."
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to Load Mess Menus"
            message="Could not retrieve dining menu schedules from the backend server."
            onRetry={() => refetch()}
          />
        ) : menus && menus.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => (
              <Card key={menu._id} className="border-border shadow-2xs flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                      {menu.mealType}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(menu.date).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold mt-1.5 capitalize">
                    {menu.mealType.toLowerCase()} Menu
                  </CardTitle>
                  {menu.hostelId?.name && (
                    <CardDescription className="text-[11px]">
                      {menu.hostelId.name} Dining Hall
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 text-xs pt-1">
                  <div className="rounded-md bg-muted/60 p-2.5 space-y-1">
                    <p className="font-semibold text-foreground text-[11px]">Included Dishes:</p>
                    <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-0.5">
                      {menu.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {menu.description && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Note: {menu.description}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setSelectedMenu(menu)}
                  >
                    <Star className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                    Submit Meal Feedback
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Mess Menus Published"
            description="The warden or mess manager has not published menu items for today yet."
          />
        )}

        {/* Feedback Submission Modal */}
        {selectedMenu && (
          <Dialog open={!!selectedMenu} onOpenChange={() => setSelectedMenu(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base">Submit Mess Feedback</DialogTitle>
                    <DialogDescription className="text-xs">
                      Rate quality for {selectedMenu.mealType} ({new Date(selectedMenu.date).toLocaleDateString()})
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4 py-2 text-xs">
                {feedbackMutation.isError && (
                  <div className="rounded bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium">
                    {feedbackMutation.error instanceof Error ? feedbackMutation.error.message : 'Failed to submit feedback.'}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Rating (1 to 5 Stars)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`flex h-9 w-9 items-center justify-center rounded-md border text-xs font-bold transition-colors ${
                          rating >= star
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Comments & Observations</label>
                  <Textarea
                    placeholder="Provide constructive feedback regarding food taste, hygiene, or quantity..."
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedMenu(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="emerald" size="sm" disabled={feedbackMutation.isPending}>
                    {feedbackMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Submit Feedback
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
