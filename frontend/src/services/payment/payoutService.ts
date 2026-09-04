// Priority LMS Batch 5 — Payout Orchestration & Provider Registry Service
import { IPayoutProvider, PayoutRequest, PayoutResponse } from './payoutProvider.interface';
import { BankTransferProvider } from './bankTransferProvider';
import { GatewayPayoutProvider } from './gatewayPayoutProvider';

const providerRegistry: Record<string, IPayoutProvider> = {
  CORE_BANK_DIRECT: new BankTransferProvider(),
  GATEWAY_PAYOUT_API: new GatewayPayoutProvider(),
  DEFAULT: new BankTransferProvider(),
};

/**
 * Returns payout provider instance from registry.
 */
export function getPayoutProvider(providerName?: string): IPayoutProvider {
  if (providerName && providerRegistry[providerName.toUpperCase()]) {
    return providerRegistry[providerName.toUpperCase()];
  }
  return providerRegistry.DEFAULT;
}

/**
 * Executes an idempotent payout dispatch to the configured payment provider.
 */
export async function executePayout(
  request: PayoutRequest,
  providerName?: string
): Promise<PayoutResponse> {
  const provider = getPayoutProvider(providerName);

  // Maximum retry attempts for transient network failures
  const maxRetries = 2;
  let attempt = 0;
  let lastResponse: PayoutResponse | null = null;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      const response = await provider.initiatePayout(request);
      lastResponse = response;

      // If successful or non-retryable terminal failure (e.g. invalid account), return immediately
      if (response.status === 'SUCCESS' || response.status === 'PROCESSING' || !response.isRetryable) {
        return response;
      }

      // If retryable failure and attempts remain, delay briefly
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    } catch (err: any) {
      lastResponse = {
        status: 'FAILED',
        payoutId: request.payoutId,
        correlationId: request.correlationId,
        providerReference: `EXC-${Date.now()}`,
        valueDate: new Date().toISOString().split('T')[0],
        failureReason: err.message || 'Unknown network exception during provider payout call',
        isRetryable: true,
      };

      if (attempt > maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }

  return (
    lastResponse || {
      status: 'FAILED',
      payoutId: request.payoutId,
      correlationId: request.correlationId,
      providerReference: `TIMEOUT-${Date.now()}`,
      valueDate: new Date().toISOString().split('T')[0],
      failureReason: 'Provider payout call timed out after max retries.',
      isRetryable: false,
    }
  );
}
