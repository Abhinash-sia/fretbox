'use client';

import * as React from 'react';
import { BookOpen, Users } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { useFacultyAssignments, useSectionEnrollments } from '@/features/faculty/hooks/use-faculty-queries';

export default function FacultyClassesPage() {
  const { data: assignments, isLoading, isError, refetch } = useFacultyAssignments();
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | undefined>(undefined);

  const effectiveSectionId = selectedSectionId || (assignments && assignments[0]
    ? (typeof assignments[0].classSectionId === 'object' ? assignments[0].classSectionId._id : assignments[0].classSectionId)
    : undefined);

  const { data: enrollments, isLoading: enrollmentsLoading } = useSectionEnrollments(effectiveSectionId);

  return (
    <ProtectedRoute allowedRoles={['faculty']}>
      <AppShell>
        <PageHeader
          heading="My Courses & Class Sections"
          subheading="View assigned teaching courses and registered student class rosters."
        />

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Teaching Assignments"
            message="Could not retrieve faculty assignments from the backend server."
            onRetry={() => refetch()}
          />
        ) : assignments && assignments.length > 0 ? (
          <div className="space-y-6">
            {/* Course Selector Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignments.map((asgn) => {
                const secId = typeof asgn.classSectionId === 'object' ? asgn.classSectionId._id : asgn.classSectionId;
                const isSelected = selectedSectionId === secId;

                return (
                  <Card
                    key={asgn._id}
                    className={`cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-emerald-600 ring-1 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedSectionId(secId)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                          {asgn.courseId?.code}
                        </Badge>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-sm font-bold mt-1">
                        {asgn.courseId?.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Section: {typeof asgn.classSectionId === 'object' ? asgn.classSectionId.name : 'Assigned Section'}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Student Roster Table for Selected Class Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Registered Student Roster</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Enrolled students for selected section.
                    </CardDescription>
                  </div>
                  <Badge variant="info" className="font-mono text-[10px]">
                    {enrollments?.length || 0} Students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {enrollmentsLoading ? (
                  <div className="p-4">
                    <TableSkeleton rows={4} />
                  </div>
                ) : enrollments && enrollments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Roll Number</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((enr) => (
                        <TableRow key={enr._id}>
                          <TableCell className="font-mono text-xs font-semibold text-foreground">
                            {enr.rollNumber}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {enr.studentId.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {enr.studentId.email}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={enr.isActive ? 'success' : 'outline'} className="font-mono text-[9px]">
                              {enr.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      title="No Students Enrolled"
                      description="No active student enrollments found for this selected class section."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState
            title="No Course Teaching Assignments"
            description="Your profile currently has no course teaching assignments."
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
