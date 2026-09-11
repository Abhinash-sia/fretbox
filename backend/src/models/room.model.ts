import { Schema, model, Document, Types } from 'mongoose';
import { RoomStatus } from '../types/index.js';

export interface IRoom {
  hostelId?: Types.ObjectId;
  hostelBlockId: Types.ObjectId;
  blockId?: Types.ObjectId;
  roomNumber: string;
  floor: number;
  floorNumber?: number;
  capacity: number;
  occupiedCount: number;
  status: RoomStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRoomDocument extends IRoom, Document {}

const roomSchema = new Schema<IRoomDocument>(
  {
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      index: true,
    },
    hostelBlockId: {
      type: Schema.Types.ObjectId,
      ref: 'HostelBlock',
      required: [true, 'Hostel block ID is required'],
      index: true,
    },
    blockId: {
      type: Schema.Types.ObjectId,
      ref: 'HostelBlock',
      index: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      default: 1,
    },
    floorNumber: {
      type: Number,
      default: 1,
    },
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    occupiedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(RoomStatus),
      default: RoomStatus.AVAILABLE,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

roomSchema.pre('save', function (next) {
  if (this.blockId && !this.hostelBlockId) {
    this.hostelBlockId = this.blockId;
  } else if (this.hostelBlockId && !this.blockId) {
    this.blockId = this.hostelBlockId;
  }
  if (this.floorNumber !== undefined && this.floor === undefined) {
    this.floor = this.floorNumber;
  } else if (this.floor !== undefined && this.floorNumber === undefined) {
    this.floorNumber = this.floor;
  }
  next();
});

// Prevent duplicate room numbers within the same block
roomSchema.index({ hostelBlockId: 1, roomNumber: 1 }, { unique: true });

export const Room = model<IRoomDocument>('Room', roomSchema);
