export enum PaymentStatus {
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum FeeCategory {
  TUITION = 'TUITION',
  HOSTEL = 'HOSTEL',
  MESS = 'MESS',
  LIBRARY = 'LIBRARY',
  LABORATORY = 'LABORATORY',
  OTHER = 'OTHER',
}

export interface FeeItem {
  id: string;
  title: string;
  category: FeeCategory;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  academicYear?: string;
  semester?: number;
}

export interface RazorpayOrderInput {
  feeId: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface PaymentVerificationInput {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: PaymentStatus;
  transactionId?: string;
  message?: string;
}

export interface PaymentHistoryRecord {
  id: string;
  feeTitle: string;
  amount: number;
  status: PaymentStatus;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  receiptUrl?: string;
}
