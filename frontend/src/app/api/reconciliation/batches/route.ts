// Priority LMS Batch 5 — Reconciliation Batches & Items API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { resolveReconciliationItem } from '@/services/reconciliation/reconciliationService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['view_reports', 'view_disbursements', 'view_repayments']);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const batchType = searchParams.get('type');
    const batchId = searchParams.get('batchId');

    if (batchId) {
      const batch = await prisma.reconciliationBatch.findUnique({
        where: { id: batchId },
        include: {
          items: {
            orderBy: [{ resolved: 'asc' }, { status: 'desc' }],
          },
        },
      });

      if (!batch) {
        return NextResponse.json({ error: 'Reconciliation batch not found' }, { status: 404 });
      }

      return NextResponse.json({
        ...batch,
        items: batch.items.map((i) => ({
          ...i,
          lmsAmount: Number(i.lmsAmount),
          providerAmount: i.providerAmount ? Number(i.providerAmount) : null,
          glAmount: i.glAmount ? Number(i.glAmount) : null,
        })),
      });
    }

    const where: any = {};
    if (batchType && batchType !== 'ALL') where.batchType = batchType;

    const batches = await prisma.reconciliationBatch.findMany({
      where,
      include: {
        items: {
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(batches);
  } catch (error: any) {
    console.error('API /api/reconciliation/batches GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, ['manage_repayments', 'execute_disbursement']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { itemId, resolutionNotes } = body;

    if (!itemId || !resolutionNotes) {
      return NextResponse.json({ error: 'itemId and resolutionNotes are required' }, { status: 400 });
    }

    const updated = await resolveReconciliationItem({
      itemId,
      resolutionNotes,
      actorUser,
    });

    await writeAuditLog({
      actorUser,
      entityType: 'RECONCILIATION',
      entityId: updated.id,
      entityName: updated.lmsReference,
      action: 'RESOLVE_DISCREPANCY',
      details: `Resolved reconciliation discrepancy: ${resolutionNotes}`,
      request,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /api/reconciliation/batches PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
