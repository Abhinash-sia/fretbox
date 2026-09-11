import { Schema, model, Document } from 'mongoose';
import { HostelCategory } from '../types/index.js';

export interface IHostel {
  name: string;
  code: string;
  category: HostelCategory;
  capacity?: number;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHostelDocument extends IHostel, Document {}

const hostelSchema = new Schema<IHostelDocument>(
  {
    name: {
      type: String,
      required: [true, 'Hostel name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Hostel code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(HostelCategory),
      default: HostelCategory.COED,
    },
    capacity: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
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

export const Hostel = model<IHostelDocument>('Hostel', hostelSchema);
