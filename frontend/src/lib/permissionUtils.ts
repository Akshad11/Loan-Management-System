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
  view_system_settings: ['perm_config_view', 'SETTINGS:VIEW', 'CONFIG:VIEW', 'perm_sys_view', 'SYSTEM_CONFIG:VIEW'],
  manage_system_settings: ['perm_config_edit', 'SETTINGS:MANAGE', 'CONFIG:EDIT', 'perm_sys_manage', 'SYSTEM_CONFIG:MANAGE', 'perm_branch_manage'],
  view_system_config: ['perm_sys_view', 'SYSTEM_CONFIG:VIEW', 'perm_config_view', 'SETTINGS:VIEW'],
  manage_system_config: ['perm_sys_manage', 'SYSTEM_CONFIG:MANAGE', 'perm_config_edit', 'SETTINGS:MANAGE'],
  view_audit_logs: ['perm_audit_view', 'AUDIT:VIEW'],

  // Bureau Analysis
  'bureau.view': ['perm_bureau_view', 'BUREAU:VIEW', 'perm_credit_view', 'CREDIT:VIEW'],
  'bureau.request': ['perm_bureau_request', 'BUREAU:REQUEST', 'perm_credit_conduct', 'CREDIT:CONDUCT'],
  'bureau.refresh': ['perm_bureau_refresh', 'BUREAU:REFRESH', 'perm_credit_conduct', 'CREDIT:CONDUCT'],
  view_bureau: ['perm_bureau_view', 'BUREAU:VIEW'],
  request_bureau: ['perm_bureau_request', 'BUREAU:REQUEST'],

  // Co-Applicants
  'coapplicant.view': ['perm_coapp_view', 'COAPPLICANT:VIEW', 'perm_app_view', 'APPLICATIONS:VIEW'],
  'coapplicant.create': ['perm_coapp_create', 'COAPPLICANT:CREATE', 'perm_app_edit', 'APPLICATIONS:EDIT', 'perm_app_party_manage'],
  'coapplicant.edit': ['perm_coapp_edit', 'COAPPLICANT:EDIT', 'perm_app_edit', 'APPLICATIONS:EDIT', 'perm_app_party_manage'],
  'coapplicant.delete': ['perm_coapp_delete', 'COAPPLICANT:DELETE', 'perm_app_edit', 'APPLICATIONS:EDIT', 'perm_app_party_manage'],

  // Collateral Management
  'collateral.view': ['perm_collat_view', 'COLLATERAL:VIEW', 'perm_app_view', 'APPLICATIONS:VIEW', 'perm_loan_view', 'LOANS:VIEW'],
  'collateral.create': ['perm_collat_create', 'COLLATERAL:CREATE', 'perm_app_edit', 'APPLICATIONS:EDIT'],
  'collateral.edit': ['perm_collat_edit', 'COLLATERAL:EDIT', 'perm_app_edit', 'APPLICATIONS:EDIT'],
  'collateral.delete': ['perm_collat_delete', 'COLLATERAL:DELETE', 'perm_app_edit', 'APPLICATIONS:EDIT'],
  'collateral.verify': ['perm_collat_verify', 'COLLATERAL:VERIFY', 'perm_credit_conduct', 'CREDIT:CONDUCT', 'APPROVAL:APPROVE'],
  'collateral.valuation': ['perm_collat_valuation', 'COLLATERAL:VALUATION', 'perm_credit_conduct', 'CREDIT:CONDUCT'],

  // Batch 4: Workflow, Credit Review, Documents & Decisions
  'credit.view': ['perm_credit_wb_view', 'CREDIT:VIEW', 'perm_credit_view', 'CREDIT_ASSESSMENT:VIEW'],
  'credit.review': ['perm_credit_wb_review', 'CREDIT:REVIEW', 'perm_credit_assess', 'CREDIT:ASSESS', 'CREDIT_ASSESSMENT:EDIT'],
  'credit.recommend': ['perm_credit_wb_recommend', 'CREDIT:RECOMMEND', 'perm_credit_submit', 'CREDIT:SUBMIT'],
  'credit.approve': ['perm_credit_wb_approve', 'CREDIT:APPROVE', 'perm_appr_action', 'APPROVALS:APPROVE', 'APPROVAL:APPROVE'],
  'credit.reject': ['perm_credit_wb_reject', 'CREDIT:REJECT', 'perm_appr_reject', 'APPROVALS:REJECT', 'APPROVAL:REJECT'],
  'credit.return': ['perm_credit_wb_return', 'CREDIT:RETURN', 'perm_credit_return', 'perm_appr_return', 'APPROVALS:RETURN'],
  'checklist.view': ['perm_chk_view', 'CHECKLIST:VIEW', 'perm_credit_wb_view', 'CREDIT:VIEW'],
  'checklist.update': ['perm_chk_update', 'CHECKLIST:UPDATE', 'perm_credit_wb_review', 'CREDIT:REVIEW'],
  'document.verify': ['perm_doc_verify', 'DOCUMENT:VERIFY', 'perm_kyc_verify', 'KYC:VERIFY', 'APPLICATIONS:VERIFY_DOCUMENT'],
  'document.reject': ['perm_doc_reject', 'DOCUMENT:REJECT', 'perm_kyc_verify', 'KYC:VERIFY'],
  'workflow.assign': ['perm_wf_assign', 'WORKFLOW:ASSIGN', 'perm_credit_assign', 'CREDIT:ASSIGN', 'APPROVALS:ASSIGN'],
  'workflow.reassign': ['perm_wf_reassign', 'WORKFLOW:REASSIGN', 'perm_appr_reassign', 'APPROVALS:REASSIGN'],
  'decision.view': ['perm_dec_view', 'DECISION:VIEW', 'perm_credit_wb_view', 'CREDIT:VIEW', 'perm_appr_view', 'APPROVALS:VIEW'],

  // Batch 5: Disbursement, Repayment, Mandates & Reconciliation
  'disbursement.view': ['perm_disb_view', 'DISBURSEMENT:VIEW', 'view_disbursements'],
  'disbursement.create': ['perm_disb_create', 'DISBURSEMENT:CREATE', 'create_disbursement_request', 'execute_disbursement'],
  'disbursement.request': ['perm_disb_request', 'DISBURSEMENT:REQUEST', 'create_disbursement_request', 'perm_disb_create'],
  'disbursement.approve': ['perm_disb_approve', 'DISBURSEMENT:APPROVE', 'approve_disbursement', 'perm_appr_approve'],
  'disbursement.reject': ['perm_disb_reject', 'DISBURSEMENT:REJECT', 'perm_appr_reject'],
  'disbursement.reverse': ['perm_disb_reverse', 'DISBURSEMENT:REVERSE', 'perm_repay_reverse'],
  'repayment.view': ['perm_repay_view', 'REPAYMENTS:VIEW', 'view_repayments'],
  'repayment.post': ['perm_repay_post', 'REPAYMENTS:POST', 'post_repayment'],
  'repayment.reverse': ['perm_repay_reverse', 'REPAYMENTS:REVERSE', 'reverse_repayment'],
  'repayment.allocate': ['perm_repay_allocate', 'REPAYMENTS:ALLOCATE', 'perm_repay_post', 'manage_repayments'],
  'mandate.view': ['perm_mandate_view', 'MANDATE:VIEW', 'perm_repay_view', 'view_loans'],
  'mandate.manage': ['perm_mandate_manage', 'MANDATE:MANAGE', 'perm_repay_post', 'manage_repayments'],
  'reconciliation.view': ['perm_recon_view', 'RECONCILIATION:VIEW', 'perm_rep_view', 'view_reports'],
  'reconciliation.execute': ['perm_recon_execute', 'RECONCILIATION:EXECUTE', 'perm_rep_view', 'view_reports'],

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
