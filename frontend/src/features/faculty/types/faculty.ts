export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Course {
  _id: string;
  code: string;
  name: string;
  credits: number;
  departmentId?: string | { _id: string; name: string; code: string };
  description?: string;
  isActive: boolean;
}

export interface ClassSection {
  _id: string;
  name: string;
  programId?: string | { _id: string; name: string; code: string };
  academicYearId?: string | { _id: string; yearLabel: string };
  semesterId?: string | { _id: string; name: string; number: number };
  isActive: boolean;
}

export interface FacultyAssignment {
  _id: string;
  facultyId: string | { _id: string; name: string; email: string };
  courseId: Course;
  classSectionId: ClassSection;
  academicYearId?: string | { _id: string; yearLabel: string };
  semesterId?: string | { _id: string; name: string; number: number };
  createdAt: string;
}

export interface StudentEnrollment {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  classSectionId: string | ClassSection;
  rollNumber: string;
  isActive: boolean;
}

export interface AttendanceSession {
  _id: string;
  courseId: string | Course;
  classSectionId: string | ClassSection;
  facultyId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  sessionNumber?: number;
  topic?: string;
  createdAt: string;
}

export interface CreateAttendanceSessionInput {
  courseId: string;
  classSectionId: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionNumber?: number;
  topic?: string;
}

export interface MarkAttendanceRecordItem {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface MarkAttendanceInput {
  sessionId: string;
  records: MarkAttendanceRecordItem[];
}

export interface CorrectAttendanceInput {
  recordId: string;
  status: AttendanceStatus;
  reason: string;
}

export interface AttendanceAuditLog {
  _id: string;
  attendanceRecordId: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
  correctedByUserId: { _id: string; name: string; email: string };
  createdAt: string;
}

export interface CourseAttendanceStudentSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  totalSessions: number;
  attendedSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  percentage: number;
  isLowAttendance: boolean;
}

export interface CourseAttendanceOverview {
  courseId: string;
  courseCode: string;
  courseName: string;
  totalConductedSessions: number;
  students: CourseAttendanceStudentSummary[];
}
