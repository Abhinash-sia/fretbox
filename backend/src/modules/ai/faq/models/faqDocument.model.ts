import { Schema, model, Document, Types } from 'mongoose';
import { FaqCategory, UserRole } from '../../../../types/index.js';

export interface IFaqDocumentModel extends Document {
  title: string;
  category: FaqCategory;
  content: string;
  tags: string[];
  isApproved: boolean;
  targetRoles: UserRole[];
  createdById?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const faqDocumentSchema = new Schema<IFaqDocumentModel>(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(FaqCategory),
      default: FaqCategory.GENERAL,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Document content is required'],
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
    targetRoles: [
      {
        type: String,
        enum: Object.values(UserRole),
      },
    ],
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

// Fulltext index on title, content, and tags for text search retrieval
faqDocumentSchema.index({ title: 'text', content: 'text', tags: 'text' });
faqDocumentSchema.index({ tags: 1 });

export const FaqDocument = model<IFaqDocumentModel>('FaqDocument', faqDocumentSchema);
