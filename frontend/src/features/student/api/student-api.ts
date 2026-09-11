import { apiClient } from '@/lib/api/api-client';
import {
  StudentAttendanceSummary,
  HostelRoomAllocation,
  Complaint,
  CreateComplaintInput,
  GatePass,
  CreateGatePassInput,
  MessMenu,
  MessFeedbackInput,
  AppNotification,
  Announcement,
  FaqQueryResponse,
} from '../types/student';

export const studentApi = {
  // 1. Attendance Summary
  async getAttendanceSummary(studentId: string): Promise<StudentAttendanceSummary> {
    return apiClient.request<StudentAttendanceSummary>(`/academic/attendance/student/${studentId}`);
  },

  // 2. Room Allocation
  async getMyAllocation(): Promise<HostelRoomAllocation | null> {
    try {
      return await apiClient.request<HostelRoomAllocation>('/hostels/allocations/my');
    } catch {
      return null;
    }
  },

  // 3. Complaints
  async getComplaints(status?: string): Promise<Complaint[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.request<{ complaints: Complaint[] } | Complaint[]>(`/complaints${query}`);
    return Array.isArray(response) ? response : response.complaints || [];
  },

  async createComplaint(input: CreateComplaintInput): Promise<Complaint> {
    return apiClient.request<Complaint>('/complaints', {
      method: 'POST',
      body: input,
    });
  },

  // 4. Gate Passes
  async getGatePasses(status?: string): Promise<GatePass[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.request<{ gatePasses: GatePass[] } | GatePass[]>(`/gate-passes${query}`);
    return Array.isArray(response) ? response : response.gatePasses || [];
  },

  async createGatePass(input: CreateGatePassInput): Promise<GatePass> {
    return apiClient.request<GatePass>('/gate-passes', {
      method: 'POST',
      body: input,
    });
  },

  async cancelGatePass(id: string): Promise<GatePass> {
    return apiClient.request<GatePass>(`/gate-passes/${id}/cancel`, {
      method: 'POST',
    });
  },

  // 5. Mess Menus & Feedback
  async getMessMenus(): Promise<MessMenu[]> {
    const response = await apiClient.request<{ menus: MessMenu[] } | MessMenu[]>('/mess/menus');
    return Array.isArray(response) ? response : response.menus || [];
  },

  async submitMessFeedback(input: MessFeedbackInput): Promise<void> {
    await apiClient.request(`/mess/menus/${input.menuId}/feedback`, {
      method: 'POST',
      body: { rating: input.rating, comments: input.comments },
    });
  },

  // 6. Notifications & Announcements
  async getNotifications(): Promise<AppNotification[]> {
    const response = await apiClient.request<{ notifications: AppNotification[] } | AppNotification[]>('/communication/notifications');
    return Array.isArray(response) ? response : response.notifications || [];
  },

  async getUnreadNotificationCount(): Promise<number> {
    const data = await apiClient.request<{ count: number }>('/communication/notifications/unread-count');
    return data?.count ?? 0;
  },

  async markNotificationRead(id: string): Promise<void> {
    await apiClient.request(`/communication/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async getAnnouncements(): Promise<Announcement[]> {
    const response = await apiClient.request<{ announcements: Announcement[] } | Announcement[]>('/communication/announcements');
    return Array.isArray(response) ? response : response.announcements || [];
  },

  // 7. AI FAQ Query
  async queryFaq(query: string): Promise<FaqQueryResponse> {
    return apiClient.request<FaqQueryResponse>('/faq/query', {
      method: 'POST',
      body: { query },
    });
  },
};
