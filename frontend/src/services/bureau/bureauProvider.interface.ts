/**
 * Bureau Provider Abstraction & Data Contracts
 * Standardizes multi-bureau queries across CIBIL, Experian, Equifax, and CRIF High Mark.
 */

export type BureauProviderType = 'CIBIL' | 'EXPERIAN' | 'EQUIFAX' | 'CRIF';

export interface BureauPullRequest {
  applicantId: string;
  applicantType: 'PRIMARY' | 'CO_APPLICANT';
  name: string;
  pan: string;
  mobile?: string;
  email?: string;
  dob?: string;
  gender?: string;
  address?: {
    addressLine1?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };
  referenceNumber?: string;
}

export interface NormalizedBureauAccount {
  accountNumberMasked: string;
  accountType: string; // Home Loan, Auto Loan, Credit Card, Personal Loan, etc.
  lenderName: string;
  ownershipType: 'INDIVIDUAL' | 'JOINT' | 'GUARANTOR';
  sanctionedAmount: number;
  currentBalance: number;
  overdueAmount: number;
  openDate: string;
  closedDate?: string;
  lastPaymentDate?: string;
  status: 'ACTIVE' | 'CLOSED' | 'SETTLED' | 'WRITTEN_OFF';
  dpdBucket: '0' | '30+' | '60+' | '90+' | 'DEFAULT';
  paymentHistory?: string; // 24-36 month compact string e.g. "000000000000"
}

export interface NormalizedBureauEnquiry {
  date: string;
  purpose: string;
  amount: number;
  lender: string;
}

export interface NormalizedBureauReport {
  provider: BureauProviderType;
  referenceNumber: string;
  score: number;
  scoreDate: string;
  scoreBand: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  totalAccounts: number;
  activeAccounts: number;
  closedAccounts: number;
  creditCardAccounts: number;
  totalOutstanding: number;
  totalOverdue: number;
  securedExposure: number;
  unsecuredExposure: number;
  dpd30PlusCount: number;
  dpd90PlusCount: number;
  defaultsCount: number;
  settlementsCount: number;
  recentEnquiriesCount: number;
  accounts: NormalizedBureauAccount[];
  enquiries: NormalizedBureauEnquiry[];
  riskIndicators: string[];
  scoreHistory: { month: string; score: number }[];
  rawPayload: Record<string, any>;
}

export interface IBureauProvider {
  name: BureauProviderType;
  pullReport(request: BureauPullRequest): Promise<NormalizedBureauReport>;
}
