'use client';

import * as React from 'react';
import { ShieldCheck, ShieldAlert, BookOpen, ChevronDown, ChevronUp, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FaqSource } from '../types/ai';

interface AiSourcesCardProps {
  isGrounded: boolean;
  confidence: number;
  sources: FaqSource[];
  provider?: string;
}

export function AiSourcesCard({
  isGrounded,
  confidence,
  sources,
  provider,
}: AiSourcesCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isFallback = provider === 'fallback-retrieval';

  return (
    <div className="mt-3 rounded-md border border-border/60 bg-muted/20 p-2.5 text-xs">
      {/* 1. Header: Grounding Status & Confidence */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          {isGrounded ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Grounded in verified campus records</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Not fully grounded in official documentation</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isFallback && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
              <Server className="mr-1 h-3 w-3" />
              Direct Knowledge Lookup
            </Badge>
          )}

          <Badge
            variant={isGrounded ? 'secondary' : 'outline'}
            className="text-[10px] font-mono tracking-tight"
          >
            Confidence: {(confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>

      {/* 2. Sources Accordion Trigger */}
      {sources && sources.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/40">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-primary" />
              <span>
                {sources.length} Cited Source{sources.length > 1 ? 's' : ''}
              </span>
            </span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Expanded Sources List */}
          {isExpanded && (
            <div className="mt-2 space-y-1.5 pl-1">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="flex items-center justify-between rounded bg-background/80 p-1.5 border border-border/50 text-[11px]"
                >
                  <span className="font-medium text-foreground truncate max-w-[220px]">
                    {src.title}
                  </span>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono px-1 py-0">
                    {src.category}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
