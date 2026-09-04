// Priority LMS Batch 5 — Core Banking Host-to-Host (NEFT/RTGS/IMPS) Adapter
import crypto from 'crypto';
import { IPayoutProvider, PayoutRequest, PayoutResponse } from './payoutProvider.interface';

export class BankTransferProvider implements IPayoutProvider {
  readonly providerName = 'CORE_BANK_DIRECT';

  private secretKey: string;

  constructor(secretKey: string = process.env.BANK_API_SECRET || 'fintech_bank_secure_h2h_secret_2026') {
    this.secretKey = secretKey;
  }

  async initiatePayout(request: PayoutRequest): Promise<PayoutResponse> {
    const { amount, accountNumber, ifscCode, paymentMode, idempotencyKey, correlationId, payoutId } = request;

    // 1. Validation
    if (!accountNumber || accountNumber.length < 9) {
      return {
        status: 'FAILED',
        payoutId,
        correlationId,
        providerReference: `ERR-${Date.now()}`,
        valueDate: new Date().toISOString().split('T')[0],
        failureReason: 'Invalid beneficiary account number length or format.',
        errorCode: 'INVALID_BENEFICIARY_ACCOUNT',
        isRetryable: false,
      };
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode.toUpperCase())) {
      return {
        status: 'FAILED',
        payoutId,
        correlationId,
        providerReference: `ERR-${Date.now()}`,
        valueDate: new Date().toISOString().split('T')[0],
        failureReason: `Invalid IFSC code "${ifscCode}". Must adhere to RBI 11-character format.`,
        errorCode: 'INVALID_IFSC',
        isRetryable: false,
      };
    }

    // Special testing fail triggers
    if (amount === 99999) {
      return {
        status: 'FAILED',
        payoutId,
        correlationId,
        providerReference: `H2H-FAIL-${Date.now()}`,
        valueDate: new Date().toISOString().split('T')[0],
        failureReason: 'Simulated CBS Core Banking insufficient liquidity response.',
        errorCode: 'CBS_INSUFFICIENT_FUNDS',
        isRetryable: true,
      };
    }

    // For large payments > 50 Lakhs, if RTGS/NEFT selected, generate UTR
    const bankPrefix = ifscCode.substring(0, 4).toUpperCase();
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    const utr = `${bankPrefix}R${dateStr}${randomHex}`;
    const providerReference = `H2H-${Date.now()}-${payoutId.substring(0, 8)}`;

    return {
      status: 'SUCCESS',
      payoutId,
      correlationId,
      providerReference,
      utrNumber: utr,
      valueDate: new Date().toISOString().split('T')[0],
      feeAmount: paymentMode === 'RTGS' ? 25.0 : paymentMode === 'NEFT' ? 5.0 : 2.5,
      isRetryable: false,
      rawResponse: {
        cbsResponseCode: '00',
        cbsResponseMessage: 'TRANSACTION_SETTLED_NEFT_RTGS_IMPS',
        settlementTimestamp: new Date().toISOString(),
        rrn: utr,
      },
    };
  }

  async checkStatus(payoutId: string, correlationId: string): Promise<PayoutResponse> {
    return {
      status: 'SUCCESS',
      payoutId,
      correlationId,
      providerReference: `H2H-STATUS-${Date.now()}`,
      valueDate: new Date().toISOString().split('T')[0],
      isRetryable: false,
    };
  }

  verifyWebhookSignature(payload: any, signature: string, secret?: string): boolean {
    const effectiveSecret = secret || this.secretKey;
    try {
      const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const hmac = crypto.createHmac('sha256', effectiveSecret);
      hmac.update(dataString);
      const expectedSignature = hmac.digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }
}
