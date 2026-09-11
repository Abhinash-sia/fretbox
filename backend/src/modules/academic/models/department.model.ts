import { Schema, model, Document } from 'mongoose';

export interface IDepartment {
  name: string;
  code: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDepartmentDocument extends IDepartment, Document {}

const departmentSchema = new Schema<IDepartmentDocument>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
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

export const Department = model<IDepartmentDocument>('Department', departmentSchema);
