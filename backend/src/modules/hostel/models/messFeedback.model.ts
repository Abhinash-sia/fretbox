import mongoose, { Document, Schema } from 'mongoose';

export interface IMessFeedback extends Document {
  menuId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  rating: number; // 1 to 5
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messFeedbackSchema = new Schema<IMessFeedback>(
  {
    menuId: {
      type: Schema.Types.ObjectId,
      ref: 'MessMenu',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comments: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

messFeedbackSchema.index({ menuId: 1, studentId: 1 }, { unique: true });

export const MessFeedback = mongoose.model<IMessFeedback>('MessFeedback', messFeedbackSchema);
