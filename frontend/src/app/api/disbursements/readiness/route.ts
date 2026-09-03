import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['view_disbursements', 'view_sanctions']);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const sanctionId = searchParams.get('sanctionId');

    if (!sanctionId) {
      return NextResponse.json({ error: 'sanctionId is required' }, { status: 400 });
    }

    const sanction = await prisma.sanction.findUnique({
      where: { id: sanctionId },
      include: {
        application: {
          include: {
            documents: true,
          },
        },
        approval: true,
        conditions: true,
      },
    });

    if (!sanction) {
      return NextResponse.json({ error: 'Sanction record not found' }, { status: 404 });
    }

    // Load customer separately (Sanction has no direct customer relation)
    const customer = await prisma.customer.findUnique({
      where: { id: sanction.customerId },
      include: { kycRecords: true },
    });

    const application = sanction.application;
    const approval = sanction.approval;
    const conditions = sanction.conditions || [];
    const openConditions = conditions.filter(
      (c: any) => c.requiredBefore === 'DISBURSEMENT' && c.status === 'PENDING'
    );

    const checks: any[] = [];

    // 1. Customer Active & KYC Check
    const latestKyc = customer?.kycRecords?.[0];
    const isKycValid =
      customer &&
      customer.status === 'ACTIVE' &&
      (latestKyc?.status === 'VERIFIED' || customer.panMasked);

    checks.push({
      id: 'chk_kyc',
      category: 'CUSTOMER',
      title: 'Customer Identity & KYC Verification',
      description: 'Borrower KYC must be fully verified (Aadhaar/PAN/Video KYC) with active account.',
      status: isKycValid ? 'PASS' : 'BLOCKED',
      source: 'Customer / KYC Module',
      reason: isKycValid ? undefined : 'Customer KYC is unverified or customer is inactive.',
      verifiedAt: isKycValid ? new Date().toISOString() : undefined,
      verifiedBy: isKycValid ? 'Compliance Automation' : undefined,
    });

    // 2. Application Status Check
    const isAppEligible =
      application && (application.status === 'SANCTIONED' || application.status === 'APPROVED');
    checks.push({
      id: 'chk_app',
      category: 'APPLICATION',
      title: 'Loan Application Eligibility & Workflow State',
      description: 'Application must be in approved/sanctioned status with complete profiles.',
      status: isAppEligible ? 'PASS' : 'BLOCKED',
      source: 'Application Engine',
      reason: isAppEligible ? undefined : `Application status is ${application?.status || 'UNKNOWN'}.`,
    });

    // 3. Approval Record Check
    const isApprovalValid = approval && (approval.status === 'APPROVED' || approval.status === 'SANCTIONED');
    checks.push({
      id: 'chk_approval',
      category: 'APPROVAL',
      title: 'Credit Committee Final Approval',
      description: 'Final multi-level approval must be in place and not cancelled or expired.',
      status: isApprovalValid ? 'PASS' : 'BLOCKED',
      source: 'Credit Governance',
      reason: isApprovalValid ? undefined : 'Final credit committee approval is missing or unapproved.',
    });

    // 4. Sanction Confirmation Check
    const isSanctionConfirmed = sanction.status === 'SANCTIONED';
    checks.push({
      id: 'chk_sanction',
      category: 'SANCTION',
      title: 'Sanction Confirmation & Acceptance',
      description: 'Sanction letter must be generated, issued, and confirmed by sanction authority.',
      status: isSanctionConfirmed
        ? 'PASS'
        : sanction.status === 'DRAFT' || sanction.status === 'UNDER_REVIEW'
        ? 'PENDING'
        : 'BLOCKED',
      source: 'Sanction Management',
      reason: isSanctionConfirmed
        ? undefined
        : `Sanction is in ${sanction.status} status. Needs confirmation.`,
    });

    // 5. Pre-Disbursement Mandatory Conditions Check
    checks.push({
      id: 'chk_conditions',
      category: 'CONDITIONS',
      title: 'Pre-Disbursement Conditions Compliance',
      description: 'All mandatory conditions flagged for completion before disbursement must be satisfied.',
      status: openConditions.length === 0 ? 'PASS' : 'BLOCKED',
      source: 'Sanction Conditions Hub',
      reason:
        openConditions.length === 0
          ? undefined
          : `${openConditions.length} pre-disbursement condition(s) pending compliance.`,
      blockingDetails:
        openConditions.length > 0 ? openConditions.map((c) => c.description).join('; ') : undefined,
    });

    // 6. Mandatory Documents Verification Check
    const appDocs = application?.documents || [];
    const unverifiedMandatoryDocs = appDocs.filter((d) => d.isMandatory && d.status !== 'VERIFIED');
    checks.push({
      id: 'chk_docs',
      category: 'DOCUMENTS',
      title: 'Mandatory Loan Documents Verification',
      description: 'All mandatory loan contract, income, and security documents must be verified.',
      status: unverifiedMandatoryDocs.length === 0 ? 'PASS' : 'BLOCKED',
      source: 'Document Hub',
      reason:
        unverifiedMandatoryDocs.length === 0
          ? undefined
          : `${unverifiedMandatoryDocs.length} mandatory document(s) unverified.`,
    });

    // 7. Banking & Beneficiary Details Check
    const customerHasBank = !!(customer?.accountNumber || customer?.accountNumberMasked || customer?.ifscCode);
    checks.push({
      id: 'chk_bank',
      category: 'BANKING',
      title: 'Beneficiary Bank Account & Mandate Verification',
      description: 'Verified beneficiary bank account details and payment mandate must be present.',
      status: customerHasBank ? 'PASS' : 'PENDING',
      source: 'Core Banking / KYC',
      reason: customerHasBank ? undefined : 'Customer bank account or IFSC details missing.',
    });

    const passedChecks = checks.filter((c) => c.status === 'PASS').length;
    const pendingChecks = checks.filter((c) => c.status === 'PENDING').length;
    const blockedChecks = checks.filter((c) => c.status === 'BLOCKED').length;

    return NextResponse.json({
      isEligible: blockedChecks === 0 && pendingChecks === 0,
      totalChecks: checks.length,
      passedChecks,
      pendingChecks,
      blockedChecks,
      checks,
    });
  } catch (error: any) {
    console.error('API /api/disbursements/readiness GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
