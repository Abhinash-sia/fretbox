import { Schema, model, Document, Types } from 'mongoose';
import {
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTarget,
  UserRole,
} from '../types/index.js';

export interface IAnnouncement {
  title: string;
  body: string;
  createdBy: Types.ObjectId;
  target: AnnouncementTarget;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  publishAt?: Date;
  expiresAt?: Date;
  publishedAt?: Date;
  cancelledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAnnouncementDocument extends IAnnouncement, Document {}

const announcementSchema = new Schema<IAnnouncementDocument>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Announcement body is required'],
      trim: true,
      maxlength: [5000, 'Body cannot exceed 5000 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
      index: true,
    },
    target: {
      all: { type: Boolean, default: false },
      roles: [{ type: String, enum: Object.values(UserRole) }],
      programs: [{ type: Schema.Types.ObjectId, ref: 'Program' }],
      academicYears: [{ type: Schema.Types.ObjectId, ref: 'AcademicYear' }],
      hostels: [{ type: Schema.Types.ObjectId, ref: 'Hostel' }],
      hostelBlocks: [{ type: Schema.Types.ObjectId, ref: 'HostelBlock' }],
    },
    priority: {
      type: String,
      enum: Object.values(AnnouncementPriority),
      default: AnnouncementPriority.NORMAL,
    },
    status: {
      type: String,
      enum: Object.values(AnnouncementStatus),
      default: AnnouncementStatus.DRAFT,
      index: true,
    },
    publishAt: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

announcementSchema.index({ status: 1, publishAt: 1, expiresAt: 1 });
announcementSchema.index({ priority: 1, createdAt: -1 });

export const Announcement = model<IAnnouncementDocument>('Announcement', announcementSchema);
