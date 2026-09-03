import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ["view_customers","view_loans","view_applications"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: { users: true, customers: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = branches.map((b: any) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      addressLine1: b.addressLine1 || '',
      addressLine2: b.addressLine2 || '',
      city: b.city,
      state: b.state,
      pinCode: b.pinCode || '',
      phone: b.phone || '',
      email: b.email || '',
      managerId: b.managerId,
      managerName: b.managerName || 'Unassigned',
      region: b.region || 'West',
      status: b.status,
      activeLoanCount: b.activeLoanCount,
      totalPortfolioValue: Number(b.totalPortfolioValue || 0),
      userCount: b._count.users,
      customerCount: b._count.customers,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /branches GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['manage_branches', 'manage_system_settings', 'manage_users_roles']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    let managerName = body.managerName;
    if (body.managerId && !managerName) {
      const mgr = await prisma.user.findUnique({ where: { id: body.managerId } });
      if (mgr) {
        managerName = `${mgr.firstName} ${mgr.lastName}`.trim();
      }
    }

    const branch = await prisma.branch.create({
      data: {
        id: body.id || undefined,
        code: body.code ? body.code.toUpperCase().trim() : `BR-${Date.now().toString().slice(-4)}`,
        name: body.name ? body.name.trim() : 'Unnamed Branch',
        addressLine1: body.addressLine1 || '',
        addressLine2: body.addressLine2 || '',
        city: body.city || '',
        state: body.state || '',
        pinCode: body.pinCode || '',
        phone: body.phone || '',
        email: body.email || '',
        managerId: body.managerId || null,
        managerName: managerName || null,
        region: body.region || 'West',
        status: body.status || 'ACTIVE',
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'BRANCH',
      entityId: branch.id,
      entityName: branch.name,
      action: 'CREATE',
      details: `Created new branch "${branch.name}" (${branch.code}) in ${branch.city}, ${branch.state}`,
      request,
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    console.error('API /branches POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, ['manage_branches', 'manage_system_settings', 'manage_users_roles']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { id, reason, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });

    let managerName = data.managerName;
    if (data.managerId && managerName === undefined) {
      const mgr = await prisma.user.findUnique({ where: { id: data.managerId } });
      if (mgr) {
        managerName = `${mgr.firstName} ${mgr.lastName}`.trim();
      }
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.code && { code: data.code.toUpperCase().trim() }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
        ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 }),
        ...(data.pinCode !== undefined && { pinCode: data.pinCode }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.status && { status: data.status }),
        ...(data.managerId !== undefined && { managerId: data.managerId || null }),
        ...(managerName !== undefined && { managerName: managerName || null }),
        ...(data.region !== undefined && { region: data.region }),
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'BRANCH',
      entityId: branch.id,
      entityName: branch.name,
      action: data.status === 'INACTIVE' ? 'DEACTIVATE' : data.status === 'ACTIVE' && reason ? 'REACTIVATE' : 'UPDATE',
      details: `Updated branch "${branch.name}" (${branch.code})`,
      reason: reason || undefined,
      request,
    });

    return NextResponse.json(branch);
  } catch (error: any) {
    console.error('API /branches PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
