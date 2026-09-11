import { Request, Response, NextFunction } from 'express';
import { GateEventService } from '../services/gateEvent.service.js';
import { sendSuccess } from '../../../utils/response.js';
import {
  GateEventType,
  UserRole,
  UnauthorizedError,
  ForbiddenError,
} from '../../../types/index.js';

const gateEventService = new GateEventService();

const parsePagination = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { page, limit };
};

export const getGateEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (
      req.user.role !== UserRole.SECURITY &&
      req.user.role !== UserRole.WARDEN &&
      req.user.role !== UserRole.ADMINISTRATOR
    ) {
      throw new ForbiddenError('Access forbidden: Insufficient permissions', 'AUTH_FORBIDDEN');
    }

    const { page, limit } = parsePagination(req);
    const filterOptions = {
      studentId: req.query.studentId as string,
      securityUserId: req.query.securityUserId as string,
      gateId: req.query.gateId as string,
      eventType: req.query.eventType as GateEventType,
    };

    const result = await gateEventService.getGateEvents(filterOptions, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getGateEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (
      req.user.role !== UserRole.SECURITY &&
      req.user.role !== UserRole.WARDEN &&
      req.user.role !== UserRole.ADMINISTRATOR
    ) {
      throw new ForbiddenError('Access forbidden: Insufficient permissions', 'AUTH_FORBIDDEN');
    }

    const gateEvent = await gateEventService.getGateEventById(req.params.id!);
    sendSuccess(res, gateEvent, 200);
  } catch (err) {
    next(err);
  }
};
