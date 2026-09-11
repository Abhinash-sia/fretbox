'use client';

import * as React from 'react';
import { CheckCircle, Clock, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatus } from '../types/payments';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  switch (status) {
    case PaymentStatus.PAID:
      return (
        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          <CheckCircle className="mr-1 h-3 w-3 inline" /> Paid
        </Badge>
      );
    case PaymentStatus.PROCESSING:
    case PaymentStatus.CREATED:
      return (
        <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-500/30">
          <RefreshCw className="mr-1 h-3 w-3 inline animate-spin" /> Verification Pending
        </Badge>
      );
    case PaymentStatus.PENDING:
      return (
        <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
          <Clock className="mr-1 h-3 w-3 inline" /> Unpaid / Due
        </Badge>
      );
    case PaymentStatus.FAILED:
      return (
        <Badge variant="secondary" className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
          <AlertCircle className="mr-1 h-3 w-3 inline" /> Payment Failed
        </Badge>
      );
    case PaymentStatus.CANCELLED:
      return (
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          <XCircle className="mr-1 h-3 w-3 inline" /> Cancelled
        </Badge>
      );
    case PaymentStatus.REFUNDED:
      return (
        <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
          Refunded
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          {status}
        </Badge>
      );
  }
}
