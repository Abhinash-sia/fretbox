'use client';

import * as React from 'react';
import { Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ForecastItem } from '../types/prediction';

interface PredictionTableProps {
  forecast: ForecastItem[];
}

export function PredictionTable({ forecast }: PredictionTableProps) {
  if (!forecast || forecast.length === 0) return null;

  // Calculate overall average for relative workload level categorization
  const avg = forecast.reduce((acc, item) => acc + item.predictedComplaints, 0) / forecast.length;

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Daily Predicted Demand Breakdown</span>
          </span>
          <span className="text-xs font-mono text-muted-foreground font-normal">
            {forecast.length} Total Rows
          </span>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Detailed forecast of expected daily complaint volume to assist staff scheduling & resource allocation.
        </CardDescription>
      </CardHeader>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-semibold">Forecast Date</TableHead>
              <TableHead className="text-xs font-semibold">Day of Week</TableHead>
              <TableHead className="text-xs font-semibold text-center">Predicted Complaints</TableHead>
              <TableHead className="text-xs font-semibold text-right">Workload Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forecast.map((item) => {
              const dateObj = new Date(item.date);
              const dayName = isNaN(dateObj.getTime())
                ? ''
                : dateObj.toLocaleDateString('en-US', { weekday: 'long' });

              const isHigh = item.predictedComplaints > avg * 1.3 && item.predictedComplaints >= 3;
              const isModerate = item.predictedComplaints >= avg * 0.9 && !isHigh;

              return (
                <TableRow key={item.date} className="text-xs">
                  <TableCell className="font-mono font-medium text-foreground">
                    {item.date}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium">
                    {dayName}
                  </TableCell>
                  <TableCell className="text-center font-bold text-foreground text-sm font-mono">
                    {item.predictedComplaints}
                  </TableCell>
                  <TableCell className="text-right">
                    {isHigh ? (
                      <Badge variant="secondary" className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                        <AlertTriangle className="mr-1 h-3 w-3 inline" /> High Workload
                      </Badge>
                    ) : isModerate ? (
                      <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                        Moderate
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                        <ShieldCheck className="mr-1 h-3 w-3 inline" /> Normal
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
