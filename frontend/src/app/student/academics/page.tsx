'use client';

import * as React from 'react';
import { BookOpen } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { EmptyState } from '@/components/states/empty-state';
import { useStudentAttendance } from '@/features/student/hooks/use-student-queries';

export default function StudentAcademicsPage() {
  const { data: attendanceSummary, isLoading, isError, refetch } = useStudentAttendance();

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <PageHeader
          heading="Academic Program & Registered Courses"
          subheading="Enrolled curriculum, courses, and academic section details."
        />

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Academic Details"
            message="Could not retrieve academic course records from the backend server."
            onRetry={() => refetch()}
          />
        ) : attendanceSummary?.courses && attendanceSummary.courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attendanceSummary.courses.map((course) => (
              <Card key={course.courseId} className="border-border shadow-2xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {course.courseCode}
                    </span>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm font-bold mt-1">
                    {course.courseName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="rounded-md bg-muted/60 p-2.5 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conducted Sessions:</span>
                      <span className="font-semibold text-foreground">{course.totalSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Attended Sessions:</span>
                      <span className="font-semibold text-foreground">{course.attendedSessions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Enrolled Courses Found"
            description="You are currently not enrolled in active academic course sections."
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
