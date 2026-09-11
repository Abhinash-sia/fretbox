'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { UserRole } from '@/config/navigation.config';
import { TableSkeleton } from '@/components/states/loading-skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-4">
          <TableSkeleton rows={4} />
          <p className="text-center text-xs text-muted-foreground font-mono">
            Verifying Fretbox session & security tokens...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    router.push('/unauthorized');
    return null;
  }

  return <>{children}</>;
}
