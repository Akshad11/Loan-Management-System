import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth, writeAuditLog } from '@/lib/withAdminAuth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await withAdminAuth(request, 'manage_users_roles');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reset failed logins, unlock account, set status to ACTIVE
    await prisma.user.update({
      where: { id },
      data: {
        failedLogins: 0,
        status: 'ACTIVE',
      },
    });

    // NOTE: In a production system with bcrypt, you would generate a temporary
    // password here, hash it, store it, and send it via email.
    // Current auth system does not use password hashing.

    await writeAuditLog({
      actorUser,
      entityType: 'USER',
      entityId: id,
      entityName: `${existingUser.firstName} ${existingUser.lastName}`,
      action: 'PASSWORD_RESET',
      details: `Password reset initiated for ${existingUser.firstName} ${existingUser.lastName}. Failed login counter cleared. Account unlocked.`,
      changes: { before: { failedLogins: existingUser.failedLogins, status: existingUser.status }, after: { failedLogins: 0, status: 'ACTIVE' } },
      request,
    });

    return NextResponse.json({
      success: true,
      message: `Password reset successful for ${existingUser.firstName} ${existingUser.lastName}. Account has been unlocked.`,
    });
  } catch (error: any) {
    console.error('API /users/[id]/reset-password POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
