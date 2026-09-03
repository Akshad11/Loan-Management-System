import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdjustmentMakerChecker } from '@/services/chargeAdjustmentEngine';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, ["manage_repayments","action_approvals"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { approverId, approverName, approverRole, approvalNotes } = body;

    const adjustment = await prisma.financialAdjustmentRequest.findFirst({
      where: { OR: [{ id }, { adjustmentNumber: id }] },
    });

    if (!adjustment) {
      return NextResponse.json({ error: 'Adjustment request not found.' }, { status: 404 });
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(adjustment.status)) {
      return NextResponse.json({ error: `Cannot approve adjustment with status '${adjustment.status}'.` }, { status: 400 });
    }

    // Segregation of duties validation
    const makerChecker = validateAdjustmentMakerChecker(adjustment as any, {
      id: approverId || 'usr_mgr_01',
      name: approverName || 'Branch Manager / Approver',
      roleName: approverRole || 'Approver',
    });

    if (!makerChecker.allowed) {
      return NextResponse.json({ error: makerChecker.reason }, { status: 403 });
    }

    const updated = await prisma.financialAdjustmentRequest.update({
      where: { id: adjustment.id },
      data: {
        status: 'APPROVED',
        approvedBy: approverId || 'usr_mgr_01',
        approvedByName: approverName || 'Branch Manager / Approver',
        approvedByRole: approverRole || 'Approver',
        approvedAt: new Date(),
        approvalNotes: approvalNotes || 'Approved by authority.',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /adjustments/[id]/approve POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
