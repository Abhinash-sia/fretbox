import { apiClient } from '@/lib/api/api-client';
import {
  FeeItem,
  PaymentHistoryRecord,
  RazorpayOrderInput,
  RazorpayOrderResponse,
  PaymentVerificationInput,
  PaymentVerificationResponse,
} from '../types/payments';

export const paymentsApi = {
  /**
   * Get student fee dues from backend
   */
  async getMyFees(): Promise<FeeItem[]> {
    try {
      const response = await apiClient.request<FeeItem[] | { fees: FeeItem[] }>('/payments/fees/my');
      return Array.isArray(response) ? response : response.fees || [];
    } catch {
      // Backend provisioning pending for fees API
      return [];
    }
  },

  /**
   * Get payment transaction history
   */
  async getPaymentHistory(): Promise<PaymentHistoryRecord[]> {
    try {
      const response = await apiClient.request<PaymentHistoryRecord[] | { history: PaymentHistoryRecord[] }>('/payments/history');
      return Array.isArray(response) ? response : response.history || [];
    } catch {
      // Backend provisioning pending for payment history API
      return [];
    }
  },

  /**
   * Create Razorpay payment order on Express backend
   */
  async createPaymentOrder(input: RazorpayOrderInput): Promise<RazorpayOrderResponse> {
    return apiClient.request<RazorpayOrderResponse>('/payments/orders', {
      method: 'POST',
      body: input,
    });
  },

  /**
   * Send Razorpay transaction identifiers to backend for HMAC verification
   */
  async verifyPayment(input: PaymentVerificationInput): Promise<PaymentVerificationResponse> {
    return apiClient.request<PaymentVerificationResponse>('/payments/verify', {
      method: 'POST',
      body: input,
    });
  },
};
