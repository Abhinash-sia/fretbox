import { Schema, model, Document, Types } from 'mongoose';

export interface ISemester {
  academicYearId: Types.ObjectId;
  number: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISemesterDocument extends ISemester, Document {}

const semesterSchema = new Schema<ISemesterDocument>(
  {
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year ID is required'],
      index: true,
    },
    number: {
      type: Number,
      required: [true, 'Semester number is required'],
      min: [1, 'Semester number must be at least 1'],
    },
    name: {
      type: String,
      required: [true, 'Semester name is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate semester numbers within the same academic year
semesterSchema.index({ academicYearId: 1, number: 1 }, { unique: true });

export const Semester = model<ISemesterDocument>('Semester', semesterSchema);
