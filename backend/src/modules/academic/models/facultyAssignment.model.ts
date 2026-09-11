import { Schema, model, Document, Types } from 'mongoose';

export interface IFacultyAssignment {
  facultyId: Types.ObjectId;
  courseId: Types.ObjectId;
  classSectionId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  semesterId: Types.ObjectId;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFacultyAssignmentDocument extends IFacultyAssignment, Document {}

const facultyAssignmentSchema = new Schema<IFacultyAssignmentDocument>(
  {
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty ID is required'],
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: [true, 'Class Section ID is required'],
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic Year ID is required'],
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester ID is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate active faculty assignments for the same course, class section, and semester
facultyAssignmentSchema.index(
  { facultyId: 1, courseId: 1, classSectionId: 1, semesterId: 1 },
  { unique: true },
);

export const FacultyAssignment = model<IFacultyAssignmentDocument>(
  'FacultyAssignment',
  facultyAssignmentSchema,
);
