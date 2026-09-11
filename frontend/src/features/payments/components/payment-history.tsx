'use client';

import * as React from 'react';
import { History, Receipt, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaymentHistoryRecord } from '../types/payments';
import { PaymentStatusBadge } from './payment-status';

interface PaymentHistoryProps {
  history: PaymentHistoryRecord[];
  isLoading: boolean;
}

export function PaymentHistory({ history, isLoading }: PaymentHistoryProps) {
  if (isLoading) return null;
  if (!history || history.length === 0) return null;

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span>Transaction & Payment History</span>
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {history.length} Transaction{history.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Verified historical payment transactions and Razorpay payment identifiers.
        </CardDescription>
      </CardHeader>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Fee Title</TableHead>
              <TableHead className="text-xs font-semibold">Razorpay Payment ID</TableHead>
              <TableHead className="text-xs font-semibold text-right">Amount (₹)</TableHead>
              <TableHead className="text-xs font-semibold text-center">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((record) => (
              <TableRow key={record.id} className="text-xs">
                <TableCell className="font-mono text-[11px] text-muted-foreground">
                  {record.createdAt}
                </TableCell>
                <TableCell className="font-semibold text-foreground">{record.feeTitle}</TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">
                  {record.razorpayPaymentId || 'N/A'}
                </TableCell>
                <TableCell className="text-right font-bold font-mono text-foreground">
                  ₹{record.amount.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-center">
                  <PaymentStatusBadge status={record.status} />
                </TableCell>
                <TableCell className="text-right">
                  {record.receiptUrl ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-6 text-[10px] px-2 text-primary"
                    >
                      <a href={record.receiptUrl} target="_blank" rel="noopener noreferrer">
                        <Receipt className="mr-1 h-3 w-3 inline" /> Receipt
                        <ExternalLink className="ml-1 h-2.5 w-2.5 inline" />
                      </a>
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">N/A</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
