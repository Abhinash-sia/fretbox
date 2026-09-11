import { Schema, model, Document, Types } from 'mongoose';

export interface IClassSection {
  name: string;
  programId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  semesterId: Types.ObjectId;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IClassSectionDocument extends IClassSection, Document {}

const classSectionSchema = new Schema<IClassSectionDocument>(
  {
    name: {
      type: String,
      required: [true, 'Class section name is required'],
      trim: true,
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: [true, 'Program ID is required'],
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year ID is required'],
      index: true,
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

// Prevent duplicate section name within the same semester
classSectionSchema.index({ name: 1, semesterId: 1 }, { unique: true });

export const ClassSection = model<IClassSectionDocument>('ClassSection', classSectionSchema);
