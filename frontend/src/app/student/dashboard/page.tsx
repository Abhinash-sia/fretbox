'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Building2,
  Wrench,
  QrCode,
  Sparkles,
  ArrowRight,
  Plus,
  Bell,
  Utensils,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { CardSkeleton, TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { useAuth } from '@/components/providers/auth-provider';
import {
  useStudentAttendance,
  useStudentAllocation,
  useStudentComplaints,
  useStudentGatePasses,
  useStudentAnnouncements,
} from '@/features/student/hooks/use-student-queries';
import { ComplaintCreateModal } from '@/features/student/components/complaint-create-modal';
import { GatePassRequestModal } from '@/features/student/components/gate-pass-request-modal';
import { FaqWidgetModal } from '@/features/student/components/faq-widget-modal';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [complaintModalOpen, setComplaintModalOpen] = React.useState(false);
  const [gatePassModalOpen, setGatePassModalOpen] = React.useState(false);
  const [faqModalOpen, setFaqModalOpen] = React.useState(false);

  const { data: attendance, isLoading: attendanceLoading } = useStudentAttendance();
  const { data: allocation, isLoading: allocationLoading } = useStudentAllocation();
  const { data: complaints, isLoading: complaintsLoading } = useStudentComplaints();
  const { data: gatePasses, isLoading: gatePassesLoading } = useStudentGatePasses();
  const { data: announcements, isLoading: announcementsLoading } = useStudentAnnouncements();

  const activeGatePass = gatePasses?.find((p) => p.status === 'APPROVED' || p.status === 'PENDING');
  const openComplaintsCount = complaints?.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length || 0;

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <AppShell>
        {/* Header */}
        <PageHeader
          heading={`Welcome back, ${user?.name || 'Student'}`}
          subheading="Campus Operations Operating Center — Academics, Hostel, Maintenance, and Movement Passes."
        >
          <Button variant="outline" size="sm" onClick={() => setFaqModalOpen(true)}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            AI FAQ Assistant
          </Button>
          <Button variant="outline" size="sm" onClick={() => setGatePassModalOpen(true)}>
            <QrCode className="mr-1.5 h-3.5 w-3.5" />
            Request Pass
          </Button>
          <Button variant="emerald" size="sm" onClick={() => setComplaintModalOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            File Ticket
          </Button>
        </PageHeader>

        {/* Quick Action Navigation Strip */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <Link
            href="/student/attendance"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Attendance</span>
          </Link>
          <Link
            href="/student/hostel"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Hostel & Room</span>
          </Link>
          <Link
            href="/student/complaints"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Complaints</span>
          </Link>
          <Link
            href="/student/gate-pass"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <QrCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Gate Passes</span>
          </Link>
          <Link
            href="/student/mess"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Utensils className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>Mess Menu</span>
          </Link>
          <Link
            href="/student/notifications"
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Updates</span>
          </Link>
        </div>

        {/* Operational Overview Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Widget 1: Attendance Metric */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Academic Attendance
                </CardTitle>
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <CardSkeleton />
              ) : attendance?.overall ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-foreground">
                      {Math.round(attendance.overall.percentage || 0)}%
                    </span>
                    <Badge
                      variant={attendance.overall.isLowAttendance ? 'danger' : 'success'}
                      className="font-mono text-[10px]"
                    >
                      {attendance.overall.isLowAttendance ? 'Low Attendance' : 'Compliant'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Attended {attendance.overall.attendedSessions} of {attendance.overall.totalConductedSessions} conducted sessions across enrolled courses.
                  </div>
                  <Link
                    href="/student/attendance"
                    className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                  >
                    View course breakdown <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <EmptyState title="No Attendance Records" description="No attendance sessions have been logged for your enrolled courses yet." />
              )}
            </CardContent>
          </Card>

          {/* Widget 2: Room Allocation */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Hostel Allocation
                </CardTitle>
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              {allocationLoading ? (
                <CardSkeleton />
              ) : allocation ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Hostel:</span>
                    <span className="font-semibold text-foreground">
                      {allocation.hostelId?.name || 'Assigned Hostel'} ({allocation.hostelId?.code})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Block & Room:</span>
                    <span className="font-semibold font-mono text-foreground">
                      Block {allocation.blockId?.name} — Room {allocation.roomId?.roomNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="success" className="font-mono text-[9px] uppercase">
                      {allocation.status}
                    </Badge>
                  </div>
                  <Link
                    href="/student/hostel"
                    className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-2"
                  >
                    View hostel details <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <EmptyState title="No Active Room Allocation" description="You have not been assigned to a hostel room yet." />
              )}
            </CardContent>
          </Card>

          {/* Widget 3: Active Gate Pass */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Gate Movement Pass
                </CardTitle>
                <QrCode className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              {gatePassesLoading ? (
                <CardSkeleton />
              ) : activeGatePass ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                      {activeGatePass.destination}
                    </span>
                    <Badge
                      variant={activeGatePass.status === 'APPROVED' ? 'success' : 'warning'}
                      className="font-mono text-[9px]"
                    >
                      {activeGatePass.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{activeGatePass.reason}</p>
                  <div className="text-[10px] font-mono text-muted-foreground pt-1">
                    Out: {new Date(activeGatePass.outDateTime).toLocaleString()}
                  </div>
                  <Link
                    href="/student/gate-pass"
                    className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                  >
                    Manage gate passes <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs text-muted-foreground">No active or pending gate pass requests.</p>
                  <Button variant="outline" size="sm" onClick={() => setGatePassModalOpen(true)}>
                    <Plus className="mr-1 h-3 w-3" /> Request Pass
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Complaints & Campus Announcements Row */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Complaints Tracker */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <span>Maintenance Complaints</span>
                  {openComplaintsCount > 0 && (
                    <Badge variant="warning" className="font-mono text-[10px]">
                      {openComplaintsCount} Open
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">Your reported facility and operational tickets.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setComplaintModalOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {complaintsLoading ? (
                <TableSkeleton rows={3} />
              ) : complaints && complaints.length > 0 ? (
                complaints.slice(0, 3).map((ticket) => (
                  <div
                    key={ticket._id}
                    className="flex items-center justify-between rounded-md border border-border/80 bg-card p-3 shadow-2xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{ticket.title}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {ticket.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{ticket.description}</p>
                    </div>
                    <StatusIndicator status={ticket.status === 'RESOLVED' ? 'success' : ticket.status === 'IN_PROGRESS' ? 'warning' : 'info'} />
                  </div>
                ))
              ) : (
                <EmptyState title="No Complaints Filed" description="You have no reported maintenance or facility tickets." />
              )}
              {complaints && complaints.length > 3 && (
                <div className="text-center pt-1">
                  <Link href="/student/complaints" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    View all {complaints.length} tickets →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campus Announcements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Campus Announcements</span>
              </CardTitle>
              <CardDescription className="text-xs">Official institution updates and notices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {announcementsLoading ? (
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
                <EmptyState title="No Campus Notices" description="There are no active campus announcements broadcast at this time." />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal Dialogs */}
        <ComplaintCreateModal open={complaintModalOpen} onOpenChange={setComplaintModalOpen} />
        <GatePassRequestModal open={gatePassModalOpen} onOpenChange={setGatePassModalOpen} />
        <FaqWidgetModal open={faqModalOpen} onOpenChange={setFaqModalOpen} />
      </AppShell>
    </ProtectedRoute>
  );
}
