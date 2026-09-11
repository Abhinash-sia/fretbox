'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { useAuth } from '@/components/providers/auth-provider';
import { initSocket, disconnectSocket } from './socket-client';
import {
  SocketConnectionState,
  NotificationNewPayload,
  NotificationReadPayload,
  NotificationActionPayload,
  AnnouncementPublishedPayload,
} from '../types/communication';

interface RealtimeEvent<T = unknown> {
  name: string;
  payload: T;
  timestamp: number;
}

interface SocketContextValue {
  status: SocketConnectionState;
  socket: Socket | null;
  lastEvent: RealtimeEvent | null;
}

const SocketContext = React.createContext<SocketContextValue>({
  status: 'disconnected',
  socket: null,
  lastEvent: null,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [status, setStatus] = React.useState<SocketConnectionState>('disconnected');
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [lastEvent, setLastEvent] = React.useState<RealtimeEvent | null>(null);

  React.useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    const s = initSocket();

    if (!s) {
      return;
    }

    const onConnect = () => setStatus('connected');
    const onDisconnect = (reason: string) => {
      if (reason === 'io server disconnect') {
        setStatus('disconnected');
      } else {
        setStatus('reconnecting');
      }
    };
    const onError = () => setStatus('error');
    const onReconnectAttempt = () => setStatus('reconnecting');

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onError);
    s.io.on('reconnect_attempt', onReconnectAttempt);

    const handleNotificationNew = (payload: NotificationNewPayload) => {
      setLastEvent({ name: 'notification:new', payload, timestamp: Date.now() });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-complaints'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-communication'] });
    };

    const handleNotificationRead = (payload: NotificationReadPayload) => {
      setLastEvent({ name: 'notification:read', payload, timestamp: Date.now() });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-communication'] });
    };

    const handleNotificationAction = (payload: NotificationActionPayload) => {
      setLastEvent({ name: 'notification:action', payload, timestamp: Date.now() });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-communication'] });
    };

    const handleAnnouncementPublished = (payload: AnnouncementPublishedPayload) => {
      setLastEvent({ name: 'announcement:published', payload, timestamp: Date.now() });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-communication'] });
    };

    s.on('notification:new', handleNotificationNew);
    s.on('notification:read', handleNotificationRead);
    s.on('notification:action', handleNotificationAction);
    s.on('announcement:published', handleAnnouncementPublished);

    // Asynchronously bind socket and initial state
    queueMicrotask(() => {
      setSocket(s);
      setStatus(s.connected ? 'connected' : 'connecting');
    });

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onError);
      s.off('notification:new', handleNotificationNew);
      s.off('notification:read', handleNotificationRead);
      s.off('notification:action', handleNotificationAction);
      s.off('announcement:published', handleAnnouncementPublished);
      s.io.off('reconnect_attempt', onReconnectAttempt);
    };
  }, [user, queryClient]);

  const value = React.useMemo(
    () => ({ status, socket, lastEvent }),
    [status, socket, lastEvent],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  return React.useContext(SocketContext);
}
