import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth, writeAuditLog } from '@/lib/withAdminAuth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

const VALID_ACTIONS = ['activate', 'deactivate', 'suspend', 'unlock'] as const;
type StatusAction = typeof VALID_ACTIONS[number];

const ACTION_TO_STATUS: Record<StatusAction, string> = {
  activate: 'ACTIVE',
  deactivate: 'INACTIVE',
  suspend: 'SUSPENDED',
  unlock: 'ACTIVE',
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await withAdminAuth(request, 'manage_users_roles');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body as { action: StatusAction; reason?: string };

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deactivating their own account
    if (id === actorUser.id && (action === 'deactivate' || action === 'suspend')) {
      return NextResponse.json(
        { error: 'You cannot deactivate or suspend your own account.' },
        { status: 400 }
      );
    }

    const newStatus = ACTION_TO_STATUS[action];
    const updateData: any = { status: newStatus };
    if (action === 'unlock') updateData.failedLogins = 0;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const actionLabel =
      action === 'activate' ? 'ACTIVATED'
      : action === 'deactivate' ? 'DEACTIVATED'
      : action === 'suspend' ? 'SUSPENDED'
      : 'UNLOCKED';

    await writeAuditLog({
      actorUser,
      entityType: 'USER',
      entityId: id,
      entityName: `${existingUser.firstName} ${existingUser.lastName}`,
      action: actionLabel,
      details: `User account ${actionLabel.toLowerCase()}. Previous status: ${existingUser.status} → ${newStatus}.`,
      changes: { before: { status: existingUser.status }, after: { status: newStatus } },
      reason: reason || undefined,
      request,
    });

    return NextResponse.json({
      success: true,
      id: updatedUser.id,
      status: updatedUser.status,
      action: actionLabel,
    });
  } catch (error: any) {
    console.error('API /users/[id]/status POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
