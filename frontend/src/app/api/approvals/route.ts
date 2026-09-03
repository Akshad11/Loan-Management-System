import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_approvals');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (type === 'matrix-rules') {
      const rules = await prisma.approvalMatrixRule.findMany({
        orderBy: { ruleCode: 'asc' },
      });
      const formatted = rules.map((r: any, idx: number) => ({
        id: r.id,
        ruleCode: r.ruleCode,
        productCode: r.allowedProducts[0] || 'ALL',
        productName: r.allowedProducts.join(', ') || 'All Products',
        minAmount: 0,
        maxAmount: Number(r.maxApprovalLimit),
        branchId: 'ALL',
        branchName: 'All Branches',
        region: 'All Regions',
        level: idx + 1,
        levelName: r.roleName,
        approverRoleId: `role_${r.roleName.toLowerCase().replace(/\s+/g, '_')}`,
        approverRoleName: r.roleName,
        authorityLimit: Number(r.maxApprovalLimit),
        canApproveExceptions: r.requiresCommittee,
        exceptionAuthorityRole: r.requiresCommittee ? 'Credit Committee' : undefined,
        isActive: r.isActive,
        createdDate: r.createdAt.toISOString().split('T')[0],
        updatedDate: r.updatedAt.toISOString().split('T')[0],
        updatedBy: 'System Admin',
      }));
      return NextResponse.json(formatted);
    }

    if (id) {
      const approval = await prisma.approvalRecord.findUnique({
        where: { id },
        include: { conditions: true },
      });
      if (!approval) return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
      return NextResponse.json(formatApproval(approval));
    }

    const approvals = await prisma.approvalRecord.findMany({
      include: { conditions: true },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(approvals.map(formatApproval));
  } catch (error: any) {
    console.error('API /approvals GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatApproval(a: any) {
  const exceptions = (Array.isArray(a.exceptions) ? a.exceptions : []) as any[];

  return {
    id: a.id,
    approvalNumber: a.approvalNumber,
    applicationId: a.applicationId,
    applicationNumber: a.applicationNumber,
    customerId: a.customerId,
    customerName: a.customerName,
    productCode: a.productCode,
    productName: a.productName,
    requestedAmount: Number(a.requestedAmount),
    recommendedAmount: Number(a.recommendedAmount),
    approvedAmount: a.approvedAmount ? Number(a.approvedAmount) : null,
    interestRate: Number(a.interestRate),
    tenureMonths: a.tenureMonths,
    status: a.status,
    requiredRoleLevel: a.requiredRoleLevel,
    assignedToRole: a.assignedToRole,
    assignedToUser: a.assignedToUser,
    currentStage: a.currentStage,
    approvalDecision: a.approvalDecision,
    decisionReason: a.decisionReason,
    sanctionGenerated: a.sanctionGenerated,
    conditions: (a.conditions || []).map((c: any) => ({
      id: c.id,
      approvalId: c.approvalId,
      code: c.code,
      title: c.title,
      description: c.description,
      category: c.category,
      isPreDisbursement: c.isPreDisbursement,
      status: c.status,
      assignedTo: c.assignedTo,
      resolvedBy: c.resolvedBy,
      resolvedAt: c.resolvedAt?.toISOString(),
      resolutionNotes: c.resolution,
    })),
    exceptions,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['action_approvals', 'view_approvals']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const count = await prisma.approvalRecord.count();
    const approvalNumber =
      body.approvalNumber || `APR-2026-${String(count + 1).padStart(6, '0')}`;

    const approval = await prisma.approvalRecord.create({
      data: {
        id: body.id || undefined,
        approvalNumber,
        applicationId: body.applicationId,
        applicationNumber: body.applicationNumber,
        assessmentId: body.creditAssessmentId || body.assessmentId || null,
        customerId: body.customerId,
        customerName: body.customerName,
        productCode: body.productCode,
        productName: body.productName,
        requestedAmount: body.requestedAmount,
        recommendedAmount: body.recommendedAmount,
        approvedAmount: body.approvedAmount || null,
        interestRate: body.interestRate || body.approvedInterestRate || body.requestedInterestRate,
        tenureMonths: body.tenureMonths || body.approvedTenureMonths || body.requestedTenureMonths,
        status: body.status || 'PENDING',
        requiredRoleLevel: body.requiredRoleLevel || 'Branch Manager',
        assignedToRole: body.assignedToRole || 'role_branch_manager',
        assignedToUser: body.assignedToUser || actorUser.name,
        currentStage: body.currentStage || 'Level 1: Branch Manager Review',
        approvalDecision: body.approvalDecision || null,
        decisionReason: body.decisionReason || null,
        sanctionGenerated: body.sanctionGenerated ?? false,
        exceptions: body.exceptions || [],
        decisionTrail: body.decisionTrail || [],
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'APPROVAL',
      entityId: approval.id,
      entityName: approvalNumber,
      action: 'CREATE',
      details: `Created approval dossier ${approvalNumber} for app ${approval.applicationNumber}`,
      request,
    });

    return NextResponse.json(formatApproval(approval), { status: 201 });
  } catch (error: any) {
    console.error('API /approvals POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, ['action_approvals', 'manage_approval_conditions']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Approval ID required' }, { status: 400 });

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.approvedAmount !== undefined) updateData.approvedAmount = data.approvedAmount;
    if (data.interestRate !== undefined) updateData.interestRate = data.interestRate;
    if (data.tenureMonths !== undefined) updateData.tenureMonths = data.tenureMonths;
    if (data.approvalDecision !== undefined) updateData.approvalDecision = data.approvalDecision;
    if (data.decisionReason !== undefined) updateData.decisionReason = data.decisionReason;
    if (data.assignedToUser !== undefined) updateData.assignedToUser = data.assignedToUser;
    if (data.currentStage !== undefined) updateData.currentStage = data.currentStage;
    if (data.sanctionGenerated !== undefined) updateData.sanctionGenerated = data.sanctionGenerated;
    if (data.exceptions) updateData.exceptions = data.exceptions;
    if (data.decisionTrail) updateData.decisionTrail = data.decisionTrail;

    const updated = await prisma.approvalRecord.update({
      where: { id },
      data: updateData,
      include: { conditions: true },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'APPROVAL',
      entityId: updated.id,
      entityName: updated.approvalNumber,
      action: updated.approvalDecision || 'UPDATE',
      details: `Approval ${updated.approvalNumber} updated. Decision: ${updated.approvalDecision || updated.status}`,
      request,
    });

    return NextResponse.json(formatApproval(updated));
  } catch (error: any) {
    console.error('API /approvals PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
