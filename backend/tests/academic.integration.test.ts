import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Department } from '../src/models/department.model.js';
import { Program } from '../src/models/program.model.js';
import { AcademicYear } from '../src/models/academicYear.model.js';
import { Semester } from '../src/models/semester.model.js';
import { Course } from '../src/models/course.model.js';
import { ClassSection } from '../src/models/classSection.model.js';
import { FacultyAssignment } from '../src/models/facultyAssignment.model.js';
import { StudentEnrollment } from '../src/models/studentEnrollment.model.js';
import { AttendanceSession } from '../src/models/attendanceSession.model.js';
import { AttendanceRecord } from '../src/models/attendanceRecord.model.js';
import { AttendanceAudit } from '../src/models/attendanceAudit.model.js';
import { tokenService } from '../src/services/token.service.js';
import { UserRole, AttendanceStatus } from '../src/types/index.js';

describe('Academic & Attendance Integration Endpoints', () => {
  const app = createApp();

  let adminToken: string;
  let facultyToken: string;
  let student1Token: string;

  let adminId: string;
  let facultyId: string;
  let student1Id: string;
  let student2Id: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_academic_integration' });
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

    // Create Admin User
    const admin = await User.create({
      name: 'Admin Integration',
      email: 'admin.int@example.com',
      passwordHash: 'hash',
      role: UserRole.ADMINISTRATOR,
    });
    adminId = admin._id.toString();
    adminToken = tokenService.generateAccessToken(adminId, UserRole.ADMINISTRATOR);

    // Create Faculty User
    const faculty = await User.create({
      name: 'Faculty Integration',
      email: 'faculty.int@example.com',
      passwordHash: 'hash',
      role: UserRole.FACULTY,
    });
    facultyId = faculty._id.toString();
    facultyToken = tokenService.generateAccessToken(facultyId, UserRole.FACULTY);

    // Create Student 1 User
    const student1 = await User.create({
      name: 'Student One',
      email: 'student1.int@example.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });
    student1Id = student1._id.toString();
    student1Token = tokenService.generateAccessToken(student1Id, UserRole.STUDENT);

    // Create Student 2 User
    const student2 = await User.create({
      name: 'Student Two',
      email: 'student2.int@example.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });
    student2Id = student2._id.toString();
  });

  it('Admin creates department, program, academic year, semester, course, and section', async () => {
    // 1. Department
    const deptRes = await request(app)
      .post('/api/v1/academic/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Computer Science', code: 'CS' });
    expect(deptRes.status).toBe(201);
    const deptId = deptRes.body.data._id;

    // 2. Program
    const progRes = await request(app)
      .post('/api/v1/academic/programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'B.Tech CS', code: 'BTCS', departmentId: deptId, durationYears: 4 });
    expect(progRes.status).toBe(201);
    const progId = progRes.body.data._id;

    // 3. Academic Year
    const yearRes = await request(app)
      .post('/api/v1/academic/years')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '2026-27',
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2027-05-31T00:00:00.000Z',
      });
    expect(yearRes.status).toBe(201);
    const yearId = yearRes.body.data._id;

    // 4. Semester
    const semRes = await request(app)
      .post('/api/v1/academic/semesters')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicYearId: yearId,
        number: 1,
        name: 'Fall 2026',
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-12-20T00:00:00.000Z',
      });
    expect(semRes.status).toBe(201);
    const semId = semRes.body.data._id;

    // 5. Course
    const courseRes = await request(app)
      .post('/api/v1/academic/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'CS101',
        name: 'Intro to CS',
        credits: 4,
        semesterId: semId,
        programId: progId,
      });
    expect(courseRes.status).toBe(201);

    // 6. Class Section
    const secRes = await request(app)
      .post('/api/v1/academic/sections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'CSE-A',
        programId: progId,
        academicYearId: yearId,
        semesterId: semId,
      });
    expect(secRes.status).toBe(201);
  });

  it('Faculty marks attendance & Student retrieves attendance summary with self-ownership authorization', async () => {
    // Setup master data
    const dept = await Department.create({ name: 'CS', code: 'CS' });
    const prog = await Program.create({
      name: 'BTCS',
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

    // Assign faculty & Enroll student
    await FacultyAssignment.create({
      facultyId,
      courseId: course._id,
      classSectionId: section._id,
      academicYearId: year._id,
      semesterId: sem._id,
    });

    await StudentEnrollment.create({
      studentId: student1Id,
      classSectionId: section._id,
      academicYearId: year._id,
      semesterId: sem._id,
      rollNumber: 'ROLL-1',
    });

    // 1. Faculty creates attendance session
    const sessRes = await request(app)
      .post('/api/v1/academic/attendance/sessions')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        courseId: course._id.toString(),
        classSectionId: section._id.toString(),
        date: '2026-09-01T00:00:00.000Z',
        startTime: '09:00',
        endTime: '10:00',
        topic: 'Session 1',
      });
    expect(sessRes.status).toBe(201);
    const sessionId = sessRes.body.data._id;

    // 2. Faculty marks attendance
    const markRes = await request(app)
      .post(`/api/v1/academic/attendance/sessions/${sessionId}/records`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        records: [{ studentId: student1Id, status: AttendanceStatus.PRESENT }],
      });
    expect(markRes.status).toBe(201);
    const recordId = markRes.body.data[0]._id;

    // 3. Student 1 views OWN attendance summary -> 200 OK
    const ownSummaryRes = await request(app)
      .get(`/api/v1/academic/attendance/student/${student1Id}`)
      .set('Authorization', `Bearer ${student1Token}`);
    expect(ownSummaryRes.status).toBe(200);
    expect(ownSummaryRes.body.data.overall.percentage).toBe(100.0);

    // 4. Student 1 attempts to view Student 2 attendance summary -> 403 Forbidden
    const otherSummaryRes = await request(app)
      .get(`/api/v1/academic/attendance/student/${student2Id}`)
      .set('Authorization', `Bearer ${student1Token}`);
    expect(otherSummaryRes.status).toBe(403);
    expect(otherSummaryRes.body.error.code).toBe('ACADEMIC_FORBIDDEN');

    // 5. Faculty performs attendance correction
    const correctRes = await request(app)
      .patch(`/api/v1/academic/attendance/records/${recordId}`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        status: AttendanceStatus.ABSENT,
        reason: 'Marked present by mistake',
      });
    expect(correctRes.status).toBe(200);
    expect(correctRes.body.data.status).toBe(AttendanceStatus.ABSENT);

    // 6. Faculty checks audit trail log
    const auditRes = await request(app)
      .get(`/api/v1/academic/attendance/records/${recordId}/audit`)
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data).toHaveLength(1);
    expect(auditRes.body.data[0].previousStatus).toBe(AttendanceStatus.PRESENT);
    expect(auditRes.body.data[0].newStatus).toBe(AttendanceStatus.ABSENT);
  });
});
