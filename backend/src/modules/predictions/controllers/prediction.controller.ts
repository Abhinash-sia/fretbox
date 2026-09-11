import { Request, Response, NextFunction } from 'express';
import { predictionService } from '../services/prediction.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { predictionQuerySchema } from '../schemas/b9.schemas.js';

export class PredictionController {
  public getComplaintDemandPredictions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsedQuery = predictionQuerySchema.parse(req.query);
      const prediction = await predictionService.getComplaintDemandForecast(
        parsedQuery.horizonDays,
        parsedQuery.historyDays,
      );

      sendSuccess(res, prediction, 200, 'Demand predictions generated successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const predictionController = new PredictionController();
