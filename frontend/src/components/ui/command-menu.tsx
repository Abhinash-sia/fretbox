'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAiDrawer } from '@/features/ai/context/ai-drawer-context';

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAction?: (href: string) => void;
}

export function CommandMenu({ open, onOpenChange, onSelectAction }: CommandMenuProps) {
  const { openDrawer: openAiDrawer } = useAiDrawer();
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    if (onSelectAction) {
      onSelectAction(path);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label="Campus command palette" className="overflow-hidden p-0 shadow-lg max-w-xl">
        <CommandPrimitive className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandPrimitive.Input
              aria-label="Campus command palette search input"
              placeholder="Type a command or search campus records..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandPrimitive.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 text-xs">
            <CommandPrimitive.Empty className="py-6 text-center text-xs text-muted-foreground">
              No results found.
            </CommandPrimitive.Empty>
            <CommandPrimitive.Group heading="Campus AI Assistant" className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <CommandPrimitive.Item
                onSelect={() => {
                  onOpenChange(false);
                  openAiDrawer();
                }}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-xs px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground text-primary font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Ask Campus AI Assistant</span>
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>
            <CommandPrimitive.Group heading="Quick Navigation" className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <CommandPrimitive.Item
                onSelect={() => handleSelect('/student/dashboard')}
                className="relative flex cursor-pointer select-none items-center rounded-xs px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <span>Dashboard Overview</span>
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                onSelect={() => handleSelect('/student/attendance')}
                className="relative flex cursor-pointer select-none items-center rounded-xs px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <span>Check Academic Attendance</span>
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                onSelect={() => handleSelect('/student/gate-pass')}
                className="relative flex cursor-pointer select-none items-center rounded-xs px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <span>Apply Gate Pass</span>
              </CommandPrimitive.Item>
              <CommandPrimitive.Item
                onSelect={() => handleSelect('/student/complaints')}
                className="relative flex cursor-pointer select-none items-center rounded-xs px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <span>Register Hostel Complaint</span>
              </CommandPrimitive.Item>
            </CommandPrimitive.Group>
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
