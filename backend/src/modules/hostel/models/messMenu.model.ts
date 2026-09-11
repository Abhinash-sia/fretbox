import mongoose, { Document, Schema } from 'mongoose';
import { MealType } from '../../../types/index.js';

export interface IMessMenu extends Document {
  hostelId?: mongoose.Types.ObjectId; // Optional: menu can be global or per-hostel
  date: Date; // standard YYYY-MM-DD date start
  mealType: MealType;
  items: string[];
  description?: string;
  isPublished: boolean;
  createdByUserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messMenuSchema = new Schema<IMessMenu>(
  {
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    mealType: {
      type: String,
      enum: Object.values(MealType),
      required: true,
    },
    items: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'Menu must contain at least one item',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

messMenuSchema.index({ date: 1, mealType: 1, hostelId: 1 }, { unique: true });

export const MessMenu = mongoose.model<IMessMenu>('MessMenu', messMenuSchema);
