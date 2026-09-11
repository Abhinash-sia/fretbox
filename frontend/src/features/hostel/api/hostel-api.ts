import { apiClient } from '@/lib/api/api-client';
import {
  Hostel,
  HostelBlock,
  Room,
  StudentAllocation,
  CreateHostelInput,
  CreateBlockInput,
  CreateRoomInput,
  AllocateRoomInput,
  VacateRoomInput,
} from '../types/hostel';

interface PaginatedResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const hostelApi = {
  // --- Hostels ---
  getHostels: async (page = 1, limit = 50) => {
    return apiClient.get<PaginatedResponse & { hostels: Hostel[] }>(
      `/hostels?page=${page}&limit=${limit}`
    );
  },

  getHostelById: async (id: string) => {
    return apiClient.get<Hostel>(`/hostels/${id}`);
  },

  createHostel: async (input: CreateHostelInput) => {
    return apiClient.post<Hostel>('/hostels', input);
  },

  updateHostel: async (id: string, input: Partial<CreateHostelInput>) => {
    return apiClient.patch<Hostel>(`/hostels/${id}`, input);
  },

  // --- Hostel Blocks ---
  getBlocksByHostel: async (hostelId: string) => {
    return apiClient.get<HostelBlock[]>(`/hostels/${hostelId}/blocks`);
  },

  createBlock: async (input: CreateBlockInput) => {
    return apiClient.post<HostelBlock>('/hostels/blocks', input);
  },

  // --- Rooms ---
  getRooms: async (params?: {
    hostelId?: string;
    blockId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.hostelId) query.set('hostelId', params.hostelId);
    if (params?.blockId) query.set('blockId', params.blockId);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return apiClient.get<PaginatedResponse & { rooms: Room[] }>(
      `/hostels/rooms/all?${query.toString()}`
    );
  },

  getRoomById: async (id: string) => {
    return apiClient.get<Room>(`/hostels/rooms/${id}`);
  },

  createRoom: async (input: CreateRoomInput) => {
    return apiClient.post<Room>('/hostels/rooms', input);
  },

  updateRoom: async (id: string, input: Partial<{ capacity: number; status: string; floorNumber: number }>) => {
    return apiClient.patch<Room>(`/hostels/rooms/${id}`, input);
  },

  // --- Allocations ---
  getAllocations: async (params?: {
    studentId?: string;
    hostelId?: string;
    blockId?: string;
    roomId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.studentId) query.set('studentId', params.studentId);
    if (params?.hostelId) query.set('hostelId', params.hostelId);
    if (params?.blockId) query.set('blockId', params.blockId);
    if (params?.roomId) query.set('roomId', params.roomId);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return apiClient.get<PaginatedResponse & { allocations: StudentAllocation[] }>(
      `/hostels/allocations?${query.toString()}`
    );
  },

  getMyAllocation: async () => {
    return apiClient.get<StudentAllocation | null>('/hostels/allocations/my');
  },

  allocateRoom: async (input: AllocateRoomInput) => {
    return apiClient.post<StudentAllocation>('/hostels/allocations', input);
  },

  vacateRoom: async (allocationId: string, input?: VacateRoomInput) => {
    return apiClient.patch<StudentAllocation>(`/hostels/allocations/${allocationId}/vacate`, input || {});
  },
};
