import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_users');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const users = await prisma.user.findMany({
      include: {
        role: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName} ${u.lastName}`,
      employeeId: u.employeeId,
      mobile: u.mobile,
      department: u.department || 'Operations',
      status: u.status,
      roleId: u.roleId,
      roleName: u.role?.name || 'Unknown Role',
      branchId: u.branchId,
      branchName: u.branch?.name || 'Unknown Branch',
      lastLogin: u.lastLogin?.toISOString() || new Date().toISOString(),
      failedLogins: u.failedLogins,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /users GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_users');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const newUser = await prisma.user.create({
      data: {
        id: body.id || undefined,
        username: body.username,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        employeeId: body.employeeId,
        mobile: body.mobile || '9999999999',
        department: body.department,
        status: body.status || 'ACTIVE',
        roleId: body.roleId,
        branchId: body.branchId,
      },
      include: {
        role: true,
        branch: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('API /users POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email && { email: data.email }),
        ...(data.mobile && { mobile: data.mobile }),
        ...(data.status && { status: data.status }),
        ...(data.roleId && { roleId: data.roleId }),
        ...(data.branchId && { branchId: data.branchId }),
        ...(data.department && { department: data.department }),
        ...(data.lastLogin && { lastLogin: new Date(data.lastLogin) }),
      },
      include: {
        role: true,
        branch: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /users PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
