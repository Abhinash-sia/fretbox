import { Schema, model, Document, Types } from 'mongoose';

export interface IStudentEnrollment {
  studentId: Types.ObjectId;
  classSectionId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  semesterId: Types.ObjectId;
  rollNumber: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStudentEnrollmentDocument extends IStudentEnrollment, Document {}

const studentEnrollmentSchema = new Schema<IStudentEnrollmentDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
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
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
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

// Prevent duplicate enrollment for the same student in the same semester
studentEnrollmentSchema.index({ studentId: 1, semesterId: 1 }, { unique: true });

export const StudentEnrollment = model<IStudentEnrollmentDocument>(
  'StudentEnrollment',
  studentEnrollmentSchema,
);
