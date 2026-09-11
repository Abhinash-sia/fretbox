'use client';

import * as React from 'react';
import { Bot, User, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '../types/ai';
import { AiSourcesCard } from './ai-sources-card';

interface AiMessageBubbleProps {
  message: ChatMessage;
}

export function AiMessageBubble({ message }: AiMessageBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex w-full items-start gap-2.5 py-2 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border border-border'
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
      </div>

      {/* Bubble Container */}
      <div className={`flex max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative rounded-lg px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-none font-medium'
              : 'bg-card border border-border text-card-foreground rounded-tl-none'
          }`}
        >
          {/* Text Message */}
          <div className="whitespace-pre-wrap break-words">{message.text}</div>

          {/* Copy Button for Assistant */}
          {!isUser && !message.error && (
            <div className="mt-1.5 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                title="Copy response text"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          )}
        </div>

        {/* Error Alert Box */}
        {message.error && (
          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 p-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{message.error}</span>
          </div>
        )}

        {/* Grounding and Sources Card for Assistant Query Results */}
        {!isUser && message.queryResult && (
          <div className="w-full">
            <AiSourcesCard
              isGrounded={message.queryResult.isGrounded}
              confidence={message.queryResult.confidence}
              sources={message.queryResult.sources}
              provider={message.queryResult.provider}
            />
          </div>
        )}

        {/* Timestamp */}
        <span className="mt-1 text-[10px] text-muted-foreground select-none px-1">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
}
