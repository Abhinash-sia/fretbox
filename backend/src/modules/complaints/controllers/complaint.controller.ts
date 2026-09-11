import { Request, Response, NextFunction } from 'express';
import { ComplaintService } from '../services/complaint.service.js';
import { sendSuccess } from '../../../utils/response.js';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  UserRole,
  UnauthorizedError,
  ForbiddenError,
} from '../../../types/index.js';

const complaintService = new ComplaintService();

const parsePagination = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { page, limit };
};

export const createComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const studentId =
      req.user.role === UserRole.STUDENT ? req.user.id : req.body.studentId || req.user.id;

    const complaint = await complaintService.createComplaint({
      studentId,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      priority: req.body.priority,
      hostelId: req.body.hostelId,
      blockId: req.body.blockId,
      roomId: req.body.roomId,
      assetId: req.body.assetId,
      preferredTimeSlot: req.body.preferredTimeSlot,
    });

    sendSuccess(res, complaint, 201, 'Complaint submitted successfully');
  } catch (err) {
    next(err);
  }
};

export const getComplaints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { page, limit } = parsePagination(req);

    const filter: Record<string, unknown> = {
      category: req.query.category as ComplaintCategory,
      status: req.query.status as ComplaintStatus,
      priority: req.query.priority as ComplaintPriority,
      assignedToStaffId: req.query.assignedToStaffId as string,
      hostelId: req.query.hostelId as string,
      blockId: req.query.blockId as string,
      roomId: req.query.roomId as string,
      assetId: req.query.assetId as string,
      search: req.query.search as string,
      updatedSince: req.query.updatedSince as string,
    };

    // Scoping for students
    if (req.user.role === UserRole.STUDENT) {
      filter.studentId = req.user.id;
    } else if (req.query.studentId) {
      filter.studentId = req.query.studentId as string;
    }

    const result = await complaintService.getComplaints(filter, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getComplaintById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const result = await complaintService.getComplaintById(req.params.id!);

    const studentIdStr = (
      result.complaint.studentId?._id ||
      result.complaint.studentId ||
      result.complaint.createdBy
    )?.toString();

    if (req.user.role === UserRole.STUDENT && studentIdStr !== req.user.id) {
      throw new ForbiddenError('Students can only access their own complaints');
    }

    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const assignComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const complaint = await complaintService.assignComplaint({
      complaintId: req.params.id!,
      assignedToStaffId: req.body.assignedToStaffId,
      assignedByUserId: req.user.id,
      notes: req.body.notes,
    });

    sendSuccess(res, complaint, 200, 'Complaint assigned successfully');
  } catch (err) {
    next(err);
  }
};

export const updateComplaintStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const complaint = await complaintService.updateComplaintStatus({
      complaintId: req.params.id!,
      status: req.body.status,
      performedByUserId: req.user.id,
      userRole: req.user.role,
      notes: req.body.notes,
      resolutionNotes: req.body.resolutionNotes,
    });

    sendSuccess(res, complaint, 200, 'Complaint status updated successfully');
  } catch (err) {
    next(err);
  }
};

export const getComplaintMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostelId = req.query.hostelId as string;
    const metrics = await complaintService.getComplaintMetrics(hostelId);
    sendSuccess(res, metrics, 200);
  } catch (err) {
    next(err);
  }
};

export const getRecurringIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 3;
    const result = await complaintService.getRecurringIssues(threshold);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const classifyComplaintWithAi = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const complaint = await complaintService.classifyComplaintWithAi(req.params.id!, req.user);
    sendSuccess(res, complaint, 200, 'AI classification requested successfully');
  } catch (err) {
    next(err);
  }
};

export const applyAiClassification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const complaint = await complaintService.applyAiClassification(
      req.params.id!,
      req.user,
      req.body,
    );
    sendSuccess(res, complaint, 200, 'AI recommendation applied successfully');
  } catch (err) {
    next(err);
  }
};
