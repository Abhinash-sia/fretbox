import { Request, Response, NextFunction } from 'express';
import { FaqService } from '../services/faq.service.js';
import { sendSuccess } from '../../../../utils/response.js';
import { UnauthorizedError, FaqCategory } from '../../../../types/index.js';

const faqService = new FaqService();

export const queryFaq = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { question, category, limit } = req.body;

    const result = await faqService.queryFaq(question, category, req.user.role, limit);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getFaqDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const category = req.query.category as FaqCategory | undefined;

    const docs = await faqService.getFaqDocuments(category, req.user.role);
    sendSuccess(res, docs, 200);
  } catch (err) {
    next(err);
  }
};

export const createFaqDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const doc = await faqService.createFaqDocument({
      ...req.body,
      createdById: req.user.id,
    });
    sendSuccess(res, doc, 201, 'FAQ document created successfully');
  } catch (err) {
    next(err);
  }
};

export const updateFaqDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const doc = await faqService.updateFaqDocument(req.params.id!, req.body);
    sendSuccess(res, doc, 200, 'FAQ document updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteFaqDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();
    await faqService.deleteFaqDocument(req.params.id!);
    sendSuccess(res, null, 200, 'FAQ document deleted successfully');
  } catch (err) {
    next(err);
  }
};
