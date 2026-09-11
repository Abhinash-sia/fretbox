import Types from 'mongoose';
import { AttendanceSession } from '../models/attendanceSession.model.js';
import { AttendanceRecord } from '../models/attendanceRecord.model.js';
import { AttendanceAudit } from '../models/attendanceAudit.model.js';
import { FacultyAssignment } from '../models/facultyAssignment.model.js';
import { StudentEnrollment } from '../models/studentEnrollment.model.js';
import { Course } from '../models/course.model.js';
import { User } from '../models/user.model.js';
import { calculateAttendancePercentage, ACADEMIC_CONFIG } from '../config/academic.config.js';
import {
  AttendanceStatus,
  SessionStatus,
  UserRole,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  StudentAttendanceSummary,
  CourseAttendanceSummary,
} from '../types/index.js';

export interface CreateSessionDTO {
  courseId: string;
  classSectionId: string;
  facultyId: string;
  date: Date;
  startTime: string;
  endTime: string;
  sessionNumber?: number;
  topic?: string;
}

export interface MarkAttendanceRecordDTO {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export class AttendanceService {
  /**
   * Creates a new attendance session.
   * Enforces business rule: Faculty must be assigned to the course and class section.
   */
  public async createSession(dto: CreateSessionDTO) {
    // 1. Verify Faculty Assignment exists and is active
    const assignment = await FacultyAssignment.findOne({
      facultyId: dto.facultyId,
      courseId: dto.courseId,
      classSectionId: dto.classSectionId,
      isActive: true,
    });

    if (!assignment) {
      throw new ForbiddenError(
        'Faculty member is not assigned to teach this course in this section',
        'ATTENDANCE_NOT_ASSIGNED',
      );
    }

    return AttendanceSession.create({
      courseId: dto.courseId,
      classSectionId: dto.classSectionId,
      facultyId: dto.facultyId,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      sessionNumber: dto.sessionNumber || 1,
      topic: dto.topic ? dto.topic.trim() : undefined,
      status: SessionStatus.COMPLETED,
    });
  }

  /**
   * Marks attendance for students in an attendance session.
   * Enforces business rules:
   * - Attendance session must exist.
   * - Students must belong to the relevant class section.
   * - One attendance record per student per session.
   */
  public async markSessionAttendance(
    sessionId: string,
    facultyId: string,
    records: MarkAttendanceRecordDTO[],
  ) {
    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Attendance session not found', 'ATTENDANCE_SESSION_NOT_FOUND');
    }

    // Verify calling faculty matches session faculty (or admin override)
    const facultyUser = await User.findById(facultyId);
    if (
      facultyUser?.role !== UserRole.ADMINISTRATOR &&
      session.facultyId.toString() !== facultyId
    ) {
      throw new ForbiddenError(
        'Faculty member can only mark attendance for their own sessions',
        'ATTENDANCE_NOT_ASSIGNED',
      );
    }

    // Fetch enrolled students for this class section
    const enrollments = await StudentEnrollment.find({
      classSectionId: session.classSectionId,
      isActive: true,
    }).select('studentId');

    const enrolledStudentIds = new Set(enrollments.map((e) => e.studentId.toString()));

    const createdRecords = [];

    for (const recordDTO of records) {
      // Validate student belongs to section
      if (!enrolledStudentIds.has(recordDTO.studentId)) {
        throw new BadRequestError(
          `Student '${recordDTO.studentId}' is not enrolled in this class section`,
          'ATTENDANCE_INVALID_STUDENT',
        );
      }

      // Prevent duplicate record insertion
      const existing = await AttendanceRecord.findOne({
        attendanceSessionId: sessionId,
        studentId: recordDTO.studentId,
      });

      if (existing) {
        throw new ConflictError(
          `Attendance record already exists for student '${recordDTO.studentId}' in this session`,
          'ATTENDANCE_DUPLICATE_RECORD',
        );
      }

      const newRecord = await AttendanceRecord.create({
        attendanceSessionId: sessionId,
        studentId: recordDTO.studentId,
        status: recordDTO.status,
        markedAt: new Date(),
        markedBy: facultyId,
        remarks: recordDTO.remarks ? recordDTO.remarks.trim() : undefined,
      });

      createdRecords.push(newRecord);
    }

    return createdRecords;
  }

  /**
   * Retrieves overall & course-wise attendance summary for a student.
   *
   * BUSINESS CALCULATION RULE:
   * present = attended
   * late = attended
   * absent = not attended
   * excused = not attended for percentage calculation
   *
   * Formula:
   *   percentage = ((present + late) / totalConductedSessions) * 100
   */
  public async getStudentAttendanceSummary(studentId: string): Promise<StudentAttendanceSummary> {
    const student = await User.findById(studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new NotFoundError('Student not found', 'ACADEMIC_NOT_FOUND');
    }

    // Find student enrollments to determine their active class sections
    const enrollments = await StudentEnrollment.find({
      studentId,
      isActive: true,
    }).select('classSectionId semesterId');

    if (enrollments.length === 0) {
      return {
        studentId,
        overall: {
          totalConductedSessions: 0,
          attendedSessions: 0,
          percentage: 0.0,
          isLowAttendance: false,
          threshold: ACADEMIC_CONFIG.LOW_ATTENDANCE_THRESHOLD,
        },
        courses: [],
      };
    }

    const sectionIds = enrollments.map((e) => e.classSectionId);

    // Find all attendance sessions conducted for these class sections
    const sessions = await AttendanceSession.find({
      classSectionId: { $in: sectionIds },
      status: SessionStatus.COMPLETED,
    }).select('_id courseId');

    const sessionIds = sessions.map((s) => s._id);

    // Aggregate attendance records for this student across those sessions
    const records = await AttendanceRecord.find({
      attendanceSessionId: { $in: sessionIds },
      studentId,
    });

    // Group sessions and records by course
    const courseMap = new Map<string, { totalSessions: number; records: typeof records }>();

    for (const session of sessions) {
      const courseIdStr = session.courseId.toString();
      if (!courseMap.has(courseIdStr)) {
        courseMap.set(courseIdStr, { totalSessions: 0, records: [] });
      }
      const entry = courseMap.get(courseIdStr)!;
      entry.totalSessions += 1;
    }

    // Map records to course entries
    const sessionToCourseMap = new Map<string, string>();
    for (const session of sessions) {
      sessionToCourseMap.set(session._id.toString(), session.courseId.toString());
    }

    for (const record of records) {
      const courseIdStr = sessionToCourseMap.get(record.attendanceSessionId.toString());
      if (courseIdStr && courseMap.has(courseIdStr)) {
        courseMap.get(courseIdStr)!.records.push(record);
      }
    }

    // Calculate per-course statistics
    const coursesSummary: CourseAttendanceSummary[] = [];
    let grandTotalSessions = 0;
    let grandPresentCount = 0;
    let grandLateCount = 0;

    for (const [courseIdStr, data] of courseMap.entries()) {
      const courseObj = await Course.findById(courseIdStr).select('code name');

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;

      for (const rec of data.records) {
        if (rec.status === AttendanceStatus.PRESENT) presentCount++;
        else if (rec.status === AttendanceStatus.LATE) lateCount++;
        else if (rec.status === AttendanceStatus.ABSENT) absentCount++;
        else if (rec.status === AttendanceStatus.EXCUSED) excusedCount++;
      }

      const totalConducted = data.totalSessions;
      const { percentage, isLowAttendance, attendedSessions } = calculateAttendancePercentage(
        presentCount,
        lateCount,
        totalConducted,
      );

      grandTotalSessions += totalConducted;
      grandPresentCount += presentCount;
      grandLateCount += lateCount;

      coursesSummary.push({
        courseId: courseIdStr,
        courseCode: courseObj?.code || '',
        courseName: courseObj?.name || '',
        totalConductedSessions: totalConducted,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        attendedSessions,
        percentage,
        isLowAttendance,
        threshold: ACADEMIC_CONFIG.LOW_ATTENDANCE_THRESHOLD,
      });
    }

    const overallCalc = calculateAttendancePercentage(
      grandPresentCount,
      grandLateCount,
      grandTotalSessions,
    );

    return {
      studentId,
      overall: {
        totalConductedSessions: grandTotalSessions,
        attendedSessions: overallCalc.attendedSessions,
        percentage: overallCalc.percentage,
        isLowAttendance: overallCalc.isLowAttendance,
        threshold: ACADEMIC_CONFIG.LOW_ATTENDANCE_THRESHOLD,
      },
      courses: coursesSummary,
    };
  }

  /**
   * Retrieves student attendance specifically for a single course.
   */
  public async getStudentCourseAttendance(studentId: string, courseId: string) {
    const fullSummary = await this.getStudentAttendanceSummary(studentId);
    const courseSummary = fullSummary.courses.find((c) => c.courseId === courseId);

    if (!courseSummary) {
      throw new NotFoundError(
        'No attendance data found for the specified student and course',
        'ACADEMIC_NOT_FOUND',
      );
    }

    return courseSummary;
  }

  /**
   * Retrieves overall attendance overview for a course (Faculty / Admin view).
   */
  public async getCourseAttendanceOverview(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw new NotFoundError('Course not found', 'ACADEMIC_NOT_FOUND');

    const sessions = await AttendanceSession.find({
      courseId,
      status: SessionStatus.COMPLETED,
    });

    const totalSessions = sessions.length;
    const sessionIds = sessions.map((s) => s._id);

    const records = await AttendanceRecord.find({
      attendanceSessionId: { $in: sessionIds },
    });

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;

    for (const rec of records) {
      if (rec.status === AttendanceStatus.PRESENT) presentCount++;
      else if (rec.status === AttendanceStatus.LATE) lateCount++;
      else if (rec.status === AttendanceStatus.ABSENT) absentCount++;
      else if (rec.status === AttendanceStatus.EXCUSED) excusedCount++;
    }

    return {
      courseId,
      courseCode: course.code,
      courseName: course.name,
      totalConductedSessions: totalSessions,
      totalRecordsMarked: records.length,
      presentCount,
      lateCount,
      absentCount,
      excusedCount,
      threshold: ACADEMIC_CONFIG.LOW_ATTENDANCE_THRESHOLD,
    };
  }

  /**
   * Performs an attendance record correction while preserving a complete audit trail.
   */
  public async correctAttendanceRecord(
    recordId: string,
    newStatus: AttendanceStatus,
    reason: string,
    changedByUserId: string,
  ) {
    const record = await AttendanceRecord.findById(recordId);
    if (!record) {
      throw new NotFoundError('Attendance record not found', 'ATTENDANCE_RECORD_NOT_FOUND');
    }

    const session = await AttendanceSession.findById(record.attendanceSessionId);
    if (!session) {
      throw new NotFoundError(
        'Associated attendance session not found',
        'ATTENDANCE_SESSION_NOT_FOUND',
      );
    }

    // Verify authorized user (must be assigned faculty or admin)
    const changingUser = await User.findById(changedByUserId);
    if (
      changingUser?.role !== UserRole.ADMINISTRATOR &&
      session.facultyId.toString() !== changedByUserId
    ) {
      throw new ForbiddenError(
        'Only the assigned faculty member or an administrator can correct attendance records',
        'ATTENDANCE_CORRECTION_INVALID',
      );
    }

    const previousStatus = record.status;

    if (previousStatus === newStatus) {
      return record; // No status change required
    }

    // Update attendance record
    record.status = newStatus;
    record.markedBy = Types.Types.ObjectId.createFromHexString(changedByUserId);
    record.markedAt = new Date();
    await record.save();

    // Create Audit Log entry
    await AttendanceAudit.create({
      attendanceRecordId: record._id,
      studentId: record.studentId,
      attendanceSessionId: record.attendanceSessionId,
      previousStatus,
      newStatus,
      changedBy: changedByUserId,
      reason: reason.trim(),
      changedAt: new Date(),
    });

    return record;
  }

  /**
   * Retrieves complete audit log history for an attendance record.
   */
  public async getAttendanceAuditLogs(recordId: string) {
    const record = await AttendanceRecord.findById(recordId);
    if (!record) {
      throw new NotFoundError('Attendance record not found', 'ATTENDANCE_RECORD_NOT_FOUND');
    }

    const auditLogs = await AttendanceAudit.find({ attendanceRecordId: recordId })
      .populate('changedBy', 'name email role')
      .populate('studentId', 'name email')
      .sort({ changedAt: -1 });

    return auditLogs;
  }
}

export const attendanceService = new AttendanceService();
