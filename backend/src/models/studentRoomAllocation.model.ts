import { Schema, model, Document, Types } from 'mongoose';
import { AllocationStatus } from '../types/index.js';

export interface IStudentRoomAllocation {
  studentId: Types.ObjectId;
  hostelId?: Types.ObjectId;
  blockId?: Types.ObjectId;
  roomId: Types.ObjectId;
  allocatedAt: Date;
  vacatedAt?: Date | null;
  status: AllocationStatus;
  allocatedBy: Types.ObjectId;
  allocatedByUserId?: Types.ObjectId;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStudentRoomAllocationDocument extends IStudentRoomAllocation, Document {}

const studentRoomAllocationSchema = new Schema<IStudentRoomAllocationDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      index: true,
    },
    blockId: {
      type: Schema.Types.ObjectId,
      ref: 'HostelBlock',
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room ID is required'],
      index: true,
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
    vacatedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(AllocationStatus),
      default: AllocationStatus.ACTIVE,
      index: true,
    },
    allocatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    allocatedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

studentRoomAllocationSchema.pre('save', function (next) {
  if (this.allocatedByUserId && !this.allocatedBy) {
    this.allocatedBy = this.allocatedByUserId;
  } else if (this.allocatedBy && !this.allocatedByUserId) {
    this.allocatedByUserId = this.allocatedBy;
  }
  next();
});

// Indexes for fast lookup of active student allocations and room occupancy
studentRoomAllocationSchema.index({ studentId: 1, status: 1 });
studentRoomAllocationSchema.index({ roomId: 1, status: 1 });

export const StudentRoomAllocation = model<IStudentRoomAllocationDocument>(
  'StudentRoomAllocation',
  studentRoomAllocationSchema,
);
