'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Wrench,
  Building2,
  UserCheck,
  Utensils,
  ShieldCheck,
  Bell,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { OverviewAnalytics } from '../types/admin';

interface AdminKpiCardsProps {
  overview?: OverviewAnalytics;
}

export function AdminKpiCards({ overview }: AdminKpiCardsProps) {
  const c = overview?.complaints || { total: 0, active: 0, resolved: 0, closed: 0 };
  const h = overview?.hostel || { totalCapacity: 0, occupiedBeds: 0, occupancyPercentage: 0 };
  const a = overview?.attendance || { averagePercentage: 0, totalSessions: 0 };
  const m = overview?.mess || { averageRating: 0, totalFeedback: 0 };
  const g = overview?.gate || { totalEvents: 0 };
  const comm = overview?.communication || { totalNotifications: 0, readPercentage: 0, actionPercentage: 0 };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
      {/* 1. Active Complaints */}
      <Link href="/admin/complaints" className="group">
        <Card className="hover:border-amber-500/50 transition-colors h-full">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground">Active Complaints</span>
              <Wrench className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl font-bold text-foreground">{c.active}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{c.total} Total</span>
            </div>
            <div className="flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-mono pt-0.5">
              <span>{c.resolved + c.closed} Resolved</span>
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 2. Hostel Occupancy */}
      <Link href="/admin/hostels" className="group">
        <Card className="hover:border-emerald-500/50 transition-colors h-full">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground">Hostel Occupancy</span>
              <Building2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl font-bold text-foreground">
                {h.occupancyPercentage}%
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {h.occupiedBeds}/{h.totalCapacity}
              </span>
            </div>
            <div className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-mono pt-0.5">
              <span>Beds Filled</span>
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 3. Average Attendance */}
      <Link href="/admin/analytics" className="group">
        <Card className="hover:border-blue-500/50 transition-colors h-full">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground">Avg Attendance</span>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl font-bold text-foreground">
                {a.averagePercentage}%
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {a.totalSessions} Sessions
              </span>
            </div>
            <div className="flex items-center text-[10px] text-blue-600 dark:text-blue-400 font-mono pt-0.5">
              <span>Campus Rate</span>
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 4. Mess Feedback */}
      <Link href="/admin/mess" className="group">
        <Card className="hover:border-purple-500/50 transition-colors h-full">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground">Mess Rating</span>
              <Utensils className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl font-bold text-foreground">
                {m.averageRating} / 5
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {m.totalFeedback} Reviews
              </span>
            </div>
            <div className="flex items-center text-[10px] text-purple-600 dark:text-purple-400 font-mono pt-0.5">
              <span>Student Score</span>
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 5. Gate Scan Volume */}
      <Link href="/admin/gate-passes" className="group">
        <Card className="hover:border-cyan-500/50 transition-colors h-full">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground">Gate Volume</span>
              <ShieldCheck className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl font-bold text-foreground">{g.totalEvents}</span>
              <span className="font-mono text-[10px] text-muted-foreground">Scans</span>
            </div>
            <div className="flex items-center text-[10px] text-cyan-600 dark:text-cyan-400 font-mono pt-0.5">
              <span>Gate Events</span>
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 6. Communication Read Rate */}
      <Link href="/admin/communication" className="group">
        <Card className="hover:border-rose-500/50 transition-colors h-full">
          <CardContent className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground">Alert Read Rate</span>
              <Bell className="h-4 w-4 text-rose-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xl font-bold text-foreground">
                {comm.readPercentage}%
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {comm.totalNotifications} Sent
              </span>
            </div>
            <div className="flex items-center text-[10px] text-rose-600 dark:text-rose-400 font-mono pt-0.5">
              <span>{comm.actionPercentage}% Actioned</span>
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
