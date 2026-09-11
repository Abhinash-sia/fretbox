import { Schema, model, Document, Types } from 'mongoose';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  AiClassificationStatus,
  IAiClassification,
} from '../../../types/index.js';

export interface IComplaint {
  ticketNumber: string;
  createdBy: Types.ObjectId;
  studentId?: Types.ObjectId;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  hostelId?: Types.ObjectId;
  blockId?: Types.ObjectId;
  roomId?: Types.ObjectId;
  assetId?: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  assignedToStaffId?: Types.ObjectId;
  preferredTimeSlot?: string;
  assignedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  resolutionNote?: string;
  resolutionNotes?: string;
  resolutionTimeMinutes?: number;
  aiClassification?: IAiClassification;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IComplaintDocument extends IComplaint, Document {}

const complaintSchema = new Schema<IComplaintDocument>(
  {
    ticketNumber: {
      type: String,
      required: [true, 'Ticket number is required'],
      unique: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(ComplaintCategory),
      required: [true, 'Complaint category is required'],
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(ComplaintPriority),
      default: ComplaintPriority.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.OPEN,
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
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },
    assetId: {
      type: Schema.Types.ObjectId,
      ref: 'FacilityAsset',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedToStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    preferredTimeSlot: {
      type: String,
      trim: true,
    },
    assignedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    resolutionNote: {
      type: String,
      trim: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    resolutionTimeMinutes: {
      type: Number,
    },
    aiClassification: {
      category: {
        type: String,
        enum: Object.values(ComplaintCategory),
      },
      priority: {
        type: String,
        enum: Object.values(ComplaintPriority),
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      reason: {
        type: String,
        trim: true,
      },
      provider: {
        type: String,
        trim: true,
      },
      model: {
        type: String,
        trim: true,
      },
      status: {
        type: String,
        enum: Object.values(AiClassificationStatus),
      },
      classifiedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  },
);

complaintSchema.pre('save', function (next) {
  if (this.studentId && !this.createdBy) {
    this.createdBy = this.studentId;
  } else if (this.createdBy && !this.studentId) {
    this.studentId = this.createdBy;
  }
  if (this.assignedToStaffId && !this.assignedTo) {
    this.assignedTo = this.assignedToStaffId;
  } else if (this.assignedTo && !this.assignedToStaffId) {
    this.assignedToStaffId = this.assignedTo;
  }
  if (this.resolutionNotes && !this.resolutionNote) {
    this.resolutionNote = this.resolutionNotes;
  } else if (this.resolutionNote && !this.resolutionNotes) {
    this.resolutionNotes = this.resolutionNote;
  }
  next();
});

// Compound index for complaint listing & dashboard queries
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });

export const Complaint = model<IComplaintDocument>('Complaint', complaintSchema);
