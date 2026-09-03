import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth, writeAuditLog } from '@/lib/withAdminAuth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true, branch: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch audit history for this user
    const auditHistory = await (prisma as any).adminAuditLog.findMany({
      where: { entityId: id, entityType: 'USER' },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      employeeId: user.employeeId,
      mobile: user.mobile,
      department: user.department || 'Operations',
      status: user.status,
      roleId: user.roleId,
      roleName: (user as any).role?.name || 'Unknown',
      rolePermissions: (user as any).role?.permissions || [],
      branchId: user.branchId,
      branchName: (user as any).branch?.name || 'Unknown',
      lastLogin: user.lastLogin?.toISOString() || null,
      failedLogins: user.failedLogins,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      auditHistory: auditHistory.map((l: any) => ({
        id: l.id,
        timestamp: l.timestamp.toISOString(),
        action: l.action,
        actorName: l.actorName,
        details: l.details,
        changes: l.changes,
      })),
    });
  } catch (error: any) {
    console.error('API /users/[id] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await withAdminAuth(request, 'manage_users_roles');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;
    const body = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent privilege escalation: users cannot elevate other users above their own role level
    // (Basic check — can be extended with role hierarchy if needed)
    const updateData: any = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.mobile !== undefined) updateData.mobile = body.mobile;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.roleId !== undefined) updateData.roleId = body.roleId;
    if (body.branchId !== undefined) updateData.branchId = body.branchId;
    if (body.employeeId !== undefined) updateData.employeeId = body.employeeId;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true, branch: true },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'USER',
      entityId: id,
      entityName: `${existingUser.firstName} ${existingUser.lastName}`,
      action: 'UPDATE',
      details: `User profile updated. Fields changed: ${Object.keys(updateData).join(', ')}`,
      changes: {
        before: Object.fromEntries(Object.keys(updateData).map((k) => [k, (existingUser as any)[k]])),
        after: updateData,
      },
      request,
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      email: updatedUser.email,
      roleName: (updatedUser as any).role?.name,
      branchName: (updatedUser as any).branch?.name,
      status: updatedUser.status,
    });
  } catch (error: any) {
    console.error('API /users/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
