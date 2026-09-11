import { useQuery } from '@tanstack/react-query';
import { predictionApi } from '../api/prediction-api';
import { PredictionQueryInput, PythonPredictionResponse } from '../types/prediction';

export const PREDICTION_QUERY_KEY = ['prediction', 'complaints'];

export function useComplaintDemandPredictions(params: PredictionQueryInput) {
  return useQuery<PythonPredictionResponse, Error>({
    queryKey: [...PREDICTION_QUERY_KEY, params.horizonDays, params.historyDays],
    queryFn: () => predictionApi.getComplaintDemandPredictions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });
}
