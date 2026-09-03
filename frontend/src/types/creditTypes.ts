// Batch 6 - Credit Assessment, Decision & History Type Definitions

export type AssessmentStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'DECISIONED'
  | 'RETURNED';

export type CreditRecommendation =
  | 'RECOMMEND_APPROVE'
  | 'RECOMMEND_REJECT'
  | 'RECOMMEND_REFER'
  | 'RETURN_FOR_MORE_INFO';

export type EmploymentStabilityRating =
  | 'VERY_STABLE'
  | 'STABLE'
  | 'MODERATE'
  | 'VOLATILE'
  | 'UNSTABLE';

export type IncomeSourceType =
  | 'SALARIED'
  | 'SELF_EMPLOYED'
  | 'BUSINESS'
  | 'PROFESSIONAL'
  | 'PENSION'
  | 'OTHER';

export type ObligationSource =
  | 'INTERNAL_LOAN'
  | 'BUREAU'
  | 'DECLARED'
  | 'MANUAL_ENTRY';

export interface ObligationItem {
  id: string;
  assessmentId: string;
  lenderName: string;
  loanType: string;
  outstandingAmount: number;
  monthlyEmi: number;
  remainingTenureMonths: number;
  isSecured: boolean;
  source: ObligationSource;
  accountNumber?: string;
  isExcludedFromFoir?: boolean;
  exclusionReason?: string;
}

export interface BankingIndicators {
  primaryBank: string;
  accountType: string;
  averageMonthlyBalance: number;
  salaryCreditsStatus: 'REGULAR' | 'IRREGULAR' | 'FREQUENT_VARIATION';
  salaryCreditAverage: number;
  recentBounceCount: number;
  overdraftUsage: 'NONE' | 'OCCASIONAL' | 'FREQUENT' | 'HIGH';
  monthlyCreditTransactionCount: number;
  monthlyDebitTransactionCount: number;
  recentTransactionTrend: 'STABLE' | 'GROWING' | 'DECLINING' | 'VOLATILE';
  inwardChequeReturnCount: number;
  outwardChequeReturnCount: number;
  cashDepositPercentage: number;
}

export interface BureauAccountRecord {
  id: string;
  accountType: string;
  lender: string;
  sanctionedAmount: number;
  currentBalance: number;
  openDate: string;
  status: 'STANDARD' | 'SMA_0' | 'SMA_1' | 'SMA_2' | 'NPA' | 'CLOSED' | 'SETTLED' | 'WRITTEN_OFF';
  onTimePaymentsCount: number;
  latePaymentsCount: number;
  maxDpd: number;
  lastPaymentDate?: string;
  isSecured: boolean;
}

export interface CreditHistoryRecord {
  bureauScore: number;
  bureauName: string;
  scoreDate: string;
  scoreBand: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'HIGH_RISK';
  activeAccountsCount: number;
  closedAccountsCount: number;
  delinquenciesCount: number;
  recentDpdDays: number;
  writeOffsCount: number;
  suitFiled: boolean;
  enquiriesLast6Months: number;
  accounts: BureauAccountRecord[];
  negativeIndicators: string[];
}

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskIndicatorItem {
  id: string;
  title: string;
  severity: RiskSeverity;
  category: 'INCOME' | 'OBLIGATIONS' | 'BUREAU' | 'BANKING' | 'COLLATERAL' | 'EMPLOYMENT' | 'DOCUMENTATION';
  source: string;
  notes: string;
  detectedDate: string;
}

export type RuleEvaluationResult = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_EVALUATED';

export interface AssessmentRuleItem {
  id: string;
  ruleCode: string;
  name: string;
  category: 'ELIGIBILITY' | 'CREDIT_POLICY' | 'AFFORDABILITY' | 'DOCUMENTATION';
  currentValueDisplay: string;
  thresholdDisplay: string;
  result: RuleEvaluationResult;
  source: string;
  description: string;
  remediationNotes?: string;
  isBlockingApproval: boolean;
}

export type ConditionRequiredStage = 'APPROVAL' | 'SANCTION' | 'DISBURSEMENT' | 'POST_DISBURSEMENT';
export type ConditionStatus = 'OPEN' | 'COMPLETED' | 'WAIVED' | 'NOT_APPLICABLE';

export interface AssessmentConditionItem {
  id: string;
  assessmentId: string;
  conditionType: string;
  description: string;
  requiredBefore: ConditionRequiredStage;
  dueDate?: string;
  status: ConditionStatus;
  addedBy: string;
  addedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface AssessmentVersionSnapshot {
  versionNumber: number;
  timestamp: string;
  actor: string;
  actorRole: string;
  recommendation: CreditRecommendation;
  recommendedAmount: number;
  recommendedTenureMonths: number;
  recommendedInterestRate: number;
  consideredIncome: number;
  existingObligationRatio: number;
  postApplicationObligationRatio: number;
  decisionNotes: string;
  changeReason?: string;
}

export interface AssessmentTimelineEvent {
  id: string;
  assessmentId: string;
  timestamp: string;
  eventType: string;
  eventTitle: string;
  actor: string;
  actorRole: string;
  previousState?: string;
  newState?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreditAssessmentRecord {
  id: string; // e.g. "CA-2026-000481"
  assessmentNumber: string;
  applicationId: string;
  applicationNumber: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  customerMobile: string;
  customerKycStatus: string;
  branchId: string;
  branchName: string;
  productCode: string;
  productName: string;
  applicationDate: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  requestedInterestRate: number;
  requestedFrequency: string;
  purpose: string;
  status: AssessmentStatus;
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: string;
  assignedBy?: string;
  assignmentNotes?: string;
  startedAt?: string;
  startedBy?: string;
  submittedAt?: string;
  submittedBy?: string;
  returnedAt?: string;
  returnedBy?: string;
  returnReason?: string;
  returnRequiredAction?: string;
  ageDays: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // Financial & Income Assessment
  incomeSourceType: IncomeSourceType;
  employerOrBusinessName: string;
  employmentVintageYears: number;
  employmentVintageMonths: number;
  employmentStability: EmploymentStabilityRating;
  monthlyGrossIncome: number;
  monthlyNetIncome: number;
  otherMonthlyIncome: number;
  otherIncomeDescription?: string;
  totalConsideredIncome: number;

  // Obligations
  obligations: ObligationItem[];
  totalExistingOutstanding: number;
  totalExistingMonthlyEmi: number;
  existingObligationRatio: number; // (totalExistingMonthlyEmi / totalConsideredIncome) * 100

  // Proposed & Assessment Metrics
  proposedEmi: number;
  postApplicationObligationRatio: number; // ((totalExistingMonthlyEmi + proposedEmi) / totalConsideredIncome) * 100

  // Banking & Bureau
  bankingIndicators: BankingIndicators;
  creditHistory: CreditHistoryRecord;
  riskIndicators: RiskIndicatorItem[];

  // Rules & Conditions
  rules: AssessmentRuleItem[];
  conditions: AssessmentConditionItem[];

  // Recommendation & Underwriter Decision
  recommendation: CreditRecommendation;
  recommendedAmount: number;
  recommendedTenureMonths: number;
  recommendedInterestRate: number;
  recommendationNotes: string;
  decisionChangeReason?: string;
  underwriterNotes: string;

  // History & Versions
  currentVersion: number;
  versions: AssessmentVersionSnapshot[];
  history: AssessmentTimelineEvent[];
  createdDate: string;
  updatedDate: string;
}

export interface CreditQueueToolbarFilters {
  searchQuery: string;
  status: 'ALL' | AssessmentStatus;
  branchId: string;
  productCode: string;
  assignedOfficerId: string;
  dateFrom: string;
  dateTo: string;
  assessmentDateFrom: string;
  assessmentDateTo: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy: 'OLDEST' | 'NEWEST' | 'AMOUNT_DESC' | 'PENDING_DAYS' | 'PRIORITY';
}
