import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaintAssignment extends Document {
  complaintId: mongoose.Types.ObjectId;
  assignedToStaffId: mongoose.Types.ObjectId;
  assignedByUserId: mongoose.Types.ObjectId;
  notes?: string;
  assignedAt: Date;
  isActive: boolean;
  unassignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const complaintAssignmentSchema = new Schema<IComplaintAssignment>(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    assignedToStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    unassignedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

complaintAssignmentSchema.index({ complaintId: 1, isActive: 1 });

export const ComplaintAssignment = mongoose.model<IComplaintAssignment>(
  'ComplaintAssignment',
  complaintAssignmentSchema,
);
