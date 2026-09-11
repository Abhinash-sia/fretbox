import { Request, Response, NextFunction } from 'express';
import { FacilityService } from '../services/facility.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { AssetCategory, AssetStatus, AssetCondition } from '../../../types/index.js';

const facilityService = new FacilityService();

const parsePagination = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { page, limit };
};

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await facilityService.createAsset(req.body);
    sendSuccess(res, asset, 201, 'Facility asset created successfully');
  } catch (err) {
    next(err);
  }
};

export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const filter = {
      category: req.query.category as AssetCategory,
      status: req.query.status as AssetStatus,
      condition: req.query.condition as AssetCondition,
      hostelId: req.query.hostelId as string,
      blockId: req.query.blockId as string,
      roomId: req.query.roomId as string,
      search: req.query.search as string,
    };
    const result = await facilityService.getAssets(filter, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getAssetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await facilityService.getAssetById(req.params.id!);
    sendSuccess(res, asset, 200);
  } catch (err) {
    next(err);
  }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await facilityService.updateAsset(req.params.id!, req.body);
    sendSuccess(res, asset, 200, 'Facility asset updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await facilityService.deleteAsset(req.params.id!);
    sendSuccess(res, null, 200, 'Facility asset deleted successfully');
  } catch (err) {
    next(err);
  }
};
