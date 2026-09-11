'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, role } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <Badge variant="danger" className="mx-auto font-mono text-[10px] uppercase tracking-wider mb-2">
            HTTP 403 — FORBIDDEN
          </Badge>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Access Denied
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Your authenticated role does not have permission to view this operational resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2 text-xs">
          <div className="rounded-md bg-muted p-3 space-y-1 font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Account:</span>
              <span className="text-foreground font-semibold">{user?.email || 'Authenticated User'}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Assigned Role:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase">{role || 'None'}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Role-based access control (RBAC) is enforced by the backend authority. Contact your campus administrator if you require permissions.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" className="w-full text-xs" onClick={() => router.back()}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Go Back
          </Button>
          <Button variant="default" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => router.push('/')}>
            <Home className="mr-1.5 h-3.5 w-3.5" />
            Main Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
