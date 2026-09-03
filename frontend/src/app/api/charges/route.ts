import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateChargeAmount, recalculateLoanBalances } from '@/services/chargeAdjustmentEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ["view_loans","view_repayments"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loanId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const chargeType = searchParams.get('chargeType');
    const search = searchParams.get('search');

    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;
    if (status && status !== 'ALL') where.status = status;
    if (chargeType && chargeType !== 'ALL') where.chargeType = chargeType;

    if (search) {
      where.OR = [
        { chargeNumber: { contains: search, mode: 'insensitive' } },
        { chargeName: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const charges = await prisma.loanCharge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        loan: {
          select: {
            id: true,
            accountNumber: true,
            customerName: true,
            status: true,
            feeOutstanding: true,
            penaltyOutstanding: true,
          },
        },
      },
    });

    const allCharges = await prisma.loanCharge.findMany();
    const totalLevied = allCharges.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
    const totalOutstanding = allCharges
      .filter((c) => c.status === 'APPLIED' || c.status === 'PARTIALLY_PAID')
      .reduce((sum, c) => sum + Number(c.outstandingAmount ?? c.totalAmount ?? 0), 0);

    return NextResponse.json({
      charges,
      kpis: {
        totalLevied,
        totalOutstanding,
        chargesCount: allCharges.length,
      },
    });
  } catch (error: any) {
    console.error('API /charges GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_repayments');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const {
      loanId,
      chargeCode,
      chargeName,
      chargeType,
      customAmount,
      taxPercentage = 18.0,
      dueDate,
      sourceEvent,
      eventReferenceId,
      notes,
      createdBy,
    } = body;

    if (!loanId) {
      return NextResponse.json({ error: 'Loan ID is required.' }, { status: 400 });
    }

    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id: loanId }, { accountNumber: loanId }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found.' }, { status: 404 });
    }

    // Idempotency check: If eventReferenceId provided and charge already exists for this event
    if (eventReferenceId) {
      const existing = await prisma.loanCharge.findFirst({
        where: { loanId: loan.id, eventReferenceId },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Charge already exists for event ${eventReferenceId}. Duplicate charge prevented.` },
          { status: 409 }
        );
      }
    }

    // Calculate charge and tax
    const { baseAmount, taxAmount, totalAmount } = calculateChargeAmount({
      config: {
        calculationBasis: 'FIXED_AMOUNT',
        rateOrValue: customAmount || 500,
        taxPercentage,
      },
      loan: loan as any,
      customAmount,
    });

    const count = await prisma.loanCharge.count();
    const chargeNumber = `CHG-${new Date().getFullYear()}-${String(count + 101).padStart(6, '0')}`;
    const txCount = await prisma.loanTransaction.count();
    const txnReference = `TXN-CHG-${new Date().getFullYear()}-${String(txCount + 101).padStart(6, '0')}`;

    const isPenalty = chargeType === 'LATE_PAYMENT_FEE' || chargeCode.includes('PENALTY') || chargeCode.includes('LATE');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Charge
      const createdCharge = await tx.loanCharge.create({
        data: {
          chargeNumber,
          loanId: loan.id,
          customerId: loan.customerId,
          accountNumber: loan.accountNumber,
          customerName: loan.customerName,
          chargeCode,
          chargeName: chargeName || 'Loan Fee / Penalty',
          chargeType: chargeType || 'OTHER_FEE',
          calculationType: 'FIXED',
          rateOrValue: baseAmount,
          sourceEvent: sourceEvent || 'MANUAL_ASSESSMENT',
          eventReferenceId,
          amount: baseAmount,
          taxAmount,
          totalAmount,
          paidAmount: 0,
          waivedAmount: 0,
          outstandingAmount: totalAmount,
          status: 'APPLIED',
          dueDate: dueDate || loan.nextDueDate,
          source: 'CHARGE_ENGINE',
          notes,
          createdBy: createdBy || 'Operations Officer',
        },
      });

      // 2. Recalculate and update Loan Balances
      const balanceDelta = isPenalty
        ? { penaltyDelta: totalAmount }
        : { feeDelta: totalAmount };

      const updatedBalances = recalculateLoanBalances(loan as any, balanceDelta);

      await tx.loanAccount.update({
        where: { id: loan.id },
        data: {
          feeOutstanding: updatedBalances.feeOutstanding,
          penaltyOutstanding: updatedBalances.penaltyOutstanding,
          totalOutstanding: updatedBalances.totalOutstanding,
        },
      });

      // 3. Create Loan Transaction
      await tx.loanTransaction.create({
        data: {
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          transactionReference: txnReference,
          transactionType: isPenalty ? 'PENALTY_LEVIED' : 'FEE_LEVIED',
          amount: totalAmount,
          principalPortion: 0,
          interestPortion: 0,
          feePortion: isPenalty ? 0 : totalAmount,
          penaltyPortion: isPenalty ? totalAmount : 0,
          status: 'SUCCESSFUL',
          transactionDate: new Date().toISOString().split('T')[0],
          createdBy: createdBy || 'Operations Officer',
          notes: `${createdCharge.chargeName} applied (${createdCharge.chargeNumber}).`,
        },
      });

      // 4. Log Loan History
      await tx.loanHistory.create({
        data: {
          loanId: loan.id,
          action: isPenalty ? 'PENALTY_LEVIED' : 'FEE_LEVIED',
          actor: createdBy || 'Operations Officer',
          actorName: createdBy || 'Operations Officer',
          actorRole: 'Operations Officer',
          previousState: `Total Dues: ₹${loan.totalOutstanding}`,
          newState: `Total Dues: ₹${updatedBalances.totalOutstanding}`,
          amount: totalAmount,
          reference: chargeNumber,
          notes: `Applied ${createdCharge.chargeName} for ₹${totalAmount}.`,
        },
      });

      return createdCharge;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('API /charges POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
