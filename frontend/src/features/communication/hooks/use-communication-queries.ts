import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  communicationApi,
  NotificationListResponse,
  AnnouncementListResponse,
} from '../api/communication-api';
import {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '../types/communication';

// --------------------------------------------------
// Notifications Hooks
// --------------------------------------------------
export function useNotifications(params?: {
  unreadOnly?: boolean;
  type?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<NotificationListResponse>({
    queryKey: ['notifications', params],
    queryFn: () => communicationApi.getNotifications(params),
    staleTime: 10000,
  });
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['unread-count'],
    queryFn: () => communicationApi.getUnreadCount(),
    staleTime: 15000,
    refetchInterval: 60000, // Safety fallback polling
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useMarkAsActioned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationApi.markAsActioned(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

// --------------------------------------------------
// Announcements Hooks
// --------------------------------------------------
export function useAnnouncements(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery<AnnouncementListResponse>({
    queryKey: ['announcements', params],
    queryFn: () => communicationApi.getAnnouncements(params),
    staleTime: 30000,
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ['announcement', id],
    queryFn: () => communicationApi.getAnnouncementById(id),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) => communicationApi.createAnnouncement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAnnouncementInput }) =>
      communicationApi.updateAnnouncement(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement', variables.id] });
    },
  });
}

export function usePublishAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationApi.publishAnnouncement(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      queryClient.invalidateQueries({ queryKey: ['announcement-stats', id] });
    },
  });
}

export function useCancelAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationApi.cancelAnnouncement(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    },
  });
}

export function useAnnouncementStats(id: string, enabled = true) {
  return useQuery({
    queryKey: ['announcement-stats', id],
    queryFn: () => communicationApi.getAnnouncementStats(id),
    enabled: !!id && enabled,
  });
}
