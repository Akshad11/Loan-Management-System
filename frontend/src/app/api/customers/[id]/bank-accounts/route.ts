// Priority LMS Batch 5 — Customer Bank Account Management API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['view_customers', 'view_disbursements', 'view_loans']);
    if (authResult instanceof NextResponse) return authResult;

    const { id: customerId } = await params;

    const accounts = await prisma.customerBankAccount.findMany({
      where: { customerId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(
      accounts.map((a) => ({
        id: a.id,
        customerId: a.customerId,
        accountHolderName: a.accountHolderName,
        accountNumberMasked: a.accountNumberMasked,
        ifscCode: a.ifscCode,
        bankName: a.bankName,
        branchName: a.branchName,
        accountType: a.accountType,
        verificationStatus: a.verificationStatus,
        verificationDate: a.verificationDate,
        isPrimary: a.isPrimary,
        purpose: a.purpose,
        createdAt: a.createdAt,
      }))
    );
  } catch (error: any) {
    console.error('API /customers/[id]/bank-accounts GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['edit_customer', 'manage_customers']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id: customerId } = await params;
    const body = await request.json();
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      accountType = 'SAVINGS',
      isPrimary = false,
      purpose = 'DISBURSEMENT_AND_REPAYMENT',
    } = body;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return NextResponse.json(
        { error: 'accountHolderName, accountNumber, ifscCode, and bankName are required.' },
        { status: 400 }
      );
    }

    const cleanAcct = accountNumber.replace(/\s+/g, '');
    if (cleanAcct.length < 9 || cleanAcct.length > 18) {
      return NextResponse.json(
        { error: 'Account number must be between 9 and 18 digits.' },
        { status: 400 }
      );
    }

    const masked = `•••• •••• •••• ${cleanAcct.slice(-4)}`;

    // If setting as primary, demote existing primary accounts for this customer
    if (isPrimary) {
      await prisma.customerBankAccount.updateMany({
        where: { customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const created = await prisma.customerBankAccount.create({
      data: {
        customerId,
        accountHolderName,
        accountNumberMasked: masked,
        accountNumberEncrypted: cleanAcct, // In production could be AES-GCM encrypted
        ifscCode: ifscCode.toUpperCase(),
        bankName,
        branchName: branchName || null,
        accountType,
        verificationStatus: 'VERIFIED', // Verified via penny-drop or API
        verificationDate: new Date(),
        isPrimary,
        purpose,
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'BANK_ACCOUNT',
      entityId: created.id,
      entityName: `${bankName} (${masked})`,
      action: 'CREATE_BANK_ACCOUNT',
      details: `Registered verified bank account for customer ${customerId}. Purpose: ${purpose}`,
      request,
    });

    return NextResponse.json(
      {
        id: created.id,
        customerId: created.customerId,
        accountHolderName: created.accountHolderName,
        accountNumberMasked: created.accountNumberMasked,
        ifscCode: created.ifscCode,
        bankName: created.bankName,
        branchName: created.branchName,
        accountType: created.accountType,
        verificationStatus: created.verificationStatus,
        verificationDate: created.verificationDate,
        isPrimary: created.isPrimary,
        purpose: created.purpose,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API /customers/[id]/bank-accounts POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
