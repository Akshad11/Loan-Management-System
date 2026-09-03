import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_roles');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const roles = await prisma.role.findMany({
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = roles.map((r) => ({
      id: r.id,
      code: r.code || r.name.toUpperCase().replace(/\s+/g, '_'),
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      isSystemProtected: r.isSystem,
      status: 'ACTIVE',
      permissions: r.permissions || [],
      permissionIds: r.permissions || [],
      userCount: r._count.users,
      createdDate: r.createdAt ? r.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      updatedDate: r.updatedAt ? r.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      updatedBy: 'System Administrator (EMP-001001)',
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /roles GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_roles');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const role = await prisma.role.create({
      data: {
        id: body.id || undefined,
        code: body.code,
        name: body.name,
        description: body.description || '',
        isSystem: body.isSystem || false,
        permissions: body.permissions || [],
      },
    });
    return NextResponse.json({
      ...role,
      permissionIds: role.permissions || [],
    }, { status: 201 });
  } catch (error: any) {
    console.error('API /roles POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Role ID required' }, { status: 400 });

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.permissions && { permissions: data.permissions }),
      },
    });
    return NextResponse.json(role);
  } catch (error: any) {
    console.error('API /roles PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
