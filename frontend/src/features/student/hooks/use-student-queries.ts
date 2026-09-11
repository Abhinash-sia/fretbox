import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { studentApi } from '../api/student-api';
import { CreateComplaintInput, CreateGatePassInput, MessFeedbackInput } from '../types/student';

export function useStudentAttendance() {
  const { user } = useAuth();
  const studentId = user?.id;

  return useQuery({
    queryKey: ['student', 'attendance', studentId],
    queryFn: () => (studentId ? studentApi.getAttendanceSummary(studentId) : null),
    enabled: !!studentId,
  });
}

export function useStudentAllocation() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['student', 'allocation', user?.id],
    queryFn: () => studentApi.getMyAllocation(),
    enabled: !!user?.id,
  });
}

export function useStudentComplaints(status?: string) {
  return useQuery({
    queryKey: ['student', 'complaints', status],
    queryFn: () => studentApi.getComplaints(status),
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateComplaintInput) => studentApi.createComplaint(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'complaints'] });
    },
  });
}

export function useStudentGatePasses(status?: string) {
  return useQuery({
    queryKey: ['student', 'gate-passes', status],
    queryFn: () => studentApi.getGatePasses(status),
  });
}

export function useCreateGatePass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGatePassInput) => studentApi.createGatePass(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'gate-passes'] });
    },
  });
}

export function useCancelGatePass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentApi.cancelGatePass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'gate-passes'] });
    },
  });
}

export function useStudentMessMenus() {
  return useQuery({
    queryKey: ['student', 'mess-menus'],
    queryFn: () => studentApi.getMessMenus(),
  });
}

export function useSubmitMessFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MessFeedbackInput) => studentApi.submitMessFeedback(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'mess-menus'] });
    },
  });
}

export function useStudentNotifications() {
  return useQuery({
    queryKey: ['student', 'notifications'],
    queryFn: () => studentApi.getNotifications(),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['student', 'notifications', 'unread-count'],
    queryFn: () => studentApi.getUnreadNotificationCount(),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] });
    },
  });
}

export function useStudentAnnouncements() {
  return useQuery({
    queryKey: ['student', 'announcements'],
    queryFn: () => studentApi.getAnnouncements(),
  });
}

export function useFaqQuery() {
  return useMutation({
    mutationFn: (query: string) => studentApi.queryFaq(query),
  });
}
