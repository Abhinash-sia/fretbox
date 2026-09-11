'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bell,
  UserCheck,
  Clock,
  Calendar,
  Building2,
  Wrench,
  QrCode,
  Utensils,
  CreditCard,
  BookOpen,
  FileCheck,
  MessageSquare,
  ListCheck,
  Users,
  Bed,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Sparkles,
  Box,
  Megaphone,
  Building,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole, ROLE_NAVIGATION, NavItem } from '@/config/navigation.config';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Bell,
  UserCheck,
  Clock,
  Calendar,
  Building2,
  Wrench,
  QrCode,
  Utensils,
  CreditCard,
  BookOpen,
  FileCheck,
  MessageSquare,
  ListCheck,
  Users,
  Bed,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Sparkles,
  Box,
  Megaphone,
  Building,
};

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { role: userRole } = useAuth();
  const currentRole: UserRole = userRole || 'student';
  const navigationGroups = ROLE_NAVIGATION[currentRole] || [];

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-border bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] select-none',
        className
      )}
    >
      {/* 1. Header / Logo Area */}
      <div className="flex h-14 items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-base shadow-xs">
          F
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white">FRETBOX</span>
          <span className="text-[10px] text-emerald-400 font-mono font-medium uppercase tracking-wider">
            Campus Ops OS
          </span>
        </div>
      </div>

      {/* 2. Authenticated Role Badge (Production F2 RBAC) */}
      <div className="border-b border-[hsl(var(--sidebar-border))] p-3">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          Authenticated Role Context
        </label>
        <div className="flex items-center justify-between rounded-md bg-[hsl(var(--sidebar-muted))] border border-[hsl(var(--sidebar-border))] px-3 py-1.5 text-xs text-white font-medium">
          <span className="capitalize">{currentRole} Portal</span>
          <Badge variant="outline" className="text-[9px] uppercase font-mono text-emerald-400 border-emerald-500/30 px-1.5 py-0">
            RBAC Active
          </Badge>
        </div>
      </div>

      {/* 3. Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.groupName} className="space-y-1">
            <h4 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {group.groupName}
            </h4>
            <div className="space-y-0.5 mt-1">
              {group.items.map((item: NavItem) => {
                const IconComponent = iconMap[item.iconName] || LayoutDashboard;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                        : 'text-slate-300 hover:bg-[hsl(var(--sidebar-muted))] hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>
                    {item.badge !== undefined && (
                      <Badge
                        variant={item.badgeVariant || 'default'}
                        className="px-1.5 py-0 text-[10px] font-bold h-4"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Footer Metadata */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Fretbox v1.0.0</span>
        <span className="font-mono text-emerald-400">F2 Session Auth</span>
      </div>
    </aside>
  );
}
