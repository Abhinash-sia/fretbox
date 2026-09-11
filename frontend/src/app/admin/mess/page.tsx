'use client';

import * as React from 'react';
import { Utensils, Star } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { useMessAnalytics } from '@/features/admin/hooks/use-admin-queries';

export default function AdminMessPage() {
  const { data, isLoading, isError, refetch } = useMessAnalytics();

  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Mess Rating & Student Feedback Analytics"
          subheading="Student dining ratings, review distribution, and meal-wise average scores."
        />

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Mess Analytics"
            message="Could not retrieve mess feedback ratings."
            onRetry={() => refetch()}
          />
        ) : data ? (
          <div className="space-y-4 select-none">
            {/* Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block">
                      Overall Average Rating
                    </span>
                    <span className="font-mono text-2xl font-bold text-foreground">
                      {data.averageRating} / 5.0
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      Based on {data.totalFeedback} Reviews
                    </span>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                    <Star className="h-5 w-5 fill-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold">Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-xs font-mono">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = data.ratingDistribution?.[star] || 0;
                    const pct = data.totalFeedback > 0 ? Math.round((count / data.totalFeedback) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-12 text-muted-foreground">{star} Stars</span>
                        <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-12 text-right">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Meal Type Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-purple-600" />
                  <span>Rating Breakdown by Meal Type</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Breakfast, Lunch, Snacks, and Dinner student rating scores.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
                      <th className="p-3">Meal Type</th>
                      <th className="p-3 text-right">Average Rating</th>
                      <th className="p-3 text-right">Total Reviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.mealTypeBreakdown?.length > 0 ? (
                      data.mealTypeBreakdown.map((item) => (
                        <tr key={item.mealType} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-semibold text-foreground capitalize">{item.mealType}</td>
                          <td className="p-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                            {item.averageRating} / 5
                          </td>
                          <td className="p-3 text-right font-mono text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{item.totalFeedback} Reviews</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-xs text-muted-foreground">
                          No meal type feedback recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </AppShell>
    </ProtectedRoute>
  );
}
