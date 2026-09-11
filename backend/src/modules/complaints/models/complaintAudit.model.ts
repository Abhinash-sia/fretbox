import mongoose, { Document, Schema } from 'mongoose';
import { ComplaintAuditAction, ComplaintStatus } from '../../../types/index.js';

export interface IComplaintAudit extends Document {
  complaintId: mongoose.Types.ObjectId;
  performedByUserId: mongoose.Types.ObjectId;
  action: ComplaintAuditAction;
  previousStatus?: ComplaintStatus;
  newStatus?: ComplaintStatus;
  previousAssigneeId?: mongoose.Types.ObjectId;
  newAssigneeId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const complaintAuditSchema = new Schema<IComplaintAudit>(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    performedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(ComplaintAuditAction),
      required: true,
    },
    previousStatus: {
      type: String,
      enum: Object.values(ComplaintStatus),
    },
    newStatus: {
      type: String,
      enum: Object.values(ComplaintStatus),
    },
    previousAssigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    newAssigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

complaintAuditSchema.index({ complaintId: 1, createdAt: -1 });

export const ComplaintAudit = mongoose.model<IComplaintAudit>(
  'ComplaintAudit',
  complaintAuditSchema,
);
