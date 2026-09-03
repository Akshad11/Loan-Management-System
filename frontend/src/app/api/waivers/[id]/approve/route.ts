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
    const { approvedAmount, approverId, approverName, approverRole, approvalNotes } = body;

    const waiver = await prisma.waiverRequest.findFirst({
      where: { OR: [{ id }, { waiverNumber: id }] },
    });

    if (!waiver) {
      return NextResponse.json({ error: 'Waiver request not found.' }, { status: 404 });
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(waiver.status)) {
      return NextResponse.json({ error: `Cannot approve waiver with status '${waiver.status}'.` }, { status: 400 });
    }

    // Segregation of duties maker-checker validation
    const makerChecker = validateAdjustmentMakerChecker(waiver as any, {
      id: approverId || 'usr_mgr_01',
      name: approverName || 'Branch Credit Committee Head',
      roleName: approverRole || 'Branch Manager / Approver',
    });

    if (!makerChecker.allowed) {
      return NextResponse.json({ error: makerChecker.reason }, { status: 403 });
    }

    const finalApprovedAmount = approvedAmount ? Number(approvedAmount) : Number(waiver.requestedAmount);

    const updated = await prisma.waiverRequest.update({
      where: { id: waiver.id },
      data: {
        status: 'APPROVED',
        approvedAmount: finalApprovedAmount,
        approvedBy: approverId || 'usr_mgr_01',
        approvedByName: approverName || 'Branch Credit Committee Head',
        approvedByRole: approverRole || 'Branch Manager / Approver',
        approvedAt: new Date(),
        approvalNotes: approvalNotes || 'Waiver approved by authority.',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /waivers/[id]/approve POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
