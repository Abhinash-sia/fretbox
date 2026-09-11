import { Schema, model, Document, Types } from 'mongoose';
import { AttendanceStatus } from '../types/index.js';

export interface IAttendanceAudit {
  attendanceRecordId: Types.ObjectId;
  studentId: Types.ObjectId;
  attendanceSessionId: Types.ObjectId;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  changedBy: Types.ObjectId;
  reason: string;
  changedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttendanceAuditDocument extends IAttendanceAudit, Document {}

const attendanceAuditSchema = new Schema<IAttendanceAuditDocument>(
  {
    attendanceRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceRecord',
      required: [true, 'Attendance Record ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    attendanceSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Attendance Session ID is required'],
      index: true,
    },
    previousStatus: {
      type: String,
      enum: Object.values(AttendanceStatus),
      required: [true, 'Previous status is required'],
    },
    newStatus: {
      type: String,
      enum: Object.values(AttendanceStatus),
      required: [true, 'New status is required'],
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Changed by user ID is required'],
    },
    reason: {
      type: String,
      required: [true, 'Correction reason is required'],
      trim: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const AttendanceAudit = model<IAttendanceAuditDocument>(
  'AttendanceAudit',
  attendanceAuditSchema,
);
