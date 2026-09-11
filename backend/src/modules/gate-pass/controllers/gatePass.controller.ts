import { Request, Response, NextFunction } from 'express';
import { GatePassService } from '../services/gatePass.service.js';
import { sendSuccess } from '../../../utils/response.js';
import {
  GatePassStatus,
  UserRole,
  UnauthorizedError,
  ForbiddenError,
} from '../../../types/index.js';

const gatePassService = new GatePassService();

const parsePagination = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { page, limit };
};

export const createGatePass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role !== UserRole.STUDENT) {
      throw new ForbiddenError('Only students can create gate passes', 'GATE_PASS_FORBIDDEN');
    }

    const gatePass = await gatePassService.createGatePass({
      studentId: req.user.id,
      reason: req.body.reason,
      destination: req.body.destination,
      outDateTime: req.body.outDateTime,
      expectedReturnDateTime: req.body.expectedReturnDateTime,
    });

    sendSuccess(res, gatePass, 201, 'Gate pass request created successfully');
  } catch (err) {
    next(err);
  }
};

export const getGatePasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { page, limit } = parsePagination(req);

    const filterOptions: Record<string, unknown> = {
      status: req.query.status as GatePassStatus,
      search: req.query.search as string,
    };

    // Scoping for students
    if (req.user.role === UserRole.STUDENT) {
      filterOptions.studentId = req.user.id;
    } else if (req.query.studentId) {
      filterOptions.studentId = req.query.studentId as string;
    }

    const result = await gatePassService.getGatePasses(filterOptions, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getGatePassById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const pass = await gatePassService.getGatePassById(req.params.id!);

    // Self-ownership check for students
    const studentOwnerId = (
      (pass.studentId as unknown as { _id?: { toString(): string } })._id || pass.studentId
    ).toString();
    if (req.user.role === UserRole.STUDENT && studentOwnerId !== req.user.id) {
      throw new ForbiddenError(
        'Students can only access their own gate pass',
        'GATE_PASS_FORBIDDEN',
      );
    }

    sendSuccess(res, pass, 200);
  } catch (err) {
    next(err);
  }
};

export const cancelGatePass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const pass = await gatePassService.cancelGatePass(req.params.id!, req.user.id);
    sendSuccess(res, pass, 200, 'Gate pass cancelled successfully');
  } catch (err) {
    next(err);
  }
};

export const approveGatePass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const result = await gatePassService.approveGatePass(req.params.id!, req.user.id);
    sendSuccess(res, result, 200, 'Gate pass approved successfully');
  } catch (err) {
    next(err);
  }
};

export const rejectGatePass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const pass = await gatePassService.rejectGatePass(
      req.params.id!,
      req.user.id,
      req.body.rejectionReason,
    );
    sendSuccess(res, pass, 200, 'Gate pass rejected successfully');
  } catch (err) {
    next(err);
  }
};

export const scanGatePass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (req.user.role !== UserRole.SECURITY && req.user.role !== UserRole.ADMINISTRATOR) {
      throw new ForbiddenError(
        'Only security officers or admins can scan gate passes',
        'GATE_PASS_FORBIDDEN',
      );
    }

    const result = await gatePassService.scanGatePass({
      token: req.body.token,
      securityUserId: req.user.id,
      gateId: req.body.gateId,
    });

    sendSuccess(res, result, 200, 'Gate pass verified and exit recorded successfully');
  } catch (err) {
    next(err);
  }
};
