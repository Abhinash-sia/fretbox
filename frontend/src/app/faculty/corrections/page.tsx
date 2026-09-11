'use client';

import * as React from 'react';
import { FileCheck, AlertTriangle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import {
  useFacultyAssignments,
  useCourseAttendanceOverview,
} from '@/features/faculty/hooks/use-faculty-queries';
import { CorrectAttendanceModal } from '@/features/faculty/components/correct-attendance-modal';

export default function FacultyCorrectionsPage() {
  const [activeCorrection, setActiveCorrection] = React.useState<{ recordId: string; studentName: string } | null>(null);

  const { data: assignments } = useFacultyAssignments();
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | undefined>(undefined);

  const effectiveCourseId = selectedCourseId || (assignments && assignments[0]
    ? (typeof assignments[0].courseId === 'object' ? assignments[0].courseId._id : assignments[0].courseId)
    : undefined);

  const { data: overview, isLoading, isError, refetch } = useCourseAttendanceOverview(effectiveCourseId);

  const lowAttendanceStudents = React.useMemo(() => {
    if (!overview?.students) return [];
    return overview.students.filter((s) => s.isLowAttendance);
  }, [overview]);

  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <AppShell>
        <PageHeader
          heading="Attendance Audit & Record Corrections"
          subheading="Identify low-attendance students and submit audited status corrections with mandatory logs."
        />

        <div className="space-y-6">
          {/* Selector Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>Select Course for Audit Review</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Review attendance compliance for assigned courses.
                  </CardDescription>
                </div>
                {assignments && assignments.length > 0 && (
                  <select
                    value={selectedCourseId || ''}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  >
                    {assignments.map((asgn) => (
                      <option key={asgn._id} value={typeof asgn.courseId === 'object' ? asgn.courseId._id : asgn.courseId}>
                        {asgn.courseId?.code} — {asgn.courseId?.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Low Attendance Audit Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Low Attendance Warning Roster (&lt;75%)</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Students flagged for academic policy non-compliance in {overview?.courseCode || 'selected course'}.
                  </CardDescription>
                </div>
                <Badge variant="danger" className="font-mono text-[10px]">
                  {lowAttendanceStudents.length} Flagged
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <TableSkeleton rows={4} />
              ) : isError ? (
                <ErrorState
                  title="Failed to Load Audit Roster"
                  message="Could not retrieve attendance audit data from the server."
                  onRetry={() => refetch()}
                />
              ) : lowAttendanceStudents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="text-center">Attended / Total</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-right">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowAttendanceStudents.map((st) => (
                      <TableRow key={st.studentId}>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {st.rollNumber}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{st.studentName}</TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {st.attendedSessions} / {st.totalSessions}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-emerald-600 dark:text-emerald-400">
                          {st.presentCount}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-rose-600 dark:text-rose-400 font-bold">
                          {st.absentCount}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                          {Math.round(st.percentage || 0)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6">
                  <EmptyState
                    title="No Low Attendance Students"
                    description="All enrolled students in this course currently meet or exceed the mandatory 75% attendance threshold."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Correction Modal */}
        {activeCorrection && (
          <CorrectAttendanceModal
            open={!!activeCorrection}
            onOpenChange={() => setActiveCorrection(null)}
            recordId={activeCorrection.recordId}
            studentName={activeCorrection.studentName}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
