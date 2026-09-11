'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Wrench, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/states/loading-skeleton';
import { ErrorState } from '@/components/states/error-state';
import { useComplaintAnalytics } from '../hooks/use-admin-queries';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#64748b'];

export function ComplaintAnalyticsView() {
  const { data, isLoading, isError, refetch } = useComplaintAnalytics();

  if (isLoading) return <TableSkeleton rows={4} />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Complaint Analytics"
        message="Could not retrieve complaint SLA metrics."
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return null;

  const statusData = Object.entries(data.statusBreakdown || {}).map(([name, count]) => ({
    name: name.toUpperCase().replace('_', ' '),
    count,
  }));

  const categoryData = Object.entries(data.categoryDistribution || {}).map(([name, count]) => ({
    name: name.toUpperCase(),
    count,
  }));

  const priorityData = Object.entries(data.priorityDistribution || {}).map(([name, count]) => ({
    name: name.toUpperCase(),
    count,
  }));

  const ageing = data.activeComplaints?.ageingBuckets || {
    under24h: 0,
    between24and48h: 0,
    between48and72h: 0,
    between3and7d: 0,
    over7d: 0,
  };

  const ageingChartData = [
    { name: '< 24 Hours', count: ageing.under24h, color: '#10b981' },
    { name: '24 - 48 Hours', count: ageing.between24and48h, color: '#3b82f6' },
    { name: '48 - 72 Hours', count: ageing.between48and72h, color: '#f59e0b' },
    { name: '3 - 7 Days', count: ageing.between3and7d, color: '#f97316' },
    { name: '> 7 Days', count: ageing.over7d, color: '#ef4444' },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* SLA Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">
                Avg Resolution SLA
              </span>
              <span className="font-mono text-xl font-bold text-foreground">
                {data.resolutionTime?.averageHours || 0} Hours
              </span>
              <span className="text-[10px] text-muted-foreground block pt-0.5 font-mono">
                {data.resolutionTime?.resolvedCount || 0} Total Resolved
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">
                Active Complaints Age
              </span>
              <span className="font-mono text-xl font-bold text-foreground">
                {data.activeComplaints?.averageAgeHours || 0} Hours Avg
              </span>
              <span className="text-[10px] text-muted-foreground block pt-0.5 font-mono">
                {data.activeComplaints?.count || 0} Open Tickets
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Wrench className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">
                Overdue Tickets (&gt; 7 Days)
              </span>
              <span className="font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
                {ageing.over7d} Tickets
              </span>
              <span className="text-[10px] text-muted-foreground block pt-0.5 font-mono">
                Requires Immediate Escalation
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Complaint Ageing Buckets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span>Active Complaint Ageing Buckets</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of open tickets by duration since creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            {ageingChartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '6px', fontSize: '11px', color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ageingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No active complaints currently pending.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Category Distribution</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Complaints grouped by issue domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-60 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <div className="w-full h-full flex flex-col md:flex-row items-center justify-around gap-2">
                <div className="w-44 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                        {categoryData.map((_, idx) => (
                          <Cell key={`cat-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '6px', fontSize: '11px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-1.5 text-xs font-mono">
                  {categoryData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}:</span>
                      <span className="font-bold text-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No category data recorded.</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Priority & Status Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center justify-between border-b border-border/50 pb-1.5 font-mono">
                <span className="text-muted-foreground">{s.name}</span>
                <Badge variant="outline" className="text-xs">{s.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {priorityData.map((p) => (
              <div key={p.name} className="flex items-center justify-between border-b border-border/50 pb-1.5 font-mono">
                <span className="text-muted-foreground">{p.name}</span>
                <Badge variant={p.name === 'URGENT' ? 'destructive' : p.name === 'HIGH' ? 'warning' : 'secondary'} className="text-xs">
                  {p.count}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
