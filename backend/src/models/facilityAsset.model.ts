import { Schema, model, Document, Types } from 'mongoose';
import { AssetCategory, AssetStatus, AssetCondition } from '../types/index.js';

export interface IFacilityAsset {
  assetCode: string;
  assetTag?: string;
  name: string;
  category: AssetCategory;
  description?: string;
  locationType: 'hostel' | 'block' | 'room' | 'common';
  hostelId?: Types.ObjectId;
  blockId?: Types.ObjectId;
  roomId?: Types.ObjectId;
  locationText?: string;
  status: AssetStatus;
  condition: AssetCondition;
  installedAt?: Date;
  lastMaintenanceAt?: Date;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFacilityAssetDocument extends IFacilityAsset, Document {}

const facilityAssetSchema = new Schema<IFacilityAssetDocument>(
  {
    assetCode: {
      type: String,
      required: [true, 'Asset code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    assetTag: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(AssetCategory),
      required: [true, 'Asset category is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    locationType: {
      type: String,
      enum: ['hostel', 'block', 'room', 'common'],
      default: 'common',
      required: [true, 'Location type is required'],
    },
    hostelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hostel',
      index: true,
    },
    blockId: {
      type: Schema.Types.ObjectId,
      ref: 'HostelBlock',
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      index: true,
    },
    locationText: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(AssetStatus),
      default: AssetStatus.ACTIVE,
      index: true,
    },
    condition: {
      type: String,
      enum: Object.values(AssetCondition),
      default: AssetCondition.GOOD,
    },
    installedAt: {
      type: Date,
      default: Date.now,
    },
    lastMaintenanceAt: {
      type: Date,
    },
    purchaseDate: {
      type: Date,
    },
    warrantyExpiry: {
      type: Date,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
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

export const FacilityAsset = model<IFacilityAssetDocument>('FacilityAsset', facilityAssetSchema);
