import {
  LMSUser,
  Role,
  Branch,
  AdminAuditEntry,
  UserStatus,
  RoleStatus,
  BranchStatus,
} from '../../../types';
import { LMSStoreContext } from '../types';

export function recountRoleAndBranchUsers(ctx: LMSStoreContext) {
  ctx.roles = ctx.roles.map((r) => {
    const count = ctx.users.filter((u) => u.roleId === r.id && u.status === 'ACTIVE').length;
    return { ...r, userCount: count };
  });

  ctx.branches = ctx.branches.map((b) => {
    const count = ctx.users.filter((u) => u.branchId === b.id && u.status === 'ACTIVE').length;
    return { ...b, userCount: count };
  });
}

export function logAudit(
  ctx: LMSStoreContext,
  entry: Omit<AdminAuditEntry, 'id' | 'timestamp' | 'actorId' | 'actorName' | 'actorRole' | 'ipAddress'>
) {
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const newLog: AdminAuditEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: formattedDate,
    actorId: 'usr_001',
    actorName: 'Siddharth Rao (EMP-001001)',
    actorRole: 'System Administrator',
    ipAddress: '10.14.22.102',
    ...entry,
  };

  ctx.auditLogs = [newLog, ...ctx.auditLogs];
  ctx.syncApi('/api/audit', 'POST', newLog);
}

export function createUser(
  ctx: LMSStoreContext,
  userData: {
    firstName: string;
    lastName: string;
    employeeId: string;
    mobile: string;
    username: string;
    email: string;
    roleId: string;
    branchId: string;
    department?: string;
    status: UserStatus;
  }
): LMSUser {
  const role = ctx.roles.find((r) => r.id === userData.roleId);
  const branch = ctx.branches.find((b) => b.id === userData.branchId);
  const fullName = `${userData.firstName.trim()} ${userData.lastName.trim()}`;
  const now = new Date().toISOString().split('T')[0];

  const newUser: LMSUser = {
    id: `usr_${Date.now()}`,
    firstName: userData.firstName.trim(),
    lastName: userData.lastName.trim(),
    name: fullName,
    employeeId: userData.employeeId.trim().toUpperCase(),
    username: userData.username.trim().toLowerCase(),
    email: userData.email.trim().toLowerCase(),
    mobile: userData.mobile.trim(),
    roleId: userData.roleId,
    roleName: role ? role.name : 'Unknown Role',
    branchId: userData.branchId,
    branchName: branch ? branch.name : 'Unknown Branch',
    department: userData.department?.trim() || 'General Operations',
    status: userData.status,
    createdDate: now,
    updatedDate: now,
    lastLogin: 'Never logged in',
    failedLoginAttempts: 0,
  };

  ctx.users = [newUser, ...ctx.users];
  recountRoleAndBranchUsers(ctx);

  logAudit(ctx, {
    entityType: 'USER',
    entityId: newUser.id,
    entityName: `${newUser.name} (${newUser.employeeId})`,
    action: 'USER_CREATED',
    details: `Created new staff account with role "${newUser.roleName}" at "${newUser.branchName}".`,
  });

  ctx.notify();
  return newUser;
}

export function updateUser(
  ctx: LMSStoreContext,
  userId: string,
  updates: Partial<LMSUser>,
  reason?: string
): LMSUser {
  const index = ctx.users.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error('User not found');

  const prev = ctx.users[index];
  const role = updates.roleId ? ctx.roles.find((r) => r.id === updates.roleId) : undefined;
  const branch = updates.branchId ? ctx.branches.find((b) => b.id === updates.branchId) : undefined;

  const firstName = updates.firstName !== undefined ? updates.firstName.trim() : prev.firstName;
  const lastName = updates.lastName !== undefined ? updates.lastName.trim() : prev.lastName;
  const fullName = `${firstName} ${lastName}`.trim();

  const updatedUser: LMSUser = {
    ...prev,
    ...updates,
    firstName,
    lastName,
    name: fullName || prev.name,
    roleName: role ? role.name : (updates.roleName || prev.roleName),
    branchName: branch ? branch.name : (updates.branchName || prev.branchName),
    updatedDate: new Date().toISOString().split('T')[0],
  };

  ctx.users[index] = updatedUser;
  recountRoleAndBranchUsers(ctx);

  logAudit(ctx, {
    entityType: 'USER',
    entityId: updatedUser.id,
    entityName: `${updatedUser.name} (${updatedUser.employeeId})`,
    action: 'USER_UPDATED',
    details: `Updated staff profile information and assignments.`,
    reason: reason || 'Administrative profile update',
  });

  ctx.notify();
  return updatedUser;
}

export function deactivateUser(ctx: LMSStoreContext, userId: string, reason: string) {
  const user = ctx.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  user.status = 'INACTIVE';
  user.updatedDate = new Date().toISOString().split('T')[0];
  recountRoleAndBranchUsers(ctx);

  logAudit(ctx, {
    entityType: 'USER',
    entityId: user.id,
    entityName: `${user.name} (${user.employeeId})`,
    action: 'USER_DEACTIVATED',
    details: `Staff account marked as INACTIVE. Active sessions revoked.`,
    reason,
  });

  ctx.notify();
}

export function reactivateUser(ctx: LMSStoreContext, userId: string, reason?: string) {
  const user = ctx.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  user.status = 'ACTIVE';
  user.updatedDate = new Date().toISOString().split('T')[0];
  recountRoleAndBranchUsers(ctx);

  logAudit(ctx, {
    entityType: 'USER',
    entityId: user.id,
    entityName: `${user.name} (${user.employeeId})`,
    action: 'USER_REACTIVATED',
    details: `Staff account reactivated to ACTIVE status.`,
    reason: reason || 'Administrative reactivation',
  });

  ctx.notify();
}

export function createRole(
  ctx: LMSStoreContext,
  roleData: {
    name: string;
    description: string;
    permissionIds: string[];
    status: RoleStatus;
  }
): Role {
  const now = new Date().toISOString().split('T')[0];
  const code = roleData.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

  const newRole: Role = {
    id: `role_${Date.now()}`,
    code,
    name: roleData.name.trim(),
    description: roleData.description.trim(),
    status: roleData.status,
    userCount: 0,
    permissionIds: roleData.permissionIds,
    createdDate: now,
    updatedDate: now,
    updatedBy: 'Siddharth Rao (EMP-001001)',
  };

  ctx.roles = [...ctx.roles, newRole];

  logAudit(ctx, {
    entityType: 'ROLE',
    entityId: newRole.id,
    entityName: newRole.name,
    action: 'ROLE_CREATED',
    details: `Created new RBAC role with ${newRole.permissionIds.length} granted permissions.`,
  });

  ctx.notify();
  return newRole;
}

export function updateRole(
  ctx: LMSStoreContext,
  roleId: string,
  updates: Partial<Role>,
  reason?: string
): Role {
  const index = ctx.roles.findIndex((r) => r.id === roleId);
  if (index === -1) throw new Error('Role not found');

  const prev = ctx.roles[index];
  const updatedRole: Role = {
    ...prev,
    ...updates,
    updatedDate: new Date().toISOString().split('T')[0],
    updatedBy: 'Siddharth Rao (EMP-001001)',
  };

  ctx.roles[index] = updatedRole;

  logAudit(ctx, {
    entityType: 'ROLE',
    entityId: updatedRole.id,
    entityName: updatedRole.name,
    action: 'ROLE_UPDATED',
    details: `Updated role configuration and permission grants (${updatedRole.permissionIds.length} total permissions).`,
    reason: reason || 'Policy update',
  });

  ctx.notify();
  return updatedRole;
}

export function deactivateRole(ctx: LMSStoreContext, roleId: string, reason: string) {
  const role = ctx.roles.find((r) => r.id === roleId);
  if (!role) throw new Error('Role not found');
  if (role.isSystemProtected) throw new Error('Cannot deactivate system protected role');

  role.status = 'INACTIVE';
  role.updatedDate = new Date().toISOString().split('T')[0];

  logAudit(ctx, {
    entityType: 'ROLE',
    entityId: role.id,
    entityName: role.name,
    action: 'ROLE_DEACTIVATED',
    details: `Role marked as INACTIVE.`,
    reason,
  });

  ctx.notify();
}

export function reactivateRole(ctx: LMSStoreContext, roleId: string, reason?: string) {
  const role = ctx.roles.find((r) => r.id === roleId);
  if (!role) throw new Error('Role not found');

  role.status = 'ACTIVE';
  role.updatedDate = new Date().toISOString().split('T')[0];

  logAudit(ctx, {
    entityType: 'ROLE',
    entityId: role.id,
    entityName: role.name,
    action: 'ROLE_REACTIVATED',
    details: `Role status restored to ACTIVE.`,
    reason: reason || 'Administrative reactivation',
  });

  ctx.notify();
}

export function createBranch(
  ctx: LMSStoreContext,
  branchData: {
    code: string;
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    phone: string;
    email: string;
    managerId?: string;
    status: BranchStatus;
  }
): Branch {
  const now = new Date().toISOString().split('T')[0];
  const manager = branchData.managerId ? ctx.users.find((u) => u.id === branchData.managerId) : undefined;

  const newBranch: Branch = {
    id: `br_${Date.now()}`,
    code: branchData.code.trim().toUpperCase(),
    name: branchData.name.trim(),
    addressLine1: branchData.addressLine1.trim(),
    addressLine2: branchData.addressLine2?.trim(),
    city: branchData.city.trim(),
    state: branchData.state.trim(),
    pinCode: branchData.pinCode.trim(),
    phone: branchData.phone.trim(),
    email: branchData.email.trim().toLowerCase(),
    managerId: branchData.managerId,
    managerName: manager?.name,
    status: branchData.status,
    userCount: 0,
    activeLoanCount: 0,
    totalPortfolioValue: 0,
    createdDate: now,
    updatedDate: now,
  };

  ctx.branches = [...ctx.branches, newBranch];

  logAudit(ctx, {
    entityType: 'BRANCH',
    entityId: newBranch.id,
    entityName: `${newBranch.name} (${newBranch.code})`,
    action: 'BRANCH_CREATED',
    details: `Created new branch office in ${newBranch.city}, ${newBranch.state}.`,
  });

  ctx.notify();
  return newBranch;
}

export function updateBranch(
  ctx: LMSStoreContext,
  branchId: string,
  updates: Partial<Branch>,
  reason?: string
): Branch {
  const index = ctx.branches.findIndex((b) => b.id === branchId);
  if (index === -1) throw new Error('Branch not found');

  const prev = ctx.branches[index];
  const manager = updates.managerId ? ctx.users.find((u) => u.id === updates.managerId) : undefined;

  const updatedBranch: Branch = {
    ...prev,
    ...updates,
    managerName: manager ? manager.name : (updates.managerName !== undefined ? updates.managerName : prev.managerName),
    updatedDate: new Date().toISOString().split('T')[0],
  };

  ctx.branches[index] = updatedBranch;

  logAudit(ctx, {
    entityType: 'BRANCH',
    entityId: updatedBranch.id,
    entityName: `${updatedBranch.name} (${updatedBranch.code})`,
    action: 'BRANCH_UPDATED',
    details: `Updated branch records, location, and operational parameters.`,
    reason: reason || 'Location/Contact update',
  });

  ctx.notify();
  return updatedBranch;
}

export function deactivateBranch(ctx: LMSStoreContext, branchId: string, reason: string) {
  const branch = ctx.branches.find((b) => b.id === branchId);
  if (!branch) throw new Error('Branch not found');

  branch.status = 'INACTIVE';
  branch.updatedDate = new Date().toISOString().split('T')[0];

  logAudit(ctx, {
    entityType: 'BRANCH',
    entityId: branch.id,
    entityName: `${branch.name} (${branch.code})`,
    action: 'BRANCH_DEACTIVATED',
    details: `Branch marked as INACTIVE. Active loan portfolio remains monitored.`,
    reason,
  });

  ctx.notify();
}

export function reactivateBranch(ctx: LMSStoreContext, branchId: string, reason?: string) {
  const branch = ctx.branches.find((b) => b.id === branchId);
  if (!branch) throw new Error('Branch not found');

  branch.status = 'ACTIVE';
  branch.updatedDate = new Date().toISOString().split('T')[0];

  logAudit(ctx, {
    entityType: 'BRANCH',
    entityId: branch.id,
    entityName: `${branch.name} (${branch.code})`,
    action: 'BRANCH_REACTIVATED',
    details: `Branch status restored to ACTIVE.`,
    reason: reason || 'Administrative reactivation',
  });

  ctx.notify();
}

