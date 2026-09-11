import { apiClient } from '@/lib/api/api-client';
import {
  FacultyAssignment,
  StudentEnrollment,
  Course,
  ClassSection,
  AttendanceSession,
  CreateAttendanceSessionInput,
  MarkAttendanceInput,
  CorrectAttendanceInput,
  CourseAttendanceOverview,
  AttendanceAuditLog,
} from '../types/faculty';

export const facultyApi = {
  // 1. Faculty Course Assignments
  async getFacultyAssignments(facultyId: string): Promise<FacultyAssignment[]> {
    const response = await apiClient.request<{ assignments: FacultyAssignment[] } | FacultyAssignment[]>(
      `/academic/assignments?facultyId=${facultyId}`
    );
    return Array.isArray(response) ? response : response.assignments || [];
  },

  // 2. Class Section Enrollments
  async getStudentEnrollments(classSectionId?: string): Promise<StudentEnrollment[]> {
    const query = classSectionId ? `?classSectionId=${classSectionId}` : '';
    const response = await apiClient.request<{ enrollments: StudentEnrollment[] } | StudentEnrollment[]>(
      `/academic/enrollments${query}`
    );
    return Array.isArray(response) ? response : response.enrollments || [];
  },

  // 3. Courses & Sections Directory
  async getCourses(): Promise<Course[]> {
    const response = await apiClient.request<{ courses: Course[] } | Course[]>('/academic/courses');
    return Array.isArray(response) ? response : response.courses || [];
  },

  async getClassSections(): Promise<ClassSection[]> {
    const response = await apiClient.request<{ sections: ClassSection[] } | ClassSection[]>('/academic/sections');
    return Array.isArray(response) ? response : response.sections || [];
  },

  // 4. Create Attendance Session
  async createAttendanceSession(input: CreateAttendanceSessionInput): Promise<AttendanceSession> {
    return apiClient.request<AttendanceSession>('/academic/attendance/sessions', {
      method: 'POST',
      body: input,
    });
  },

  // 5. Mark Session Attendance Records
  async markSessionAttendance(input: MarkAttendanceInput): Promise<unknown> {
    return apiClient.request(`/academic/attendance/sessions/${input.sessionId}/records`, {
      method: 'POST',
      body: { records: input.records },
    });
  },

  // 6. Course Attendance Overview (Faculty analytics)
  async getCourseAttendanceOverview(courseId: string): Promise<CourseAttendanceOverview> {
    return apiClient.request<CourseAttendanceOverview>(`/academic/attendance/course/${courseId}`);
  },

  // 7. Correct Attendance Record
  async correctAttendanceRecord(input: CorrectAttendanceInput): Promise<unknown> {
    return apiClient.request(`/academic/attendance/records/${input.recordId}`, {
      method: 'PATCH',
      body: { status: input.status, reason: input.reason },
    });
  },

  // 8. Attendance Audit Logs
  async getAttendanceAuditLogs(recordId: string): Promise<AttendanceAuditLog[]> {
    const response = await apiClient.request<{ logs: AttendanceAuditLog[] } | AttendanceAuditLog[]>(
      `/academic/attendance/records/${recordId}/audit`
    );
    return Array.isArray(response) ? response : response.logs || [];
  },
};
