import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaints-api';
import {
  CreateComplaintInput,
  AssignComplaintInput,
  UpdateComplaintStatusInput,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../types/complaints';

export function useComplaintsList(params?: {
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
}) {
  return useQuery({
    queryKey: ['complaints-list', params],
    queryFn: () => complaintsApi.getComplaints(params),
  });
}

export function useComplaintDetails(id?: string) {
  return useQuery({
    queryKey: ['complaint-details', id],
    queryFn: () => (id ? complaintsApi.getComplaintById(id) : null),
    enabled: !!id,
  });
}

export function useComplaintMetrics(hostelId?: string) {
  return useQuery({
    queryKey: ['complaint-metrics', hostelId],
    queryFn: () => complaintsApi.getMetrics(hostelId),
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateComplaintInput) => complaintsApi.createComplaint(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints-list'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint-metrics'] });
    },
  });
}

export function useAssignComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssignComplaintInput }) =>
      complaintsApi.assignComplaint(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaints-list'] });
      queryClient.invalidateQueries({ queryKey: ['complaint-details', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['complaint-metrics'] });
    },
  });
}

export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateComplaintStatusInput }) =>
      complaintsApi.updateStatus(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaints-list'] });
      queryClient.invalidateQueries({ queryKey: ['complaint-details', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['student', 'complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint-metrics'] });
    },
  });
}
