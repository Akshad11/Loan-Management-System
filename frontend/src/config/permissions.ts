import { PermissionDefinition, ModuleCategory } from '../types';

export const PERMISSION_MODULES: { key: ModuleCategory; label: string; description: string }[] = [
  { key: 'CUSTOMERS', label: 'Customer Management', description: 'Customer profiles, onboarding, and contact records' },
  { key: 'KYC', label: 'KYC Verification', description: 'PAN, Aadhaar, identity checks, and AML verification' },
  { key: 'APPLICATIONS', label: 'Loan Origination & Applications', description: 'Intake, pipeline, and loan requests' },
  { key: 'CREDIT_ASSESSMENT', label: 'Credit Assessment & Underwriting', description: 'CIBIL analysis, debt calculations, and financial scoring' },
  { key: 'APPROVALS', label: 'Approvals & Committee Governance', description: 'Sanctioning authority, credit committee reviews' },
  { key: 'SANCTIONS', label: 'Sanction Letters & Documentation', description: 'Issuance, signing, and condition compliance' },
  { key: 'LOANS', label: 'Loan Accounts Portfolio', description: 'Active accounts, statements, and NPA monitoring' },
  { key: 'DISBURSEMENT', label: 'Disbursements & Bank Payouts', description: 'Fund release, NEFT/RTGS processing, and verification' },
  { key: 'REPAYMENTS', label: 'Repayments & Ledger', description: 'EMI collection, posting, reversal, and adjustments' },
  { key: 'COLLECTIONS', label: 'Collections & Delinquency', description: 'DPD tracking, demand notices, and recovery logs' },
  { key: 'REPORTS', label: 'Reporting & Analytics', description: 'Operational, regulatory (RBI), and financial reports' },
  { key: 'AUDIT', label: 'System Audit Logs', description: 'Immutable transaction trails and administrative access history' },
  { key: 'USERS', label: 'User Management', description: 'Staff user accounts, statuses, and credential controls' },
  { key: 'ROLES', label: 'Roles & Permissions', description: 'RBAC role definitions and permission matrices' },
  { key: 'BRANCHES', label: 'Branch Management', description: 'Branch directory, manager assignment, and locations' },
  { key: 'SYSTEM_CONFIG', label: 'System Configuration', description: 'Global parameters, operational timers, and financial rules' },
  { key: 'LOAN_PRODUCTS', label: 'Loan Products Configuration', description: 'Interest rates, product limits, and fee schedules' },
];

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  // Customers
  { id: 'perm_cust_view', code: 'CUSTOMERS:VIEW', name: 'View Customers', description: 'Access customer profiles and records', module: 'CUSTOMERS', moduleLabel: 'Customer Management', action: 'VIEW' },
  { id: 'perm_cust_create', code: 'CUSTOMERS:CREATE', name: 'Create Customer', description: 'Onboard new borrowers into the system', module: 'CUSTOMERS', moduleLabel: 'Customer Management', action: 'CREATE' },
  { id: 'perm_cust_edit', code: 'CUSTOMERS:EDIT', name: 'Edit Customer', description: 'Update customer contact and profile data', module: 'CUSTOMERS', moduleLabel: 'Customer Management', action: 'EDIT' },
  { id: 'perm_cust_export', code: 'CUSTOMERS:EXPORT', name: 'Export Customers', description: 'Download customer lists and reports', module: 'CUSTOMERS', moduleLabel: 'Customer Management', action: 'EXPORT' },

  // KYC
  { id: 'perm_kyc_view', code: 'KYC:VIEW', name: 'View KYC Documents', description: 'Inspect identity cards and verified records', module: 'KYC', moduleLabel: 'KYC Verification', action: 'VIEW' },
  { id: 'perm_kyc_verify', code: 'KYC:VERIFY', name: 'Verify / Approve KYC', description: 'Mark KYC documents as verified or rejected', module: 'KYC', moduleLabel: 'KYC Verification', action: 'APPROVE' },

  // Applications
  { id: 'perm_app_view', code: 'APPLICATIONS:VIEW', name: 'View Loan Applications', description: 'Browse origination pipeline and applications', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'VIEW' },
  { id: 'perm_app_create', code: 'APPLICATIONS:CREATE', name: 'Create Application', description: 'Initiate new loan application files', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'CREATE' },
  { id: 'perm_app_edit', code: 'APPLICATIONS:EDIT', name: 'Edit Application', description: 'Modify loan terms and application details', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'EDIT' },
  { id: 'perm_app_submit', code: 'APPLICATIONS:SUBMIT', name: 'Submit for Credit Review', description: 'Hand over loan application to underwriting', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'SUBMIT' },
  { id: 'perm_app_cancel', code: 'APPLICATIONS:CANCEL', name: 'Cancel Application', description: 'Withdraw or cancel pending loan applications', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'REJECT' },
  { id: 'perm_app_party_manage', code: 'APPLICATIONS:PARTY_MANAGE', name: 'Manage Co-applicants & Guarantors', description: 'Link and unlink parties from loan applications', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'MANAGE' },
  { id: 'perm_app_doc_view', code: 'APPLICATIONS:DOCUMENT_VIEW', name: 'View Application Documents', description: 'Inspect attached application proofs and checklist', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'VIEW' },
  { id: 'perm_app_doc_upload', code: 'APPLICATIONS:DOCUMENT_UPLOAD', name: 'Upload Application Documents', description: 'Attach required financial and KYC documents to application', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'CREATE' },
  { id: 'perm_app_doc_remove', code: 'APPLICATIONS:DOCUMENT_REMOVE', name: 'Remove Application Documents', description: 'Detach non-mandatory or erroneous documents', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'DELETE' },
  { id: 'perm_app_export', code: 'APPLICATIONS:EXPORT', name: 'Export Applications', description: 'Export loan pipeline reports and audit summaries', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'EXPORT' },

  // Credit Assessment
  { id: 'perm_credit_view', code: 'CREDIT:VIEW', name: 'View Credit Assessments', description: 'Examine debt-to-income and bureau metrics', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'VIEW' },
  { id: 'perm_credit_conduct', code: 'CREDIT:CONDUCT', name: 'Conduct Credit Assessment', description: 'Score applicants and propose sanction limits', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'CREATE' },
  { id: 'perm_credit_recommend', code: 'CREDIT:RECOMMEND', name: 'Recommend for Approval', description: 'Submit credit appraisal to sanctioning committee', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'SUBMIT' },
  { id: 'perm_credit_assign', code: 'CREDIT:ASSIGN', name: 'Assign Assessment Case', description: 'Allocate credit review files to underwriters', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'MANAGE' },
  { id: 'perm_credit_assess', code: 'CREDIT:ASSESS', name: 'Assess Financial Profile', description: 'Perform in-depth income, obligation, and banking analysis', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'EDIT' },
  { id: 'perm_credit_edit', code: 'CREDIT:EDIT', name: 'Edit Assessment Details', description: 'Update financial figures and underwriter notes', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'EDIT' },
  { id: 'perm_credit_submit', code: 'CREDIT:SUBMIT', name: 'Submit Credit Decision', description: 'Forward underwriter recommendation to committee', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'SUBMIT' },
  { id: 'perm_credit_return', code: 'CREDIT:RETURN', name: 'Return Assessment to Sourcing', description: 'Send case back to loan officer for document clarifications', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'REJECT' },
  { id: 'perm_credit_decision', code: 'CREDIT:DECISION', name: 'Make Credit Decision', description: 'Formulate credit recommendation with covenants', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'APPROVE' },
  { id: 'perm_credit_rule_view', code: 'CREDIT:RULE_VIEW', name: 'View Assessment Rules', description: 'Inspect automated policy checks and threshold compliance', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'VIEW' },
  { id: 'perm_credit_condition_manage', code: 'CREDIT:CONDITION_MANAGE', name: 'Manage Sanction Conditions', description: 'Attach, resolve, or waive approval and disbursement covenants', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'MANAGE' },
  { id: 'perm_credit_history_view', code: 'CREDIT:HISTORY_VIEW', name: 'View Assessment History', description: 'Audit version snapshots and immutable decision timelines', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'VIEW' },

  // Approvals (High-risk financial) & Committee Governance (Batch 7)
  { id: 'perm_appr_view', code: 'APPROVALS:VIEW', name: 'View Pending Approvals', description: 'View committee workqueue, dossiers, and proposals', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'VIEW' },
  { id: 'perm_appr_action', code: 'APPROVALS:APPROVE', name: 'Approve Loan Sanction', description: 'Execute final credit approval within assigned limit', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'APPROVE', isHighRiskFinancial: true },
  { id: 'perm_appr_assign', code: 'APPROVALS:ASSIGN', name: 'Assign Approval Case', description: 'Allocate approval cases to credit managers and committee members', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'MANAGE' },
  { id: 'perm_appr_reassign', code: 'APPROVALS:REASSIGN', name: 'Reassign Approval Case', description: 'Reallocate approval cases to alternate approvers', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'MANAGE' },
  { id: 'perm_appr_decide', code: 'APPROVALS:DECIDE', name: 'Make Approval Decision', description: 'Approve, reject, or return applications at assigned level', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'APPROVE', isHighRiskFinancial: true },
  { id: 'perm_appr_return', code: 'APPROVALS:RETURN', name: 'Return for More Information', description: 'Send application back to underwriting/sourcing for clarifications', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'REJECT' },
  { id: 'perm_appr_reject', code: 'APPROVALS:REJECT', name: 'Reject Loan Application', description: 'Issue formal credit rejection decision', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'REJECT', isHighRiskFinancial: true },
  { id: 'perm_appr_condition_manage', code: 'APPROVALS:CONDITION_MANAGE', name: 'Manage Approval Conditions', description: 'Add, resolve, or waive approval/sanction conditions', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'MANAGE' },
  { id: 'perm_appr_exception_manage', code: 'APPROVALS:EXCEPTION_MANAGE', name: 'Manage & Route Exceptions', description: 'Create, route, and resolve policy/amount/rate exceptions', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'MANAGE' },
  { id: 'perm_appr_history_view', code: 'APPROVALS:HISTORY_VIEW', name: 'View Approval History & Audit', description: 'Inspect immutable decision versions and chronological audit trail', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'VIEW' },
  { id: 'perm_appr_matrix_view', code: 'APPROVALS:MATRIX_VIEW', name: 'View Approval Matrix', description: 'Inspect delegation of authority rules and tiers', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'VIEW' },
  { id: 'perm_appr_matrix_manage', code: 'APPROVALS:MATRIX_MANAGE', name: 'Manage Approval Matrix', description: 'Configure approval levels, roles, and exposure limits', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'MANAGE' },
  { id: 'perm_appr_export', code: 'APPROVALS:EXPORT', name: 'Export Approvals Queue', description: 'Export approval queue and decisions reports', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'EXPORT' },

  // Sanctions & Documentation (Batch 8)
  { id: 'perm_sanc_view', code: 'SANCTIONS:VIEW', name: 'View Sanctions', description: 'Access issued sanction records, offers, and readiness files', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'VIEW' },
  { id: 'perm_sanc_create', code: 'SANCTIONS:CREATE', name: 'Create Sanction', description: 'Initialize sanction from approved application', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'CREATE' },
  { id: 'perm_sanc_edit', code: 'SANCTIONS:EDIT', name: 'Edit Sanction Terms', description: 'Adjust sanction terms with deviation justifications', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'EDIT' },
  { id: 'perm_sanc_review', code: 'SANCTIONS:REVIEW', name: 'Review Sanction Dossier', description: 'Conduct pre-sanction checks and terms review', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'VIEW' },
  { id: 'perm_sanc_confirm', code: 'SANCTIONS:CONFIRM', name: 'Confirm Loan Sanction', description: 'Execute final sanction confirmation and validation', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'APPROVE', isHighRiskFinancial: true },
  { id: 'perm_sanc_return', code: 'SANCTIONS:RETURN', name: 'Return Sanction for Correction', description: 'Send sanction draft back with required corrections', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'REJECT' },
  { id: 'perm_sanc_cancel', code: 'SANCTIONS:CANCEL', name: 'Cancel Sanction', description: 'Cancel sanction with audit justification', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'REJECT', isHighRiskFinancial: true },
  { id: 'perm_sanc_condition_manage', code: 'SANCTIONS:CONDITION_MANAGE', name: 'Manage Sanction Conditions', description: 'Add, complete, or waive pre-disbursement conditions', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'MANAGE' },
  { id: 'perm_sanc_letter_generate', code: 'SANCTIONS:LETTER_GENERATE', name: 'Generate Sanction Letter', description: 'Create and version formal sanction letter drafts', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'CREATE' },
  { id: 'perm_sanc_letter_issue', code: 'SANCTIONS:LETTER_ISSUE', name: 'Issue Sanction Letter', description: 'Formally issue and dispatch sanction letter to customer', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'APPROVE' },
  { id: 'perm_sanc_history_view', code: 'SANCTIONS:HISTORY_VIEW', name: 'View Sanction History', description: 'Audit sanction versions, timeline, and change events', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'VIEW' },
  { id: 'perm_sanc_readiness_view', code: 'SANCTIONS:READINESS_VIEW', name: 'View Pre-Disbursement Readiness', description: 'Inspect automated readiness checklist and blockers', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'VIEW' },
  { id: 'perm_sanc_readiness_manage', code: 'SANCTIONS:READINESS_MANAGE', name: 'Manage Readiness Prerequisites', description: 'Resolve prerequisites and mark readiness compliance', module: 'SANCTIONS', moduleLabel: 'Sanction Letters & Documentation', action: 'MANAGE' },

  // Loans
  { id: 'perm_loan_view', code: 'LOANS:VIEW', name: 'View Loan Accounts', description: 'Access loan accounts, DPD, and balances', module: 'LOANS', moduleLabel: 'Loan Accounts Portfolio', action: 'VIEW' },
  { id: 'perm_loan_close', code: 'LOANS:CLOSE', name: 'Close Loan Account', description: 'Execute account closure upon full settlement', module: 'LOANS', moduleLabel: 'Loan Accounts Portfolio', action: 'CLOSE_LOAN', isHighRiskFinancial: true },
  { id: 'perm_loan_foreclose', code: 'LOANS:FORECLOSE', name: 'Foreclose Loan Account', description: 'Process prepayment and early account foreclosure', module: 'LOANS', moduleLabel: 'Loan Accounts Portfolio', action: 'FORECLOSE', isHighRiskFinancial: true },

  // Disbursement (High-risk financial)
  { id: 'perm_disb_view', code: 'DISBURSEMENT:VIEW', name: 'View Disbursements', description: 'Browse pending and processed payout files', module: 'DISBURSEMENT', moduleLabel: 'Disbursements & Bank Payouts', action: 'VIEW' },
  { id: 'perm_disb_execute', code: 'DISBURSEMENT:EXECUTE', name: 'Authorize Fund Disbursement', description: 'Release bank payout to borrower bank account', module: 'DISBURSEMENT', moduleLabel: 'Disbursements & Bank Payouts', action: 'DISBURSE', isHighRiskFinancial: true },

  // Repayments (High-risk financial)
  { id: 'perm_repay_view', code: 'REPAYMENTS:VIEW', name: 'View Repayments Ledger', description: 'Check repayment schedules and collected EMIs', module: 'REPAYMENTS', moduleLabel: 'Repayments & Ledger', action: 'VIEW' },
  { id: 'perm_repay_post', code: 'REPAYMENTS:POST', name: 'Post Repayment Receipt', description: 'Record manual or gateway EMI receipts into ledger', module: 'REPAYMENTS', moduleLabel: 'Repayments & Ledger', action: 'POST_PAYMENT', isHighRiskFinancial: true },
  { id: 'perm_repay_reverse', code: 'REPAYMENTS:REVERSE', name: 'Reverse Repayment Entry', description: 'Undo erroneous credit entries in ledger', module: 'REPAYMENTS', moduleLabel: 'Repayments & Ledger', action: 'REVERSE_PAYMENT', isHighRiskFinancial: true },
  { id: 'perm_repay_waive', code: 'REPAYMENTS:WAIVE_CHARGE', name: 'Waive Penal Charges', description: 'Grant waiver on late payment penalty fees', module: 'REPAYMENTS', moduleLabel: 'Repayments & Ledger', action: 'WAIVE_CHARGE', isHighRiskFinancial: true },

  // Collections
  { id: 'perm_collec_view', code: 'COLLECTIONS:VIEW', name: 'View Collections & NPA', description: 'Monitor overdue buckets and delinquent accounts', module: 'COLLECTIONS', moduleLabel: 'Collections & Delinquency', action: 'VIEW' },
  { id: 'perm_collec_action', code: 'COLLECTIONS:LOG_ACTIVITY', name: 'Log Recovery Actions', description: 'Record borrower interactions and promise-to-pay', module: 'COLLECTIONS', moduleLabel: 'Collections & Delinquency', action: 'CREATE' },

  // Reports
  { id: 'perm_rep_view', code: 'REPORTS:VIEW', name: 'View Financial & MIS Reports', description: 'Access operational reports and portfolios', module: 'REPORTS', moduleLabel: 'Reporting & Analytics', action: 'VIEW' },
  { id: 'perm_rep_export', code: 'REPORTS:EXPORT', name: 'Export Regulatory Data', description: 'Download RBI reports and auditor balance sheets', module: 'REPORTS', moduleLabel: 'Reporting & Analytics', action: 'EXPORT' },

  // Audit
  { id: 'perm_audit_view', code: 'AUDIT:VIEW', name: 'View System Audit Logs', description: 'Access read-only system audit trails', module: 'AUDIT', moduleLabel: 'System Audit Logs', action: 'VIEW' },

  // User Management
  { id: 'perm_users_view', code: 'USERS:VIEW', name: 'View User Directory', description: 'Access staff accounts, branches, and statuses', module: 'USERS', moduleLabel: 'User Management', action: 'VIEW' },
  { id: 'perm_users_manage', code: 'USERS:MANAGE', name: 'Create & Manage Users', description: 'Provision accounts, update profiles, and deactivate users', module: 'USERS', moduleLabel: 'User Management', action: 'MANAGE' },

  // Role Management
  { id: 'perm_roles_view', code: 'ROLES:VIEW', name: 'View Roles & Permissions', description: 'View system roles and permission assignments', module: 'ROLES', moduleLabel: 'Roles & Permissions', action: 'VIEW' },
  { id: 'perm_roles_manage', code: 'ROLES:MANAGE', name: 'Configure Roles & Matrix', description: 'Create and modify role definitions and permissions', module: 'ROLES', moduleLabel: 'Roles & Permissions', action: 'MANAGE' },

  // Branch Management
  { id: 'perm_branch_view', code: 'BRANCHES:VIEW', name: 'View Branch Directory', description: 'Access branch details, codes, and managers', module: 'BRANCHES', moduleLabel: 'Branch Management', action: 'VIEW' },
  { id: 'perm_branch_manage', code: 'BRANCHES:MANAGE', name: 'Create & Manage Branches', description: 'Register new branches and update locations', module: 'BRANCHES', moduleLabel: 'Branch Management', action: 'MANAGE' },

  // System Configuration
  { id: 'perm_sys_view', code: 'SYSTEM_CONFIG:VIEW', name: 'View System Configuration', description: 'Inspect global operational parameters', module: 'SYSTEM_CONFIG', moduleLabel: 'System Configuration', action: 'VIEW' },
  { id: 'perm_sys_manage', code: 'SYSTEM_CONFIG:MANAGE', name: 'Modify System Parameters', description: 'Update system-wide operational limits and rules', module: 'SYSTEM_CONFIG', moduleLabel: 'System Configuration', action: 'MANAGE' },

  // Loan Products
  { id: 'perm_prod_view', code: 'LOAN_PRODUCTS:VIEW', name: 'View Loan Products', description: 'Inspect active loan catalog and interest schemes', module: 'LOAN_PRODUCTS', moduleLabel: 'Loan Products Configuration', action: 'VIEW' },
  { id: 'perm_prod_manage', code: 'LOAN_PRODUCTS:MANAGE', name: 'Configure Loan Products', description: 'Define new interest schemes and lending limits', module: 'LOAN_PRODUCTS', moduleLabel: 'Loan Products Configuration', action: 'MANAGE' },

  // Credit Bureau & CIBIL
  { id: 'perm_bureau_view', code: 'BUREAU:VIEW', name: 'View Credit Bureau Reports', description: 'View CIBIL and credit bureau analysis, score cards, and trade lines', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'VIEW' },
  { id: 'perm_bureau_request', code: 'BUREAU:REQUEST', name: 'Request Bureau Report', description: 'Initiate new credit bureau enquiry for applicant or co-applicant', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'CREATE' },
  { id: 'perm_bureau_refresh', code: 'BUREAU:REFRESH', name: 'Refresh Bureau Report', description: 'Re-pull or refresh existing credit bureau reports', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'EDIT' },

  // Co-Applicants & Parties
  { id: 'perm_coapp_view', code: 'COAPPLICANT:VIEW', name: 'View Co-Applicants', description: 'Access co-applicant profiles, KYC, and financial summaries', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'VIEW' },
  { id: 'perm_coapp_create', code: 'COAPPLICANT:CREATE', name: 'Add Co-Applicant', description: 'Add new or link existing customer as co-applicant', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'CREATE' },
  { id: 'perm_coapp_edit', code: 'COAPPLICANT:EDIT', name: 'Edit Co-Applicant', description: 'Modify co-applicant details, ownership share, or primary designation', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'EDIT' },
  { id: 'perm_coapp_delete', code: 'COAPPLICANT:DELETE', name: 'Remove Co-Applicant', description: 'Unlink or remove co-applicants before submission', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'DELETE' },

  // Collateral Management
  { id: 'perm_collat_view', code: 'COLLATERAL:VIEW', name: 'View Collateral Details', description: 'Inspect collateral records, asset details, and LTV ratios', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'VIEW' },
  { id: 'perm_collat_create', code: 'COLLATERAL:CREATE', name: 'Create Collateral Record', description: 'Pledge new collateral assets to applications or loans', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'CREATE' },
  { id: 'perm_collat_edit', code: 'COLLATERAL:EDIT', name: 'Edit Collateral Record', description: 'Update asset details, ownership, or pledged status', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'EDIT' },
  { id: 'perm_collat_delete', code: 'COLLATERAL:DELETE', name: 'Remove Collateral Record', description: 'Delete or release pledged collateral assets', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'DELETE' },
  { id: 'perm_collat_verify', code: 'COLLATERAL:VERIFY', name: 'Verify Collateral (Legal/Tech)', description: 'Record legal search reports and technical inspection clearance', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'APPROVE' },
  { id: 'perm_collat_valuation', code: 'COLLATERAL:VALUATION', name: 'Record Asset Valuation', description: 'Update market valuation, forced sale value, and re-estimate LTV', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'EDIT' },

  // Batch 4: Workflow, Credit Review, Documents & Decisions
  { id: 'perm_credit_wb_view', code: 'CREDIT:VIEW', name: 'View Credit Workbench', description: 'Access credit review workbench and dossier', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'VIEW' },
  { id: 'perm_credit_wb_review', code: 'CREDIT:REVIEW', name: 'Review Credit Dossier', description: 'Perform underwriting evaluation across applicant, bureau, and collateral', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'EDIT' },
  { id: 'perm_credit_wb_recommend', code: 'CREDIT:RECOMMEND', name: 'Recommend Credit Proposal', description: 'Recommend approval or conditional sanction to committee', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'SUBMIT' },
  { id: 'perm_credit_wb_approve', code: 'CREDIT:APPROVE', name: 'Approve Credit Proposal', description: 'Execute formal credit sanction within assigned authority', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'APPROVE', isHighRiskFinancial: true },
  { id: 'perm_credit_wb_reject', code: 'CREDIT:REJECT', name: 'Reject Credit Proposal', description: 'Execute formal credit rejection decision', module: 'APPROVALS', moduleLabel: 'Approvals & Committee Governance', action: 'REJECT', isHighRiskFinancial: true },
  { id: 'perm_credit_wb_return', code: 'CREDIT:RETURN', name: 'Return for Correction', description: 'Return application with structured correction checklist', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'REJECT' },
  { id: 'perm_chk_view', code: 'CHECKLIST:VIEW', name: 'View Review Checklist', description: 'View underwriting and compliance checklists', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'VIEW' },
  { id: 'perm_chk_update', code: 'CHECKLIST:UPDATE', name: 'Update Checklist Item', description: 'Mark checklist items verified, waived, or failed', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'EDIT' },
  { id: 'perm_doc_verify', code: 'DOCUMENT:VERIFY', name: 'Verify Application Document', description: 'Inspect and mark documents verified', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'APPROVE' },
  { id: 'perm_doc_reject', code: 'DOCUMENT:REJECT', name: 'Reject Application Document', description: 'Reject document with mandatory explanation', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'REJECT' },
  { id: 'perm_wf_assign', code: 'WORKFLOW:ASSIGN', name: 'Assign Workflow Application', description: 'Allocate applications to credit underwriters and checkers', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'MANAGE' },
  { id: 'perm_wf_reassign', code: 'WORKFLOW:REASSIGN', name: 'Reassign Workflow Application', description: 'Reassign application to alternate officer', module: 'APPLICATIONS', moduleLabel: 'Loan Origination & Applications', action: 'MANAGE' },
  { id: 'perm_dec_view', code: 'DECISION:VIEW', name: 'View Credit Decisions', description: 'Access formal decision history, conditions, and returns', module: 'CREDIT_ASSESSMENT', moduleLabel: 'Credit Assessment & Underwriting', action: 'VIEW' },

  // Batch 5: Disbursement, Repayment, Mandates, Reconciliation & Post-Approval Controls
  { id: 'perm_disb_create', code: 'DISBURSEMENT:CREATE', name: 'Create Disbursement Request', description: 'Create full or partial disbursement request instructions', module: 'DISBURSEMENT', moduleLabel: 'Disbursements & Bank Payouts', action: 'CREATE' },
  { id: 'perm_disb_request', code: 'DISBURSEMENT:REQUEST', name: 'Submit Disbursement for Approval', description: 'Submit disbursement tranche for checker authorization', module: 'DISBURSEMENT', moduleLabel: 'Disbursements & Bank Payouts', action: 'SUBMIT' },
  { id: 'perm_disb_approve', code: 'DISBURSEMENT:APPROVE', name: 'Approve Disbursement Request', description: 'Authorize payout tranche under authority limit', module: 'DISBURSEMENT', moduleLabel: 'Disbursements & Bank Payouts', action: 'APPROVE', isHighRiskFinancial: true },
  { id: 'perm_disb_reject', code: 'DISBURSEMENT:REJECT', name: 'Reject Disbursement Request', description: 'Reject payout tranche with reason', module: 'DISBURSEMENT', moduleLabel: 'Disbursements & Bank Payouts', action: 'REJECT', isHighRiskFinancial: true },
  { id: 'perm_disb_reverse', code: 'DISBURSEMENT:REVERSE', name: 'Reverse Disbursement Transaction', description: 'Execute compensating accounting reversal on failed/recalled payout', module: 'DISBURSEMENT', moduleLabel: 'Disbursements & Bank Payouts', action: 'REVERSE_PAYMENT', isHighRiskFinancial: true },
  { id: 'perm_repay_allocate', code: 'REPAYMENTS:ALLOCATE', name: 'Execute Repayment Allocation', description: 'Run waterfall payment allocation across fees, interest, and principal', module: 'REPAYMENTS', moduleLabel: 'Repayments & Ledger', action: 'POST_PAYMENT', isHighRiskFinancial: true },
  { id: 'perm_mandate_view', code: 'MANDATE:VIEW', name: 'View Repayment Mandates', description: 'Browse active and pending NACH/eMandate records', module: 'REPAYMENTS', moduleLabel: 'Repayments & Ledger', action: 'VIEW' },
  { id: 'perm_mandate_manage', code: 'MANDATE:MANAGE', name: 'Manage Repayment Mandates', description: 'Register, activate, or cancel customer auto-debit mandates', module: 'REPAYMENTS', moduleLabel: 'Repayments & Ledger', action: 'MANAGE', isHighRiskFinancial: true },
  { id: 'perm_recon_view', code: 'RECONCILIATION:VIEW', name: 'View Reconciliation Reports', description: 'Inspect 3-way reconciliation batches and discrepancies', module: 'REPORTS', moduleLabel: 'Reporting & Analytics', action: 'VIEW' },
  { id: 'perm_recon_execute', code: 'RECONCILIATION:EXECUTE', name: 'Execute Operational Reconciliation', description: 'Run automated 3-way matching between LMS, Bank, and GL', module: 'REPORTS', moduleLabel: 'Reporting & Analytics', action: 'MANAGE', isHighRiskFinancial: true },
];
