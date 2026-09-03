import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_collections');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const {
      eventType = 'HEARING_HELD',
      eventDate,
      notes,
      referenceNumber,
      documentUrl,
      nextHearingDate,
      actorName = 'Legal Officer',
      actorRole = 'Legal Officer',
    } = body;

    const lc = await prisma.legalCase.findFirst({
      where: { OR: [{ id }, { legalCaseNumber: id }] },
    });

    if (!lc) {
      return NextResponse.json({ error: 'Legal case not found' }, { status: 404 });
    }

    const event = await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.legalCaseEvent.create({
        data: {
          legalCaseId: lc.id,
          eventType,
          eventDate: eventDate || new Date().toISOString().split('T')[0],
          actorName,
          actorRole,
          notes,
          referenceNumber,
          documentUrl,
          nextHearingDate,
        },
      });

      await tx.legalCase.update({
        where: { id: lc.id },
        data: {
          lastHearingDate: eventDate || new Date().toISOString().split('T')[0],
          nextHearingDate: nextHearingDate || lc.nextHearingDate,
        },
      });

      return createdEvent;
    });

    return NextResponse.json(event);
  } catch (error: any) {
    console.error('Error logging legal case event:', error);
    return NextResponse.json({ error: error.message || 'Failed to log legal case event' }, { status: 500 });
  }
}
