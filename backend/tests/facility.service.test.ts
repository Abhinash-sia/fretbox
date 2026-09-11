import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { FacilityService } from '../src/modules/hostel/services/facility.service.js';
import { FacilityAsset } from '../src/modules/hostel/models/facilityAsset.model.js';
import { AssetCategory, AssetStatus, AssetCondition, ConflictError } from '../src/types/index.js';

describe('FacilityService Unit Tests', () => {
  const facilityService = new FacilityService();

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_facility_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await FacilityAsset.deleteMany({});
  });

  it('should create and retrieve facility asset', async () => {
    const asset = await facilityService.createAsset({
      name: 'Water Cooler 1',
      assetTag: 'WC-001',
      category: AssetCategory.WATER,
      locationText: 'Ground Floor Lounge',
    });

    expect(asset._id).toBeDefined();
    expect(asset.assetTag).toBe('WC-001');

    await expect(
      facilityService.createAsset({
        name: 'Duplicate Cooler',
        assetTag: 'WC-001',
        category: AssetCategory.WATER,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should list assets with search filter and update condition', async () => {
    await facilityService.createAsset({
      name: 'Split AC Unit',
      assetTag: 'AC-101',
      category: AssetCategory.APPLIANCE,
      condition: AssetCondition.GOOD,
    });

    const searchRes = await facilityService.getAssets({ search: 'Split AC' });
    expect(searchRes.total).toBe(1);
    expect(searchRes.assets[0].assetTag).toBe('AC-101');

    const updated = await facilityService.updateAsset(searchRes.assets[0]._id.toString(), {
      condition: AssetCondition.POOR,
      status: AssetStatus.MAINTENANCE,
    });

    expect(updated.condition).toBe(AssetCondition.POOR);
    expect(updated.status).toBe(AssetStatus.MAINTENANCE);
  });
});
