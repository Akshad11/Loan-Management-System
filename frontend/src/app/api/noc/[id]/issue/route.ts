import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'close_loan');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { issuedBy, approvedBy, deliveryMethod = 'DOWNLOAD', dispatchAddress } = body;

    const noc = await prisma.nocRecord.findFirst({
      where: { OR: [{ id }, { nocNumber: id }] },
    });

    if (!noc) {
      return NextResponse.json({ error: 'NOC record not found.' }, { status: 404 });
    }

    if (noc.status === 'ISSUED') {
      return NextResponse.json({ error: 'NOC has already been issued.' }, { status: 409 });
    }

    const updated = await prisma.nocRecord.update({
      where: { id: noc.id },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
        issuedBy: issuedBy || 'Operations Officer',
        approvedAt: new Date(),
        approvedBy: approvedBy || 'Branch Credit Committee Head',
        deliveryMethod,
        dispatchAddress,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /noc/[id]/issue POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
