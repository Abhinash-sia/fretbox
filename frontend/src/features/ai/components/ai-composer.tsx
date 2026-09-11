'use client';

import * as React from 'react';
import { Send, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaqCategory } from '../types/ai';

interface AiComposerProps {
  onSendMessage: (question: string, category?: FaqCategory) => void;
  isLoading: boolean;
  selectedCategory: FaqCategory | 'ALL';
  onCategoryChange: (cat: FaqCategory | 'ALL') => void;
  onClearMessages: () => void;
  hasMessages: boolean;
}

export function AiComposer({
  onSendMessage,
  isLoading,
  selectedCategory,
  onCategoryChange,
  onClearMessages,
  hasMessages,
}: AiComposerProps) {
  const [question, setQuestion] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(
      trimmed,
      selectedCategory === 'ALL' ? undefined : selectedCategory,
    );
    setQuestion('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background p-3 space-y-2">
      {/* Category selector & Clear button bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as FaqCategory | 'ALL')}
            className="h-7 text-xs border border-border/60 bg-muted/30 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          >
            <option value="ALL">All Categories</option>
            <option value={FaqCategory.GENERAL}>General</option>
            <option value={FaqCategory.HOSTEL}>Hostel</option>
            <option value={FaqCategory.ACADEMIC}>Academic</option>
            <option value={FaqCategory.FACILITIES}>Facilities</option>
            <option value={FaqCategory.MESS}>Mess</option>
            <option value={FaqCategory.GATE_PASS}>Gate Pass</option>
          </select>
        </div>

        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearMessages}
            disabled={isLoading}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-rose-500"
            title="Clear current session chat history"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Clear Session
          </Button>
        )}
      </div>

      {/* Input composer form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask campus AI assistant (e.g. hostel rules, library hours)..."
          disabled={isLoading}
          rows={2}
          className="flex-1 resize-none rounded-md border border-input bg-background p-2.5 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />

        <Button
          type="submit"
          disabled={!question.trim() || isLoading}
          size="sm"
          className="h-14 px-3 text-xs shrink-0"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send Question</span>
        </Button>
      </form>
      <div className="flex justify-between items-center text-[10px] text-muted-foreground px-0.5 select-none">
        <span>Press <kbd className="font-mono bg-muted border rounded px-1">Enter</kbd> to send, <kbd className="font-mono bg-muted border rounded px-1">Shift+Enter</kbd> for line break</span>
      </div>
    </div>
  );
}
