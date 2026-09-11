import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string;
  subheading?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  heading,
  subheading,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4 mb-6',
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          {heading}
        </h1>
        {subheading && (
          <p className="text-xs md:text-sm text-muted-foreground">{subheading}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
