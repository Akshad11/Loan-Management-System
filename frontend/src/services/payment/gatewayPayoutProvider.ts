// Priority LMS Batch 5 — Payment Gateway Payout Adapter (e.g. RazorpayX / Cashfree)
import crypto from 'crypto';
import { IPayoutProvider, PayoutRequest, PayoutResponse } from './payoutProvider.interface';

export class GatewayPayoutProvider implements IPayoutProvider {
  readonly providerName = 'GATEWAY_PAYOUT_API';

  private webhookSecret: string;

  constructor(webhookSecret: string = process.env.PAYOUT_GATEWAY_SECRET || 'fintech_gateway_payout_secret_2026') {
    this.webhookSecret = webhookSecret;
  }

  async initiatePayout(request: PayoutRequest): Promise<PayoutResponse> {
    const { amount, accountNumber, ifscCode, correlationId, payoutId } = request;

    if (!accountNumber || !ifscCode) {
      return {
        status: 'FAILED',
        payoutId,
        correlationId,
        providerReference: `GW-ERR-${Date.now()}`,
        valueDate: new Date().toISOString().split('T')[0],
        failureReason: 'Missing bank account or IFSC.',
        errorCode: 'GATEWAY_PARAM_MISSING',
        isRetryable: false,
      };
    }

    // Special trigger for async processing test
    if (amount === 55555) {
      return {
        status: 'PROCESSING',
        payoutId,
        correlationId,
        providerReference: `pout_${Date.now()}_async`,
        valueDate: new Date().toISOString().split('T')[0],
        isRetryable: false,
        rawResponse: {
          gatewayStatus: 'queued',
          message: 'Payout queued for clearing window batch release.',
        },
      };
    }

    const gatewayPayoutId = `pout_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const utr = `CMS${Date.now().toString().slice(-10)}${Math.floor(100 + Math.random() * 900)}`;

    return {
      status: 'SUCCESS',
      payoutId,
      correlationId,
      providerReference: gatewayPayoutId,
      utrNumber: utr,
      valueDate: new Date().toISOString().split('T')[0],
      feeAmount: 10.0,
      isRetryable: false,
      rawResponse: {
        id: gatewayPayoutId,
        entity: 'payout',
        fund_account: { id: `fa_${Date.now()}` },
        amount: Math.round(amount * 100),
        currency: 'INR',
        status: 'processed',
        utr,
      },
    };
  }

  async checkStatus(payoutId: string, correlationId: string): Promise<PayoutResponse> {
    return {
      status: 'SUCCESS',
      payoutId,
      correlationId,
      providerReference: `pout_check_${payoutId}`,
      valueDate: new Date().toISOString().split('T')[0],
      isRetryable: false,
    };
  }

  verifyWebhookSignature(payload: any, signature: string, secret?: string): boolean {
    const effectiveSecret = secret || this.webhookSecret;
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
