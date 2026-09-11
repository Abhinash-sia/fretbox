import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments-api';
import {
  FeeItem,
  PaymentHistoryRecord,
  RazorpayOrderInput,
  RazorpayOrderResponse,
  PaymentVerificationInput,
  PaymentVerificationResponse,
} from '../types/payments';

export const FEES_QUERY_KEY = ['payments', 'fees'];
export const HISTORY_QUERY_KEY = ['payments', 'history'];

export function useMyFees() {
  return useQuery<FeeItem[], Error>({
    queryKey: FEES_QUERY_KEY,
    queryFn: () => paymentsApi.getMyFees(),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePaymentHistory() {
  return useQuery<PaymentHistoryRecord[], Error>({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: () => paymentsApi.getPaymentHistory(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatePaymentOrder() {
  return useMutation<RazorpayOrderResponse, Error, RazorpayOrderInput>({
    mutationFn: (input) => paymentsApi.createPaymentOrder(input),
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation<PaymentVerificationResponse, Error, PaymentVerificationInput>({
    mutationFn: (input) => paymentsApi.verifyPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
    },
  });
}
