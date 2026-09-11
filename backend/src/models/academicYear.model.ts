import { Schema, model, Document } from 'mongoose';

export interface IAcademicYear {
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAcademicYearDocument extends IAcademicYear, Document {}

const academicYearSchema = new Schema<IAcademicYearDocument>(
  {
    name: {
      type: String,
      required: [true, 'Academic year name is required'],
      unique: true,
      trim: true,
      index: true,
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

export const AcademicYear = model<IAcademicYearDocument>('AcademicYear', academicYearSchema);
