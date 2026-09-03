import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_audit_logs');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const logs = await (prisma as any).adminAuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const formatted = logs.map((l: any) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      actorId: l.actorId,
      actorName: l.actorName,
      actorRole: l.actorRole,
      entityType: l.entityType,
      entityId: l.entityId,
      entityName: l.entityName,
      action: l.action,
      details: l.details,
      reason: l.reason || undefined,
      changes: l.changes || undefined,
      ipAddress: l.ipAddress,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /audit GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_audit_logs');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const log = await (prisma as any).adminAuditLog.create({
      data: {
        id: body.id || undefined,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        actorId: body.actorId || 'usr_001',
        actorName: body.actorName || 'Alex Morgan',
        actorRole: body.actorRole || 'Branch Manager',
        entityType: body.entityType || 'APPLICATION',
        entityId: body.entityId || 'SYS',
        entityName: body.entityName || 'System',
        action: body.action || 'UPDATE',
        details: body.details || 'Action performed',
        reason: body.reason || null,
        changes: body.changes || null,
        ipAddress: body.ipAddress || '127.0.0.1',
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    console.error('API /audit POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
