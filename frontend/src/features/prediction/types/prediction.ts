export interface PredictionQueryInput {
  horizonDays: number;
  historyDays: number;
}

export interface ForecastItem {
  date: string;
  predictedComplaints: number;
}

export interface ModelMetrics {
  name: string;
  mae: number;
  rmse: number;
}

export interface PythonPredictionResponse {
  status: 'success' | 'insufficient_data';
  message?: string;
  forecast: ForecastItem[];
  model?: ModelMetrics | null;
  baseline?: ModelMetrics | null;
  featuresUsed: string[];
  trainingObservations: number;
  testObservations: number;
  selectedModel?: string | null;
}
