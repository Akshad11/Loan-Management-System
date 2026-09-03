import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Check raw database connection & latency
    const startTime = Date.now();
    const dbInfo = await prisma.$queryRaw<Array<{ now: Date; version: string; db_name: string }>>`
      SELECT NOW() as now, version() as version, current_database() as db_name;
    `;
    const latencyMs = Date.now() - startTime;

    // 2. Fetch record counts from all seeded models
    const [
      usersCount,
      rolesCount,
      branchesCount,
      customersCount,
      kycCount,
      documentsCount,
      loanProductsCount,
      applicationsCount,
      coApplicantsCount,
      guarantorsCount,
      creditAssessmentsCount,
      approvalMatrixCount,
      approvalsCount,
      sanctionsCount,
      loanAccountsCount,
      auditLogsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.branch.count(),
      prisma.customer.count(),
      prisma.kycRecord.count(),
      prisma.documentItem.count(),
      prisma.loanProduct.count(),
      prisma.loanApplication.count(),
      prisma.coApplicant.count(),
      prisma.guarantor.count(),
      prisma.creditAssessment.count(),
      prisma.approvalMatrixRule.count(),
      prisma.approvalRecord.count(),
      prisma.sanction.count(),
      prisma.loanAccount.count(),
      prisma.adminAuditLog.count(),
    ]);

    return NextResponse.json({
      status: 'healthy',
      database: {
        name: dbInfo[0]?.db_name || 'loan_ms_db',
        serverTime: dbInfo[0]?.now ?? new Date().toISOString(),
        version: dbInfo[0]?.version ?? 'unknown',
        latencyMs,
        connection: 'PostgreSQL Direct Pool via Prisma',
      },
      tables: {
        users: usersCount,
        roles: rolesCount,
        branches: branchesCount,
        customers: customersCount,
        kycRecords: kycCount,
        documents: documentsCount,
        loanProducts: loanProductsCount,
        loanApplications: applicationsCount,
        coApplicants: coApplicantsCount,
        guarantors: guarantorsCount,
        creditAssessments: creditAssessmentsCount,
        approvalMatrixRules: approvalMatrixCount,
        approvalRecords: approvalsCount,
        sanctions: sanctionsCount,
        loanAccounts: loanAccountsCount,
        adminAuditLogs: auditLogsCount,
      },
      summary: {
        totalEntities:
          usersCount +
          rolesCount +
          branchesCount +
          customersCount +
          kycCount +
          documentsCount +
          loanProductsCount +
          applicationsCount +
          coApplicantsCount +
          guarantorsCount +
          creditAssessmentsCount +
          approvalMatrixCount +
          approvalsCount +
          sanctionsCount +
          loanAccountsCount +
          auditLogsCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Database Status Query Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to retrieve database status.',
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
