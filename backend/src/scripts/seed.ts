import { getEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Department } from '../models/department.model.js';
import { Program } from '../models/program.model.js';
import { AcademicYear } from '../models/academicYear.model.js';
import { Semester } from '../models/semester.model.js';
import { Course } from '../models/course.model.js';
import { ClassSection } from '../models/classSection.model.js';
import { FacultyAssignment } from '../models/facultyAssignment.model.js';
import { StudentEnrollment } from '../models/studentEnrollment.model.js';
import { AttendanceSession } from '../models/attendanceSession.model.js';
import { AttendanceRecord } from '../models/attendanceRecord.model.js';
import { passwordService } from '../services/password.service.js';
import { UserRole, AttendanceStatus, SessionStatus } from '../types/index.js';
import { logger } from '../config/logger.js';

const seedUsers = [
  {
    name: 'Demo Student 1',
    email: 'student@fretbox.demo',
    password: 'Password123!',
    role: UserRole.STUDENT,
  },
  {
    name: 'Demo Student 2',
    email: 'student2@fretbox.demo',
    password: 'Password123!',
    role: UserRole.STUDENT,
  },
  {
    name: 'Demo Faculty',
    email: 'faculty@fretbox.demo',
    password: 'Password123!',
    role: UserRole.FACULTY,
  },
  {
    name: 'Demo Security',
    email: 'security@fretbox.demo',
    password: 'Password123!',
    role: UserRole.SECURITY,
  },
  {
    name: 'Demo Warden',
    email: 'warden@fretbox.demo',
    password: 'Password123!',
    role: UserRole.WARDEN,
  },
  {
    name: 'Demo Staff',
    email: 'staff@fretbox.demo',
    password: 'Password123!',
    role: UserRole.STAFF,
  },
  {
    name: 'Demo Admin',
    email: 'admin@fretbox.demo',
    password: 'Password123!',
    role: UserRole.ADMINISTRATOR,
  },
];

async function seed() {
  logger.info('Starting manual development seed script (B1 Auth + B2 Academic/Attendance)...');
  const env = getEnv();

  try {
    await connectDB(env.MONGODB_URI);

    // 1. Seed Users
    const userMap = new Map<string, string>();
    for (const userData of seedUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        const passwordHash = await passwordService.hashPassword(userData.password);
        user = await User.create({
          name: userData.name,
          email: userData.email,
          passwordHash,
          role: userData.role,
          isActive: true,
        });
        logger.info({ email: userData.email, role: userData.role }, 'Seeded test account');
      }
      userMap.set(userData.email, user._id.toString());
    }

    const facultyId = userMap.get('faculty@fretbox.demo')!;
    const student1Id = userMap.get('student@fretbox.demo')!;
    const student2Id = userMap.get('student2@fretbox.demo')!;

    // 2. Department
    let dept = await Department.findOne({ code: 'CSE' });
    if (!dept) {
      dept = await Department.create({
        name: 'Computer Science and Engineering',
        code: 'CSE',
        isActive: true,
      });
      logger.info('Seeded Department: CSE');
    }

    // 3. Program
    let program = await Program.findOne({ code: 'BTECH-CSE' });
    if (!program) {
      program = await Program.create({
        name: 'B.Tech Computer Science and Engineering',
        code: 'BTECH-CSE',
        departmentId: dept._id,
        durationYears: 4,
        isActive: true,
      });
      logger.info('Seeded Program: BTECH-CSE');
    }

    // 4. Academic Year
    let acadYear = await AcademicYear.findOne({ name: '2026-27' });
    if (!acadYear) {
      acadYear = await AcademicYear.create({
        name: '2026-27',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      });
      logger.info('Seeded Academic Year: 2026-27');
    }

    // 5. Semester
    let semester = await Semester.findOne({ academicYearId: acadYear._id, number: 1 });
    if (!semester) {
      semester = await Semester.create({
        academicYearId: acadYear._id,
        number: 1,
        name: 'Fall 2026 Semester 1',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-12-20'),
        isCurrent: true,
      });
      logger.info('Seeded Semester: Fall 2026 Semester 1');
    }

    // 6. Courses
    let course1 = await Course.findOne({ code: 'CS101', programId: program._id });
    if (!course1) {
      course1 = await Course.create({
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 4,
        semesterId: semester._id,
        programId: program._id,
        isActive: true,
      });
      logger.info('Seeded Course: CS101');
    }

    let course2 = await Course.findOne({ code: 'CS301', programId: program._id });
    if (!course2) {
      course2 = await Course.create({
        code: 'CS301',
        name: 'Database Management Systems',
        credits: 4,
        semesterId: semester._id,
        programId: program._id,
        isActive: true,
      });
      logger.info('Seeded Course: CS301');
    }

    // 7. Class Section
    let section = await ClassSection.findOne({ name: 'CSE-A', semesterId: semester._id });
    if (!section) {
      section = await ClassSection.create({
        name: 'CSE-A',
        programId: program._id,
        academicYearId: acadYear._id,
        semesterId: semester._id,
        isActive: true,
      });
      logger.info('Seeded Class Section: CSE-A');
    }

    // 8. Faculty Assignments
    let assignment1 = await FacultyAssignment.findOne({
      facultyId,
      courseId: course1._id,
      classSectionId: section._id,
    });
    if (!assignment1) {
      await FacultyAssignment.create({
        facultyId,
        courseId: course1._id,
        classSectionId: section._id,
        academicYearId: acadYear._id,
        semesterId: semester._id,
        isActive: true,
      });
      logger.info('Seeded Faculty Assignment: Demo Faculty -> CS101 (CSE-A)');
    }

    let assignment2 = await FacultyAssignment.findOne({
      facultyId,
      courseId: course2._id,
      classSectionId: section._id,
    });
    if (!assignment2) {
      await FacultyAssignment.create({
        facultyId,
        courseId: course2._id,
        classSectionId: section._id,
        academicYearId: acadYear._id,
        semesterId: semester._id,
        isActive: true,
      });
      logger.info('Seeded Faculty Assignment: Demo Faculty -> CS301 (CSE-A)');
    }

    // 9. Student Enrollments
    let enrollment1 = await StudentEnrollment.findOne({
      studentId: student1Id,
      semesterId: semester._id,
    });
    if (!enrollment1) {
      await StudentEnrollment.create({
        studentId: student1Id,
        classSectionId: section._id,
        academicYearId: acadYear._id,
        semesterId: semester._id,
        rollNumber: '2026-CSE-001',
        isActive: true,
      });
      logger.info('Seeded Student Enrollment: Demo Student 1 -> CSE-A');
    }

    let enrollment2 = await StudentEnrollment.findOne({
      studentId: student2Id,
      semesterId: semester._id,
    });
    if (!enrollment2) {
      await StudentEnrollment.create({
        studentId: student2Id,
        classSectionId: section._id,
        academicYearId: acadYear._id,
        semesterId: semester._id,
        rollNumber: '2026-CSE-002',
        isActive: true,
      });
      logger.info('Seeded Student Enrollment: Demo Student 2 -> CSE-A');
    }

    // 10. Sample Attendance Sessions & Records for CS301
    const existingSessions = await AttendanceSession.countDocuments({
      courseId: course2._id,
      classSectionId: section._id,
    });

    if (existingSessions === 0) {
      // Session 1: Both Present
      const sess1 = await AttendanceSession.create({
        courseId: course2._id,
        classSectionId: section._id,
        facultyId,
        date: new Date('2026-09-01'),
        startTime: '09:00',
        endTime: '10:00',
        sessionNumber: 1,
        topic: 'Introduction to Relational Databases',
        status: SessionStatus.COMPLETED,
      });

      await AttendanceRecord.create([
        {
          attendanceSessionId: sess1._id,
          studentId: student1Id,
          status: AttendanceStatus.PRESENT,
          markedBy: facultyId,
        },
        {
          attendanceSessionId: sess1._id,
          studentId: student2Id,
          status: AttendanceStatus.PRESENT,
          markedBy: facultyId,
        },
      ]);

      // Session 2: Student 1 Late, Student 2 Present
      const sess2 = await AttendanceSession.create({
        courseId: course2._id,
        classSectionId: section._id,
        facultyId,
        date: new Date('2026-09-03'),
        startTime: '09:00',
        endTime: '10:00',
        sessionNumber: 2,
        topic: 'ER Modeling and Normalization',
        status: SessionStatus.COMPLETED,
      });

      await AttendanceRecord.create([
        {
          attendanceSessionId: sess2._id,
          studentId: student1Id,
          status: AttendanceStatus.LATE,
          markedBy: facultyId,
        },
        {
          attendanceSessionId: sess2._id,
          studentId: student2Id,
          status: AttendanceStatus.PRESENT,
          markedBy: facultyId,
        },
      ]);

      // Session 3: Student 1 Absent, Student 2 Present
      const sess3 = await AttendanceSession.create({
        courseId: course2._id,
        classSectionId: section._id,
        facultyId,
        date: new Date('2026-09-05'),
        startTime: '09:00',
        endTime: '10:00',
        sessionNumber: 3,
        topic: 'SQL Queries and Joins',
        status: SessionStatus.COMPLETED,
      });

      await AttendanceRecord.create([
        {
          attendanceSessionId: sess3._id,
          studentId: student1Id,
          status: AttendanceStatus.ABSENT,
          markedBy: facultyId,
        },
        {
          attendanceSessionId: sess3._id,
          studentId: student2Id,
          status: AttendanceStatus.PRESENT,
          markedBy: facultyId,
        },
      ]);

      // Session 4: Student 1 Absent, Student 2 Excused
      const sess4 = await AttendanceSession.create({
        courseId: course2._id,
        classSectionId: section._id,
        facultyId,
        date: new Date('2026-09-08'),
        startTime: '09:00',
        endTime: '10:00',
        sessionNumber: 4,
        topic: 'Transactions and Indexing',
        status: SessionStatus.COMPLETED,
      });

      await AttendanceRecord.create([
        {
          attendanceSessionId: sess4._id,
          studentId: student1Id,
          status: AttendanceStatus.ABSENT,
          markedBy: facultyId,
        },
        {
          attendanceSessionId: sess4._id,
          studentId: student2Id,
          status: AttendanceStatus.EXCUSED,
          markedBy: facultyId,
        },
      ]);

      logger.info('Seeded 4 Attendance Sessions and Records for CS301');
    }

    logger.info('Academic and Attendance seed completed successfully.');
  } catch (error) {
    logger.error({ error }, 'Error running seed script');
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seed();
