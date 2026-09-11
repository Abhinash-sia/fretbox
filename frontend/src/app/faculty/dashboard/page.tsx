'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  UserCheck,
  FileCheck,
  Calendar,
  Plus,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton, TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { useAuth } from '@/components/providers/auth-provider';
import {
  useFacultyAssignments,
  useFacultyCourses,
  useFacultyClassSections,
} from '@/features/faculty/hooks/use-faculty-queries';
import { useStudentAnnouncements } from '@/features/student/hooks/use-student-queries';
import { CreateSessionModal } from '@/features/faculty/components/create-session-modal';
import { MarkAttendanceModal } from '@/features/faculty/components/mark-attendance-modal';

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const [createSessionOpen, setCreateSessionOpen] = React.useState(false);
  const [markAttendanceOpen, setMarkAttendanceOpen] = React.useState(false);
  const [activeSession, setActiveSession] = React.useState<{ sessionId: string; classSectionId: string } | null>(null);

  const { data: assignments, isLoading: assignmentsLoading } = useFacultyAssignments();
  const { data: courses } = useFacultyCourses();
  const { data: sections } = useFacultyClassSections();
  const { data: announcements, isLoading: annLoading } = useStudentAnnouncements();

  const handleSessionCreated = (sessionId: string, classSectionId: string) => {
    setActiveSession({ sessionId, classSectionId });
    setMarkAttendanceOpen(true);
  };

  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <AppShell>
        <PageHeader
          heading={`Welcome, Prof. ${user?.name || 'Faculty Member'}`}
          subheading="Faculty Academic Operations Center — Course Assignments, Rollcall Attendance, & Student Monitoring."
        >
          <Button variant="emerald" size="sm" onClick={() => setCreateSessionOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Record Session Attendance
          </Button>
        </PageHeader>

        {/* Quick Action Navigation Strip */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          <Link
            href="/faculty/classes"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>My Classes</span>
          </Link>
          <Link
            href="/faculty/attendance"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            href="/faculty/corrections"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Corrections</span>
          </Link>
          <Link
            href="/faculty/notifications"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Notifications</span>
          </Link>
          <Link
            href="/faculty/calendar"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Academic Calendar</span>
          </Link>
        </div>

        {/* Operational Overview Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Widget 1: Assigned Courses Count */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Assigned Teaching Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <CardSkeleton />
              ) : assignments && assignments.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-foreground">
                      {assignments.length}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Active Term
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Assigned academic courses across class sections for this semester.
                  </div>
                  <Link
                    href="/faculty/classes"
                    className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                  >
                    View course assignments <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <EmptyState title="No Assigned Courses" description="You have no course teaching assignments registered for this active term." />
              )}
            </CardContent>
          </Card>

          {/* Widget 2: Attendance Rollcall Quick Trigger */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Class Rollcall Attendance
                </CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                Create a new lecture attendance session to log present, absent, and late students.
              </p>
              <Button variant="emerald" className="w-full text-xs" onClick={() => setCreateSessionOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Start New Class Rollcall
              </Button>
            </CardContent>
          </Card>

          {/* Widget 3: Attendance Corrections */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Audited Attendance Logs
                </CardTitle>
                <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                Review course attendance rates and apply audited status corrections with mandatory reason logs.
              </p>
              <Link href="/faculty/corrections">
                <Button variant="outline" className="w-full text-xs">
                  Open Audit & Corrections →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Courses & Campus Notices Row */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Courses List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">My Active Teaching Assignments</CardTitle>
              <CardDescription className="text-xs">Courses and class sections assigned to your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {assignmentsLoading ? (
                <TableSkeleton rows={3} />
              ) : assignments && assignments.length > 0 ? (
                assignments.map((asgn) => (
                  <div key={asgn._id} className="flex items-center justify-between rounded-md border border-border/80 bg-card p-3 shadow-2xs">
                    <div>
                      <div className="font-bold text-foreground">
                        {asgn.courseId?.code} — {asgn.courseId?.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        Section: {asgn.classSectionId?.name || 'Assigned Section'}
                      </div>
                    </div>
                    <Link href={`/faculty/attendance?courseId=${asgn.courseId?._id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Mark Attendance
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <EmptyState title="No Course Assignments" description="You currently have no course teaching assignments." />
              )}
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Campus Announcements</span>
              </CardTitle>
              <CardDescription className="text-xs">Official institutional updates for faculty.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {annLoading ? (
                <TableSkeleton rows={3} />
              ) : announcements && announcements.length > 0 ? (
                announcements.slice(0, 3).map((notice) => (
                  <div key={notice._id} className="rounded-md border border-border/80 bg-muted/40 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{notice.title}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{notice.content}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="No Campus Notices" description="There are no active campus announcements." />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Creation & Rollcall Modals */}
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
