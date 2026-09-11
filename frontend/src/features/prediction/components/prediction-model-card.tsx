'use client';

import * as React from 'react';
import { Cpu, Layers, Database, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PythonPredictionResponse } from '../types/prediction';

interface PredictionModelCardProps {
  data: PythonPredictionResponse;
}

export function PredictionModelCard({ data }: PredictionModelCardProps) {
  const { model, baseline, selectedModel, featuresUsed, trainingObservations, testObservations } = data;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <span>Forecasting Model & Evaluation Metadata</span>
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            Python Scikit-Learn Engine
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Chronological 80/20 train/test evaluation comparing RandomForestRegressor against 7-day seasonal naive baseline.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {/* Model Metrics Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* ML Model Metrics */}
          {model && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                selectedModel === 'RandomForestRegressor'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>{model.name}</span>
                {selectedModel === 'RandomForestRegressor' && (
                  <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Active Choice
                  </Badge>
                )}
              </div>
              <div className="mt-2 space-y-1 text-muted-foreground font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Mean Absolute Error (MAE):</span>
                  <span className="font-bold text-foreground">{model.mae}</span>
                </div>
                <div className="flex justify-between">
                  <span>Root Mean Squared Error (RMSE):</span>
                  <span className="font-bold text-foreground">{model.rmse}</span>
                </div>
              </div>
            </div>
          )}

          {/* Seasonal Naive Baseline Metrics */}
          {baseline && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                selectedModel === '7-day-seasonal-naive'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>{baseline.name}</span>
                {selectedModel === '7-day-seasonal-naive' && (
                  <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Active Choice
                  </Badge>
                )}
              </div>
              <div className="mt-2 space-y-1 text-muted-foreground font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Mean Absolute Error (MAE):</span>
                  <span className="font-bold text-foreground">{baseline.mae}</span>
                </div>
                <div className="flex justify-between">
                  <span>Root Mean Squared Error (RMSE):</span>
                  <span className="font-bold text-foreground">{baseline.rmse}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feature Vectors Used */}
        {featuresUsed && featuresUsed.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>Engineered Time-Series Features ({featuresUsed.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {featuresUsed.map((feat) => (
                <span
                  key={feat}
                  className="text-[10px] font-mono bg-muted border border-border/60 px-2 py-0.5 rounded"
                >
                  {feat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Observations Split Info */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Database className="h-3.5 w-3.5" />
            <span>Training Dataset: <strong className="text-foreground">{trainingObservations}</strong> days</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Test Evaluation: <strong className="text-foreground">{testObservations}</strong> days</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
