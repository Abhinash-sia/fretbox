'use client';

import * as React from 'react';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PredictionQueryInput } from '../types/prediction';
import { useComplaintDemandPredictions } from '../hooks/use-prediction-queries';
import { PredictionFilters } from './prediction-filters';
import { PredictionSummary } from './prediction-summary';
import { PredictionChart } from './prediction-chart';
import { PredictionModelCard } from './prediction-model-card';
import { PredictionTable } from './prediction-table';

export function PredictionDashboard() {
  const [filters, setFilters] = React.useState<PredictionQueryInput>({
    horizonDays: 7,
    historyDays: 180,
  });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useComplaintDemandPredictions(filters);

  return (
    <div className="space-y-6">
      {/* 1. Filter Controls */}
      <PredictionFilters
        filters={filters}
        onChangeFilters={setFilters}
        onRefresh={() => refetch()}
        isFetching={isFetching}
      />

      {/* 2. Loading Skeleton State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-28 border-border bg-card animate-pulse">
                <CardContent className="p-4" />
              </Card>
            ))}
          </div>
          <Card className="h-64 border-border bg-card animate-pulse">
            <CardContent className="p-4" />
          </Card>
        </div>
      )}

      {/* 3. Error State */}
      {isError && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Prediction Service Error
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {error?.message ||
                  'The demand prediction service is temporarily unavailable or timed out.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Request</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 4. Insufficient Data State */}
      {!isLoading && !isError && data?.status === 'insufficient_data' && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6 text-center space-y-3">
            <Database className="h-8 w-8 text-amber-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Insufficient Historical Observations
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {data.message ||
                  'Not enough historical complaint data to generate a reliable forecast. Require at least 14 daily complaint records.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Success State Renders Full Prediction Insights */}
      {!isLoading && !isError && data && data.status === 'success' && (
        <>
          {/* KPI Cards */}
          <PredictionSummary data={data} />

          {/* Time-Series Forecast Curve */}
          <PredictionChart forecast={data.forecast} />

          {/* Model Evaluation & Feature Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PredictionModelCard data={data} />
            <PredictionTable forecast={data.forecast} />
          </div>
        </>
      )}
    </div>
  );
}
