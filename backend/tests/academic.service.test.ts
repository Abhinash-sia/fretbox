import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { academicService } from '../src/modules/academic/services/academic.service.js';
import { Department } from '../src/modules/academic/models/department.model.js';
import { Program } from '../src/modules/academic/models/program.model.js';
import { AcademicYear } from '../src/modules/academic/models/academicYear.model.js';
import { Semester } from '../src/modules/academic/models/semester.model.js';
import { Course } from '../src/modules/academic/models/course.model.js';
import { ConflictError, NotFoundError } from '../src/types/index.js';

describe('AcademicService Master Data CRUD', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_academic_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Department.deleteMany({});
    await Program.deleteMany({});
    await AcademicYear.deleteMany({});
    await Semester.deleteMany({});
    await Course.deleteMany({});
  });

  it('should create and retrieve a department', async () => {
    const dept = await academicService.createDepartment({
      name: 'Computer Science',
      code: 'CS',
    });

    expect(dept._id).toBeDefined();
    expect(dept.code).toBe('CS');

    const fetched = await academicService.getDepartmentById(dept._id.toString());
    expect(fetched.name).toBe('Computer Science');
  });

  it('should reject duplicate department creation', async () => {
    await academicService.createDepartment({ name: 'Computer Science', code: 'CS' });
    await expect(
      academicService.createDepartment({ name: 'CS Dept 2', code: 'CS' }),
    ).rejects.toThrow(ConflictError);
  });

  it('should throw NotFoundError for non-existent department ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(academicService.getDepartmentById(fakeId)).rejects.toThrow(NotFoundError);
  });

  it('should create program, academic year, semester, and course relationships', async () => {
    const dept = await academicService.createDepartment({ name: 'CS Dept', code: 'CS' });
    const prog = await academicService.createProgram({
      name: 'B.Tech CS',
      code: 'BTECH-CS',
      departmentId: dept._id.toString(),
      durationYears: 4,
    });
    const year = await academicService.createAcademicYear({
      name: '2026-27',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2027-05-31'),
    });
    const sem = await academicService.createSemester({
      academicYearId: year._id.toString(),
      number: 1,
      name: 'Fall 2026',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-20'),
    });

    const course = await academicService.createCourse({
      code: 'CS101',
      name: 'Intro to CS',
      credits: 4,
      semesterId: sem._id.toString(),
      programId: prog._id.toString(),
    });

    expect(course._id).toBeDefined();
    expect(course.code).toBe('CS101');
  });
});
