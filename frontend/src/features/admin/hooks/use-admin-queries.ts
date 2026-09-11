import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin-api';

export function useOverviewAnalytics(from?: string, to?: string) {
  return useQuery({
    queryKey: ['analytics-overview', from, to],
    queryFn: () => adminApi.getOverview(from, to),
    staleTime: 60000,
  });
}

export function useComplaintAnalytics(params?: {
  from?: string;
  to?: string;
  hostelId?: string;
  blockId?: string;
  category?: string;
  priority?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['analytics-complaints', params],
    queryFn: () => adminApi.getComplaintAnalytics(params),
    staleTime: 60000,
  });
}

export function useWorkloadAnalytics(params?: {
  from?: string;
  to?: string;
  hostelId?: string;
}) {
  return useQuery({
    queryKey: ['analytics-workload', params],
    queryFn: () => adminApi.getWorkloadAnalytics(params),
    staleTime: 60000,
  });
}

export function useRecurringIssues(params?: { windowDays?: number; limit?: number }) {
  return useQuery({
    queryKey: ['analytics-recurring-issues', params],
    queryFn: () => adminApi.getRecurringIssues(params),
    staleTime: 60000,
  });
}

export function useAttendanceAnalytics(params?: {
  from?: string;
  to?: string;
  academicYear?: string;
  semester?: string;
  course?: string;
  section?: string;
}) {
  return useQuery({
    queryKey: ['analytics-attendance', params],
    queryFn: () => adminApi.getAttendanceAnalytics(params),
    staleTime: 60000,
  });
}

export function useLowAttendanceStudents(params?: {
  threshold?: number;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['analytics-attendance-low', params],
    queryFn: () => adminApi.getLowAttendanceStudents(params),
    staleTime: 60000,
  });
}

export function useHostelAnalytics() {
  return useQuery({
    queryKey: ['analytics-hostels'],
    queryFn: () => adminApi.getHostelAnalytics(),
    staleTime: 60000,
  });
}

export function useFacilityAnalytics() {
  return useQuery({
    queryKey: ['analytics-facilities'],
    queryFn: () => adminApi.getFacilityAnalytics(),
    staleTime: 60000,
  });
}

export function useMessAnalytics(from?: string, to?: string) {
  return useQuery({
    queryKey: ['analytics-mess', from, to],
    queryFn: () => adminApi.getMessAnalytics(from, to),
    staleTime: 60000,
  });
}

export function useGateAnalytics(from?: string, to?: string) {
  return useQuery({
    queryKey: ['analytics-gates', from, to],
    queryFn: () => adminApi.getGateAnalytics(from, to),
    staleTime: 60000,
  });
}

export function useCommunicationAnalytics(from?: string, to?: string) {
  return useQuery({
    queryKey: ['analytics-communication', from, to],
    queryFn: () => adminApi.getCommunicationAnalytics(from, to),
    staleTime: 60000,
  });
}
