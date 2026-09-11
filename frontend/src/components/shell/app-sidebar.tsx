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
  ChevronDown,
  Building,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  className?: string;
}

export function AppSidebar({ currentRole, onRoleChange, className }: AppSidebarProps) {
  const pathname = usePathname();
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

      {/* 2. Role Selector (F1 Interactive Demo Switcher) */}
      <div className="border-b border-[hsl(var(--sidebar-border))] p-3">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          Active Role Context
        </label>
        <div className="relative">
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="w-full appearance-none rounded-md bg-[hsl(var(--sidebar-muted))] border border-[hsl(var(--sidebar-border))] px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
          >
            <option value="student">Student Portal</option>
            <option value="faculty">Faculty Portal</option>
            <option value="staff">Staff Portal</option>
            <option value="warden">Warden Portal</option>
            <option value="security">Security Post</option>
            <option value="administrator">Administrator HQ</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
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
        <span className="font-mono text-emerald-400">F1 Shell Ready</span>
      </div>
    </aside>
  );
}
