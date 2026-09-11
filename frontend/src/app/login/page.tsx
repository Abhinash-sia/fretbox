'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const router = useRouter();
  const { login, authError, clearError, isAuthenticated, role } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated && role) {
      router.push(`/${role}/dashboard`);
    }
  }, [isAuthenticated, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    clearError();

    if (!email.trim()) {
      setFieldError('Email address is required.');
      return;
    }

    if (!password) {
      setFieldError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch {
      // Error handled by AuthProvider state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 select-none">
      <div className="w-full max-w-md space-y-4">
        {/* Institutional Header */}
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
            F
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">FRETBOX</h1>
          <p className="text-xs text-muted-foreground font-mono">
            Unified Campus Operations Platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Campus Sign In</CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                JWT Auth
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your institutional credentials to access your assigned operational portal.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 text-xs">
              {(authError || fieldError) && (
                <div className="flex items-start gap-2 rounded-md bg-rose-50 dark:bg-rose-950/40 p-3 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="text-xs font-medium leading-normal">
                    {fieldError || authError}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Institutional Email</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="user@fretbox.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Password</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-3.5 w-3.5" />
                    Sign In to Portal
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Demo Seed Accounts Quick Selector */}
        <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-[11px]">
          <div className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
            Quick Fill Demo Accounts (Password: Password123!)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('student@fretbox.edu')}
              className="text-left p-1.5 rounded bg-muted/50 hover:bg-muted font-mono text-[10px] transition-colors"
            >
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Student:</span> student@fretbox.edu
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('faculty@fretbox.edu')}
              className="text-left p-1.5 rounded bg-muted/50 hover:bg-muted font-mono text-[10px] transition-colors"
            >
              <span className="font-semibold text-blue-600 dark:text-blue-400">Faculty:</span> faculty@fretbox.edu
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('warden@fretbox.edu')}
              className="text-left p-1.5 rounded bg-muted/50 hover:bg-muted font-mono text-[10px] transition-colors"
            >
              <span className="font-semibold text-amber-600 dark:text-amber-400">Warden:</span> warden@fretbox.edu
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@fretbox.edu')}
              className="text-left p-1.5 rounded bg-muted/50 hover:bg-muted font-mono text-[10px] transition-colors"
            >
              <span className="font-semibold text-rose-600 dark:text-rose-400">Admin:</span> admin@fretbox.edu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
