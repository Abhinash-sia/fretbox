import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { facultyApi } from '../api/faculty-api';
import {
  CreateAttendanceSessionInput,
  MarkAttendanceInput,
  CorrectAttendanceInput,
} from '../types/faculty';

export function useFacultyAssignments() {
  const { user } = useAuth();
  const facultyId = user?.id;

  return useQuery({
    queryKey: ['faculty', 'assignments', facultyId],
    queryFn: () => (facultyId ? facultyApi.getFacultyAssignments(facultyId) : []),
    enabled: !!facultyId,
  });
}

export function useSectionEnrollments(classSectionId?: string) {
  return useQuery({
    queryKey: ['faculty', 'enrollments', classSectionId],
    queryFn: () => facultyApi.getStudentEnrollments(classSectionId),
    enabled: !!classSectionId,
  });
}

export function useFacultyCourses() {
  return useQuery({
    queryKey: ['faculty', 'courses'],
    queryFn: () => facultyApi.getCourses(),
  });
}

export function useFacultyClassSections() {
  return useQuery({
    queryKey: ['faculty', 'sections'],
    queryFn: () => facultyApi.getClassSections(),
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAttendanceSessionInput) => facultyApi.createAttendanceSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['faculty', 'attendance'] });
    },
  });
}

export function useMarkSessionAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkAttendanceInput) => facultyApi.markSessionAttendance(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', 'attendance'] });
    },
  });
}

export function useCourseAttendanceOverview(courseId?: string) {
  return useQuery({
    queryKey: ['faculty', 'attendance', 'course', courseId],
    queryFn: () => (courseId ? facultyApi.getCourseAttendanceOverview(courseId) : null),
    enabled: !!courseId,
  });
}

export function useCorrectAttendanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CorrectAttendanceInput) => facultyApi.correctAttendanceRecord(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', 'attendance'] });
    },
  });
}
