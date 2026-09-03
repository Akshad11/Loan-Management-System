/**
 * Pure isomorphic permission check utilities & canonical aliases.
 * Safe to import in both Client (Browser) and Server components.
 */

import { PERMISSION_CATALOG } from '@/config/permissions';

/**
 * Mapping of legacy or UI permission aliases to canonical codes and IDs.
 */
export const PERMISSION_ALIASES: Record<string, string[]> = {
  // Customers & KYC
  view_customers: ['perm_cust_view', 'CUSTOMERS:VIEW'],
  manage_customers: ['perm_cust_edit', 'perm_cust_create', 'CUSTOMERS:CREATE', 'CUSTOMERS:EDIT'],
  create_customer: ['perm_cust_create', 'CUSTOMERS:CREATE'],
  edit_customer: ['perm_cust_edit', 'CUSTOMERS:EDIT'],
  verify_kyc: ['perm_cust_verify_kyc', 'CUSTOMERS:VERIFY_KYC'],

  // Applications
  view_applications: ['perm_app_view', 'APPLICATIONS:VIEW'],
  create_application: ['perm_app_create', 'APPLICATIONS:CREATE'],
  edit_application: ['perm_app_edit', 'APPLICATIONS:EDIT'],
  submit_application: ['perm_app_submit', 'APPLICATIONS:SUBMIT'],
  cancel_application: ['perm_app_cancel', 'APPLICATIONS:CANCEL'],
  view_application_documents: ['perm_app_doc_view', 'APPLICATIONS:DOCUMENTS_VIEW'],
  upload_application_documents: ['perm_app_doc_upload', 'APPLICATIONS:DOCUMENTS_UPLOAD'],

  // Credit Assessment
  view_credit_assessment: ['perm_ca_view', 'CREDIT_ASSESSMENT:VIEW'],
  conduct_credit_assessment: ['perm_ca_create', 'CREDIT_ASSESSMENT:CREATE'],
  edit_credit_assessment: ['perm_ca_edit', 'CREDIT_ASSESSMENT:EDIT'],
  recommend_credit_assessment: ['perm_ca_recommend', 'CREDIT_ASSESSMENT:RECOMMEND'],

  // Approvals & Sanctions
  view_approvals: ['perm_appr_view', 'APPROVAL:VIEW'],
  action_approvals: ['perm_appr_approve', 'perm_appr_reject', 'APPROVAL:APPROVE', 'APPROVAL:REJECT'],
  manage_approval_conditions: ['perm_appr_conditions', 'APPROVAL:CONDITIONS_MANAGE'],
  view_sanctions: ['perm_sn_view', 'SANCTION:VIEW'],
  create_sanction: ['perm_sn_generate', 'SANCTION:GENERATE'],
  edit_sanction: ['perm_sn_modify', 'SANCTION:MODIFY'],
  confirm_sanction: ['perm_sn_accept', 'SANCTION:ACCEPT'],
  manage_sanction_conditions: ['perm_sn_conditions', 'SANCTION:CONDITIONS_MANAGE'],

  // Disbursements
  view_disbursements: ['perm_disb_view', 'DISBURSEMENT:VIEW'],
  create_disbursement_request: ['perm_disb_create', 'DISBURSEMENT:CREATE'],
  approve_disbursement: ['perm_disb_approve', 'DISBURSEMENT:APPROVE'],
  execute_disbursement: ['perm_disb_execute', 'DISBURSEMENT:EXECUTE'],
  cancel_disbursement: ['perm_disb_cancel', 'DISBURSEMENT:CANCEL'],

  // Loans & Repayments
  view_loans: ['perm_loan_view', 'LOANS:VIEW'],
  close_loan: ['perm_loan_close', 'LOANS:CLOSE'],
  view_repayments: ['perm_repay_view', 'REPAYMENTS:VIEW'],
  post_repayment: ['perm_repay_post', 'REPAYMENTS:POST'],
  manage_repayments: ['perm_repay_post', 'perm_repay_adjust', 'REPAYMENTS:POST', 'REPAYMENTS:ADJUST'],
  reverse_repayment: ['perm_repay_reverse', 'REPAYMENTS:REVERSE'],

  // Collections & Recovery
  view_collections: ['perm_coll_view', 'COLLECTIONS:VIEW'],
  manage_collections: ['perm_coll_action', 'perm_coll_assign', 'COLLECTIONS:ACTION', 'COLLECTIONS:ASSIGN'],

  // Products
  view_loan_products: ['perm_prod_view', 'PRODUCTS:VIEW'],
  manage_loan_products: ['perm_prod_manage', 'PRODUCTS:MANAGE'],

  // Administration & System Settings
  view_users: ['perm_user_view', 'USERS:VIEW'],
  manage_users: ['perm_user_manage', 'USERS:MANAGE', 'USERS:CREATE', 'USERS:EDIT'],
  view_roles: ['perm_role_view', 'ROLES:VIEW'],
  manage_roles: ['perm_role_manage', 'ROLES:MANAGE'],
  view_branches: ['perm_branch_view', 'BRANCHES:VIEW'],
  manage_branches: ['perm_branch_manage', 'BRANCHES:MANAGE', 'BRANCHES:CREATE', 'BRANCHES:EDIT'],
  view_system_settings: ['perm_config_view', 'SETTINGS:VIEW', 'CONFIG:VIEW'],
  manage_system_settings: ['perm_config_edit', 'SETTINGS:MANAGE', 'CONFIG:EDIT', 'perm_branch_manage'],
  view_audit_logs: ['perm_audit_view', 'AUDIT:VIEW'],

  // Generic / Core
  view_dashboard: ['perm_app_view', 'perm_cust_view', 'DASHBOARD:VIEW'],
};

/**
 * Checks whether a given list of user permissions includes the required permission.
 * Resolves canonical codes (e.g. 'CUSTOMERS:VIEW'), permission IDs (e.g. 'perm_cust_view'),
 * and legacy/UI aliases (e.g. 'view_customers').
 */
export function userHasPermission(
  userPermissions: string[],
  requiredPermission: string | string[],
  isSystemAdmin: boolean = false
): boolean {
  if (isSystemAdmin) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;

  const reqList = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

  for (const req of reqList) {
    if (userPermissions.includes(req)) return true;

    // Check aliases
    const aliases = PERMISSION_ALIASES[req] || [];
    for (const alias of aliases) {
      if (userPermissions.includes(alias)) return true;
    }

    // Check catalog lookup
    const catalogEntry = PERMISSION_CATALOG.find((c) => c.id === req || c.code === req);
    if (catalogEntry) {
      if (userPermissions.includes(catalogEntry.id)) return true;
      if (userPermissions.includes(catalogEntry.code)) return true;
    }
  }

  return false;
}
