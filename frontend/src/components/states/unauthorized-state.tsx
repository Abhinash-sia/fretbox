import * as React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UnauthorizedStateProps extends React.HTMLAttributes<HTMLDivElement> {
  requiredRole?: string;
  onReturn?: () => void;
}

export function UnauthorizedState({
  requiredRole,
  onReturn,
  className,
  ...props
}: UnauthorizedStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[350px] flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center shadow-xs',
        className
      )}
      {...props}
    >
      <div className="mb-4 rounded-full bg-amber-100 p-4 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
      <p className="mt-1 text-xs text-muted-foreground max-w-md">
        You do not have the required operational permissions to access this campus module.
        {requiredRole && (
          <span className="block mt-1 font-medium text-foreground">
            Required Role Level: {requiredRole.toUpperCase()}
          </span>
        )}
      </p>
      {onReturn && (
        <Button variant="default" size="sm" onClick={onReturn} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Permitted Navigation
        </Button>
      )}
    </div>
  );
}
