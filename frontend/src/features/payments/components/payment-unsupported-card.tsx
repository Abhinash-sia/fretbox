'use client';

import * as React from 'react';
import { CreditCard, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentUnsupportedCardProps {
  role: 'student' | 'administrator' | 'warden';
}

export function PaymentUnsupportedCard({ role }: PaymentUnsupportedCardProps) {
  return (
    <Card className="border-border max-w-2xl mx-auto my-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400 border-amber-500/30">
            Backend Provisioning Pending (Phase B10.2)
          </Badge>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>
        <CardTitle className="text-base font-bold text-foreground mt-2">
          {role === 'student' ? 'Student Fee & Razorpay Gateway' : 'Campus Financial Ledger & Fee Management'}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Official Fretbox payment processing architecture, fee ledger models, and Razorpay HMAC signature verification gateway.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-xs pt-1">
        {/* Security Rules Box */}
        <div className="rounded-lg bg-muted/40 p-3.5 border border-border space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Fretbox Payment Security & Financial Compliance Policy</span>
          </div>

          <ul className="space-y-1.5 text-muted-foreground text-[11px] list-disc list-inside">
            <li>
              <strong>Backend Authoritative Amounts</strong>: Final fee dues and order amounts are calculated strictly on the Express server. The frontend never determines payable balances independently.
            </li>
            <li>
              <strong>Server-Side HMAC Verification</strong>: Razorpay signatures (`razorpay_signature`) must be cryptographically verified using server-side HMAC SHA-256 before marking transactions as paid.
            </li>
            <li>
              <strong>No-Mock Policy</strong>: Fretbox never fabricates fake Razorpay orders, mock receipts, or synthetic transaction records when backend payment endpoints are pending.
            </li>
          </ul>
        </div>

        {/* Operational Status Notice */}
        <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            The backend Razorpay order creation (`POST /api/v1/payments/orders`) and verification (`POST /api/v1/payments/verify`) endpoints are scheduled for Backend Phase B10.2 integration.
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span>Environment: Production Hardened</span>
          </span>
          <span>Role Scope: {role.toUpperCase()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
