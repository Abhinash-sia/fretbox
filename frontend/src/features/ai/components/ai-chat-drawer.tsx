'use client';

import * as React from 'react';
import { Sparkles, Bot, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAiDrawer } from '../context/ai-drawer-context';
import { useFaqQueryMutation } from '../hooks/use-ai-query';
import { FaqCategory } from '../types/ai';
import { AiMessageBubble } from './ai-message-bubble';
import { AiSuggestedPrompts } from './ai-suggested-prompts';
import { AiComposer } from './ai-composer';

export function AiChatDrawer() {
  const {
    isOpen,
    closeDrawer,
    selectedCategory,
    setSelectedCategory,
    messages,
    addMessage,
    clearMessages,
  } = useAiDrawer();

  const queryMutation = useFaqQueryMutation();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [lastAskedQuestion, setLastAskedQuestion] = React.useState<{
    question: string;
    category?: FaqCategory;
  } | null>(null);

  // Auto-scroll to bottom of chat list
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, queryMutation.isPending]);

  const handleSendQuestion = (question: string, category?: FaqCategory) => {
    // 1. Add user message to local transient session state
    addMessage({
      role: 'user',
      text: question,
    });

    setLastAskedQuestion({ question, category });

    // 2. Trigger RAG backend mutation
    queryMutation.mutate(
      {
        question,
        category,
      },
      {
        onSuccess: (data) => {
          addMessage({
            role: 'assistant',
            text: data.answer,
            queryResult: data,
          });
        },
        onError: (err) => {
          addMessage({
            role: 'assistant',
            text: 'I encountered an error retrieving campus information.',
            error: err.message || 'Network error or backend AI service unavailable.',
          });
        },
      },
    );
  };

  const handleRetry = () => {
    if (lastAskedQuestion) {
      handleSendQuestion(lastAskedQuestion.question, lastAskedQuestion.category);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-md p-0 sm:border-l border-border bg-background shadow-xl h-full"
      >
        {/* 1. Header */}
        <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0 select-none bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-sm font-bold flex items-center gap-1.5">
                Campus AI Assistant
                <Badge variant="outline" className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <ShieldCheck className="mr-0.5 h-3 w-3 inline" /> RAG Grounded
                </Badge>
              </SheetTitle>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Official Fretbox operational & campus knowledge lookup
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close drawer</span>
          </Button>
        </SheetHeader>

        {/* 2. Chat Area */}
        <div ref={scrollRef} aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Welcome Card & Starter Suggestions if no messages */}
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-3.5 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Welcome to Campus Operational AI</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Ask questions regarding campus policies, hostel rules, mess timings, academic guidelines, or gate pass workflows. Answers are synthesized strictly from approved campus knowledge records.
                </p>
              </div>

              <AiSuggestedPrompts
                onSelectPrompt={(prompt, cat) => handleSendQuestion(prompt, cat)}
              />
            </div>
          )}

          {/* Message List */}
          {messages.map((msg) => (
            <AiMessageBubble key={msg.id} message={msg} />
          ))}

          {/* Honest Operational Loading State */}
          {queryMutation.isPending && (
            <div className="flex items-center gap-2 py-3 px-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Searching verified campus knowledge records...</span>
            </div>
          )}

          {/* Retry Action if mutation failed */}
          {queryMutation.isError && (
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs">
              <span className="text-rose-600 dark:text-rose-400">Failed to complete AI query</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="h-6 text-[10px] border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
              >
                <RefreshCw className="mr-1 h-3 w-3" /> Retry
              </Button>
            </div>
          )}
        </div>

        {/* 3. Footer Composer */}
        <AiComposer
          onSendMessage={handleSendQuestion}
          isLoading={queryMutation.isPending}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onClearMessages={clearMessages}
          hasMessages={messages.length > 0}
        />
      </SheetContent>
    </Sheet>
  );
}
