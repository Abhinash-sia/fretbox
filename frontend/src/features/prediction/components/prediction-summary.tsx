'use client';

import * as React from 'react';
import { TrendingUp, Cpu, Calendar, Activity, CheckCircle, BarChart2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PythonPredictionResponse } from '../types/prediction';

interface PredictionSummaryProps {
  data: PythonPredictionResponse;
}

export function PredictionSummary({ data }: PredictionSummaryProps) {
  const { forecast, model, baseline, selectedModel, trainingObservations, testObservations } = data;

  if (!forecast || forecast.length === 0) return null;

  // Compute real metrics from forecast array
  const totalPredicted = forecast.reduce((acc, item) => acc + item.predictedComplaints, 0);
  const avgDailyPredicted = (totalPredicted / forecast.length).toFixed(1);

  // Peak day calculation
  const peakItem = forecast.reduce(
    (max, item) => (item.predictedComplaints > max.predictedComplaints ? item : max),
    forecast[0],
  );

  const activeModelMetrics = selectedModel === 'RandomForestRegressor' ? model : baseline;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Forecast Volume */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Forecasted Complaints</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {totalPredicted}
            <span className="text-xs font-normal text-muted-foreground ml-1.5">
              total over {forecast.length} days
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Avg ~{avgDailyPredicted} complaints/day
          </div>
        </CardContent>
      </Card>

      {/* 2. Peak Predicted Workload */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Peak Demand Day</span>
            <Activity className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {peakItem.predictedComplaints}
            <span className="text-xs font-normal text-muted-foreground ml-1.5">complaints</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <Calendar className="h-3 w-3 inline" />
            <span>{peakItem.date}</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Selected ML Model */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Selected ML Engine</span>
            <Cpu className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-foreground truncate">
            {selectedModel || 'Default Forecaster'}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              <CheckCircle className="mr-0.5 h-2.5 w-2.5 inline" /> Optimal Model
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 4. Model Accuracy / Error Metrics */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Model Error (MAE / RMSE)</span>
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {activeModelMetrics ? `${activeModelMetrics.mae} / ${activeModelMetrics.rmse}` : 'N/A'}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Trained on {trainingObservations} days ({testObservations} test eval)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
