import { Schema, model, Document, Types } from 'mongoose';
import { AttendanceStatus } from '../types/index.js';

export interface IAttendanceRecord {
  attendanceSessionId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: AttendanceStatus;
  markedAt: Date;
  markedBy: Types.ObjectId;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttendanceRecordDocument extends IAttendanceRecord, Document {}

const attendanceRecordSchema = new Schema<IAttendanceRecordDocument>(
  {
    attendanceSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Attendance Session ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      required: [true, 'Attendance status is required'],
      index: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marked by user ID is required'],
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

// Prevent duplicate attendance records for a student in the same session
attendanceRecordSchema.index({ attendanceSessionId: 1, studentId: 1 }, { unique: true });

// Index for fast student attendance lookup
attendanceRecordSchema.index({ studentId: 1, status: 1 });

export const AttendanceRecord = model<IAttendanceRecordDocument>(
  'AttendanceRecord',
  attendanceRecordSchema,
);
