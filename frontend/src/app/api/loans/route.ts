import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRepaymentSchedule, roundMoney } from '@/services/loanFinancialService';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const productCode = searchParams.get('productCode');
    const branchId = searchParams.get('branchId');

    const where: any = {};
    if (id) where.id = id;
    if (customerId) where.customerId = customerId;
    if (status && status !== 'ALL') where.status = status;
    if (productCode && productCode !== 'ALL') where.productCode = productCode;
    if (branchId && branchId !== 'ALL') where.branchId = branchId;

    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
        { applicationNumber: { contains: search, mode: 'insensitive' } },
        { customerMobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    const loans = await prisma.loanAccount.findMany({
      where,
      include: {
        scheduleVersions: {
          orderBy: { version: 'desc' },
        },
        schedules: {
          orderBy: { instalmentNumber: 'asc' },
        },
        charges: {
          orderBy: { createdAt: 'asc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
        repaymentSettings: true,
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = loans.map((l: any) => ({
      id: l.id,
      accountNumber: l.accountNumber,
      customerId: l.customerId,
      customerNumber: l.customerNumber || l.customerId,
      customerName: l.customerName,
      customerMobile: l.customerMobile || '',
      customerEmail: l.customerEmail || '',
      customerAddress: l.customerAddress || '',
      applicationId: l.applicationId || '',
      applicationNumber: l.applicationNumber || '',
      approvalId: l.approvalId || '',
      approvalNumber: l.approvalNumber || '',
      sanctionId: l.sanctionId || '',
      sanctionNumber: l.sanctionNumber || '',
      primaryDisbursementId: l.primaryDisbursementId || '',
      primaryDisbursementNumber: l.primaryDisbursementNumber || '',
      productCode: l.productCode,
      productName: l.productName,
      branchId: l.branchId || 'br_panjim',
      branchName: l.branchName || 'Panaji Head Office Branch',
      assignedOfficer: l.assignedOfficer || 'Alex Morgan',
      assignedOfficerId: l.assignedOfficerId || 'usr_officer_01',

      originalPrincipal: Number(l.originalPrincipal),
      sanctionedAmount: Number(l.sanctionedAmount || l.originalPrincipal),
      disbursedPrincipal: Number(l.disbursedPrincipal || l.originalPrincipal),
      principalOutstanding: Number(l.outstandingPrincipal),
      interestOutstanding: Number(l.interestOutstanding || 0),
      feeOutstanding: Number(l.feeOutstanding || 0),
      penaltyOutstanding: Number(l.penaltyOutstanding || 0),
      totalOutstanding: Number(l.totalOutstanding || l.outstandingPrincipal),

      totalPaidAmount: Number(l.totalPaidAmount || 0),
      totalPrincipalPaid: Number(l.totalPrincipalPaid || 0),
      totalInterestPaid: Number(l.totalInterestPaid || 0),
      totalFeesPaid: Number(l.totalFeesPaid || 0),

      overdueAmount: Number(l.overdueAmount || 0),
      dpd: l.dpd || 0,
      dpdBucket: l.dpdBucket || (l.dpd > 90 ? '90+ DPD' : l.dpd > 60 ? '61-90 DPD' : l.dpd > 30 ? '31-60 DPD' : l.dpd > 0 ? '1-30 DPD' : 'CURRENT'),
      status: l.status,

      interestRate: Number(l.interestRate),
      interestMethod: l.interestMethod || 'REDUCING_BALANCE',
      repaymentFrequency: l.repaymentFrequency || 'MONTHLY',
      tenureMonths: l.totalTenureMonths,
      totalInstalments: l.totalInstalments || l.totalTenureMonths,
      remainingInstalments: l.remainingInstalments || l.remainingTenureMonths,
      emiAmount: Number(l.emiAmount),

      disbursementDate: l.disbursementDate,
      loanStartDate: l.loanStartDate || l.disbursementDate,
      firstDueDate: l.firstDueDate || l.nextDueDate,
      maturityDate: l.maturityDate || l.nextDueDate,
      nextDueDate: l.nextDueDate,

      currentScheduleVersion: l.currentScheduleVersion || 1,
      scheduleVersions: l.scheduleVersions?.map((sv: any) => ({
        id: sv.id,
        loanId: sv.loanId,
        version: sv.version,
        reason: sv.reason,
        effectiveDate: sv.effectiveDate,
        totalInstalments: sv.totalInstalments,
        totalPrincipal: Number(sv.totalPrincipal),
        totalInterest: Number(sv.totalInterest),
        totalAmount: Number(sv.totalAmount),
        status: sv.status,
        createdAt: sv.createdAt.toISOString(),
        createdBy: sv.createdBy,
      })) || [],
      schedules: l.schedules?.map((s: any) => ({
        id: s.id,
        loanId: s.loanId,
        versionId: s.versionId,
        versionNumber: s.versionNumber,
        instalmentNumber: s.instalmentNumber,
        dueDate: s.dueDate,
        openingPrincipal: Number(s.openingPrincipal),
        principalDue: Number(s.principalDue),
        interestDue: Number(s.interestDue),
        feesDue: Number(s.feesDue),
        instalmentAmount: Number(s.instalmentAmount),
        closingPrincipal: Number(s.closingPrincipal),
        principalPaid: Number(s.principalPaid),
        interestPaid: Number(s.interestPaid),
        feesPaid: Number(s.feesPaid),
        totalPaid: Number(s.totalPaid),
        outstandingAmount: Number(s.outstandingAmount),
        status: s.status,
        dpd: s.dpd,
        paidDate: s.paidDate || undefined,
        paymentReference: s.paymentReference || undefined,
      })) || [],
      charges: l.charges?.map((c: any) => ({
        id: c.id,
        loanId: c.loanId,
        chargeTypeId: c.chargeTypeId,
        chargeCode: c.chargeCode,
        chargeName: c.chargeName,
        chargeType: c.chargeType,
        calculationType: c.calculationType,
        rateOrValue: Number(c.rateOrValue),
        amount: Number(c.amount),
        taxAmount: Number(c.taxAmount),
        totalAmount: Number(c.totalAmount),
        chargeTiming: c.chargeTiming,
        dueDate: c.dueDate || undefined,
        status: c.status,
        source: c.source,
        createdAt: c.createdAt.toISOString(),
        createdBy: c.createdBy,
      })) || [],
      transactions: l.transactions?.map((t: any) => ({
        id: t.id,
        loanId: t.loanId,
        accountNumber: t.accountNumber,
        transactionReference: t.transactionReference,
        transactionType: t.transactionType,
        amount: Number(t.amount),
        principalPortion: Number(t.principalPortion),
        interestPortion: Number(t.interestPortion),
        feePortion: Number(t.feePortion),
        penaltyPortion: Number(t.penaltyPortion),
        status: t.status,
        referenceId: t.referenceId || undefined,
        utrNumber: t.utrNumber || undefined,
        paymentMethod: t.paymentMethod || undefined,
        notes: t.notes || undefined,
        transactionDate: t.transactionDate,
        createdAt: t.createdAt.toISOString(),
        createdBy: t.createdBy,
      })) || [],
      repaymentSettings: l.repaymentSettings ? {
        id: l.repaymentSettings.id,
        loanId: l.repaymentSettings.loanId,
        repaymentFrequency: l.repaymentSettings.repaymentFrequency,
        paymentMethod: l.repaymentSettings.paymentMethod,
        mandateStatus: l.repaymentSettings.mandateStatus,
        mandateReference: l.repaymentSettings.mandateReference || undefined,
        bankAccountMasked: l.repaymentSettings.bankAccountMasked || undefined,
        bankName: l.repaymentSettings.bankName || undefined,
        ifscCode: l.repaymentSettings.ifscCode || undefined,
        accountHolderName: l.repaymentSettings.accountHolderName || undefined,
        preferredDebitDate: l.repaymentSettings.preferredDebitDate,
        gracePeriodDays: l.repaymentSettings.gracePeriodDays,
        updatedAt: l.repaymentSettings.updatedAt.toISOString(),
        updatedBy: l.repaymentSettings.updatedBy,
      } : undefined,
      history: l.history?.map((h: any) => ({
        id: h.id,
        loanId: h.loanId,
        timestamp: h.timestamp.toISOString(),
        action: h.action,
        actor: h.actor,
        actorName: h.actorName,
        actorRole: h.actorRole,
        previousState: h.previousState || undefined,
        newState: h.newState || undefined,
        amount: h.amount ? Number(h.amount) : undefined,
        reference: h.reference || undefined,
        reason: h.reason || undefined,
        notes: h.notes || undefined,
        metadata: h.metadata || undefined,
      })) || [],

      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    return NextResponse.json(id ? formatted[0] || null : formatted);
  } catch (error: any) {
    console.error('API /loans GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['execute_disbursement', 'manage_customers']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();

    // Idempotency check: Don't create duplicate if sanction/application already has a loan
    if (body.sanctionId || body.applicationId) {
      const existing = await prisma.loanAccount.findFirst({
        where: {
          OR: [
            body.sanctionId ? { sanctionId: body.sanctionId } : undefined,
            body.applicationId ? { applicationId: body.applicationId } : undefined,
            body.accountNumber ? { accountNumber: body.accountNumber } : undefined,
          ].filter(Boolean) as any[],
        },
      });

      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    const count = await prisma.loanAccount.count();
    const accountNumber = body.accountNumber || `LN-2026-${String(count + 1).padStart(6, '0')}`;
    const principal = Number(body.disbursedPrincipal || body.sanctionedAmount || body.originalPrincipal || 0);
    const rate = Number(body.interestRate || 14.0);
    const tenure = Number(body.tenureMonths || body.totalTenureMonths || 36);
    const frequency = body.repaymentFrequency || 'MONTHLY';
    const interestMethod = body.interestMethod || 'REDUCING_BALANCE';
    const startDate = body.disbursementDate || new Date().toISOString().split('T')[0];
    const firstDueDate = body.firstDueDate || new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0];

    // Generate schedule
    const tempLoanId = body.id || `ln_${Date.now()}`;
    const scheduleResult = generateRepaymentSchedule({
      loanId: tempLoanId,
      versionNumber: 1,
      reason: 'Initial schedule created on loan activation.',
      principal,
      annualRate: rate,
      tenureMonths: tenure,
      frequency,
      interestMethod,
      startDate,
      firstDueDate,
      createdBy: body.createdBy || 'Operations Officer',
    });

    let customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
    });

    if (!customer) {
      const customerCount = await prisma.customer.count();
      const customerNumber = body.customerNumber || `CUS-${String(customerCount + 1).padStart(6, '0')}`;
      const name = body.customerName || 'Borrower Customer';
      const parts = name.trim().split(' ');
      const firstName = parts[0] || 'Borrower';
      const lastName = parts.slice(1).join(' ') || 'Customer';

      customer = await prisma.customer.create({
        data: {
          id: body.customerId,
          customerNumber,
          firstName,
          lastName,
          name,
          dateOfBirth: '1990-01-01',
          mobile: body.customerMobile || '9876543210',
          monthlyIncome: 65000,
          branchId: body.branchId || actorUser.branchId || 'br_panjim',
          branchName: body.branchName || actorUser.branchName || 'Panaji Head Office Branch',
          currentAddress: {},
          permanentAddress: {},
        },
      });
    }

    let validApplicationId: string | null = null;
    if (body.applicationId) {
      const appExists = await prisma.loanApplication.findUnique({ where: { id: body.applicationId } });
      if (appExists) validApplicationId = body.applicationId;
    }

    let validSanctionId: string | null = null;
    if (body.sanctionId) {
      const sancExists = await prisma.sanction.findUnique({ where: { id: body.sanctionId } });
      if (sancExists) validSanctionId = body.sanctionId;
    }

    let validDisbursementId: string | null = null;
    if (body.primaryDisbursementId) {
      const disbExists = await prisma.disbursement.findUnique({ where: { id: body.primaryDisbursementId } });
      if (disbExists) validDisbursementId = body.primaryDisbursementId;
    }

    const loan = await prisma.loanAccount.create({
      data: {
        id: body.id || undefined,
        accountNumber,
        customerId: customer.id,
        customerNumber: customer.customerNumber,
        customerName: customer.name,
        customerMobile: body.customerMobile || customer.mobile,
        customerEmail: body.customerEmail || null,
        customerAddress: body.customerAddress || null,
        applicationId: validApplicationId,
        applicationNumber: body.applicationNumber || null,
        approvalId: body.approvalId || null,
        approvalNumber: body.approvalNumber || null,
        sanctionId: validSanctionId,
        sanctionNumber: body.sanctionNumber || null,
        primaryDisbursementId: validDisbursementId,
        primaryDisbursementNumber: body.primaryDisbursementNumber || null,
        productCode: body.productCode || 'PERS_LOAN',
        productName: body.productName || 'Personal Loan',
        branchId: body.branchId || customer.branchId || 'br_panjim',
        branchName: body.branchName || customer.branchName || 'Panaji Head Office Branch',
        assignedOfficer: body.assignedOfficer || 'Alex Morgan',
        assignedOfficerId: body.assignedOfficerId || 'usr_officer_01',

        originalPrincipal: principal,
        sanctionedAmount: body.sanctionedAmount || principal,
        disbursedPrincipal: principal,
        outstandingPrincipal: principal,
        interestOutstanding: 0,
        feeOutstanding: 0,
        penaltyOutstanding: 0,
        totalOutstanding: principal,

        interestRate: rate,
        interestMethod,
        repaymentFrequency: frequency,
        emiAmount: scheduleResult.emiAmount,
        totalTenureMonths: tenure,
        remainingTenureMonths: tenure,
        totalInstalments: scheduleResult.totalInstalments,
        remainingInstalments: scheduleResult.totalInstalments,

        disbursementDate: startDate,
        loanStartDate: startDate,
        firstDueDate,
        maturityDate: scheduleResult.maturityDate,
        nextDueDate: firstDueDate,

        dpd: 0,
        dpdBucket: 'CURRENT',
        overdueAmount: 0,
        status: (body.status as any) || 'ACTIVE',
        currentScheduleVersion: 1,
        createdBy: body.createdBy || 'Operations Officer',
      },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error: any) {
    console.error('API /loans POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
