import { apiClient } from '@/lib/api/api-client';
import {
  OverviewAnalytics,
  ComplaintAnalytics,
  WorkloadStaffItem,
  RecurringIssuesAnalytics,
  AttendanceAnalytics,
  LowAttendanceResponse,
  HostelAnalytics,
  FacilityAnalytics,
  MessAnalytics,
  GateAnalytics,
  CommunicationAnalytics,
} from '../types/admin';

export const adminApi = {
  async getOverview(from?: string, to?: string): Promise<OverviewAnalytics> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<OverviewAnalytics>(`/analytics/overview${query}`);
  },

  async getComplaintAnalytics(params?: {
    from?: string;
    to?: string;
    hostelId?: string;
    blockId?: string;
    category?: string;
    priority?: string;
    status?: string;
  }): Promise<ComplaintAnalytics> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.hostelId) query.set('hostelId', params.hostelId);
    if (params?.blockId) query.set('blockId', params.blockId);
    if (params?.category) query.set('category', params.category);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.status) query.set('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<ComplaintAnalytics>(`/analytics/complaints${queryString}`);
  },

  async getWorkloadAnalytics(params?: {
    from?: string;
    to?: string;
    hostelId?: string;
  }): Promise<WorkloadStaffItem[]> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.hostelId) query.set('hostelId', params.hostelId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.get<WorkloadStaffItem[]>(`/analytics/workload${queryString}`);
    return Array.isArray(res) ? res : [];
  },

  async getRecurringIssues(params?: {
    windowDays?: number;
    limit?: number;
  }): Promise<RecurringIssuesAnalytics> {
    const query = new URLSearchParams();
    if (params?.windowDays) query.set('windowDays', params.windowDays.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<RecurringIssuesAnalytics>(`/analytics/recurring-issues${queryString}`);
  },

  async getAttendanceAnalytics(params?: {
    from?: string;
    to?: string;
    academicYear?: string;
    semester?: string;
    course?: string;
    section?: string;
  }): Promise<AttendanceAnalytics> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.academicYear) query.set('academicYear', params.academicYear);
    if (params?.semester) query.set('semester', params.semester);
    if (params?.course) query.set('course', params.course);
    if (params?.section) query.set('section', params.section);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<AttendanceAnalytics>(`/analytics/attendance${queryString}`);
  },

  async getLowAttendanceStudents(params?: {
    threshold?: number;
    page?: number;
    limit?: number;
  }): Promise<LowAttendanceResponse> {
    const query = new URLSearchParams();
    if (params?.threshold) query.set('threshold', params.threshold.toString());
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<LowAttendanceResponse>(`/analytics/attendance/low${queryString}`);
  },

  async getHostelAnalytics(): Promise<HostelAnalytics> {
    return apiClient.get<HostelAnalytics>('/analytics/hostels');
  },

  async getFacilityAnalytics(): Promise<FacilityAnalytics> {
    return apiClient.get<FacilityAnalytics>('/analytics/facilities');
  },

  async getMessAnalytics(from?: string, to?: string): Promise<MessAnalytics> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<MessAnalytics>(`/analytics/mess${query}`);
  },

  async getGateAnalytics(from?: string, to?: string): Promise<GateAnalytics> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<GateAnalytics>(`/analytics/gates${query}`);
  },

  async getCommunicationAnalytics(from?: string, to?: string): Promise<CommunicationAnalytics> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<CommunicationAnalytics>(`/analytics/communication${query}`);
  },
};
