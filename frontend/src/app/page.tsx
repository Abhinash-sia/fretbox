'use client';

import * as React from 'react';
import {
  Wrench,
  Users,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardSkeleton, TableSkeleton } from '@/components/states/loading-skeleton';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { UnauthorizedState } from '@/components/states/unauthorized-state';
import { ProtectedRoute } from '@/components/auth/protected-route';

// Static Demonstration Data
const DEMO_METRICS = [
  { title: 'Active Complaints', value: '42', change: '-12% this week', icon: Wrench, status: 'warning' as const },
  { title: 'Room Occupancy', value: '94.2%', change: '1,240 / 1,316 Beds', icon: Building2, status: 'success' as const },
  { title: 'Active Gate Passes', value: '18', change: '8 Exits Pending', icon: ShieldCheck, status: 'info' as const },
  { title: 'Total Enrolled', value: '2,850', change: 'CSE & ECE Depts', icon: Users, status: 'neutral' as const },
];

const DEMO_OPERATIONAL_TABLE = [
  { id: 'FBX-2026-001', student: 'Aarav Sharma', room: 'BHA-101', category: 'Plumbing', priority: 'Urgent', status: 'in_progress', statusType: 'warning' as const, time: '10m ago' },
  { id: 'FBX-2026-002', student: 'Priya Patel', room: 'GHA-204', category: 'Electrical', priority: 'High', status: 'assigned', statusType: 'info' as const, time: '25m ago' },
  { id: 'FBX-2026-003', student: 'Rohan Verma', room: 'BHA-312', category: 'Network', priority: 'Medium', status: 'resolved', statusType: 'success' as const, time: '1h ago' },
  { id: 'FBX-2026-004', student: 'Ananya Gupta', room: 'GHA-105', category: 'Furniture', priority: 'Low', status: 'open', statusType: 'danger' as const, time: '2h ago' },
];

export default function ShellValidationPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [demoStateTab, setDemoStateTab] = React.useState('components');
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <ProtectedRoute>
      <AppShell>
        {/* 1. Static Demonstration Banner */}
        <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-100">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Phase F2 Authenticated Application Shell
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Authenticated session active. Sidebar navigation dynamically reflects your assigned backend RBAC role.
              </p>
            </div>
          </div>
          <Badge variant="success" className="hidden sm:inline-flex font-mono text-[10px]">
            F2 AUTHENTICATED
          </Badge>
        </div>

        {/* 2. Page Header */}
        <PageHeader
          heading="Campus Operations Overview"
          subheading="Unified operational command view across hostels, academics, complaints, and security."
        >
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Filter className="mr-2 h-3.5 w-3.5" />
            Filter View
          </Button>
          <Button variant="emerald" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            New Request
          </Button>
        </PageHeader>

        {/* 3. Operational Overview Metric Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="rounded-md bg-muted p-1.5 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusIndicator status={metric.status} pulse={metric.status === 'warning'} />
                    <span className="text-[11px] text-muted-foreground">{metric.change}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 4. Showcase Tabs */}
        <Tabs value={demoStateTab} onValueChange={setDemoStateTab} className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="components" className="gap-2">
              <Layers className="h-3.5 w-3.5" />
              <span>Interactive Showcase</span>
            </TabsTrigger>
            <TabsTrigger value="skeletons" className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Loading Skeletons</span>
            </TabsTrigger>
            <TabsTrigger value="empty" className="gap-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Empty & Error States</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: INTERACTIVE SHOWCASE */}
          <TabsContent value="components" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Complaint Submissions</CardTitle>
                  <CardDescription>
                    Demonstration of operational table formatting, status badges, and compact controls.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Filter by student or room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-48 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEMO_OPERATIONAL_TABLE.filter(
                      (row) =>
                        row.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        row.room.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono font-medium text-xs">{row.id}</TableCell>
                        <TableCell className="font-medium">{row.student}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.room}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.priority === 'Urgent'
                                ? 'danger'
                                : row.priority === 'High'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {row.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusIndicator status={row.statusType} label={row.status.replace('_', ' ')} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Form Controls Showcase */}
            <Card>
              <CardHeader>
                <CardTitle>Design System Controls Showcase</CardTitle>
                <CardDescription>
                  Compact forms, input controls, badges, and primary/secondary button variants.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Standard Text Input</label>
                    <Input placeholder="Enter student roll number..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Disabled Input</label>
                    <Input placeholder="ReadOnly field..." disabled />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Search Input</label>
                    <Input placeholder="Search campus directory..." type="search" />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button variant="default">Primary Action</Button>
                  <Button variant="emerald">Emerald Operational</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Urgent / Danger</Badge>
                  <Badge variant="info">Info / System</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: LOADING SKELETONS */}
          <TabsContent value="skeletons" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <Card className="p-6">
              <h4 className="text-sm font-semibold mb-4">Table Loading Skeleton</h4>
              <TableSkeleton rows={4} />
            </Card>
          </TabsContent>

          {/* TAB 3: EMPTY, ERROR & UNAUTHORIZED STATES */}
          <TabsContent value="empty" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <EmptyState
                title="No Pending Gate Passes"
                description="There are currently no out-station gate passes waiting for warden approval."
                actionLabel="Apply Gate Pass"
                onAction={() => setDialogOpen(true)}
              />
              <ErrorState
                title="Database Connection Degraded"
                description="Redis cache cluster is offline. Systems operating in fallback mode."
                onRetry={() => alert('Retry triggered')}
              />
              <UnauthorizedState
                requiredRole="Administrator"
                onReturn={() => setDemoStateTab('components')}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Dialog Demonstration */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Demonstration Modal Dialog</DialogTitle>
              <DialogDescription>
                Fretbox modal dialog primitive configured with backdrop blur and focus trapping.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <label className="text-xs font-semibold text-foreground">Action Notes</label>
              <Input placeholder="Enter resolution notes or details..." />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="emerald" onClick={() => setDialogOpen(false)}>
                Confirm Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
    </ProtectedRoute>
  );
}
