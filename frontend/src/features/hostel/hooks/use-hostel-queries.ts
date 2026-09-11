import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelApi } from '../api/hostel-api';
import {
  CreateHostelInput,
  CreateBlockInput,
  CreateRoomInput,
  AllocateRoomInput,
  VacateRoomInput,
} from '../types/hostel';

export function useHostels(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['hostels', page, limit],
    queryFn: () => hostelApi.getHostels(page, limit),
  });
}

export function useHostelBlocks(hostelId?: string) {
  return useQuery({
    queryKey: ['hostel-blocks', hostelId],
    queryFn: () => (hostelId ? hostelApi.getBlocksByHostel(hostelId) : []),
    enabled: !!hostelId,
  });
}

export function useRooms(params?: {
  hostelId?: string;
  blockId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: () => hostelApi.getRooms(params),
  });
}

export function useAllocations(params?: {
  studentId?: string;
  hostelId?: string;
  blockId?: string;
  roomId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['allocations', params],
    queryFn: () => hostelApi.getAllocations(params),
  });
}

export function useCreateHostel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHostelInput) => hostelApi.createHostel(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
    },
  });
}

export function useCreateBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBlockInput) => hostelApi.createBlock(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hostel-blocks', variables.hostelId] });
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoomInput) => hostelApi.createRoom(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useAllocateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AllocateRoomInput) => hostelApi.allocateRoom(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useVacateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ allocationId, input }: { allocationId: string; input?: VacateRoomInput }) =>
      hostelApi.vacateRoom(allocationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
