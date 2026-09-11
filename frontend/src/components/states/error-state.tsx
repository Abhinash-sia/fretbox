import * as React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'System Error Encountered',
  message,
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[250px] flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50/50 p-6 text-center dark:border-rose-950/60 dark:bg-rose-950/20',
        className
      )}
      {...props}
    >
      <div className="mb-3 rounded-full bg-rose-100 p-3 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200">{title}</h3>
      <p className="mt-1 text-xs text-rose-700 dark:text-rose-400 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 border-rose-300 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300">
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Retry Operation
        </Button>
      )}
    </div>
  );
}
