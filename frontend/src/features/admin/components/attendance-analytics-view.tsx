'use client';

import * as React from 'react';
import { UserCheck, AlertCircle, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { useAttendanceAnalytics, useLowAttendanceStudents } from '../hooks/use-admin-queries';

export function AttendanceAnalyticsView() {
  const { data: attendance, isLoading, isError, refetch } = useAttendanceAnalytics();
  const { data: lowAttendance } = useLowAttendanceStudents({ threshold: 75, limit: 10 });

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Attendance Analytics"
        message="Could not retrieve academic attendance overview."
        onRetry={() => refetch()}
      />
    );
  }
  if (!attendance) return null;

  return (
    <div className="space-y-4 select-none">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Campus Average Rate</span>
              <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {attendance.overallAttendancePercentage}%
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                {attendance.attendedRecords}/{attendance.totalAttendanceRecords} Records
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold font-mono">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Total Sessions Conducted</span>
              <span className="font-mono text-xl font-bold text-foreground">
                {attendance.totalSessions} Sessions
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">Academic Classes</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold font-mono">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Low Attendance Warnings</span>
              <span className="font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
                {lowAttendance?.totalLowAttendanceStudents || 0} Students
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">Below 75% Threshold</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 font-bold font-mono">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Course Breakdown & Low Attendance Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Course Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>Attendance Rate by Course</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Subject-wise student presence percentages.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Course Name</th>
                  <th className="p-2.5 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendance.courseBreakdown?.length > 0 ? (
                  attendance.courseBreakdown.map((item) => (
                    <tr key={item.courseId} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 font-mono font-semibold text-foreground uppercase">{item.courseCode}</td>
                      <td className="p-2.5 text-foreground">{item.courseName}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.attendancePercentage}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-xs text-muted-foreground">
                      No course attendance data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Low Attendance Alert Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <span>Students Below 75% Attendance Threshold</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Students flagged for academic attendance shortage.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[11px] text-muted-foreground">
                  <th className="p-2.5">Student Name</th>
                  <th className="p-2.5">Email</th>
                  <th className="p-2.5 text-right">Attended / Total</th>
                  <th className="p-2.5 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lowAttendance?.students?.length ? (
                  lowAttendance.students.map((student) => (
                    <tr key={student.studentId} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 font-semibold text-foreground">{student.studentName}</td>
                      <td className="p-2.5 font-mono text-muted-foreground text-[11px]">{student.studentEmail}</td>
                      <td className="p-2.5 text-right font-mono text-muted-foreground">
                        {student.attended}/{student.totalConducted}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        <Badge variant="destructive" className="text-[10px]">
                          {student.attendancePercentage}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-xs text-muted-foreground">
                      No student attendance warnings flagged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
