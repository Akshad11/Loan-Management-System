import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/serverAuth';
import { submitCreditDecision } from '@/services/credit/creditDecisionService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['decision.view', 'credit.view', 'view_applications']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const decisions = await prisma.creditDecisionRecord.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
    });

    const returnHistory = await prisma.applicationReturnHistory.findMany({
      where: { applicationId: id },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({
      applicationId: id,
      decisions,
      returnHistory,
    });
  } catch (error: any) {
    console.error('API /decisions GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['credit.approve', 'credit.reject', 'action_approvals']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;
    const body = await request.json();
    const {
      decision,
      approvedAmount,
      approvedTenureMonths,
      approvedRoi,
      conditions,
      remarks,
      creditNotes,
    } = body;

    if (!decision) {
      return NextResponse.json({ error: 'decision is required' }, { status: 400 });
    }

    const result = await submitCreditDecision({
      applicationId: id,
      decision,
      approvedAmount,
      approvedTenureMonths,
      approvedRoi,
      conditions,
      remarks,
      creditNotes,
      actorUser,
      request,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('API /decisions POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 });
  }
}
