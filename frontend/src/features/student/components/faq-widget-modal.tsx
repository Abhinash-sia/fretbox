'use client';

import * as React from 'react';
import { Sparkles, Send, Loader2, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFaqQuery } from '../hooks/use-student-queries';
import { FaqQueryResponse } from '../types/student';

interface FaqWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaqWidgetModal({ open, onOpenChange }: FaqWidgetModalProps) {
  const [queryText, setQueryText] = React.useState('');
  const [response, setResponse] = React.useState<FaqQueryResponse | null>(null);
  const faqMutation = useFaqQuery();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    try {
      const res = await faqMutation.mutateAsync(queryText.trim());
      setResponse(res);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base flex items-center gap-2">
                <span>Fretbox Campus AI & FAQ Assistant</span>
                <Badge variant="outline" className="font-mono text-[9px] uppercase text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  RAG Grounded
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ask instant questions regarding hostel rules, mess timings, academic guidelines, or gate passes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Response Container */}
          {response && (
            <div className="rounded-lg border border-border bg-muted/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Official Campus Policy Answer
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Confidence: {Math.round((response.confidence || 0.9) * 100)}%
                </span>
              </div>
              <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                {response.answer}
              </p>

              {response.citations && response.citations.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Verified Citations:
                  </p>
                  <div className="space-y-1">
                    {response.citations.map((cite, i) => (
                      <div key={i} className="text-[11px] bg-background/80 p-1.5 rounded border border-border/40">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{cite.title}: </span>
                        <span className="text-muted-foreground">{cite.content || cite.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {faqMutation.isError && (
            <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {faqMutation.error instanceof Error ? faqMutation.error.message : 'Failed to process AI FAQ query.'}
            </div>
          )}

          {/* Query Form */}
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="e.g. What are the hostel night curfew hours?"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="text-xs"
              disabled={faqMutation.isPending}
            />
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={faqMutation.isPending || !queryText.trim()}
            >
              {faqMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
