import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRestructuringSchedulePreview } from '@/services/restructuringEngine';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, ["view_loans","manage_repayments"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();

    const restructuring = await prisma.restructuringRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
      include: { loan: true },
    });

    if (!restructuring) {
      return NextResponse.json({ error: 'Restructuring request not found.' }, { status: 404 });
    }

    const proposedTenure = body.proposedTenureMonths !== undefined
      ? Number(body.proposedTenureMonths)
      : restructuring.proposedTenureMonths;
    const proposedRate = body.proposedInterestRate !== undefined
      ? Number(body.proposedInterestRate)
      : Number(restructuring.proposedInterestRate);
    const proposedFreq = body.proposedRepaymentFrequency || restructuring.proposedRepaymentFrequency;
    const firstDueDate = body.proposedFirstDueDate || restructuring.proposedFirstDueDate;
    const moratoriumMonths = body.moratoriumMonths !== undefined
      ? Number(body.moratoriumMonths)
      : (restructuring.moratoriumMonths || 0);
    const moratoriumInterestTreatment = body.moratoriumInterestTreatment || restructuring.moratoriumInterestTreatment || 'ACCRUE_AND_AMORTIZE';
    const moratoriumPrincipalTreatment = body.moratoriumPrincipalTreatment || restructuring.moratoriumPrincipalTreatment || 'DEFER';
    const targetEmi = body.proposedEmiAmount ? Number(body.proposedEmiAmount) : undefined;

    const preview = generateRestructuringSchedulePreview({
      loan: restructuring.loan as any,
      requestType: (body.requestType || restructuring.requestType) as any,
      proposedTenureMonths: proposedTenure,
      proposedInterestRate: proposedRate,
      proposedRepaymentFrequency: proposedFreq as any,
      proposedFirstDueDate: firstDueDate,
      moratoriumMonths,
      moratoriumInterestTreatment: moratoriumInterestTreatment as any,
      moratoriumPrincipalTreatment: moratoriumPrincipalTreatment as any,
      targetEmiAmount: targetEmi,
    });

    return NextResponse.json(preview);
  } catch (error: any) {
    console.error('API /restructuring/[id]/preview-schedule POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
