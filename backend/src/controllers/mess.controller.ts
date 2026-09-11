import { Request, Response, NextFunction } from 'express';
import { MessService } from '../services/mess.service.js';
import { sendSuccess } from '../utils/response.js';
import { MealType, UserRole, UnauthorizedError } from '../types/index.js';

const messService = new MessService();

const parsePagination = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { page, limit };
};

export const createMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const menu = await messService.createMenu({
      ...req.body,
      createdByUserId: req.user.id,
    });
    sendSuccess(res, menu, 201, 'Mess menu created successfully');
  } catch (err) {
    next(err);
  }
};

export const getMenus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const filter = {
      date: req.query.date as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      hostelId: req.query.hostelId as string,
      mealType: req.query.mealType as MealType,
      isPublished:
        req.query.isPublished !== undefined ? req.query.isPublished === 'true' : undefined,
    };

    // If user is a student, only show published menus by default unless specified
    if (req.user?.role === UserRole.STUDENT && filter.isPublished === undefined) {
      filter.isPublished = true;
    }

    const result = await messService.getMenus(filter, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getMenuById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const menu = await messService.getMenuById(req.params.id!);
    sendSuccess(res, menu, 200);
  } catch (err) {
    next(err);
  }
};

export const updateMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const menu = await messService.updateMenu(req.params.id!, req.body);
    sendSuccess(res, menu, 200, 'Mess menu updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await messService.deleteMenu(req.params.id!);
    sendSuccess(res, null, 200, 'Mess menu deleted successfully');
  } catch (err) {
    next(err);
  }
};

export const submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const feedback = await messService.submitFeedback({
      menuId: req.params.id!,
      studentId: req.user.id,
      rating: req.body.rating,
      comments: req.body.comments,
    });

    sendSuccess(res, feedback, 201, 'Feedback submitted successfully');
  } catch (err) {
    next(err);
  }
};

export const getFeedbackSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await messService.getFeedbackSummary(req.params.id!);
    sendSuccess(res, summary, 200);
  } catch (err) {
    next(err);
  }
};

export const getFeedbacksByMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = parsePagination(req);
    const result = await messService.getFeedbacksByMenu(req.params.id!, page, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};
