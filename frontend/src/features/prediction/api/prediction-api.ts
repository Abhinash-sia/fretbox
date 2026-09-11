import { apiClient } from '@/lib/api/api-client';
import { PredictionQueryInput, PythonPredictionResponse } from '../types/prediction';

export const predictionApi = {
  /**
   * Get complaint demand forecasts from Express backend proxy
   * Endpoint: GET /admin/predictions/complaints?horizonDays=X&historyDays=Y
   */
  async getComplaintDemandPredictions(
    params: PredictionQueryInput,
  ): Promise<PythonPredictionResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set('horizonDays', params.horizonDays.toString());
    searchParams.set('historyDays', params.historyDays.toString());

    return apiClient.request<PythonPredictionResponse>(
      `/admin/predictions/complaints?${searchParams.toString()}`,
    );
  },
};
