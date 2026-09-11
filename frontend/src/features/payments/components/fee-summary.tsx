'use client';

import * as React from 'react';
import { CheckCircle, Clock, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FeeItem, PaymentStatus } from '../types/payments';

interface FeeSummaryProps {
  fees: FeeItem[];
}

export function FeeSummary({ fees }: FeeSummaryProps) {
  if (!fees || fees.length === 0) return null;

  const totalAmount = fees.reduce((acc, fee) => acc + fee.amount, 0);
  const paidAmount = fees
    .filter((fee) => fee.status === PaymentStatus.PAID)
    .reduce((acc, fee) => acc + fee.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Billed */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Fees Assessed</span>
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground font-mono">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
        </CardContent>
      </Card>

      {/* Total Paid */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Paid</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{paidAmount.toLocaleString('en-IN')}
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Balance */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Outstanding Balance</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
            ₹{pendingAmount.toLocaleString('en-IN')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
