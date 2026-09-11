import { Complaint } from '../models/complaint.model.js';
import { getEnv } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../types/index.js';
import { pythonPredictionResponseSchema, PythonPredictionResponse } from '../utils/b9.schemas.js';

export class PredictionService {
  /**
   * Generates a demand prediction by retrieving continuous daily complaint history
   * from MongoDB and dispatching to the local Python AI microservice.
   */
  public async getComplaintDemandForecast(
    horizonDays = 7,
    historyDays = 180,
  ): Promise<PythonPredictionResponse> {
    const env = getEnv();

    // 1. Calculate cutoff date for history window
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - historyDays);

    // 2. Aggregate complaint counts grouped by day (YYYY-MM-DD)
    const aggregatedData = await Complaint.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          dateStr: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
        },
      },
      {
        $group: {
          _id: '$dateStr',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const records = aggregatedData.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    // 3. Prepare payload for Python microservice
    const aiServiceUrl = env.AI_SERVICE_URL || 'http://localhost:8000';
    const timeoutMs = env.PREDICTION_SERVICE_TIMEOUT_MS || 5000;

    const payload = {
      horizonDays,
      historyDays,
      records,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${aiServiceUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.error({ status: response.status }, 'Python AI service returned non-200 status');
        throw new AppError(
          'Demand prediction service error.',
          503,
          'PREDICTION_SERVICE_UNAVAILABLE',
        );
      }

      const jsonBody = await response.json();

      // 4. Validate Python service response format using Zod
      const parseResult = pythonPredictionResponseSchema.safeParse(jsonBody);
      if (!parseResult.success) {
        logger.error(
          { error: parseResult.error },
          'Invalid response format from Python AI service',
        );
        throw new AppError(
          'Received invalid payload from demand prediction service.',
          502,
          'PREDICTION_PAYLOAD_INVALID',
        );
      }

      return parseResult.data;
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (error instanceof AppError) {
        throw error;
      }
      if (err.name === 'AbortError') {
        logger.warn('Demand prediction request timed out');
        throw new AppError(
          'Demand prediction service timed out.',
          504,
          'PREDICTION_SERVICE_TIMEOUT',
        );
      }

      logger.warn({ err: err.message }, 'Failed to connect to Python demand prediction service');
      throw new AppError(
        'Demand prediction is temporarily unavailable.',
        503,
        'PREDICTION_SERVICE_UNAVAILABLE',
      );
    }
  }
}

export const predictionService = new PredictionService();
