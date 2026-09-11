'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, Check, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useUnreadCount,
  useNotifications,
  useMarkAsRead,
} from '../hooks/use-communication-queries';
import { useSocket } from '../realtime/use-socket';
import { NotificationItem } from '../types/communication';

export function NotificationBell() {
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifData, isLoading } = useNotifications({ limit: 5 });
  const markReadMutation = useMarkAsRead();
  const { status: socketStatus } = useSocket();

  const notifications = notifData?.notifications || [];

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await markReadMutation.mutateAsync(id);
    } catch {
      // Error state managed by mutation
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <Badge variant="destructive" className="font-mono text-[9px] px-1 py-0 uppercase">
            Urgent
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="warning" className="font-mono text-[9px] px-1 py-0 uppercase">
            High
          </Badge>
        );
      case 'normal':
      default:
        return (
          <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 uppercase">
            Normal
          </Badge>
        );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground focus:outline-none select-none"
        >
          <Bell className="h-4 w-4" />

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 font-mono text-[9px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Socket status dot indicator */}
          <span
            className={`absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ring-1 ring-background ${
              socketStatus === 'connected'
                ? 'bg-emerald-500'
                : socketStatus === 'connecting' || socketStatus === 'reconnecting'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-zinc-400'
            }`}
            title={`Realtime Status: ${socketStatus}`}
          />
          <span className="sr-only">Notifications ({unreadCount} unread)</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 md:w-96 p-0 select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-xs text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="success" className="font-mono text-[10px] px-1.5 py-0">
                {unreadCount} New
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
            {socketStatus === 'connected' ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
              </span>
            ) : socketStatus === 'reconnecting' || socketStatus === 'connecting' ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <RefreshCw className="h-3 w-3 animate-spin" /> Connecting
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="h-3 w-3" /> Offline
              </span>
            )}
          </div>
        </div>

        {/* Notifications Preview List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((item: NotificationItem) => (
              <div
                key={item._id}
                className={`p-3 transition-colors ${
                  !item.readAt
                    ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                    : 'hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-semibold text-xs leading-snug ${
                          !item.readAt ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {item.title}
                      </span>
                      {getPriorityBadge(item.priority)}
                    </div>
                    <p className="text-xs line-clamp-2 text-foreground/80 leading-relaxed">
                      {item.body}
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground block pt-0.5">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {!item.readAt && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                      onClick={(e) => handleMarkRead(e, item._id)}
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No recent notifications found.
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Footer Link */}
        <DropdownMenuItem asChild className="p-0 cursor-pointer">
          <Link
            href="/notifications"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 text-center text-xs font-semibold text-primary hover:bg-muted/50"
          >
            <span>View All Notifications</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
