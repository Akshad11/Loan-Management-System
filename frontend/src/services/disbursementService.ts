import {
  DisbursementRecord,
  DisbursementRequestRecord,
  DisbursementReadinessResult,
  DisbursementBeneficiaryRecord,
  DisbursementTransactionRecord,
  PaymentMethod,
} from '../types/disbursementTypes';

class DisbursementApiService {
  private baseUrl = '/api/disbursements';

  public async getDisbursements(filters?: Record<string, string>): Promise<DisbursementRecord[]> {
    try {
      const query = filters ? new URLSearchParams(filters).toString() : '';
      const response = await fetch(`${this.baseUrl}${query ? `?${query}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch disbursements');
      return await response.json();
    } catch (error) {
      console.warn('API /api/disbursements fetch failed, using local store data:', error);
      return [];
    }
  }

  public async getDisbursementById(id: string): Promise<DisbursementRecord | null> {
    try {
      const response = await fetch(`${this.baseUrl}?id=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error('Disbursement not found');
      return await response.json();
    } catch (error) {
      console.warn('API /api/disbursements?id= failed:', error);
      return null;
    }
  }

  public async getReadiness(sanctionId: string): Promise<DisbursementReadinessResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/readiness?sanctionId=${encodeURIComponent(sanctionId)}`);
      if (!response.ok) throw new Error('Failed to evaluate readiness');
      return await response.json();
    } catch (error) {
      console.warn('API /api/disbursements/readiness failed:', error);
      return null;
    }
  }

  public async createRequest(data: {
    sanctionId: string;
    requestedAmount: number;
    disbursementType: 'FULL' | 'PARTIAL';
    beneficiaryId?: string;
    newBeneficiary?: any;
    paymentMethod: PaymentMethod;
    purpose?: string;
    notes?: string;
    actorName: string;
    actorRole: string;
    actorId: string;
  }): Promise<DisbursementRecord> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create disbursement request');
    }

    return await response.json();
  }

  public async executeAction(
    disbursementId: string,
    action: 'ASSIGN' | 'APPROVE' | 'REJECT' | 'RETURN',
    payload: {
      requestId: string;
      actorName: string;
      actorRole: string;
      assignedToId?: string;
      assignedToName?: string;
      notes?: string;
      reason?: string;
    }
  ): Promise<DisbursementRecord> {
    const response = await fetch(`${this.baseUrl}/${encodeURIComponent(disbursementId)}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to execute action ${action}`);
    }

    return await response.json();
  }

  public async executeTransaction(
    disbursementId: string,
    payload: {
      requestId: string;
      paymentMethod: PaymentMethod;
      utrNumber?: string;
      externalReference?: string;
      simulateFailure?: boolean;
      failureReason?: string;
      actorName: string;
      actorRole: string;
    }
  ): Promise<DisbursementRecord> {
    const response = await fetch(`${this.baseUrl}/${encodeURIComponent(disbursementId)}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to process transaction');
    }

    return await response.json();
  }

  public async reverseTransaction(
    disbursementId: string,
    payload: {
      transactionId: string;
      reason: string;
      actorName: string;
      actorRole: string;
    }
  ): Promise<DisbursementRecord> {
    const response = await fetch(`${this.baseUrl}/${encodeURIComponent(disbursementId)}/transactions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to reverse transaction');
    }

    return await response.json();
  }
}

export const disbursementApiService = new DisbursementApiService();
