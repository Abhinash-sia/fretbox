import { Schema, model, Document, Types } from 'mongoose';
import { GatePassStatus } from '../../../types/index.js';

export interface IGatePass {
  passNumber: string;
  studentId: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  reason: string;
  destination: string;
  outDateTime: Date;
  expectedReturnDateTime: Date;
  status: GatePassStatus;
  tokenHash?: string;
  tokenIssuedAt?: Date;
  usedAt?: Date;
  cancelledAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGatePassDocument extends IGatePass, Document {}

const gatePassSchema = new Schema<IGatePassDocument>(
  {
    passNumber: {
      type: String,
      required: [true, 'Pass number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    outDateTime: {
      type: Date,
      required: [true, 'Out date time is required'],
    },
    expectedReturnDateTime: {
      type: Date,
      required: [true, 'Expected return date time is required'],
    },
    status: {
      type: String,
      enum: Object.values(GatePassStatus),
      default: GatePassStatus.PENDING,
      index: true,
    },
    tokenHash: {
      type: String,
      index: true,
      select: false, // Never select tokenHash by default in normal queries
    },
    tokenIssuedAt: {
      type: Date,
    },
    usedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

gatePassSchema.index({ status: 1, outDateTime: 1, expectedReturnDateTime: 1 });

export const GatePass = model<IGatePassDocument>('GatePass', gatePassSchema);
