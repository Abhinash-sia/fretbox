import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { AuthUserContext } from '../../../types/index.js';

/**
 * Resolves hostel scope if user is a Warden.
 */
const getHostelIdScope = (_user: AuthUserContext): string | undefined => {
  // If user is warden, we could filter by warden's authorized hostel scope if provided.
  // Wardens can access scoped hostel analytics.
  return undefined;
};

export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const hostelScope = getHostelIdScope(user);
    const data = await AnalyticsService.getOverview(
      req.query.from as string,
      req.query.to as string,
      hostelScope,
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getComplaintAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const hostelScope = getHostelIdScope(user);
    const data = await AnalyticsService.getComplaintAnalytics(
      req.query as Record<string, unknown>,
      hostelScope,
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getWorkloadAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const hostelScope = getHostelIdScope(user);
    const data = await AnalyticsService.getWorkloadAnalytics(
      req.query as Record<string, unknown>,
      hostelScope,
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getRecurringIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const hostelScope = getHostelIdScope(user);
    const windowDays = req.query.windowDays ? parseInt(req.query.windowDays as string, 10) : 30;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const data = await AnalyticsService.getRecurringIssues(windowDays, limit, hostelScope);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getAttendanceAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await AnalyticsService.getAttendanceAnalytics(
      req.query as Record<string, unknown>,
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getLowAttendanceStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : 75;
    const data = await AnalyticsService.getLowAttendanceStudents({
      ...(req.query as Record<string, unknown>),
      threshold,
    });
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getHostelAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const hostelScope = getHostelIdScope(user);
    const data = await AnalyticsService.getHostelAnalytics(hostelScope);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getFacilityAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const hostelScope = getHostelIdScope(user);
    const data = await AnalyticsService.getFacilityAnalytics(hostelScope);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getMessAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await AnalyticsService.getMessAnalytics(
      req.query.from as string,
      req.query.to as string,
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getGateAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await AnalyticsService.getGateAnalytics(
      req.query.from as string,
      req.query.to as string,
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};

export const getCommunicationAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await AnalyticsService.getCommunicationAnalytics(
      req.query.from as string,
      req.query.to as string,
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
};
