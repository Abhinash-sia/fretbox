import { Schema, model, Document, Types } from 'mongoose';
import { SessionStatus } from '../../../types/index.js';

export interface IAttendanceSession {
  courseId: Types.ObjectId;
  classSectionId: Types.ObjectId;
  facultyId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  sessionNumber: number;
  topic?: string;
  status: SessionStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttendanceSessionDocument extends IAttendanceSession, Document {}

const attendanceSessionSchema = new Schema<IAttendanceSessionDocument>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    classSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSection',
      required: [true, 'Class Section ID is required'],
      index: true,
    },
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    sessionNumber: {
      type: Number,
      default: 1,
    },
    topic: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.COMPLETED,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for querying session history by course, section, and date
attendanceSessionSchema.index({ courseId: 1, classSectionId: 1, date: 1 });

export const AttendanceSession = model<IAttendanceSessionDocument>(
  'AttendanceSession',
  attendanceSessionSchema,
);
