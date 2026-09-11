import { Schema, model, Document, Types } from 'mongoose';

export interface ICourse {
  code: string;
  name: string;
  credits: number;
  semesterId: Types.ObjectId;
  programId: Types.ObjectId;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourseDocument extends ICourse, Document {}

const courseSchema = new Schema<ICourseDocument>(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    credits: {
      type: Number,
      required: [true, 'Course credits are required'],
      min: [1, 'Credits must be at least 1'],
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester ID is required'],
      index: true,
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'Program',
      required: [true, 'Program ID is required'],
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

// Course code unique within program
courseSchema.index({ code: 1, programId: 1 }, { unique: true });

export const Course = model<ICourseDocument>('Course', courseSchema);
