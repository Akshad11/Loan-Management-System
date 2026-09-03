import { LMSUser } from '../types';

export const INITIAL_USERS: LMSUser[] = [
  {
    id: 'usr_001',
    employeeId: 'EMP-001001',
    firstName: 'System',
    lastName: 'Admin',
    name: 'System Administrator',
    username: 'admin',
    email: 'admin@fintechlms.in',
    mobile: '9820144520',
    roleId: 'role_sys_admin',
    roleName: 'System Administrator',
    branchId: 'br_panjim',
    branchName: 'Panaji Head Office Branch',
    status: 'ACTIVE',
    department: 'Executive Administration & IT Security',
    createdDate: '2025-01-01',
    updatedDate: '2026-02-15',
    lastLogin: '2026-03-01 10:00 AM',
    failedLoginAttempts: 0,
  },
];
