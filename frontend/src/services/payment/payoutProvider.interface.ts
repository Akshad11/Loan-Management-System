// Priority LMS Batch 5 — Payout & Banking Provider Interface
export interface PayoutRequest {
  payoutId: string;
  correlationId: string;
  amount: number;
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  paymentMode: 'NEFT' | 'RTGS' | 'IMPS' | 'UPI' | 'DIRECT_TRANSFER';
  purpose: string;
  idempotencyKey: string;
  sanctionNumber?: string;
  borrowerName?: string;
}

export type PayoutStatus = 'REQUESTED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export interface PayoutResponse {
  status: PayoutStatus;
  payoutId: string;
  correlationId: string;
  providerReference: string;
  utrNumber?: string;
  valueDate: string;
  feeAmount?: number;
  failureReason?: string;
  errorCode?: string;
  isRetryable: boolean;
  rawResponse?: Record<string, any>;
}

export interface IPayoutProvider {
  readonly providerName: string;
  initiatePayout(request: PayoutRequest): Promise<PayoutResponse>;
  checkStatus(payoutId: string, correlationId: string): Promise<PayoutResponse>;
  verifyWebhookSignature(payload: any, signature: string, secret?: string): boolean;
}
