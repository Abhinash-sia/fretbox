'use client';

import * as React from 'react';
import { Calendar, History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PredictionQueryInput } from '../types/prediction';

interface PredictionFiltersProps {
  filters: PredictionQueryInput;
  onChangeFilters: (newFilters: PredictionQueryInput) => void;
  onRefresh: () => void;
  isFetching: boolean;
}

const HORIZON_OPTIONS = [
  { label: 'Next 7 Days', value: 7 },
  { label: 'Next 14 Days', value: 14 },
  { label: 'Next 21 Days', value: 21 },
  { label: 'Next 30 Days', value: 30 },
];

const HISTORY_OPTIONS = [
  { label: 'Last 30 Days History', value: 30 },
  { label: 'Last 60 Days History', value: 60 },
  { label: 'Last 90 Days History', value: 90 },
  { label: 'Last 180 Days History', value: 180 },
  { label: 'Last 365 Days History', value: 365 },
];

export function PredictionFilters({
  filters,
  onChangeFilters,
  onRefresh,
  isFetching,
}: PredictionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-3">
        {/* Horizon Selector */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground">Forecast Horizon:</span>
          <select
            value={filters.horizonDays}
            onChange={(e) =>
              onChangeFilters({ ...filters, horizonDays: Number(e.target.value) })
            }
            className="h-8 text-xs border border-input bg-background rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium"
          >
            {HORIZON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* History Window Selector */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <History className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground">Training History:</span>
          <select
            value={filters.historyDays}
            onChange={(e) =>
              onChangeFilters({ ...filters, historyDays: Number(e.target.value) })
            }
            className="h-8 text-xs border border-input bg-background rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium"
          >
            {HISTORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recalculate / Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isFetching}
        className="h-8 text-xs gap-1.5 shrink-0"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        <span>{isFetching ? 'Recalculating...' : 'Recalculate Model'}</span>
      </Button>
    </div>
  );
}
