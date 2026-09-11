import { Types } from 'mongoose';
import { FacilityAsset, IFacilityAsset } from '../models/facilityAsset.model.js';
import { Hostel } from '../models/hostel.model.js';
import { HostelBlock } from '../models/hostelBlock.model.js';
import { Room } from '../models/room.model.js';
import {
  AssetCategory,
  AssetStatus,
  AssetCondition,
  NotFoundError,
  ConflictError,
} from '../../../types/index.js';

export class FacilityService {
  public async createAsset(data: {
    name: string;
    assetTag: string;
    category: AssetCategory;
    status?: AssetStatus;
    condition?: AssetCondition;
    hostelId?: string;
    blockId?: string;
    roomId?: string;
    locationText?: string;
    purchaseDate?: Date;
    warrantyExpiry?: Date;
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    notes?: string;
  }): Promise<IFacilityAsset> {
    const assetTag = data.assetTag.trim().toUpperCase();
    const existing = await FacilityAsset.findOne({
      $or: [{ assetCode: assetTag }, { assetTag }],
    });
    if (existing) {
      throw new ConflictError(
        `Facility asset with tag '${assetTag}' already exists`,
        'ASSET_DUPLICATE',
      );
    }

    if (data.hostelId) {
      const hostel = await Hostel.findById(data.hostelId);
      if (!hostel) throw new NotFoundError('Hostel not found', 'HOSTEL_NOT_FOUND');
    }
    if (data.blockId) {
      const block = await HostelBlock.findById(data.blockId);
      if (!block) throw new NotFoundError('Hostel block not found', 'HOSTEL_BLOCK_NOT_FOUND');
    }
    if (data.roomId) {
      const room = await Room.findById(data.roomId);
      if (!room) throw new NotFoundError('Room not found', 'ROOM_NOT_FOUND');
    }

    let locationType: 'hostel' | 'block' | 'room' | 'common' = 'common';
    if (data.roomId) locationType = 'room';
    else if (data.blockId) locationType = 'block';
    else if (data.hostelId) locationType = 'hostel';

    return FacilityAsset.create({
      name: data.name.trim(),
      assetCode: assetTag,
      assetTag,
      category: data.category,
      locationType,
      status: data.status || AssetStatus.ACTIVE,
      condition: data.condition || AssetCondition.GOOD,
      hostelId: data.hostelId ? new Types.ObjectId(data.hostelId) : undefined,
      blockId: data.blockId ? new Types.ObjectId(data.blockId) : undefined,
      roomId: data.roomId ? new Types.ObjectId(data.roomId) : undefined,
      locationText: data.locationText?.trim(),
      purchaseDate: data.purchaseDate,
      warrantyExpiry: data.warrantyExpiry,
      lastMaintenanceDate: data.lastMaintenanceDate,
      nextMaintenanceDate: data.nextMaintenanceDate,
      notes: data.notes?.trim(),
    });
  }

  public async getAssets(
    filterOptions: {
      category?: AssetCategory;
      status?: AssetStatus;
      condition?: AssetCondition;
      hostelId?: string;
      blockId?: string;
      roomId?: string;
      search?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const filter: Record<string, unknown> = {};
    if (filterOptions.category) filter.category = filterOptions.category;
    if (filterOptions.status) filter.status = filterOptions.status;
    if (filterOptions.condition) filter.condition = filterOptions.condition;
    if (filterOptions.hostelId) filter.hostelId = filterOptions.hostelId;
    if (filterOptions.blockId) filter.blockId = filterOptions.blockId;
    if (filterOptions.roomId) filter.roomId = filterOptions.roomId;
    if (filterOptions.search) {
      filter.$or = [
        { name: { $regex: filterOptions.search, $options: 'i' } },
        { assetCode: { $regex: filterOptions.search, $options: 'i' } },
        { assetTag: { $regex: filterOptions.search, $options: 'i' } },
        { locationText: { $regex: filterOptions.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [assets, total] = await Promise.all([
      FacilityAsset.find(filter)
        .populate('hostelId blockId roomId')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      FacilityAsset.countDocuments(filter),
    ]);

    return { assets, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getAssetById(id: string): Promise<IFacilityAsset> {
    const asset = await FacilityAsset.findById(id).populate('hostelId blockId roomId');
    if (!asset) {
      throw new NotFoundError('Facility asset not found', 'ASSET_NOT_FOUND');
    }
    return asset;
  }

  public async updateAsset(
    id: string,
    data: {
      name?: string;
      category?: AssetCategory;
      status?: AssetStatus;
      condition?: AssetCondition;
      hostelId?: string;
      blockId?: string;
      roomId?: string;
      locationText?: string;
      lastMaintenanceDate?: Date;
      nextMaintenanceDate?: Date;
      notes?: string;
    },
  ): Promise<IFacilityAsset> {
    const asset = await FacilityAsset.findById(id);
    if (!asset) {
      throw new NotFoundError('Facility asset not found', 'ASSET_NOT_FOUND');
    }

    if (data.name !== undefined) asset.name = data.name.trim();
    if (data.category !== undefined) asset.category = data.category;
    if (data.status !== undefined) asset.status = data.status;
    if (data.condition !== undefined) asset.condition = data.condition;
    if (data.hostelId !== undefined)
      asset.hostelId = data.hostelId ? new Types.ObjectId(data.hostelId) : undefined;
    if (data.blockId !== undefined)
      asset.blockId = data.blockId ? new Types.ObjectId(data.blockId) : undefined;
    if (data.roomId !== undefined)
      asset.roomId = data.roomId ? new Types.ObjectId(data.roomId) : undefined;
    if (data.locationText !== undefined) asset.locationText = data.locationText.trim();
    if (data.lastMaintenanceDate !== undefined)
      asset.lastMaintenanceDate = data.lastMaintenanceDate;
    if (data.nextMaintenanceDate !== undefined)
      asset.nextMaintenanceDate = data.nextMaintenanceDate;
    if (data.notes !== undefined) asset.notes = data.notes.trim();

    return asset.save();
  }

  public async deleteAsset(id: string): Promise<void> {
    const asset = await FacilityAsset.findById(id);
    if (!asset) {
      throw new NotFoundError('Facility asset not found', 'ASSET_NOT_FOUND');
    }
    await FacilityAsset.findByIdAndDelete(id);
  }
}
