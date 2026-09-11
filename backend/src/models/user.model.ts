import { Schema, model, Document } from 'mongoose';
import { UserRole } from '../types/index.js';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SafeUser = Omit<IUser, 'passwordHash'> & { _id: string };

export interface IUserDocument extends IUser, Document {
  toSafeObject(): SafeUser;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Prevents passwordHash from being returned in normal queries
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
      required: [true, 'Role is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        delete obj.passwordHash;
        delete obj.__v;
        return obj;
      },
    },
  },
);

userSchema.methods.toSafeObject = function (): SafeUser {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.passwordHash;
  delete obj.__v;
  return {
    ...(obj as unknown as IUser),
    _id: obj._id ? String(obj._id) : '',
  };
};

export const User = model<IUserDocument>('User', userSchema);
