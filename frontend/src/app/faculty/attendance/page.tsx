'use client';

import * as React from 'react';
import { UserCheck, Plus, BookOpen } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import {
  useFacultyAssignments,
  useFacultyCourses,
  useFacultyClassSections,
  useCourseAttendanceOverview,
} from '@/features/faculty/hooks/use-faculty-queries';
import { CreateSessionModal } from '@/features/faculty/components/create-session-modal';
import { MarkAttendanceModal } from '@/features/faculty/components/mark-attendance-modal';

export default function FacultyAttendancePage() {
  const [createSessionOpen, setCreateSessionOpen] = React.useState(false);
  const [markAttendanceOpen, setMarkAttendanceOpen] = React.useState(false);
  const [activeSession, setActiveSession] = React.useState<{ sessionId: string; classSectionId: string } | null>(null);

  const { data: assignments } = useFacultyAssignments();
  const { data: courses } = useFacultyCourses();
  const { data: sections } = useFacultyClassSections();

  const [selectedCourseId, setSelectedCourseId] = React.useState<string | undefined>(undefined);

  const effectiveCourseId = selectedCourseId || (assignments && assignments[0]
    ? (typeof assignments[0].courseId === 'object' ? assignments[0].courseId._id : assignments[0].courseId)
    : undefined);

  const { data: overview, isLoading: overviewLoading, isError, refetch } = useCourseAttendanceOverview(effectiveCourseId);

  const handleSessionCreated = (sessionId: string, classSectionId: string) => {
    setActiveSession({ sessionId, classSectionId });
    setMarkAttendanceOpen(true);
  };

  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <AppShell>
        <PageHeader
          heading="Mark & Record Session Attendance"
          subheading="Schedule lecture sessions, log student rollcall, and inspect course attendance metrics."
        >
          <Button variant="emerald" size="sm" onClick={() => setCreateSessionOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Class Session
          </Button>
        </PageHeader>

        <div className="space-y-6">
          {/* Course Selector Dropdown Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Select Active Course Overview</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose a course assignment to view cumulative attendance statistics.
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

          {/* Attendance Overview Table */}
          {overviewLoading ? (
            <TableSkeleton rows={5} />
          ) : isError ? (
            <ErrorState
              title="Failed to Load Course Attendance Overview"
              message="Could not retrieve course attendance metrics from the backend."
              onRetry={() => refetch()}
            />
          ) : overview && overview.students && overview.students.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>{overview.courseCode} — {overview.courseName} Overview</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Conducted Sessions: {overview.totalConductedSessions}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px]">Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="text-center">Attended / Total</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.students.map((st) => (
                      <TableRow key={st.studentId}>
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {st.rollNumber}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {st.studentName}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {st.attendedSessions} / {st.totalSessions}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-emerald-600 dark:text-emerald-400">
                          {st.presentCount}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-amber-600 dark:text-amber-400">
                          {st.lateCount}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-rose-600 dark:text-rose-400">
                          {st.absentCount}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">
                          <div className="flex items-center justify-end gap-2">
                            <StatusIndicator status={st.isLowAttendance ? 'danger' : 'success'} />
                            <span>{Math.round(st.percentage || 0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="No Attendance Sessions Logged"
              description="No attendance sessions have been created or completed for this selected course yet."
              actionLabel="Create Session"
              onAction={() => setCreateSessionOpen(true)}
            />
          )}
        </div>

        {/* Modals */}
        <CreateSessionModal
          open={createSessionOpen}
          onOpenChange={setCreateSessionOpen}
          courses={courses || []}
          sections={sections || []}
          onSessionCreated={handleSessionCreated}
        />

        {activeSession && (
          <MarkAttendanceModal
            open={markAttendanceOpen}
            onOpenChange={setMarkAttendanceOpen}
            sessionId={activeSession.sessionId}
            classSectionId={activeSession.classSectionId}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
