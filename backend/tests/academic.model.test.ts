import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Department } from '../src/models/department.model.js';
import { Program } from '../src/models/program.model.js';
import { AcademicYear } from '../src/models/academicYear.model.js';

describe('Academic Mongoose Models', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_academic_model' });
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
  });

  it('should create a department and enforce uppercase unique code', async () => {
    const dept = await Department.create({
      name: 'Electrical Engineering',
      code: 'EE',
    });

    expect(dept._id).toBeDefined();
    expect(dept.code).toBe('EE');
    expect(dept.isActive).toBe(true);

    await Department.syncIndexes();

    await expect(
      Department.create({
        name: 'Electrical Duplicate',
        code: 'EE',
      }),
    ).rejects.toThrow();
  });

  it('should create a program linked to a department', async () => {
    const dept = await Department.create({
      name: 'Mechanical Engineering',
      code: 'ME',
    });

    const prog = await Program.create({
      name: 'B.Tech Mechanical Engineering',
      code: 'BTECH-ME',
      departmentId: dept._id,
      durationYears: 4,
    });

    expect(prog._id).toBeDefined();
    expect(prog.departmentId.toString()).toBe(dept._id.toString());
  });

  it('should create an academic year with dates', async () => {
    const acadYear = await AcademicYear.create({
      name: '2026-27',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2027-05-31'),
    });

    expect(acadYear._id).toBeDefined();
    expect(acadYear.isCurrent).toBe(false);
  });
});
