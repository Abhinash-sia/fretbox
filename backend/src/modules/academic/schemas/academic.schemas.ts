import { z } from 'zod';
import { AttendanceStatus } from '../../../types/index.js';

const mongoIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const createDepartmentSchema = {
  body: z.object({
    name: z.string({ required_error: 'Department name is required' }).min(2),
    code: z.string({ required_error: 'Department code is required' }).min(2).max(10),
  }),
};

export const updateDepartmentSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(2).optional(),
    isActive: z.boolean().optional(),
  }),
};

export const createProgramSchema = {
  body: z.object({
    name: z.string({ required_error: 'Program name is required' }).min(2),
    code: z.string({ required_error: 'Program code is required' }).min(2).max(10),
    departmentId: mongoIdSchema,
    durationYears: z.number().int().positive(),
  }),
};

export const updateProgramSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(2).optional(),
    durationYears: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const createAcademicYearSchema = {
  body: z.object({
    name: z.string({ required_error: 'Academic year name is required' }).min(4),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
  }),
};

export const updateAcademicYearSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(4).optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    isCurrent: z.boolean().optional(),
  }),
};

export const createSemesterSchema = {
  body: z.object({
    academicYearId: mongoIdSchema,
    number: z.number().int().positive(),
    name: z.string({ required_error: 'Semester name is required' }),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()),
  }),
};

export const updateSemesterSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    isCurrent: z.boolean().optional(),
  }),
};

export const createCourseSchema = {
  body: z.object({
    code: z.string({ required_error: 'Course code is required' }).min(2).max(15),
    name: z.string({ required_error: 'Course name is required' }).min(2),
    credits: z.number().int().positive(),
    semesterId: mongoIdSchema,
    programId: mongoIdSchema,
  }),
};

export const updateCourseSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(2).optional(),
    credits: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const createClassSectionSchema = {
  body: z.object({
    name: z.string({ required_error: 'Class section name is required' }).min(1).max(20),
    programId: mongoIdSchema,
    academicYearId: mongoIdSchema,
    semesterId: mongoIdSchema,
  }),
};

export const updateClassSectionSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
};

export const createFacultyAssignmentSchema = {
  body: z.object({
    facultyId: mongoIdSchema,
    courseId: mongoIdSchema,
    classSectionId: mongoIdSchema,
    academicYearId: mongoIdSchema,
    semesterId: mongoIdSchema,
  }),
};

export const createStudentEnrollmentSchema = {
  body: z.object({
    studentId: mongoIdSchema,
    classSectionId: mongoIdSchema,
    academicYearId: mongoIdSchema,
    semesterId: mongoIdSchema,
    rollNumber: z.string({ required_error: 'Roll number is required' }).min(1),
  }),
};

export const createAttendanceSessionSchema = {
  body: z.object({
    courseId: mongoIdSchema,
    classSectionId: mongoIdSchema,
    date: z.string().or(z.date()),
    startTime: z.string({ required_error: 'Start time is required' }),
    endTime: z.string({ required_error: 'End time is required' }),
    sessionNumber: z.number().int().positive().optional(),
    topic: z.string().optional(),
  }),
};

export const markAttendanceSchema = {
  params: z.object({ sessionId: mongoIdSchema }),
  body: z.object({
    records: z
      .array(
        z.object({
          studentId: mongoIdSchema,
          status: z.nativeEnum(AttendanceStatus, {
            errorMap: () => ({ message: 'Invalid attendance status' }),
          }),
          remarks: z.string().optional(),
        }),
      )
      .min(1, 'At least one attendance record must be provided'),
  }),
};

export const correctAttendanceSchema = {
  params: z.object({ recordId: mongoIdSchema }),
  body: z.object({
    status: z.nativeEnum(AttendanceStatus, {
      errorMap: () => ({ message: 'Invalid attendance status' }),
    }),
    reason: z
      .string({ required_error: 'Correction reason is required' })
      .min(3, 'Reason must be at least 3 characters long'),
  }),
};
