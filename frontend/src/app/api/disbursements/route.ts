import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { executePreDisbursementGatekeeper } from '@/services/disbursement/preDisbursementGatekeeper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_disbursements');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const sanctionId = searchParams.get('sanctionId');
    const applicationId = searchParams.get('applicationId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const productCode = searchParams.get('productCode');

    // Single item query
    if (id || sanctionId || applicationId) {
      const disbursement = await prisma.disbursement.findFirst({
        where: id
          ? { OR: [{ id }, { disbursementNumber: id }] }
          : sanctionId
          ? { sanctionId }
          : { applicationId: applicationId! },
        include: {
          requests: true,
          beneficiaries: true,
          transactions: true,
          history: { orderBy: { timestamp: 'desc' } },
        },
      });

      if (!disbursement) {
        return NextResponse.json({ error: 'Disbursement record not found' }, { status: 404 });
      }

      return NextResponse.json(formatDisbursement(disbursement));
    }

    // List query with filters
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }
    if (productCode && productCode !== 'ALL') {
      where.productCode = productCode;
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
        { applicationNumber: { contains: search, mode: 'insensitive' } },
        { sanctionNumber: { contains: search, mode: 'insensitive' } },
        { disbursementNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const disbursements = await prisma.disbursement.findMany({
      where,
      include: {
        requests: true,
        beneficiaries: true,
        transactions: true,
        history: { orderBy: { timestamp: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(disbursements.map(formatDisbursement));
  } catch (error: any) {
    console.error('API /api/disbursements GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'execute_disbursement');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const {
      sanctionId,
      disbursementType = 'FULL',
      requestedAmount,
      targetDisbursementDate,
      paymentMode = 'NEFT',
      paymentMethod = 'NEFT',
      debitAccountId,
      beneficiaryId,
      newBeneficiary,
      purpose,
      notes,
      actorName = actorUser.name,
      actorRole = actorUser.roleName,
      actorId = actorUser.id,
    } = body;

    if (!sanctionId) {
      return NextResponse.json({ error: 'sanctionId is required' }, { status: 400 });
    }

    const parsedAmount = Number(requestedAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: 'requestedAmount must be greater than zero' }, { status: 400 });
    }

    // Fetch sanction
    const sanction = await prisma.sanction.findUnique({
      where: { id: sanctionId },
      include: {
        application: true,
        conditions: true,
      },
    });

    if (!sanction) {
      return NextResponse.json({ error: 'Sanction not found' }, { status: 404 });
    }

    if (sanction.status !== 'SANCTIONED') {
      return NextResponse.json(
        { error: `Cannot create disbursement for sanction with status "${sanction.status}". Sanction must be confirmed first.` },
        { status: 400 }
      );
    }

    // Validate pre-disbursement compliance gates
    if (sanction.applicationId) {
      const gateResult = await executePreDisbursementGatekeeper(sanction.applicationId);
      if (!gateResult.isEligible) {
        return NextResponse.json(
          {
            error: 'Pre-disbursement compliance check failed.',
            blockingReasons: gateResult.blockingReasons,
            checks: gateResult.checks,
          },
          { status: 422 }
        );
      }
    }

    // Find or create top-level disbursement record
    let disbursement = await prisma.disbursement.findFirst({
      where: { sanctionId },
      include: {
        requests: true,
        beneficiaries: true,
        transactions: true,
      },
    });

    const sanctionApprovedAmount = Number(sanction.approvedAmount);

    if (!disbursement) {
      const dsbCount = await prisma.disbursement.count();
      const dsbNumber = `DSB-2026-${String(dsbCount + 101).padStart(6, '0')}`;

      disbursement = await prisma.disbursement.create({
        data: {
          disbursementNumber: dsbNumber,
          applicationId: sanction.applicationId,
          applicationNumber: sanction.applicationNumber,
          sanctionId: sanction.id,
          sanctionNumber: sanction.sanctionNumber,
          customerId: sanction.customerId,
          customerNumber: sanction.customerNumber,
          customerName: sanction.customerName,
          customerMobile: sanction.customerMobile,
          productCode: sanction.productCode,
          productName: sanction.productName,
          branchId: sanction.branchId,
          branchName: sanction.branchName,
          sanctionAmount: sanctionApprovedAmount,
          totalDisbursedAmount: 0,
          remainingAmount: sanctionApprovedAmount,
          status: 'DRAFT',
          beneficiaries: {
            create: [
              {
                beneficiaryType: 'PRIMARY_BORROWER',
                beneficiaryName: sanction.customerName,
                bankName: 'HDFC Bank Ltd',
                accountNumber: '50200084920192',
                accountNumberMasked: '•••• •••• •••• 0192',
                ifscCode: 'HDFC0000120',
                accountType: 'SAVINGS',
                verificationStatus: 'VERIFIED',
                verificationSource: 'Aadhaar e-KYC Penny Drop',
              },
            ],
          },
          history: {
            create: [
              {
                event: 'DISBURSEMENT_CREATED',
                actor: actorId,
                actorName,
                actorRole,
                newState: 'DRAFT',
                amount: sanctionApprovedAmount,
                notes: `Disbursement file initialized for Sanction ${sanction.sanctionNumber}.`,
              },
            ],
          },
        },
        include: {
          requests: true,
          beneficiaries: true,
          transactions: true,
        },
      });
    }

    const currentRemaining = Number(disbursement.remainingAmount);

    // Critical Invariant: Check requested amount vs remaining balance
    if (parsedAmount > currentRemaining) {
      return NextResponse.json(
        {
          error: `Requested amount (₹${parsedAmount.toLocaleString('en-IN')}) exceeds the remaining sanction amount (₹${currentRemaining.toLocaleString('en-IN')}).`,
        },
        { status: 400 }
      );
    }

    // Handle new beneficiary if supplied
    let targetBeneficiaryId = beneficiaryId;
    if (newBeneficiary) {
      const maskedAcct = newBeneficiary.accountNumber.length > 4
        ? `•••• •••• •••• ${newBeneficiary.accountNumber.slice(-4)}`
        : newBeneficiary.accountNumber;

      const createdBen = await prisma.disbursementBeneficiary.create({
        data: {
          disbursementId: disbursement.id,
          beneficiaryType: newBeneficiary.beneficiaryType || 'PRIMARY_BORROWER',
          beneficiaryName: newBeneficiary.beneficiaryName,
          bankName: newBeneficiary.bankName,
          accountNumber: newBeneficiary.accountNumber,
          accountNumberMasked: maskedAcct,
          ifscCode: newBeneficiary.ifscCode,
          accountType: newBeneficiary.accountType || 'SAVINGS',
          verificationStatus: 'VERIFIED',
          verificationSource: 'Direct Bank Mandate',
        },
      });
      targetBeneficiaryId = createdBen.id;
    } else if (!targetBeneficiaryId && disbursement.beneficiaries.length > 0) {
      targetBeneficiaryId = disbursement.beneficiaries[0].id;
    }

    const reqCount = await prisma.disbursementRequest.count();
    const reqNumber = `DREQ-2026-${String(reqCount + 415).padStart(6, '0')}`;

    // Create the disbursement request
    await prisma.disbursementRequest.create({
      data: {
        requestNumber: reqNumber,
        disbursementId: disbursement.id,
        applicationId: sanction.applicationId,
        sanctionId: sanction.id,
        requestedAmount: parsedAmount,
        disbursementType: disbursementType === 'PARTIAL' ? 'PARTIAL' : 'FULL',
        beneficiaryId: targetBeneficiaryId,
        paymentMethod: paymentMethod as any,
        purpose: purpose || `${disbursementType} payout against sanction ${sanction.sanctionNumber}`,
        notes,
        status: 'PENDING_APPROVAL',
        requestedBy: actorId,
        requestedByName: actorName,
        requestedAt: new Date(),
      },
    });

    // Update disbursement status and record history
    const updatedDisbursement = await prisma.disbursement.update({
      where: { id: disbursement.id },
      data: {
        status: 'PENDING_APPROVAL',
        history: {
          create: [
            {
              event: 'REQUEST_CREATED',
              actor: actorId,
              actorName,
              actorRole,
              newState: 'PENDING_APPROVAL',
              amount: parsedAmount,
              notes: `${disbursementType} disbursement request ${reqNumber} submitted for ₹${parsedAmount.toLocaleString('en-IN')}.`,
            },
          ],
        },
      },
      include: {
        requests: true,
        beneficiaries: true,
        transactions: true,
        history: { orderBy: { timestamp: 'desc' } },
      },
    });

    return NextResponse.json(formatDisbursement(updatedDisbursement), { status: 201 });
  } catch (error: any) {
    console.error('API /api/disbursements POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function formatDisbursement(d: any) {
  return {
    id: d.id,
    disbursementNumber: d.disbursementNumber,
    applicationId: d.applicationId,
    applicationNumber: d.applicationNumber,
    sanctionId: d.sanctionId,
    sanctionNumber: d.sanctionNumber,
    customerId: d.customerId,
    customerNumber: d.customerNumber,
    customerName: d.customerName,
    customerMobile: d.customerMobile,
    productCode: d.productCode,
    productName: d.productName,
    branchId: d.branchId,
    branchName: d.branchName,
    sanctionAmount: Number(d.sanctionAmount),
    totalDisbursedAmount: Number(d.totalDisbursedAmount),
    remainingAmount: Number(d.remainingAmount),
    status: d.status,
    firstDisbursedAt: d.firstDisbursedAt,
    lastDisbursedAt: d.lastDisbursedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    beneficiaries: (d.beneficiaries || []).map((b: any) => ({
      id: b.id,
      disbursementId: b.disbursementId,
      beneficiaryType: b.beneficiaryType,
      beneficiaryName: b.beneficiaryName,
      bankName: b.bankName,
      accountNumber: b.accountNumber,
      accountNumberMasked: b.accountNumberMasked,
      ifscCode: b.ifscCode,
      accountType: b.accountType,
      verificationStatus: b.verificationStatus,
      verificationSource: b.verificationSource,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
    requests: (d.requests || []).map((r: any) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      disbursementId: r.disbursementId,
      applicationId: r.applicationId,
      sanctionId: r.sanctionId,
      requestedAmount: Number(r.requestedAmount),
      disbursementType: r.disbursementType,
      beneficiaryId: r.beneficiaryId,
      paymentMethod: r.paymentMethod,
      purpose: r.purpose,
      supportingDocuments: r.supportingDocuments,
      notes: r.notes,
      status: r.status,
      readinessChecks: r.readinessChecks,
      requestedBy: r.requestedBy,
      requestedByName: r.requestedByName,
      requestedAt: r.requestedAt,
      assignedTo: r.assignedTo,
      assignedToName: r.assignedToName,
      assignedAt: r.assignedAt,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      approvedBy: r.approvedBy,
      approvedByName: r.approvedByName,
      approvedAt: r.approvedAt,
      approvalNotes: r.approvalNotes,
      rejectedBy: r.rejectedBy,
      rejectedByName: r.rejectedByName,
      rejectedAt: r.rejectedAt,
      rejectionReason: r.rejectionReason,
      returnedBy: r.returnedBy,
      returnedByName: r.returnedByName,
      returnedAt: r.returnedAt,
      returnReason: r.returnReason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    transactions: (d.transactions || []).map((t: any) => ({
      id: t.id,
      transactionReference: t.transactionReference,
      disbursementId: t.disbursementId,
      requestId: t.requestId,
      amount: Number(t.amount),
      paymentMethod: t.paymentMethod,
      status: t.status,
      beneficiaryName: t.beneficiaryName,
      beneficiaryAccountNumberMasked: t.beneficiaryAccountNumberMasked,
      beneficiaryIfsc: t.beneficiaryIfsc,
      bankName: t.bankName,
      externalReference: t.externalReference,
      utrNumber: t.utrNumber,
      processingStartedAt: t.processingStartedAt,
      completedAt: t.completedAt,
      failedAt: t.failedAt,
      failureReason: t.failureReason,
      reversedAt: t.reversedAt,
      reversedBy: t.reversedBy,
      reversalReason: t.reversalReason,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    history: (d.history || []).map((h: any) => ({
      id: h.id,
      disbursementId: h.disbursementId,
      requestId: h.requestId,
      timestamp: h.timestamp,
      event: h.event,
      actor: h.actor,
      actorName: h.actorName,
      actorRole: h.actorRole,
      previousState: h.previousState,
      newState: h.newState,
      amount: h.amount ? Number(h.amount) : undefined,
      notes: h.notes,
      reference: h.reference,
      metadata: h.metadata,
    })),
  };
}
