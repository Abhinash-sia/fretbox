import { Request, Response, NextFunction } from 'express';
import { academicService } from '../services/academic.service.js';
import { attendanceService } from '../services/attendance.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { UserRole, ForbiddenError, UnauthorizedError } from '../../../types/index.js';

// Helper to parse pagination params safely
const parsePagination = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { page, limit };
};

// --- Departments ---
export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = await academicService.createDepartment(req.body);
    sendSuccess(res, dept, 201, 'Department created successfully');
  } catch (err) {
    next(err);
  }
};

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const result = await academicService.getDepartments(page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = await academicService.getDepartmentById(req.params.id!);
    sendSuccess(res, dept, 200);
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = await academicService.updateDepartment(req.params.id!, req.body);
    sendSuccess(res, dept, 200, 'Department updated successfully');
  } catch (err) {
    next(err);
  }
};

// --- Programs ---
export const createProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const program = await academicService.createProgram(req.body);
    sendSuccess(res, program, 201, 'Program created successfully');
  } catch (err) {
    next(err);
  }
};

export const getPrograms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const departmentId = req.query.departmentId as string | undefined;
    const result = await academicService.getPrograms(departmentId, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getProgramById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const program = await academicService.getProgramById(req.params.id!);
    sendSuccess(res, program, 200);
  } catch (err) {
    next(err);
  }
};

export const updateProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const program = await academicService.updateProgram(req.params.id!, req.body);
    sendSuccess(res, program, 200, 'Program updated successfully');
  } catch (err) {
    next(err);
  }
};

// --- Academic Years ---
export const createAcademicYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = await academicService.createAcademicYear(req.body);
    sendSuccess(res, year, 201, 'Academic year created successfully');
  } catch (err) {
    next(err);
  }
};

export const getAcademicYears = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const result = await academicService.getAcademicYears(page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getAcademicYearById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = await academicService.getAcademicYearById(req.params.id!);
    sendSuccess(res, year, 200);
  } catch (err) {
    next(err);
  }
};

export const updateAcademicYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = await academicService.updateAcademicYear(req.params.id!, req.body);
    sendSuccess(res, year, 200, 'Academic year updated successfully');
  } catch (err) {
    next(err);
  }
};

// --- Semesters ---
export const createSemester = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sem = await academicService.createSemester(req.body);
    sendSuccess(res, sem, 201, 'Semester created successfully');
  } catch (err) {
    next(err);
  }
};

export const getSemesters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const academicYearId = req.query.academicYearId as string | undefined;
    const result = await academicService.getSemesters(academicYearId, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getSemesterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sem = await academicService.getSemesterById(req.params.id!);
    sendSuccess(res, sem, 200);
  } catch (err) {
    next(err);
  }
};

export const updateSemester = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sem = await academicService.updateSemester(req.params.id!, req.body);
    sendSuccess(res, sem, 200, 'Semester updated successfully');
  } catch (err) {
    next(err);
  }
};

// --- Courses ---
export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await academicService.createCourse(req.body);
    sendSuccess(res, course, 201, 'Course created successfully');
  } catch (err) {
    next(err);
  }
};

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const programId = req.query.programId as string | undefined;
    const semesterId = req.query.semesterId as string | undefined;
    const result = await academicService.getCourses(programId, semesterId, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await academicService.getCourseById(req.params.id!);
    sendSuccess(res, course, 200);
  } catch (err) {
    next(err);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await academicService.updateCourse(req.params.id!, req.body);
    sendSuccess(res, course, 200, 'Course updated successfully');
  } catch (err) {
    next(err);
  }
};

// --- Class Sections ---
export const createClassSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sec = await academicService.createClassSection(req.body);
    sendSuccess(res, sec, 201, 'Class section created successfully');
  } catch (err) {
    next(err);
  }
};

export const getClassSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const programId = req.query.programId as string | undefined;
    const semesterId = req.query.semesterId as string | undefined;
    const result = await academicService.getClassSections(programId, semesterId, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getClassSectionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sec = await academicService.getClassSectionById(req.params.id!);
    sendSuccess(res, sec, 200);
  } catch (err) {
    next(err);
  }
};

export const updateClassSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sec = await academicService.updateClassSection(req.params.id!, req.body);
    sendSuccess(res, sec, 200, 'Class section updated successfully');
  } catch (err) {
    next(err);
  }
};

// --- Faculty Assignments ---
export const createFacultyAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await academicService.createFacultyAssignment(req.body);
    sendSuccess(res, assignment, 201, 'Faculty assigned successfully');
  } catch (err) {
    next(err);
  }
};

export const getFacultyAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const facultyId = req.query.facultyId as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    const result = await academicService.getFacultyAssignments(facultyId, courseId, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

// --- Student Enrollments ---
export const createStudentEnrollment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollment = await academicService.createStudentEnrollment(req.body);
    sendSuccess(res, enrollment, 201, 'Student enrolled successfully');
  } catch (err) {
    next(err);
  }
};

export const getStudentEnrollments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const studentId = req.query.studentId as string | undefined;
    const classSectionId = req.query.classSectionId as string | undefined;
    const result = await academicService.getStudentEnrollments(
      studentId,
      classSectionId,
      page,
      limit,
    );
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

// --- Attendance Handlers ---
export const createAttendanceSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const session = await attendanceService.createSession({
      ...req.body,
      facultyId: req.user.id,
    });
    sendSuccess(res, session, 201, 'Attendance session created successfully');
  } catch (err) {
    next(err);
  }
};

export const markSessionAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const records = await attendanceService.markSessionAttendance(
      req.params.sessionId!,
      req.user.id,
      req.body.records,
    );
    sendSuccess(res, records, 201, 'Attendance marked successfully');
  } catch (err) {
    next(err);
  }
};

export const getStudentAttendanceSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const requestedStudentId = req.params.studentId!;

    // Self-ownership check: Students can ONLY view their own attendance summary
    if (req.user.role === UserRole.STUDENT && req.user.id !== requestedStudentId) {
      throw new ForbiddenError(
        'Students are not permitted to view attendance records of other students',
        'ACADEMIC_FORBIDDEN',
      );
    }

    const summary = await attendanceService.getStudentAttendanceSummary(requestedStudentId);
    sendSuccess(res, summary, 200);
  } catch (err) {
    next(err);
  }
};

export const getStudentCourseAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const requestedStudentId = req.params.studentId!;

    // Self-ownership check for students
    if (req.user.role === UserRole.STUDENT && req.user.id !== requestedStudentId) {
      throw new ForbiddenError(
        'Students are not permitted to view attendance records of other students',
        'ACADEMIC_FORBIDDEN',
      );
    }

    const summary = await attendanceService.getStudentCourseAttendance(
      requestedStudentId,
      req.params.courseId!,
    );
    sendSuccess(res, summary, 200);
  } catch (err) {
    next(err);
  }
};

export const getCourseAttendanceOverview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const summary = await attendanceService.getCourseAttendanceOverview(req.params.courseId!);
    sendSuccess(res, summary, 200);
  } catch (err) {
    next(err);
  }
};

export const correctAttendanceRecord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const record = await attendanceService.correctAttendanceRecord(
      req.params.recordId!,
      req.body.status,
      req.body.reason,
      req.user.id,
    );
    sendSuccess(res, record, 200, 'Attendance record corrected successfully');
  } catch (err) {
    next(err);
  }
};

export const getAttendanceAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await attendanceService.getAttendanceAuditLogs(req.params.recordId!);
    sendSuccess(res, logs, 200);
  } catch (err) {
    next(err);
  }
};
