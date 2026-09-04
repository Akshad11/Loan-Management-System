// Priority LMS Batch 5 — Repayment Mandate (NACH / eMandate) Management Service
import prisma from '../../lib/prisma';
import { AuthContextUser } from '../../lib/serverAuth';

export interface CreateMandatePayload {
  customerId: string;
  loanId?: string;
  bankAccountId?: string;
  provider?: 'NPCI_NACH' | 'E_MANDATE' | 'RAZORPAY' | 'CASHFREE';
  maxAmount: number;
  frequency?: string;
  startDate: string;
  endDate: string;
}

/**
 * Creates a new repayment mandate in CREATED status.
 */
export async function createRepaymentMandate(
  payload: CreateMandatePayload,
  actorUser: AuthContextUser
) {
  const {
    customerId,
    loanId,
    bankAccountId,
    provider = 'NPCI_NACH',
    maxAmount,
    frequency = 'MONTHLY',
    startDate,
    endDate,
  } = payload;

  const count = await prisma.repaymentMandate.count();
  const year = new Date().getFullYear();
  const mandateNumber = `MND-${year}-${String(count + 1).padStart(6, '0')}`;

  return prisma.repaymentMandate.create({
    data: {
      mandateNumber,
      customerId,
      loanId: loanId || null,
      bankAccountId: bankAccountId || null,
      provider,
      maxAmount,
      frequency,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'PENDING',
      providerResponse: {
        createdVia: 'LMS_BANKING_ENGINE',
        initiatedBy: actorUser.name,
      },
    },
  });
}

/**
 * Activates mandate upon confirmation from NPCI / Sponsor Bank.
 */
export async function activateRepaymentMandate(params: {
  mandateId: string;
  umrn: string;
  providerResponse?: any;
  actorUser: AuthContextUser;
}) {
  const { mandateId, umrn, providerResponse, actorUser } = params;

  return prisma.repaymentMandate.update({
    where: { id: mandateId },
    data: {
      status: 'ACTIVE',
      umrn,
      providerResponse: providerResponse || { confirmedBy: actorUser.name, timestamp: new Date().toISOString() },
    },
  });
}

/**
 * Cancels an existing active or pending mandate.
 */
export async function cancelRepaymentMandate(params: {
  mandateId: string;
  reason: string;
  actorUser: AuthContextUser;
}) {
  const { mandateId, reason, actorUser } = params;

  return prisma.repaymentMandate.update({
    where: { id: mandateId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date(),
      cancelledBy: actorUser.name,
    },
  });
}
