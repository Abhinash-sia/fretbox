'use client';

import * as React from 'react';
import { Info, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UnsupportedFeatureCardProps {
  featureName: string;
  backendPhase: string;
  description: string;
}

export function UnsupportedFeatureCard({
  featureName,
  backendPhase,
  description,
}: UnsupportedFeatureCardProps) {
  return (
    <Card className="border-border shadow-xs max-w-2xl mx-auto my-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400 border-amber-500/30">
            Backend Provisioning Pending ({backendPhase})
          </Badge>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Info className="h-4 w-4" />
          </div>
        </div>
        <CardTitle className="text-base font-bold text-foreground mt-2">
          {featureName} Service Unavailable
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs pt-1">
        <div className="rounded-md bg-muted/60 p-3 space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            <span>Fretbox No-Mock Operational Policy</span>
          </div>
          <p className="text-muted-foreground text-[10px] leading-relaxed">
            Fretbox enforces real backend API contract compliance. Frontend components never fabricate mock statistics or synthetic financial records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
