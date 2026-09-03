/**
 * Automated Permission & Access-Control Verification Test Suite
 * Tests server-side authorization enforcement, status guards, role boundaries,
 * privilege escalation defense, and permission alias normalization.
 */

import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { userHasPermission, requireAuth, writeAuditLog } from '../src/lib/serverAuth';

async function runTests() {
  console.log('===============================================================');
  console.log('  LOAN MANAGEMENT SYSTEM - PERMISSION & RBAC AUDIT TEST SUITE  ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  try {
    // 1. Check seed users in DB
    const adminUser = await prisma.user.findFirst({
      where: { email: 'siddharth.rao@fintechlms.in' },
      include: { role: true },
    });
    const loanOfficer = await prisma.user.findFirst({
      where: { email: 'amit.verma@fintechlms.in' },
      include: { role: true },
    });
    const opsOfficer = await prisma.user.findFirst({
      where: { email: 'rajesh.iyer@fintechlms.in' },
      include: { role: true },
    });
    const inactiveUser = await prisma.user.findFirst({
      where: { status: { in: ['INACTIVE', 'LOCKED', 'SUSPENDED'] } },
      include: { role: true },
    });

    assert('Seed users loaded properly from database', Boolean(adminUser && loanOfficer && opsOfficer));

    if (!adminUser || !loanOfficer || !opsOfficer) {
      throw new Error('Seed users not found in database. Run database seed first.');
    }

    // Test 2: Canonical Permission Normalizer & Alias Resolution
    console.log('\n--- 1. Canonical Permission Normalizer & Alias Resolution ---');

    // Admin has universal bypass
    assert(
      'System Admin has universal bypass for any permission',
      userHasPermission([], 'manage_users', true) && userHasPermission([], 'delete_everything', true)
    );

    // Loan Officer permissions
    const officerPerms = loanOfficer.role.permissions;
    assert(
      'Loan Officer CAN view customers via UI alias (view_customers)',
      userHasPermission(officerPerms, 'view_customers')
    );
    assert(
      'Loan Officer CAN create applications via canonical code (APPLICATIONS:CREATE)',
      userHasPermission(officerPerms, 'APPLICATIONS:CREATE')
    );
    assert(
      'Loan Officer CAN view applications via perm ID (perm_app_view)',
      userHasPermission(officerPerms, 'perm_app_view')
    );
    assert(
      'Loan Officer CANNOT execute disbursements (execute_disbursement)',
      !userHasPermission(officerPerms, 'execute_disbursement')
    );
    assert(
      'Loan Officer CANNOT manage system settings (manage_system_settings)',
      !userHasPermission(officerPerms, 'manage_system_settings')
    );
    assert(
      'Loan Officer CANNOT manage user accounts (manage_users)',
      !userHasPermission(officerPerms, 'manage_users')
    );

    // Operations Officer permissions
    const opsPerms = opsOfficer.role.permissions;
    assert(
      'Operations Officer CAN execute disbursements (execute_disbursement)',
      userHasPermission(opsPerms, 'execute_disbursement')
    );
    assert(
      'Operations Officer CAN post repayments (post_repayment)',
      userHasPermission(opsPerms, 'post_repayment')
    );
    assert(
      'Operations Officer CANNOT conduct credit assessments (conduct_credit_assessment)',
      !userHasPermission(opsPerms, 'conduct_credit_assessment')
    );

    console.log('\n--- 2. Server Authorization (requireAuth) Simulation ---');

    // Test 2.1: Request without x-user-id header -> 401
    const unauthReq = new Request('http://localhost:3000/api/customers', {
      method: 'GET',
    });
    const unauthResult = await requireAuth(unauthReq, 'view_customers');
    assert(
      'Unauthenticated request returns 401 Unauthorized',
      Boolean(unauthResult && 'status' in unauthResult && unauthResult.status === 401)
    );

    // Test 2.2: Inactive/Suspended user account -> 403
    if (inactiveUser) {
      const inactiveReq = new Request('http://localhost:3000/api/customers', {
        headers: { 'x-user-id': inactiveUser.id },
      });
      const inactiveResult = await requireAuth(inactiveReq, 'view_customers');
      assert(
        'Inactive / suspended user returns 403 Forbidden with account status message',
        Boolean(inactiveResult && 'status' in inactiveResult && inactiveResult.status === 403)
      );
    } else {
      console.log('  [SKIP] Inactive user not present');
    }

    // Test 2.3: Non-existent user -> 401
    const fakeUserReq = new Request('http://localhost:3000/api/customers', {
      headers: { 'x-user-id': 'usr_non_existent_99999' },
    });
    const fakeResult = await requireAuth(fakeUserReq, 'view_customers');
    assert(
      'Non-existent user session returns 401 Unauthorized',
      Boolean(fakeResult && 'status' in fakeResult && fakeResult.status === 401)
    );

    // Test 2.4: Loan Officer unauthorized endpoint -> 403
    const officerDisbReq = new Request('http://localhost:3000/api/disbursements', {
      method: 'POST',
      headers: { 'x-user-id': loanOfficer.id },
    });
    const officerDisbResult = await requireAuth(officerDisbReq, 'execute_disbursement');
    assert(
      'Loan Officer executing disbursement returns 403 Forbidden (Insufficient permissions)',
      Boolean(officerDisbResult && 'status' in officerDisbResult && officerDisbResult.status === 403)
    );

    // Test 2.5: Loan Officer authorized endpoint -> 200 actor returned
    const officerAppReq = new Request('http://localhost:3000/api/applications', {
      method: 'POST',
      headers: { 'x-user-id': loanOfficer.id },
    });
    const officerAppResult = await requireAuth(officerAppReq, 'create_application');
    assert(
      'Loan Officer creating application successfully resolves actorUser',
      Boolean(officerAppResult && 'actorUser' in officerAppResult && officerAppResult.actorUser.email === loanOfficer.email)
    );

    // Test 2.6: System Admin universal access
    const adminReq = new Request('http://localhost:3000/api/settings', {
      method: 'PUT',
      headers: { 'x-user-id': adminUser.id },
    });
    const adminResult = await requireAuth(adminReq, 'manage_system_settings');
    assert(
      'System Admin successfully authorizes administrative route',
      Boolean(adminResult && 'actorUser' in adminResult && adminResult.actorUser.isSystemAdmin)
    );

    console.log('\n--- 3. Privilege Escalation & Direct Tampering Defenses ---');
    // Test 3.1: Loan Officer cannot alter role permissions
    const officerRoleEditReq = new Request(`http://localhost:3000/api/roles/${loanOfficer.roleId}`, {
      method: 'PUT',
      headers: { 'x-user-id': loanOfficer.id },
      body: JSON.stringify({ permissions: ['*'] }),
    });
    const roleEditAuth = await requireAuth(officerRoleEditReq, 'manage_roles');
    assert(
      'Unauthorized user cannot modify role permissions (403 Forbidden)',
      Boolean(roleEditAuth && 'status' in roleEditAuth && roleEditAuth.status === 403)
    );

    // Test 3.2: Loan Officer cannot elevate their own role to SYSTEM_ADMIN
    const officerUserEditReq = new Request(`http://localhost:3000/api/users/${loanOfficer.id}`, {
      method: 'PUT',
      headers: { 'x-user-id': loanOfficer.id },
      body: JSON.stringify({ roleId: adminUser.roleId }),
    });
    const userEditAuth = await requireAuth(officerUserEditReq, 'manage_users');
    assert(
      'Unauthorized user cannot elevate their own user role (403 Forbidden)',
      Boolean(userEditAuth && 'status' in userEditAuth && userEditAuth.status === 403)
    );

    console.log('\n--- 4. Immutable Audit Trail Persistence ---');
    const adminFullName = `${adminUser.firstName} ${adminUser.lastName}`.trim();
    await writeAuditLog({
      actorUser: {
        id: adminUser.id,
        name: adminFullName,
        email: adminUser.email,
        roleName: adminUser.role.name,
      },
      entityType: 'SETTINGS',
      entityId: 'test_audit_001',
      entityName: 'Permission Audit Test',
      action: 'SECURITY_VERIFY',
      details: 'Automated test of audit log persistence',
    });

    const savedLog = await prisma.adminAuditLog.findFirst({
      where: { entityType: 'SETTINGS', entityId: 'test_audit_001' },
    });

    assert(
      'Audit log entry persisted successfully to PostgreSQL AdminAuditLog table',
      Boolean(savedLog && savedLog.action === 'SECURITY_VERIFY' && savedLog.actorName === adminFullName)
    );

    // Clean up test audit log
    if (savedLog) {
      await prisma.adminAuditLog.delete({ where: { id: savedLog.id } });
    }

    console.log('\n===============================================================');
    console.log(`  AUDIT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
