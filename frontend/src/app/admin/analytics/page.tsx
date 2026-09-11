'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplaintAnalyticsView } from '@/features/admin/components/complaint-analytics-view';
import { HostelOccupancyView } from '@/features/admin/components/hostel-occupancy-view';
import { FacilityStatusView } from '@/features/admin/components/facility-status-view';
import { GateActivityView } from '@/features/admin/components/gate-activity-view';
import { AttendanceAnalyticsView } from '@/features/admin/components/attendance-analytics-view';
import { WorkloadDistributionView } from '@/features/admin/components/workload-distribution-view';

export default function AdminAnalyticsPage() {
  const [tab, setTab] = React.useState('complaints');

  return (
    <ProtectedRoute allowedRoles={['administrator']}>
      <AppShell>
        <PageHeader
          heading="Campus Operations Intelligence"
          subheading="In-depth analytics across complaints SLA, hostel occupancy, facility assets, gate verification, and academic attendance."
        />

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="bg-muted flex flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="complaints" className="text-xs">
              Complaints SLA
            </TabsTrigger>
            <TabsTrigger value="hostels" className="text-xs">
              Hostel Occupancy
            </TabsTrigger>
            <TabsTrigger value="facilities" className="text-xs">
              Facility Assets
            </TabsTrigger>
            <TabsTrigger value="gates" className="text-xs">
              Gate Activity
            </TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">
              Academic Attendance
            </TabsTrigger>
            <TabsTrigger value="workload" className="text-xs">
              Staff Workload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints">
            <ComplaintAnalyticsView />
          </TabsContent>

          <TabsContent value="hostels">
            <HostelOccupancyView />
          </TabsContent>

          <TabsContent value="facilities">
            <FacilityStatusView />
          </TabsContent>

          <TabsContent value="gates">
            <GateActivityView />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceAnalyticsView />
          </TabsContent>

          <TabsContent value="workload">
            <WorkloadDistributionView />
          </TabsContent>
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  );
}
