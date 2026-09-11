import { Department } from '../models/department.model.js';
import { Program } from '../models/program.model.js';
import { AcademicYear } from '../models/academicYear.model.js';
import { Semester } from '../models/semester.model.js';
import { Course } from '../models/course.model.js';
import { ClassSection } from '../models/classSection.model.js';
import { FacultyAssignment } from '../models/facultyAssignment.model.js';
import { StudentEnrollment } from '../models/studentEnrollment.model.js';
import { User } from '../models/user.model.js';
import { UserRole, NotFoundError, ConflictError, BadRequestError } from '../types/index.js';

export class AcademicService {
  // --- Departments ---
  public async createDepartment(data: { name: string; code: string }) {
    const code = data.code.trim().toUpperCase();
    const existing = await Department.findOne({ code });
    if (existing) {
      throw new ConflictError(
        `Department with code '${code}' already exists`,
        'ACADEMIC_DUPLICATE',
      );
    }
    return Department.create({ name: data.name.trim(), code });
  }

  public async getDepartments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [departments, total] = await Promise.all([
      Department.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      Department.countDocuments(),
    ]);
    return { departments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getDepartmentById(id: string) {
    const department = await Department.findById(id);
    if (!department) {
      throw new NotFoundError('Department not found', 'ACADEMIC_NOT_FOUND');
    }
    return department;
  }

  public async updateDepartment(id: string, data: { name?: string; isActive?: boolean }) {
    const department = await this.getDepartmentById(id);
    if (data.name !== undefined) department.name = data.name.trim();
    if (data.isActive !== undefined) department.isActive = data.isActive;
    return department.save();
  }

  // --- Programs ---
  public async createProgram(data: {
    name: string;
    code: string;
    departmentId: string;
    durationYears: number;
  }) {
    await this.getDepartmentById(data.departmentId);
    const code = data.code.trim().toUpperCase();
    const existing = await Program.findOne({ code });
    if (existing) {
      throw new ConflictError(`Program with code '${code}' already exists`, 'ACADEMIC_DUPLICATE');
    }
    return Program.create({
      name: data.name.trim(),
      code,
      departmentId: data.departmentId,
      durationYears: data.durationYears,
    });
  }

  public async getPrograms(departmentId?: string, page = 1, limit = 20) {
    const query = departmentId ? { departmentId } : {};
    const skip = (page - 1) * limit;
    const [programs, total] = await Promise.all([
      Program.find(query).populate('departmentId', 'name code').skip(skip).limit(limit),
      Program.countDocuments(query),
    ]);
    return { programs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getProgramById(id: string) {
    const program = await Program.findById(id).populate('departmentId', 'name code');
    if (!program) {
      throw new NotFoundError('Program not found', 'ACADEMIC_NOT_FOUND');
    }
    return program;
  }

  public async updateProgram(
    id: string,
    data: { name?: string; durationYears?: number; isActive?: boolean },
  ) {
    const program = await Program.findById(id);
    if (!program) throw new NotFoundError('Program not found', 'ACADEMIC_NOT_FOUND');
    if (data.name !== undefined) program.name = data.name.trim();
    if (data.durationYears !== undefined) program.durationYears = data.durationYears;
    if (data.isActive !== undefined) program.isActive = data.isActive;
    return program.save();
  }

  // --- Academic Years ---
  public async createAcademicYear(data: { name: string; startDate: Date; endDate: Date }) {
    const name = data.name.trim();
    const existing = await AcademicYear.findOne({ name });
    if (existing) {
      throw new ConflictError(`Academic year '${name}' already exists`, 'ACADEMIC_DUPLICATE');
    }
    return AcademicYear.create({
      name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isCurrent: false,
    });
  }

  public async getAcademicYears(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [years, total] = await Promise.all([
      AcademicYear.find().skip(skip).limit(limit).sort({ startDate: -1 }),
      AcademicYear.countDocuments(),
    ]);
    return { years, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getAcademicYearById(id: string) {
    const year = await AcademicYear.findById(id);
    if (!year) throw new NotFoundError('Academic year not found', 'ACADEMIC_NOT_FOUND');
    return year;
  }

  public async updateAcademicYear(
    id: string,
    data: { name?: string; startDate?: Date; endDate?: Date; isCurrent?: boolean },
  ) {
    const year = await this.getAcademicYearById(id);
    if (data.name !== undefined) year.name = data.name.trim();
    if (data.startDate !== undefined) year.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) year.endDate = new Date(data.endDate);
    if (data.isCurrent !== undefined) {
      if (data.isCurrent) {
        await AcademicYear.updateMany({ _id: { $ne: id } }, { isCurrent: false });
      }
      year.isCurrent = data.isCurrent;
    }
    return year.save();
  }

  // --- Semesters ---
  public async createSemester(data: {
    academicYearId: string;
    number: number;
    name: string;
    startDate: Date;
    endDate: Date;
  }) {
    await this.getAcademicYearById(data.academicYearId);
    const existing = await Semester.findOne({
      academicYearId: data.academicYearId,
      number: data.number,
    });
    if (existing) {
      throw new ConflictError(
        `Semester ${data.number} already exists in this academic year`,
        'ACADEMIC_DUPLICATE',
      );
    }
    return Semester.create({
      academicYearId: data.academicYearId,
      number: data.number,
      name: data.name.trim(),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isCurrent: false,
    });
  }

  public async getSemesters(academicYearId?: string, page = 1, limit = 20) {
    const query = academicYearId ? { academicYearId } : {};
    const skip = (page - 1) * limit;
    const [semesters, total] = await Promise.all([
      Semester.find(query).populate('academicYearId', 'name').skip(skip).limit(limit),
      Semester.countDocuments(query),
    ]);
    return { semesters, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getSemesterById(id: string) {
    const semester = await Semester.findById(id).populate('academicYearId', 'name');
    if (!semester) throw new NotFoundError('Semester not found', 'ACADEMIC_NOT_FOUND');
    return semester;
  }

  public async updateSemester(
    id: string,
    data: { name?: string; startDate?: Date; endDate?: Date; isCurrent?: boolean },
  ) {
    const semester = await Semester.findById(id);
    if (!semester) throw new NotFoundError('Semester not found', 'ACADEMIC_NOT_FOUND');
    if (data.name !== undefined) semester.name = data.name.trim();
    if (data.startDate !== undefined) semester.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) semester.endDate = new Date(data.endDate);
    if (data.isCurrent !== undefined) {
      if (data.isCurrent) {
        await Semester.updateMany({ _id: { $ne: id } }, { isCurrent: false });
      }
      semester.isCurrent = data.isCurrent;
    }
    return semester.save();
  }

  // --- Courses ---
  public async createCourse(data: {
    code: string;
    name: string;
    credits: number;
    semesterId: string;
    programId: string;
  }) {
    await this.getProgramById(data.programId);
    await this.getSemesterById(data.semesterId);

    const code = data.code.trim().toUpperCase();
    const existing = await Course.findOne({ code, programId: data.programId });
    if (existing) {
      throw new ConflictError(
        `Course code '${code}' already exists in this program`,
        'ACADEMIC_DUPLICATE',
      );
    }
    return Course.create({
      code,
      name: data.name.trim(),
      credits: data.credits,
      semesterId: data.semesterId,
      programId: data.programId,
    });
  }

  public async getCourses(programId?: string, semesterId?: string, page = 1, limit = 20) {
    const query: Record<string, unknown> = {};
    if (programId) query.programId = programId;
    if (semesterId) query.semesterId = semesterId;
    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('programId', 'name code')
        .populate('semesterId', 'name number')
        .skip(skip)
        .limit(limit),
      Course.countDocuments(query),
    ]);
    return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getCourseById(id: string) {
    const course = await Course.findById(id)
      .populate('programId', 'name code')
      .populate('semesterId', 'name number');
    if (!course) throw new NotFoundError('Course not found', 'ACADEMIC_NOT_FOUND');
    return course;
  }

  public async updateCourse(
    id: string,
    data: { name?: string; credits?: number; isActive?: boolean },
  ) {
    const course = await Course.findById(id);
    if (!course) throw new NotFoundError('Course not found', 'ACADEMIC_NOT_FOUND');
    if (data.name !== undefined) course.name = data.name.trim();
    if (data.credits !== undefined) course.credits = data.credits;
    if (data.isActive !== undefined) course.isActive = data.isActive;
    return course.save();
  }

  // --- Class Sections ---
  public async createClassSection(data: {
    name: string;
    programId: string;
    academicYearId: string;
    semesterId: string;
  }) {
    await this.getProgramById(data.programId);
    await this.getAcademicYearById(data.academicYearId);
    await this.getSemesterById(data.semesterId);

    const name = data.name.trim();
    const existing = await ClassSection.findOne({ name, semesterId: data.semesterId });
    if (existing) {
      throw new ConflictError(
        `Class section '${name}' already exists for this semester`,
        'ACADEMIC_DUPLICATE',
      );
    }
    return ClassSection.create({
      name,
      programId: data.programId,
      academicYearId: data.academicYearId,
      semesterId: data.semesterId,
    });
  }

  public async getClassSections(programId?: string, semesterId?: string, page = 1, limit = 20) {
    const query: Record<string, unknown> = {};
    if (programId) query.programId = programId;
    if (semesterId) query.semesterId = semesterId;
    const skip = (page - 1) * limit;
    const [sections, total] = await Promise.all([
      ClassSection.find(query)
        .populate('programId', 'name code')
        .populate('academicYearId', 'name')
        .populate('semesterId', 'name number')
        .skip(skip)
        .limit(limit),
      ClassSection.countDocuments(query),
    ]);
    return { sections, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getClassSectionById(id: string) {
    const section = await ClassSection.findById(id)
      .populate('programId', 'name code')
      .populate('academicYearId', 'name')
      .populate('semesterId', 'name number');
    if (!section) throw new NotFoundError('Class section not found', 'ACADEMIC_NOT_FOUND');
    return section;
  }

  public async updateClassSection(id: string, data: { name?: string; isActive?: boolean }) {
    const section = await ClassSection.findById(id);
    if (!section) throw new NotFoundError('Class section not found', 'ACADEMIC_NOT_FOUND');
    if (data.name !== undefined) section.name = data.name.trim();
    if (data.isActive !== undefined) section.isActive = data.isActive;
    return section.save();
  }

  // --- Faculty Assignments ---
  public async createFacultyAssignment(data: {
    facultyId: string;
    courseId: string;
    classSectionId: string;
    academicYearId: string;
    semesterId: string;
  }) {
    const facultyUser = await User.findById(data.facultyId);
    if (!facultyUser || facultyUser.role !== UserRole.FACULTY) {
      throw new BadRequestError(
        'Assigned user must exist and have faculty role',
        'ACADEMIC_INVALID_RELATION',
      );
    }
    await this.getCourseById(data.courseId);
    await this.getClassSectionById(data.classSectionId);

    const existing = await FacultyAssignment.findOne({
      facultyId: data.facultyId,
      courseId: data.courseId,
      classSectionId: data.classSectionId,
      semesterId: data.semesterId,
    });

    if (existing) {
      throw new ConflictError(
        'Faculty member is already assigned to this course and section for this semester',
        'ACADEMIC_DUPLICATE',
      );
    }

    return FacultyAssignment.create({
      facultyId: data.facultyId,
      courseId: data.courseId,
      classSectionId: data.classSectionId,
      academicYearId: data.academicYearId,
      semesterId: data.semesterId,
      isActive: true,
    });
  }

  public async getFacultyAssignments(facultyId?: string, courseId?: string, page = 1, limit = 20) {
    const query: Record<string, unknown> = {};
    if (facultyId) query.facultyId = facultyId;
    if (courseId) query.courseId = courseId;
    const skip = (page - 1) * limit;
    const [assignments, total] = await Promise.all([
      FacultyAssignment.find(query)
        .populate('facultyId', 'name email role')
        .populate('courseId', 'code name')
        .populate('classSectionId', 'name')
        .populate('semesterId', 'name number')
        .skip(skip)
        .limit(limit),
      FacultyAssignment.countDocuments(query),
    ]);
    return { assignments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // --- Student Enrollments ---
  public async createStudentEnrollment(data: {
    studentId: string;
    classSectionId: string;
    academicYearId: string;
    semesterId: string;
    rollNumber: string;
  }) {
    const studentUser = await User.findById(data.studentId);
    if (!studentUser || studentUser.role !== UserRole.STUDENT) {
      throw new BadRequestError(
        'Enrolled user must exist and have student role',
        'ACADEMIC_INVALID_RELATION',
      );
    }
    await this.getClassSectionById(data.classSectionId);

    const existing = await StudentEnrollment.findOne({
      studentId: data.studentId,
      semesterId: data.semesterId,
    });

    if (existing) {
      throw new ConflictError(
        'Student is already enrolled in a class section for this semester',
        'ACADEMIC_DUPLICATE',
      );
    }

    return StudentEnrollment.create({
      studentId: data.studentId,
      classSectionId: data.classSectionId,
      academicYearId: data.academicYearId,
      semesterId: data.semesterId,
      rollNumber: data.rollNumber.trim(),
      isActive: true,
    });
  }

  public async getStudentEnrollments(
    studentId?: string,
    classSectionId?: string,
    page = 1,
    limit = 20,
  ) {
    const query: Record<string, unknown> = {};
    if (studentId) query.studentId = studentId;
    if (classSectionId) query.classSectionId = classSectionId;
    const skip = (page - 1) * limit;
    const [enrollments, total] = await Promise.all([
      StudentEnrollment.find(query)
        .populate('studentId', 'name email role')
        .populate('classSectionId', 'name')
        .populate('semesterId', 'name number')
        .skip(skip)
        .limit(limit),
      StudentEnrollment.countDocuments(query),
    ]);
    return { enrollments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const academicService = new AcademicService();
