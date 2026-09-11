'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import {
  Sun,
  Moon,
  Search,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/config/navigation.config';
import { NotificationBell } from '@/features/communication/components/notification-bell';

interface AppNavbarProps {
  currentRole?: UserRole;
  onOpenCommand: () => void;
  onOpenMobileMenu: () => void;
}

export function AppNavbar({
  onOpenCommand,
  onOpenMobileMenu,
}: AppNavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, role, logout } = useAuth();
  const activeRole = role || 'student';

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : activeRole.substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xs select-none">
      {/* 1. Left: Mobile Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 text-muted-foreground"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Fretbox</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="capitalize font-semibold text-foreground">
                {activeRole} Dashboard
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 2. Right: Command Search, Notifications, Theme & Profile */}
      <div className="flex items-center gap-2">
        {/* Command Search Trigger */}
        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Quick search or command...</span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center rounded border bg-background px-1 font-mono text-[10px] font-semibold text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications Button */}
        <NotificationBell />

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9 text-xs hover:bg-muted"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                {userInitials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-semibold text-foreground capitalize leading-none">
                  {user?.name || `${activeRole} User`}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {user?.email || 'authenticated'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold leading-none capitalize">
                  {user?.name || `${activeRole} User`}
                </p>
                <p className="text-[10px] text-muted-foreground">{user?.email || 'authenticated'}</p>
                <div className="pt-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    {activeRole}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-3.5 w-3.5" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-3.5 w-3.5" />
              <span>Security & Roles</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-600 dark:text-rose-400 cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
