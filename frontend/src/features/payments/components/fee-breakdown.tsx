'use client';

import * as React from 'react';
import { CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FeeItem, PaymentStatus } from '../types/payments';
import { PaymentStatusBadge } from './payment-status';
import { PaymentUnsupportedCard } from './payment-unsupported-card';

interface FeeBreakdownProps {
  fees: FeeItem[];
  isLoading: boolean;
  onPayFee?: (fee: FeeItem) => void;
  role?: 'student' | 'administrator' | 'warden';
}

export function FeeBreakdown({
  fees,
  isLoading,
  onPayFee,
  role = 'student',
}: FeeBreakdownProps) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card p-6 h-48 animate-pulse text-xs text-muted-foreground">
        Loading fee records...
      </Card>
    );
  }

  if (!fees || fees.length === 0) {
    return <PaymentUnsupportedCard role={role} />;
  }

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>Assessed Student Fee Breakdown</span>
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {fees.length} Item{fees.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Authoritative fee dues assessed by campus administration.
        </CardDescription>
      </CardHeader>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-semibold">Fee Title</TableHead>
              <TableHead className="text-xs font-semibold">Category</TableHead>
              <TableHead className="text-xs font-semibold">Due Date</TableHead>
              <TableHead className="text-xs font-semibold text-right">Amount (₹)</TableHead>
              <TableHead className="text-xs font-semibold text-center">Status</TableHead>
              {onPayFee && <TableHead className="text-xs font-semibold text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.map((fee) => (
              <TableRow key={fee.id} className="text-xs">
                <TableCell className="font-semibold text-foreground">{fee.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {fee.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-[11px]">
                  {fee.dueDate}
                </TableCell>
                <TableCell className="text-right font-bold font-mono text-foreground">
                  ₹{fee.amount.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-center">
                  <PaymentStatusBadge status={fee.status} />
                </TableCell>
                {onPayFee && (
                  <TableCell className="text-right">
                    {fee.status === PaymentStatus.PENDING && (
                      <Button
                        size="sm"
                        onClick={() => onPayFee(fee)}
                        className="h-7 px-2.5 text-xs gap-1"
                      >
                        <CreditCard className="h-3 w-3" /> Pay Now
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
