'use client';

import * as React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium shadow-md transition-all duration-300 border ${
        !isOnline
          ? 'bg-amber-900/90 text-amber-100 border-amber-700/50'
          : 'bg-emerald-900/90 text-emerald-100 border-emerald-700/50'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
          <span>You are offline. Showing cached campus data.</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 shrink-0 text-emerald-300" />
          <span>Connection restored. Fresh data loaded.</span>
        </>
      )}
    </div>
  );
}
