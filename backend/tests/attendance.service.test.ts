import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { attendanceService } from '../src/modules/academic/services/attendance.service.js';
import { calculateAttendancePercentage } from '../src/config/academic.config.js';
import { User } from '../src/modules/auth/models/user.model.js';
import { Department } from '../src/modules/academic/models/department.model.js';
import { Program } from '../src/modules/academic/models/program.model.js';
import { AcademicYear } from '../src/modules/academic/models/academicYear.model.js';
import { Semester } from '../src/modules/academic/models/semester.model.js';
import { Course } from '../src/modules/academic/models/course.model.js';
import { ClassSection } from '../src/modules/academic/models/classSection.model.js';
import { FacultyAssignment } from '../src/modules/academic/models/facultyAssignment.model.js';
import { StudentEnrollment } from '../src/modules/academic/models/studentEnrollment.model.js';
import { AttendanceSession } from '../src/modules/academic/models/attendanceSession.model.js';
import { AttendanceRecord } from '../src/modules/academic/models/attendanceRecord.model.js';
import { AttendanceAudit } from '../src/modules/academic/models/attendanceAudit.model.js';
import { UserRole, AttendanceStatus, ForbiddenError, BadRequestError } from '../src/types/index.js';

describe('Attendance Calculation Formula & Service', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_attendance_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Department.deleteMany({});
    await Program.deleteMany({});
    await AcademicYear.deleteMany({});
    await Semester.deleteMany({});
    await Course.deleteMany({});
    await ClassSection.deleteMany({});
    await FacultyAssignment.deleteMany({});
    await StudentEnrollment.deleteMany({});
    await AttendanceSession.deleteMany({});
    await AttendanceRecord.deleteMany({});
    await AttendanceAudit.deleteMany({});
  });

  describe('Attendance Calculation Formula', () => {
    it('should calculate attendance percentage using present + late as attended', () => {
      // 20 conducted sessions: 14 present, 2 late, 3 absent, 1 excused
      // attended = 14 + 2 = 16
      // percentage = 16 / 20 * 100 = 80.00%
      const result = calculateAttendancePercentage(14, 2, 20);

      expect(result.attendedSessions).toBe(16);
      expect(result.percentage).toBe(80.0);
      expect(result.isLowAttendance).toBe(false); // 80% >= 75%
    });

    it('should identify low attendance when percentage is below 75%', () => {
      // 20 conducted sessions: 12 present, 2 late, 6 absent
      // attended = 14
      // percentage = 14 / 20 * 100 = 70.00%
      const result = calculateAttendancePercentage(12, 2, 20);

      expect(result.attendedSessions).toBe(14);
      expect(result.percentage).toBe(70.0);
      expect(result.isLowAttendance).toBe(true); // 70% < 75%
    });

    it('should handle zero conducted sessions safely without divide-by-zero errors', () => {
      const result = calculateAttendancePercentage(0, 0, 0);

      expect(result.attendedSessions).toBe(0);
      expect(result.percentage).toBe(0.0);
      expect(result.isLowAttendance).toBe(false);
    });
  });

  describe('Attendance Session & Marking Workflow', () => {
    it('should prevent unassigned faculty from creating an attendance session', async () => {
      const faculty = await User.create({
        name: 'Faculty Unassigned',
        email: 'fac.unassigned@example.com',
        passwordHash: 'hash',
        role: UserRole.FACULTY,
      });

      const fakeCourseId = new mongoose.Types.ObjectId().toString();
      const fakeSectionId = new mongoose.Types.ObjectId().toString();

      await expect(
        attendanceService.createSession({
          courseId: fakeCourseId,
          classSectionId: fakeSectionId,
          facultyId: faculty._id.toString(),
          date: new Date(),
          startTime: '09:00',
          endTime: '10:00',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow assigned faculty to create session and mark attendance for enrolled student', async () => {
      const faculty = await User.create({
        name: 'Faculty Assigned',
        email: 'fac.assigned@example.com',
        passwordHash: 'hash',
        role: UserRole.FACULTY,
      });

      const student = await User.create({
        name: 'Student Enrolled',
        email: 'student.enrolled@example.com',
        passwordHash: 'hash',
        role: UserRole.STUDENT,
      });

      const dept = await Department.create({ name: 'CS', code: 'CS' });
      const prog = await Program.create({
        name: 'BTech CS',
        code: 'BTCS',
        departmentId: dept._id,
        durationYears: 4,
      });
      const year = await AcademicYear.create({
        name: '2026-27',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2027-05-31'),
      });
      const sem = await Semester.create({
        academicYearId: year._id,
        number: 1,
        name: 'Fall 2026',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-12-20'),
      });
      const course = await Course.create({
        code: 'CS101',
        name: 'Intro CS',
        credits: 4,
        semesterId: sem._id,
        programId: prog._id,
      });
      const section = await ClassSection.create({
        name: 'SEC-A',
        programId: prog._id,
        academicYearId: year._id,
        semesterId: sem._id,
      });

      await FacultyAssignment.create({
        facultyId: faculty._id,
        courseId: course._id,
        classSectionId: section._id,
        academicYearId: year._id,
        semesterId: sem._id,
      });

      await StudentEnrollment.create({
        studentId: student._id,
        classSectionId: section._id,
        academicYearId: year._id,
        semesterId: sem._id,
        rollNumber: 'ROLL-001',
      });

      // 1. Create session
      const session = await attendanceService.createSession({
        courseId: course._id.toString(),
        classSectionId: section._id.toString(),
        facultyId: faculty._id.toString(),
        date: new Date('2026-09-01'),
        startTime: '09:00',
        endTime: '10:00',
        topic: 'Introduction',
      });

      expect(session._id).toBeDefined();

      // 2. Mark attendance
      const records = await attendanceService.markSessionAttendance(
        session._id.toString(),
        faculty._id.toString(),
        [{ studentId: student._id.toString(), status: AttendanceStatus.PRESENT }],
      );

      expect(records).toHaveLength(1);
      expect(records[0]?.status).toBe(AttendanceStatus.PRESENT);

      // 3. Get Student Summary
      const summary = await attendanceService.getStudentAttendanceSummary(student._id.toString());
      expect(summary.overall.totalConductedSessions).toBe(1);
      expect(summary.overall.attendedSessions).toBe(1);
      expect(summary.overall.percentage).toBe(100.0);
    });

    it('should reject marking attendance for student not enrolled in the class section', async () => {
      const faculty = await User.create({
        name: 'Faculty Member',
        email: 'fac2@example.com',
        passwordHash: 'hash',
        role: UserRole.FACULTY,
      });

      const unenrolledStudent = await User.create({
        name: 'Unenrolled Student',
        email: 'student.unenrolled@example.com',
        passwordHash: 'hash',
        role: UserRole.STUDENT,
      });

      const dept = await Department.create({ name: 'CS2', code: 'CS2' });
      const prog = await Program.create({
        name: 'BTCS2',
        code: 'BTCS2',
        departmentId: dept._id,
        durationYears: 4,
      });
      const year = await AcademicYear.create({
        name: '2026-27-2',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2027-05-31'),
      });
      const sem = await Semester.create({
        academicYearId: year._id,
        number: 1,
        name: 'Fall 2026 2',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-12-20'),
      });
      const course = await Course.create({
        code: 'CS102',
        name: 'Intro CS 2',
        credits: 4,
        semesterId: sem._id,
        programId: prog._id,
      });
      const section = await ClassSection.create({
        name: 'SEC-B',
        programId: prog._id,
        academicYearId: year._id,
        semesterId: sem._id,
      });

      await FacultyAssignment.create({
        facultyId: faculty._id,
        courseId: course._id,
        classSectionId: section._id,
        academicYearId: year._id,
        semesterId: sem._id,
      });

      const session = await attendanceService.createSession({
        courseId: course._id.toString(),
        classSectionId: section._id.toString(),
        facultyId: faculty._id.toString(),
        date: new Date(),
        startTime: '10:00',
        endTime: '11:00',
      });

      await expect(
        attendanceService.markSessionAttendance(session._id.toString(), faculty._id.toString(), [
          { studentId: unenrolledStudent._id.toString(), status: AttendanceStatus.PRESENT },
        ]),
      ).rejects.toThrow(BadRequestError);
    });

    it('should correct attendance record and preserve audit trail log', async () => {
      const faculty = await User.create({
        name: 'Faculty Correct',
        email: 'fac.correct@example.com',
        passwordHash: 'hash',
        role: UserRole.FACULTY,
      });

      const student = await User.create({
        name: 'Student Audit',
        email: 'student.audit@example.com',
        passwordHash: 'hash',
        role: UserRole.STUDENT,
      });

      const dept = await Department.create({ name: 'CS3', code: 'CS3' });
      const prog = await Program.create({
        name: 'BTCS3',
        code: 'BTCS3',
        departmentId: dept._id,
        durationYears: 4,
      });
      const year = await AcademicYear.create({
        name: '2026-27-3',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2027-05-31'),
      });
      const sem = await Semester.create({
        academicYearId: year._id,
        number: 1,
        name: 'Fall 2026 3',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-12-20'),
      });
      const course = await Course.create({
        code: 'CS103',
        name: 'Intro CS 3',
        credits: 4,
        semesterId: sem._id,
        programId: prog._id,
      });
      const section = await ClassSection.create({
        name: 'SEC-C',
        programId: prog._id,
        academicYearId: year._id,
        semesterId: sem._id,
      });

      await FacultyAssignment.create({
        facultyId: faculty._id,
        courseId: course._id,
        classSectionId: section._id,
        academicYearId: year._id,
        semesterId: sem._id,
      });

      await StudentEnrollment.create({
        studentId: student._id,
        classSectionId: section._id,
        academicYearId: year._id,
        semesterId: sem._id,
        rollNumber: 'ROLL-003',
      });

      const session = await attendanceService.createSession({
        courseId: course._id.toString(),
        classSectionId: section._id.toString(),
        facultyId: faculty._id.toString(),
        date: new Date(),
        startTime: '09:00',
        endTime: '10:00',
      });

      const [record] = await attendanceService.markSessionAttendance(
        session._id.toString(),
        faculty._id.toString(),
        [{ studentId: student._id.toString(), status: AttendanceStatus.ABSENT }],
      );

      // Perform correction from ABSENT to PRESENT
      const correctedRecord = await attendanceService.correctAttendanceRecord(
        record!._id.toString(),
        AttendanceStatus.PRESENT,
        'Student arrived late with valid medical note',
        faculty._id.toString(),
      );

      expect(correctedRecord.status).toBe(AttendanceStatus.PRESENT);

      // Retrieve Audit Trail
      const auditLogs = await attendanceService.getAttendanceAuditLogs(record!._id.toString());
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0]?.previousStatus).toBe(AttendanceStatus.ABSENT);
      expect(auditLogs[0]?.newStatus).toBe(AttendanceStatus.PRESENT);
      expect(auditLogs[0]?.reason).toBe('Student arrived late with valid medical note');
    });
  });
});
