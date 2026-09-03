import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_credit_assessment');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const id = searchParams.get('id');

    if (id || applicationId) {
      const assessment = await prisma.creditAssessment.findFirst({
        where: id ? { id } : { applicationId: applicationId! },
      });

      if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });

      return NextResponse.json(formatAssessment(assessment));
    }

    const assessments = await prisma.creditAssessment.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(assessments.map(formatAssessment));
  } catch (error: any) {
    console.error('API /credit-assessment GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatAssessment(a: any) {
  const obligations = (Array.isArray(a.obligations) ? a.obligations : []) as any[];
  const conditions = (Array.isArray(a.conditions) ? a.conditions : []) as any[];

  return {
    id: a.id,
    assessmentNumber: a.assessmentNumber,
    applicationId: a.applicationId,
    applicationNumber: a.applicationNumber,
    customerId: a.customerId,
    customerNumber: a.customerNumber,
    customerName: a.customerName,
    customerMobile: '9999999999',
    branchId: 'br_panaji',
    branchName: 'Main Branch',
    productCode: 'PL-PRIME',
    productName: 'Prime Personal Loan',
    requestedAmount: Number(a.maxEligibleAmount || a.recommendedAmount),
    requestedTenureMonths: a.recommendedTenure,
    interestRate: Number(a.recommendedRate),
    status: a.status,
    cibilScore: a.creditScore,
    bureauReportDate: new Date().toISOString().split('T')[0],
    bureauSummary: a.bureauDetails || {},
    totalMonthlyIncome: Number(a.monthlyIncome),
    totalExistingEmis: Number(a.existingObligations),
    proposedEmi: Number(a.proposedEmi),
    totalObligationsWithLoan: Number(a.existingObligations) + Number(a.proposedEmi),
    foirPercentage: Number(a.foirPercent),
    foirStatus: Number(a.foirPercent) > 60 ? 'HIGH' : 'WITHIN_LIMIT',
    collateralValue: null,
    ltvPercentage: null,
    riskRating: a.riskCategory,
    riskScore: 85,
    recommendedAmount: Number(a.recommendedAmount),
    recommendedTenureMonths: a.recommendedTenure,
    recommendedInterestRate: Number(a.recommendedRate),
    recommendedEmi: Number(a.proposedEmi),
    rulesEvaluated: a.policyRules || [],
    obligations,
    conditions,
    deviations: a.deviations || [],
    recommendationType: a.recommendationStatus,
    recommendationNotes: a.rationale,
    assignedAssessorName: a.assignedOfficer || 'Alex Morgan',
    assessedAt: a.completedAt?.toISOString() || a.updatedAt.toISOString(),
    completedDate: a.completedAt?.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'conduct_credit_assessment');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const count = await prisma.creditAssessment.count();
    const assessmentNumber =
      body.assessmentNumber || `CA-2026-${String(count + 1).padStart(6, '0')}`;

    const assessment = await prisma.creditAssessment.create({
      data: {
        id: body.id || undefined,
        assessmentNumber,
        applicationId: body.applicationId,
        applicationNumber: body.applicationNumber,
        customerId: body.customerId,
        customerNumber: body.customerNumber || body.customerId,
        customerName: body.customerName,
        status: body.status || 'IN_PROGRESS',
        riskCategory: body.riskRating || body.riskCategory || 'LOW',
        creditScore: body.cibilScore || 750,
        monthlyIncome: body.totalMonthlyIncome || body.monthlyIncome || 0,
        existingObligations: body.totalExistingEmis || body.existingObligations || 0,
        proposedEmi: body.proposedEmi || 0,
        foirPercent: body.foirPercentage || body.foirPercent || 0,
        maxEligibleAmount: body.requestedAmount || body.maxEligibleAmount || 0,
        recommendedAmount: body.recommendedAmount || body.requestedAmount || 0,
        recommendedTenure: body.recommendedTenureMonths || body.recommendedTenure || 36,
        recommendedRate: body.recommendedInterestRate || body.recommendedRate || 10.5,
        recommendationStatus: body.recommendationType || 'RECOMMEND_APPROVAL',
        rationale: body.recommendationNotes || body.rationale || null,
        bureauDetails: body.bureauSummary || {},
        financialRatios: body.financialRatios || {},
        obligations: body.obligations || [],
        conditions: body.conditions || [],
        deviations: body.deviations || [],
        policyRules: body.rulesEvaluated || [],
        assignedOfficer: body.assignedAssessorName || actorUser.name,
        completedAt: body.assessedAt ? new Date(body.assessedAt) : null,
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'CREDIT_ASSESSMENT',
      entityId: assessment.id,
      entityName: assessmentNumber,
      action: 'CREATE',
      details: `Created credit assessment ${assessmentNumber} for app ${assessment.applicationNumber}`,
      request,
    });

    return NextResponse.json(formatAssessment(assessment), { status: 201 });
  } catch (error: any) {
    console.error('API /credit-assessment POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, ['conduct_credit_assessment', 'edit_credit_assessment', 'recommend_credit_assessment']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Assessment ID required' }, { status: 400 });

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.recommendedAmount !== undefined) updateData.recommendedAmount = data.recommendedAmount;
    if (data.recommendedTenureMonths !== undefined) updateData.recommendedTenure = data.recommendedTenureMonths;
    if (data.recommendedInterestRate !== undefined) updateData.recommendedRate = data.recommendedInterestRate;
    if (data.recommendationType !== undefined) updateData.recommendationStatus = data.recommendationType;
    if (data.recommendationNotes !== undefined) updateData.rationale = data.recommendationNotes;
    if (data.foirPercentage !== undefined) updateData.foirPercent = data.foirPercentage;
    if (data.riskRating !== undefined) updateData.riskCategory = data.riskRating;
    if (data.assignedAssessorName !== undefined) updateData.assignedOfficer = data.assignedAssessorName;
    if (data.assessedAt) updateData.completedAt = new Date(data.assessedAt);
    if (data.rulesEvaluated) updateData.policyRules = data.rulesEvaluated;
    if (data.obligations) updateData.obligations = data.obligations;
    if (data.conditions) updateData.conditions = data.conditions;

    const updated = await prisma.creditAssessment.update({
      where: { id },
      data: updateData,
    });

    await writeAuditLog({
      actorUser,
      entityType: 'CREDIT_ASSESSMENT',
      entityId: updated.id,
      entityName: updated.assessmentNumber,
      action: 'UPDATE',
      details: `Credit assessment ${updated.assessmentNumber} updated. Recommendation: ${updated.recommendationStatus}`,
      request,
    });

    return NextResponse.json(formatAssessment(updated));
  } catch (error: any) {
    console.error('API /credit-assessment PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
