import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth, writeAuditLog } from '@/lib/withAdminAuth';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isSystemProtected: role.isSystem,
      status: 'ACTIVE',
      permissions: role.permissions || [],
      permissionIds: role.permissions || [],
      userCount: role._count.users,
      createdDate: role.createdAt ? role.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      updatedDate: role.updatedAt ? role.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      updatedBy: 'System Administrator (EMP-001001)',
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('API /roles/[id] GET error:', error);
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

    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.permissions !== undefined) {
      if (!Array.isArray(body.permissions)) {
        return NextResponse.json({ error: 'permissions must be an array' }, { status: 400 });
      }
      updateData.permissions = body.permissions;
    }

    const updatedRole = await prisma.role.update({ where: { id }, data: updateData });

    await writeAuditLog({
      actorUser,
      entityType: 'ROLE',
      entityId: id,
      entityName: existingRole.name,
      action: 'UPDATE',
      details: `Role "${existingRole.name}" updated. Fields: ${Object.keys(updateData).join(', ')}`,
      changes: {
        before: { name: existingRole.name, description: existingRole.description, permissions: existingRole.permissions },
        after: updateData,
      },
      request,
    });

    return NextResponse.json({
      id: updatedRole.id,
      name: updatedRole.name,
      permissions: updatedRole.permissions || [],
      permissionIds: updatedRole.permissions || [],
    });
  } catch (error: any) {
    console.error('API /roles/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await withAdminAuth(request, 'manage_users_roles');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: 'System roles cannot be deleted.' },
        { status: 400 }
      );
    }

    if (role._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete role "${role.name}" — ${role._count.users} user(s) are currently assigned to it. Reassign users first.` },
        { status: 400 }
      );
    }

    await prisma.role.delete({ where: { id } });

    await writeAuditLog({
      actorUser,
      entityType: 'ROLE',
      entityId: id,
      entityName: role.name,
      action: 'DELETE',
      details: `Role "${role.name}" permanently deleted.`,
      request,
    });

    return NextResponse.json({ success: true, deleted: role.name });
  } catch (error: any) {
    console.error('API /roles/[id] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
