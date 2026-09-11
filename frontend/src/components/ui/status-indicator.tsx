import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  label?: string;
  pulse?: boolean;
}

const statusColorMap: Record<StatusType, { dot: string; text: string }> = {
  success: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  warning: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  danger: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
  info: { dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300' },
  neutral: { dot: 'bg-slate-400', text: 'text-muted-foreground' },
};

export function StatusIndicator({
  status,
  label,
  pulse = false,
  className,
  ...props
}: StatusIndicatorProps) {
  const color = statusColorMap[status] || statusColorMap.neutral;

  return (
    <div className={cn('inline-flex items-center gap-2 text-xs font-medium', color.text, className)} {...props}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              color.dot
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', color.dot)} />
      </span>
      {label && <span>{label}</span>}
    </div>
  );
}
