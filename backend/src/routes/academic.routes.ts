import { Router } from 'express';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  createAcademicYear,
  getAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  createSemester,
  getSemesters,
  getSemesterById,
  updateSemester,
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  createClassSection,
  getClassSections,
  getClassSectionById,
  updateClassSection,
  createFacultyAssignment,
  getFacultyAssignments,
  createStudentEnrollment,
  getStudentEnrollments,
  createAttendanceSession,
  markSessionAttendance,
  getStudentAttendanceSummary,
  getStudentCourseAttendance,
  getCourseAttendanceOverview,
  correctAttendanceRecord,
  getAttendanceAuditLogs,
} from '../controllers/academic.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createProgramSchema,
  updateProgramSchema,
  createAcademicYearSchema,
  updateAcademicYearSchema,
  createSemesterSchema,
  updateSemesterSchema,
  createCourseSchema,
  updateCourseSchema,
  createClassSectionSchema,
  updateClassSectionSchema,
  createFacultyAssignmentSchema,
  createStudentEnrollmentSchema,
  createAttendanceSessionSchema,
  markAttendanceSchema,
  correctAttendanceSchema,
} from '../utils/academic.schemas.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Master Data Management (Admin Privileges Required for Mutating)
const adminOnly = [authenticate, authorize(UserRole.ADMINISTRATOR)];
const academicRead = [
  authenticate,
  authorize(UserRole.ADMINISTRATOR, UserRole.FACULTY, UserRole.STUDENT),
];

// --- Departments ---
router.post('/departments', adminOnly, validate(createDepartmentSchema), createDepartment);
router.get('/departments', academicRead, getDepartments);
router.get('/departments/:id', academicRead, getDepartmentById);
router.patch('/departments/:id', adminOnly, validate(updateDepartmentSchema), updateDepartment);

// --- Programs ---
router.post('/programs', adminOnly, validate(createProgramSchema), createProgram);
router.get('/programs', academicRead, getPrograms);
router.get('/programs/:id', academicRead, getProgramById);
router.patch('/programs/:id', adminOnly, validate(updateProgramSchema), updateProgram);

// --- Academic Years ---
router.post('/years', adminOnly, validate(createAcademicYearSchema), createAcademicYear);
router.get('/years', academicRead, getAcademicYears);
router.get('/years/:id', academicRead, getAcademicYearById);
router.patch('/years/:id', adminOnly, validate(updateAcademicYearSchema), updateAcademicYear);

// --- Semesters ---
router.post('/semesters', adminOnly, validate(createSemesterSchema), createSemester);
router.get('/semesters', academicRead, getSemesters);
router.get('/semesters/:id', academicRead, getSemesterById);
router.patch('/semesters/:id', adminOnly, validate(updateSemesterSchema), updateSemester);

// --- Courses ---
router.post('/courses', adminOnly, validate(createCourseSchema), createCourse);
router.get('/courses', academicRead, getCourses);
router.get('/courses/:id', academicRead, getCourseById);
router.patch('/courses/:id', adminOnly, validate(updateCourseSchema), updateCourse);

// --- Class Sections ---
router.post('/sections', adminOnly, validate(createClassSectionSchema), createClassSection);
router.get('/sections', academicRead, getClassSections);
router.get('/sections/:id', academicRead, getClassSectionById);
router.patch('/sections/:id', adminOnly, validate(updateClassSectionSchema), updateClassSection);

// --- Faculty Assignments ---
router.post(
  '/assignments',
  adminOnly,
  validate(createFacultyAssignmentSchema),
  createFacultyAssignment,
);
router.get('/assignments', academicRead, getFacultyAssignments);

// --- Student Enrollments ---
router.post(
  '/enrollments',
  adminOnly,
  validate(createStudentEnrollmentSchema),
  createStudentEnrollment,
);
router.get('/enrollments', academicRead, getStudentEnrollments);

// --- Attendance Routes ---
const facultyOrAdmin = [authenticate, authorize(UserRole.FACULTY, UserRole.ADMINISTRATOR)];

router.post(
  '/attendance/sessions',
  facultyOrAdmin,
  validate(createAttendanceSessionSchema),
  createAttendanceSession,
);

router.post(
  '/attendance/sessions/:sessionId/records',
  facultyOrAdmin,
  validate(markAttendanceSchema),
  markSessionAttendance,
);

router.get('/attendance/student/:studentId', academicRead, getStudentAttendanceSummary);

router.get(
  '/attendance/student/:studentId/course/:courseId',
  academicRead,
  getStudentCourseAttendance,
);

router.get('/attendance/course/:courseId', facultyOrAdmin, getCourseAttendanceOverview);

router.patch(
  '/attendance/records/:recordId',
  facultyOrAdmin,
  validate(correctAttendanceSchema),
  correctAttendanceRecord,
);

router.get('/attendance/records/:recordId/audit', facultyOrAdmin, getAttendanceAuditLogs);

export default router;
