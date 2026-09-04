// Priority LMS Batch 5 — Operational 3-Way Reconciliation Execution API
import { NextResponse } from 'next/server';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { runDisbursementReconciliation, runRepaymentReconciliation } from '@/services/reconciliation/reconciliationService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['view_reports', 'execute_disbursement', 'manage_repayments']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json().catch(() => ({}));
    const { type = 'DISBURSEMENT' } = body;

    let result;
    if (type === 'REPAYMENT') {
      result = await runRepaymentReconciliation(actorUser);
    } else {
      result = await runDisbursementReconciliation(actorUser);
    }

    await writeAuditLog({
      actorUser,
      entityType: 'RECONCILIATION',
      entityId: result.batchId,
      entityName: result.batchNumber,
      action: 'RUN_RECONCILIATION',
      details: `Executed 3-way operational reconciliation for ${type}. Total: ${result.totalCount}, Matched: ${result.matchedCount}, Exceptions: ${result.mismatchCount}`,
      request,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /api/reconciliation/run POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
