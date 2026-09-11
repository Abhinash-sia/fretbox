import { Schema, model, Document, Types } from 'mongoose';

export interface IProgram {
  name: string;
  code: string;
  departmentId: Types.ObjectId;
  durationYears: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProgramDocument extends IProgram, Document {}

const programSchema = new Schema<IProgramDocument>(
  {
    name: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Program code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
      index: true,
    },
    durationYears: {
      type: Number,
      required: [true, 'Duration in years is required'],
      min: [1, 'Duration must be at least 1 year'],
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

export const Program = model<IProgramDocument>('Program', programSchema);
