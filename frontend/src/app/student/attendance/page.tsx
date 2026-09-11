'use client';

import * as React from 'react';
import { UserCheck, AlertTriangle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CardSkeleton, TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useStudentAttendance } from '@/features/student/hooks/use-student-queries';

export default function StudentAttendancePage() {
  const { data: attendanceSummary, isLoading, isError, refetch } = useStudentAttendance();

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        <PageHeader
          heading="Academic Attendance"
          subheading="Official attendance records logged by faculty for your enrolled courses."
        />

        {isLoading ? (
          <div className="space-y-6">
            <CardSkeleton />
            <TableSkeleton rows={4} />
          </div>
        ) : isError ? (
          <ErrorState
            title="Unable to Load Attendance Summary"
            message="Failed to retrieve academic attendance records from the backend server."
            onRetry={() => refetch()}
          />
        ) : attendanceSummary ? (
          <div className="space-y-6">
            {/* Overall Attendance Summary Metric Card */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Overall Attendance Status</span>
                  </CardTitle>
                  <Badge
                    variant={attendanceSummary.overall.isLowAttendance ? 'danger' : 'success'}
                    className="font-mono text-[10px]"
                  >
                    {attendanceSummary.overall.isLowAttendance ? 'Low Attendance Alert' : 'Compliant'}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Academic policy mandates minimum 75% attendance across all subjects.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-extrabold text-foreground">
                    {Math.round(attendanceSummary.overall.percentage || 0)}%
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({attendanceSummary.overall.attendedSessions} attended / {attendanceSummary.overall.totalConductedSessions} total sessions)
                  </span>
                </div>

                {attendanceSummary.overall.isLowAttendance && (
                  <div className="flex items-start gap-2.5 rounded-md bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Low Attendance Warning: </span>
                      Your cumulative attendance is below the {attendanceSummary.overall.threshold}% threshold. Please consult your course faculty or academic advisor.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course-by-Course Attendance Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Course Attendance Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  Individual attendance statistics per registered course.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {attendanceSummary.courses && attendanceSummary.courses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Code</TableHead>
                        <TableHead>Course Name</TableHead>
                        <TableHead className="text-center">Attended / Total</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">Late</TableHead>
                        <TableHead className="text-center">Absent</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceSummary.courses.map((course) => (
                        <TableRow key={course.courseId}>
                          <TableCell className="font-mono text-xs font-semibold text-foreground">
                            {course.courseCode}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{course.courseName}</TableCell>
                          <TableCell className="text-center font-mono text-xs">
                            {course.attendedSessions} / {course.totalSessions}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-emerald-600 dark:text-emerald-400">
                            {course.presentCount}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-amber-600 dark:text-amber-400">
                            {course.lateCount}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-rose-600 dark:text-rose-400">
                            {course.absentCount}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold">
                            <div className="flex items-center justify-end gap-2">
                              <StatusIndicator status={course.isLowAttendance ? 'danger' : 'success'} />
                              <span>{Math.round(course.percentage || 0)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      title="No Registered Course Attendance Data"
                      description="You are currently not enrolled in active attendance sessions."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState
            title="No Attendance Record Found"
            description="Your student account has no logged attendance sessions in the system."
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
