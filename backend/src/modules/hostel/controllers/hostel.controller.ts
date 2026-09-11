import { Request, Response, NextFunction } from 'express';
import { HostelService } from '../services/hostel.service.js';
import { sendSuccess } from '../../../utils/response.js';
import {
  RoomStatus,
  AllocationStatus,
  UserRole,
  ForbiddenError,
  UnauthorizedError,
} from '../../../types/index.js';

const hostelService = new HostelService();

const parsePagination = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { page, limit };
};

// --- Hostels ---
export const createHostel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostel = await hostelService.createHostel(req.body);
    sendSuccess(res, hostel, 201, 'Hostel created successfully');
  } catch (err) {
    next(err);
  }
};

export const getHostels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const result = await hostelService.getHostels(page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getHostelById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostel = await hostelService.getHostelById(req.params.id!);
    sendSuccess(res, hostel, 200);
  } catch (err) {
    next(err);
  }
};

export const updateHostel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostel = await hostelService.updateHostel(req.params.id!, req.body);
    sendSuccess(res, hostel, 200, 'Hostel updated successfully');
  } catch (err) {
    next(err);
  }
};

// --- Hostel Blocks ---
export const createBlock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const block = await hostelService.createBlock(req.body);
    sendSuccess(res, block, 201, 'Hostel block created successfully');
  } catch (err) {
    next(err);
  }
};

export const getBlocksByHostel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blocks = await hostelService.getBlocksByHostel(req.params.hostelId!);
    sendSuccess(res, blocks, 200);
  } catch (err) {
    next(err);
  }
};

export const getBlockById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const block = await hostelService.getBlockById(req.params.id!);
    sendSuccess(res, block, 200);
  } catch (err) {
    next(err);
  }
};

export const updateBlock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const block = await hostelService.updateBlock(req.params.id!, req.body);
    sendSuccess(res, block, 200, 'Hostel block updated successfully');
  } catch (err) {
    next(err);
  }
};

// --- Rooms ---
export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await hostelService.createRoom(req.body);
    sendSuccess(res, room, 201, 'Room created successfully');
  } catch (err) {
    next(err);
  }
};

export const getRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const blockId = req.query.blockId as string;
    const hostelId = req.query.hostelId as string;
    const status = req.query.status as RoomStatus;

    const result = await hostelService.getRooms(blockId, hostelId, status, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getRoomById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await hostelService.getRoomById(req.params.id!);
    sendSuccess(res, room, 200);
  } catch (err) {
    next(err);
  }
};

export const updateRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await hostelService.updateRoom(req.params.id!, req.body);
    sendSuccess(res, room, 200, 'Room updated successfully');
  } catch (err) {
    next(err);
  }
};

// --- Allocations ---
export const allocateRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const allocation = await hostelService.allocateRoom({
      studentId: req.body.studentId,
      roomId: req.body.roomId,
      allocatedByUserId: req.user.id,
      remarks: req.body.remarks,
    });
    sendSuccess(res, allocation, 201, 'Room allocated successfully');
  } catch (err) {
    next(err);
  }
};

export const vacateRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const allocation = await hostelService.vacateRoom(
      req.params.id!,
      req.user.id,
      req.body.remarks,
    );
    sendSuccess(res, allocation, 200, 'Room allocation vacated successfully');
  } catch (err) {
    next(err);
  }
};

export const getMyAllocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role !== UserRole.STUDENT) {
      throw new ForbiddenError('Only students can view their room allocation');
    }
    const allocation = await hostelService.getStudentAllocation(req.user.id);
    sendSuccess(res, allocation, 200);
  } catch (err) {
    next(err);
  }
};

export const getAllocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const filter = {
      studentId: req.query.studentId as string,
      hostelId: req.query.hostelId as string,
      blockId: req.query.blockId as string,
      roomId: req.query.roomId as string,
      status: req.query.status as AllocationStatus,
    };
    const result = await hostelService.getAllocations(filter, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};
