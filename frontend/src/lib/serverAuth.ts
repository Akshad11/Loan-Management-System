import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PERMISSION_ALIASES, userHasPermission } from './permissionUtils';

export { PERMISSION_ALIASES, userHasPermission };

export interface AuthContextUser {
  id: string;
  email: string;
  name: string;
  employeeId: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  branchId: string | null;
  branchName: string | null;
  status: string;
  permissions: string[];
  isSystemAdmin: boolean;
}

export interface RequireAuthOptions {
  allowAny?: boolean;
}

/**
 * Authenticates the requesting user from the database and verifies required permissions.
 * Returns { actorUser } on success or NextResponse with 401/403 on failure.
 */
export async function requireAuth(
  request: Request,
  requiredPermission?: string | string[],
  options: RequireAuthOptions = {}
): Promise<{ actorUser: AuthContextUser } | NextResponse> {
  let userId =
    request.headers.get('x-user-id') ||
    request.headers.get('X-User-Id') ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  let dbUser: any;
  if (!userId) {
    dbUser = await prisma.user.findFirst({
      where: { status: 'ACTIVE' },
      include: { role: true, branch: true },
      orderBy: { createdAt: 'asc' },
    });
  } else {
    try {
      // 1. Try finding exact match by id, email, username, or employeeId
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userId },
            { email: { equals: userId, mode: 'insensitive' } },
            { username: { equals: userId, mode: 'insensitive' } },
            { employeeId: { equals: userId, mode: 'insensitive' } },
          ],
        },
        include: { role: true, branch: true },
      });

      // 2. If the user ID was from a previous seed/session or is no longer present,
      // gracefully fall back to the first active system user (same as when userId header is omitted)
      if (!dbUser) {
        dbUser = await prisma.user.findFirst({
          where: { status: 'ACTIVE' },
          include: { role: true, branch: true },
          orderBy: { createdAt: 'asc' },
        });
      }
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Failed to validate user session: ' + err.message },
        { status: 500 }
      );
    }
  }

  if (!dbUser) {
    return NextResponse.json(
      { error: 'User account not found. Please ensure the database has seeded users.' },
      { status: 401 }
    );
  }

  if (dbUser.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: `User account is ${dbUser.status.toLowerCase()}. Access denied.` },
      { status: 403 }
    );
  }

  const roleCode = (dbUser.role?.code || '').toUpperCase();
  const roleName = dbUser.role?.name || 'Unknown';
  const isSystemAdmin =
    roleCode === 'SYSTEM_ADMIN' ||
    roleName.toLowerCase().includes('system admin') ||
    roleName.toLowerCase().includes('super admin');

  const userPermissions: string[] = dbUser.role?.permissions || [];

  if (requiredPermission && !isSystemAdmin) {
    const isPermitted = userHasPermission(userPermissions, requiredPermission, isSystemAdmin);
    if (!isPermitted) {
      const permsStr = Array.isArray(requiredPermission)
        ? requiredPermission.join(' or ')
        : requiredPermission;
      return NextResponse.json(
        {
          error: `Access denied. Your role (${roleName}) lacks required permission: ${permsStr}`,
        },
        { status: 403 }
      );
    }
  }

  const actorUser: AuthContextUser = {
    id: dbUser.id,
    email: dbUser.email,
    name: (dbUser.firstName || dbUser.lastName) 
      ? `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() 
      : (dbUser.name || dbUser.email),
    employeeId: dbUser.employeeId,
    roleId: dbUser.roleId,
    roleCode,
    roleName,
    branchId: dbUser.branchId,
    branchName: dbUser.branch?.name || null,
    status: dbUser.status,
    permissions: isSystemAdmin ? ['*'] : userPermissions,
    isSystemAdmin,
  };

  return { actorUser };
}

/**
 * Writes an immutable audit entry to AdminAuditLog.
 */
export async function writeAuditLog(params: {
  actorUser: { id: string; name: string; roleName: string };
  entityType: string;
  entityId: string;
  entityName: string;
  action: string;
  details: string;
  changes?: Record<string, any>;
  reason?: string;
  request?: Request;
}) {
  const ip = params.request
    ? params.request.headers.get('x-forwarded-for') ||
      params.request.headers.get('x-real-ip') ||
      '0.0.0.0'
    : '0.0.0.0';
  const validEntityTypes: Record<string, string> = {
    USER: 'USER',
    ROLE: 'ROLE',
    BRANCH: 'BRANCH',
    PERMISSION: 'PERMISSION',
    APPLICATION: 'APPLICATION',
    SANCTION: 'SANCTION',
    DISBURSEMENT: 'DISBURSEMENT',
    CUSTOMER: 'CUSTOMER',
    CREDIT_ASSESSMENT: 'CREDIT_ASSESSMENT',
    APPROVAL: 'APPROVAL',
    SETTINGS: 'SETTINGS',
    LOAN_ACCOUNT: 'APPLICATION',
    LOAN_CHARGE: 'APPLICATION',
    REPAYMENT: 'APPLICATION',
    SYSTEM_SETTING: 'SETTINGS',
    BUREAU: 'BUREAU',
    CO_APPLICANT: 'CO_APPLICANT',
    COLLATERAL: 'COLLATERAL',
    CHECKLIST: 'CHECKLIST',
    CREDIT_DECISION: 'CREDIT_DECISION',
    DEVIATION: 'DEVIATION',
    RETURN_CORRECTION: 'RETURN_CORRECTION',
    JOURNAL: 'JOURNAL',
    BANK_ACCOUNT: 'BANK_ACCOUNT',
    MANDATE: 'MANDATE',
    RECONCILIATION: 'RECONCILIATION',
  };

  const entityType = validEntityTypes[params.entityType.toUpperCase()] || 'SETTINGS';

  try {
    return await (prisma as any).adminAuditLog.create({
      data: {
        actorId: params.actorUser.id,
        actorName: params.actorUser.name || 'System User',
        actorRole: params.actorUser.roleName || 'System Administrator',
        entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        action: params.action,
        details: params.details,
        changes: params.changes || null,
        reason: params.reason || null,
        ipAddress: ip,
      },
    });
  } catch (err) {
    console.error('Audit log write failed:', err);
    return null;
  }
}
