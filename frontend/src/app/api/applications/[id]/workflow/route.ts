import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/serverAuth';
import {
  getProductWorkflowStages,
  transitionWorkflowStage,
  assignWorkflowApplication,
} from '@/services/workflow/workflowService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['credit.view', 'view_applications']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const app = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        history: {
          where: { eventType: { in: ['WORKFLOW_STAGE_CHANGE', 'OFFICER_ASSIGNMENT', 'RETURN_FOR_CORRECTION', 'CREDIT_DECISION'] } },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const allowedStages = await getProductWorkflowStages(app.productCode);

    return NextResponse.json({
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      currentStage: app.status,
      assignedOfficerId: app.assignedOfficerId,
      assignedOfficerName: app.loanOfficer,
      allowedStages,
      history: app.history,
    });
  } catch (error: any) {
    console.error('API /workflow GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, [
      'credit.review',
      'workflow.assign',
      'credit.recommend',
      'credit.approve',
      'edit_application',
    ]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { action, targetStage, officerId, officerName, roleName, remarks } = body;

    if (action === 'ASSIGN') {
      if (!officerId || !officerName) {
        return NextResponse.json({ error: 'officerId and officerName are required' }, { status: 400 });
      }
      const result = await assignWorkflowApplication({
        applicationId: id,
        officerId,
        officerName,
        roleName: roleName || 'Credit Officer',
        actorUser,
        remarks,
        request,
      });
      return NextResponse.json(result);
    }

    if (!targetStage) {
      return NextResponse.json({ error: 'targetStage is required' }, { status: 400 });
    }

    const result = await transitionWorkflowStage({
      applicationId: id,
      targetStage,
      actorUser,
      remarks,
      request,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /workflow POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 });
  }
}
