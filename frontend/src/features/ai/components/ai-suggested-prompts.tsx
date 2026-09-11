'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { FaqCategory } from '../types/ai';

interface AiSuggestedPromptsProps {
  onSelectPrompt: (prompt: string, category?: FaqCategory) => void;
}

const ROLE_PROMPTS: Record<
  string,
  Array<{ text: string; category: FaqCategory }>
> = {
  student: [
    { text: 'What are the hostel night curfew hours?', category: FaqCategory.HOSTEL },
    { text: 'What is the mess menu and feedback process?', category: FaqCategory.MESS },
    { text: 'How do I apply for an outstation gate pass?', category: FaqCategory.GATE_PASS },
    { text: 'What is the minimum attendance requirement?', category: FaqCategory.ACADEMIC },
  ],
  faculty: [
    { text: 'What are the official campus academic grading rules?', category: FaqCategory.ACADEMIC },
    { text: 'How are attendance correction requests processed?', category: FaqCategory.ACADEMIC },
    { text: 'What are the library hours and access guidelines?', category: FaqCategory.FACILITIES },
  ],
  warden: [
    { text: 'What are the hostel room allocation & vacating guidelines?', category: FaqCategory.HOSTEL },
    { text: 'What is the procedure for handling urgent maintenance complaints?', category: FaqCategory.FACILITIES },
    { text: 'What are the visitor and night entry gate rules?', category: FaqCategory.GATE_PASS },
  ],
  security: [
    { text: 'What are the student entry and gate pass verification protocols?', category: FaqCategory.GATE_PASS },
    { text: 'What are the emergency contact guidelines for security post?', category: FaqCategory.GENERAL },
  ],
  staff: [
    { text: 'What are the facility inspection and maintenance response timelines?', category: FaqCategory.FACILITIES },
    { text: 'What is the procedure for reporting campus infrastructure damage?', category: FaqCategory.FACILITIES },
  ],
  administrator: [
    { text: 'What are the overall campus operational policies and FAQs?', category: FaqCategory.GENERAL },
    { text: 'What are the fee payment and hostel deposit rules?', category: FaqCategory.GENERAL },
    { text: 'What is the approved procedure for updating campus knowledge documents?', category: FaqCategory.GENERAL },
  ],
};

export function AiSuggestedPrompts({ onSelectPrompt }: AiSuggestedPromptsProps) {
  const { role } = useAuth();
  const currentRole = (role || 'student').toLowerCase();
  const prompts = ROLE_PROMPTS[currentRole] || ROLE_PROMPTS.student;

  return (
    <div className="my-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground select-none">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span>Suggested starter questions for {currentRole}:</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {prompts.map((item, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            onClick={() => onSelectPrompt(item.text, item.category)}
            className="h-auto py-1.5 px-2.5 text-left text-xs font-normal border-border/70 hover:border-primary/50 hover:bg-muted/50 rounded-md transition-colors"
          >
            {item.text}
          </Button>
        ))}
      </div>
    </div>
  );
}
