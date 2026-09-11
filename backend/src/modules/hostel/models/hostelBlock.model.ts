import { Schema, model, Document, Types } from 'mongoose';

export interface IHostelBlock {
  hostelId: Types.ObjectId;
  name: string;
  code: string;
  numberOfFloors: number;
  floors?: number;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHostelBlockDocument extends IHostelBlock, Document {}

const hostelBlockSchema = new Schema<IHostelBlockDocument>(
  {
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      required: [true, 'Hostel ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Hostel block name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Block code is required'],
      uppercase: true,
      trim: true,
    },
    numberOfFloors: {
      type: Number,
      default: 1,
      min: [1, 'Number of floors must be at least 1'],
    },
    floors: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

hostelBlockSchema.pre('save', function (next) {
  if (this.floors !== undefined && this.numberOfFloors === undefined) {
    this.numberOfFloors = this.floors;
  } else if (this.numberOfFloors !== undefined && this.floors === undefined) {
    this.floors = this.numberOfFloors;
  }
  next();
});

// Prevent duplicate block code within a hostel
hostelBlockSchema.index({ hostelId: 1, code: 1 }, { unique: true });

export const HostelBlock = model<IHostelBlockDocument>('HostelBlock', hostelBlockSchema);
