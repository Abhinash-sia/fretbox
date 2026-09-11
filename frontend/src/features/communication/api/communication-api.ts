import { apiClient } from '@/lib/api/api-client';
import {
  NotificationItem,
  AnnouncementItem,
  AnnouncementStats,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from '../types/communication';

export interface NotificationListResponse {
  notifications: NotificationItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AnnouncementListResponse {
  announcements: AnnouncementItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const communicationApi = {
  // 1. Notifications
  async getNotifications(params?: {
    unreadOnly?: boolean;
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationListResponse> {
    const query = new URLSearchParams();
    if (params?.unreadOnly) query.set('unreadOnly', 'true');
    if (params?.type) query.set('type', params.type);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.get<NotificationListResponse | NotificationItem[]>(
      `/communication/notifications${queryString}`,
    );

    if (Array.isArray(res)) {
      return {
        notifications: res,
        pagination: { total: res.length, page: 1, limit: res.length || 20, pages: 1 },
      };
    }
    return res || { notifications: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } };
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ unreadCount?: number; count?: number }>(
      '/communication/notifications/unread-count',
    );
    return res?.unreadCount ?? res?.count ?? 0;
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    return apiClient.patch<NotificationItem>(`/communication/notifications/${id}/read`);
  },

  async markAsActioned(id: string): Promise<NotificationItem> {
    return apiClient.patch<NotificationItem>(`/communication/notifications/${id}/action`);
  },

  // 2. Announcements
  async getAnnouncements(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<AnnouncementListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status) query.set('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.get<AnnouncementListResponse | AnnouncementItem[]>(
      `/communication/announcements${queryString}`,
    );

    if (Array.isArray(res)) {
      return {
        announcements: res,
        pagination: { total: res.length, page: 1, limit: res.length || 20, pages: 1 },
      };
    }
    return res || { announcements: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } };
  },

  async getAnnouncementById(id: string): Promise<AnnouncementItem> {
    return apiClient.get<AnnouncementItem>(`/communication/announcements/${id}`);
  },

  async createAnnouncement(input: CreateAnnouncementInput): Promise<AnnouncementItem> {
    return apiClient.post<AnnouncementItem>('/communication/announcements', input);
  },

  async updateAnnouncement(
    id: string,
    input: UpdateAnnouncementInput,
  ): Promise<AnnouncementItem> {
    return apiClient.patch<AnnouncementItem>(`/communication/announcements/${id}`, input);
  },

  async publishAnnouncement(id: string): Promise<AnnouncementItem> {
    return apiClient.post<AnnouncementItem>(`/communication/announcements/${id}/publish`);
  },

  async cancelAnnouncement(id: string): Promise<AnnouncementItem> {
    return apiClient.post<AnnouncementItem>(`/communication/announcements/${id}/cancel`);
  },

  async getAnnouncementStats(id: string): Promise<AnnouncementStats> {
    return apiClient.get<AnnouncementStats>(`/communication/announcements/${id}/stats`);
  },
};
