import { Schema, model, Document, Types } from 'mongoose';
import { GateEventType } from '../../../types/index.js';

export interface IGateEvent {
  gatePassId: Types.ObjectId;
  studentId: Types.ObjectId;
  securityUserId: Types.ObjectId;
  eventType: GateEventType;
  gateId: string;
  scannedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGateEventDocument extends IGateEvent, Document {}

const gateEventSchema = new Schema<IGateEventDocument>(
  {
    gatePassId: {
      type: Schema.Types.ObjectId,
      ref: 'GatePass',
      required: [true, 'Gate pass ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    securityUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Security user ID is required'],
      index: true,
    },
    eventType: {
      type: String,
      enum: Object.values(GateEventType),
      default: GateEventType.EXIT,
      required: true,
    },
    gateId: {
      type: String,
      required: [true, 'Gate ID is required'],
      default: 'main-gate',
      trim: true,
      index: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

gateEventSchema.index({ scannedAt: -1, eventType: 1 });

export const GateEvent = model<IGateEventDocument>('GateEvent', gateEventSchema);
