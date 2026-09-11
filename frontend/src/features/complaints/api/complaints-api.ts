import { apiClient } from '@/lib/api/api-client';
import {
  Complaint,
  ComplaintDetailsResponse,
  ComplaintMetrics,
  CreateComplaintInput,
  AssignComplaintInput,
  UpdateComplaintStatusInput,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../types/complaints';

interface PaginatedComplaintsResponse {
  complaints: Complaint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const complaintsApi = {
  getComplaints: async (params?: {
    category?: ComplaintCategory;
    status?: ComplaintStatus;
    priority?: ComplaintPriority;
    assignedToStaffId?: string;
    hostelId?: string;
    blockId?: string;
    roomId?: string;
    assetId?: string;
    search?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.assignedToStaffId) query.set('assignedToStaffId', params.assignedToStaffId);
    if (params?.hostelId) query.set('hostelId', params.hostelId);
    if (params?.blockId) query.set('blockId', params.blockId);
    if (params?.roomId) query.set('roomId', params.roomId);
    if (params?.assetId) query.set('assetId', params.assetId);
    if (params?.search) query.set('search', params.search);
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return apiClient.get<PaginatedComplaintsResponse>(`/complaints?${query.toString()}`);
  },

  getComplaintById: async (id: string) => {
    return apiClient.get<ComplaintDetailsResponse>(`/complaints/${id}`);
  },

  getMetrics: async (hostelId?: string) => {
    const query = hostelId ? `?hostelId=${hostelId}` : '';
    return apiClient.get<ComplaintMetrics>(`/complaints/metrics${query}`);
  },

  getRecurring: async (threshold = 3) => {
    return apiClient.get<unknown[]>(`/complaints/recurring?threshold=${threshold}`);
  },

  createComplaint: async (input: CreateComplaintInput) => {
    return apiClient.post<Complaint>('/complaints', input);
  },

  assignComplaint: async (id: string, input: AssignComplaintInput) => {
    return apiClient.patch<Complaint>(`/complaints/${id}/assign`, input);
  },

  updateStatus: async (id: string, input: UpdateComplaintStatusInput) => {
    return apiClient.patch<Complaint>(`/complaints/${id}/status`, input);
  },

  classifyWithAi: async (id: string) => {
    return apiClient.post<Complaint>(`/complaints/${id}/ai-classify`);
  },
};
