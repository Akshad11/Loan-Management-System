import prisma from '@/lib/prisma';

export interface ApplicantEligibilitySummary {
  applicantId: string;
  applicantType: 'PRIMARY' | 'CO_APPLICANT';
  name: string;
  monthlyIncome: number;
  existingObligations: number;
  cibilScore: number | null;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
}

export interface CombinedEligibilityResult {
  applicationId: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  interestRate: number;
  combinedMonthlyIncome: number;
  combinedMonthlyObligations: number;
  netDisposableIncome: number;
  foirLimitPercent: number;
  actualFoirPercent: number;
  maxPermissibleEMI: number;
  proposedLoanEMI: number;
  maxEligibleAmount: number;
  eligibilityStatus: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'INELIGIBLE';
  recommendedAmount: number;
  lowestBureauScore: number | null;
  overallRiskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  applicantSummaries: ApplicantEligibilitySummary[];
  policyDeviations: string[];
  recommendations: string[];
}

/**
 * Calculates combined loan eligibility for primary borrower and all co-applicants.
 * Server-side source of truth for credit decisioning.
 */
export async function calculateCombinedEligibility(
  applicationId: string
): Promise<CombinedEligibilityResult> {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: true,
      coApplicants: true,
      product: true,
    },
  });

  if (!app) {
    throw new Error(`Application ${applicationId} not found.`);
  }

  const requestedAmount = Number(app.requestedAmount);
  const tenureMonths = app.requestedTenureMonths;
  const annualInterestRate = Number(app.interestRate);
  const monthlyRate = annualInterestRate / 12 / 100;

  // 1. Gather primary borrower financial profile
  const primaryIncome = Number(app.customerMonthlyIncome || app.customer.monthlyIncome || 0);
  const primaryObligations = Number(app.customerTotalExposure || 0) * 0.03; // Approximate 3% monthly debt service or stored obligation
  const primaryScore = app.customer.cibilScore || null;

  const applicantSummaries: ApplicantEligibilitySummary[] = [
    {
      applicantId: app.customerId,
      applicantType: 'PRIMARY',
      name: app.customerName,
      monthlyIncome: primaryIncome,
      existingObligations: primaryObligations,
      cibilScore: primaryScore,
      riskRating: getScoreRiskRating(primaryScore),
    },
  ];

  // 2. Aggregate co-applicants
  let totalCoAppIncome = 0;
  let totalCoAppObligations = 0;

  for (const ca of app.coApplicants) {
    const inc = Number(ca.monthlyIncome || 0);
    const ob = Number(ca.existingObligations || (Number(ca.totalOutstanding || 0) * 0.03));
    totalCoAppIncome += inc;
    totalCoAppObligations += ob;

    applicantSummaries.push({
      applicantId: ca.id,
      applicantType: 'CO_APPLICANT',
      name: ca.customerName,
      monthlyIncome: inc,
      existingObligations: ob,
      cibilScore: ca.cibilScore,
      riskRating: getScoreRiskRating(ca.cibilScore),
    });
  }

  const combinedMonthlyIncome = primaryIncome + totalCoAppIncome;
  const combinedMonthlyObligations = primaryObligations + totalCoAppObligations;
  const netDisposableIncome = Math.max(0, combinedMonthlyIncome - combinedMonthlyObligations);

  // 3. Dynamic FOIR Matrix based on combined income slab
  let foirLimitPercent = 50;
  if (combinedMonthlyIncome >= 150000) {
    foirLimitPercent = 65;
  } else if (combinedMonthlyIncome >= 60000) {
    foirLimitPercent = 60;
  } else if (combinedMonthlyIncome >= 30000) {
    foirLimitPercent = 55;
  }

  // Max permissible EMI towards all loans = (Combined Income * FOIR Limit) - Existing Obligations
  const maxTotalAllowedEMI = (combinedMonthlyIncome * foirLimitPercent) / 100;
  const maxPermissibleEMI = Math.max(0, maxTotalAllowedEMI - combinedMonthlyObligations);

  // 4. Calculate proposed loan EMI
  let proposedLoanEMI = 0;
  if (monthlyRate > 0 && tenureMonths > 0) {
    proposedLoanEMI = Math.round(
      (requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    );
  } else {
    proposedLoanEMI = Math.round(requestedAmount / tenureMonths);
  }

  // Actual FOIR with proposed loan
  const totalCommitmentWithProposed = combinedMonthlyObligations + proposedLoanEMI;
  const actualFoirPercent = combinedMonthlyIncome > 0
    ? Number(((totalCommitmentWithProposed / combinedMonthlyIncome) * 100).toFixed(2))
    : 100;

  // 5. Present value of annuity for max eligible amount
  let maxEligibleAmount = 0;
  if (monthlyRate > 0 && maxPermissibleEMI > 0) {
    maxEligibleAmount = Math.round(
      (maxPermissibleEMI / monthlyRate) * (1 - Math.pow(1 + monthlyRate, -tenureMonths))
    );
  }

  // Product caps
  if (app.product) {
    const maxProductAmount = Number(app.product.maxAmount);
    if (maxProductAmount > 0 && maxEligibleAmount > maxProductAmount) {
      maxEligibleAmount = maxProductAmount;
    }
  }

  // 6. Bureau score analysis & risk classification
  const validScores = applicantSummaries
    .map((s) => s.cibilScore)
    .filter((score): score is number => score !== null && score > 0);

  const lowestBureauScore = validScores.length > 0 ? Math.min(...validScores) : null;

  const policyDeviations: string[] = [];
  const recommendations: string[] = [];

  let overallRiskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

  if (lowestBureauScore !== null) {
    if (lowestBureauScore < 600) {
      overallRiskCategory = 'CRITICAL';
      policyDeviations.push(`Applicant credit bureau score (${lowestBureauScore}) is below hard cutoff of 600.`);
    } else if (lowestBureauScore < 680) {
      overallRiskCategory = 'HIGH';
      policyDeviations.push(`Credit bureau score (${lowestBureauScore}) is below standard benchmark of 680.`);
    } else if (lowestBureauScore < 740) {
      overallRiskCategory = 'MEDIUM';
    }
  }

  if (actualFoirPercent > foirLimitPercent) {
    policyDeviations.push(
      `Proposed FOIR (${actualFoirPercent}%) exceeds maximum policy ceiling of ${foirLimitPercent}%.`
    );
  }

  if (combinedMonthlyIncome <= 0) {
    policyDeviations.push('Zero verified household income recorded.');
    overallRiskCategory = 'CRITICAL';
  }

  // 7. Decision status and recommended amount
  let eligibilityStatus: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'INELIGIBLE' = 'ELIGIBLE';
  let recommendedAmount = requestedAmount;

  if (overallRiskCategory === 'CRITICAL' || maxPermissibleEMI <= 0) {
    eligibilityStatus = 'INELIGIBLE';
    recommendedAmount = 0;
    recommendations.push('Reject or decline application due to critical risk criteria or unviable debt servicing capacity.');
  } else if (requestedAmount > maxEligibleAmount) {
    eligibilityStatus = 'PARTIALLY_ELIGIBLE';
    recommendedAmount = Math.max(0, Math.floor(maxEligibleAmount / 10000) * 10000);
    recommendations.push(
      `Cap approval amount to eligible limit of ₹${recommendedAmount.toLocaleString('en-IN')}, or extend tenure/add co-borrower.`
    );
  } else {
    eligibilityStatus = 'ELIGIBLE';
    recommendedAmount = requestedAmount;
    recommendations.push(`Sanction requested amount of ₹${requestedAmount.toLocaleString('en-IN')} with proposed terms.`);
  }

  return {
    applicationId,
    requestedAmount,
    requestedTenureMonths: tenureMonths,
    interestRate: annualInterestRate,
    combinedMonthlyIncome,
    combinedMonthlyObligations,
    netDisposableIncome,
    foirLimitPercent,
    actualFoirPercent,
    maxPermissibleEMI,
    proposedLoanEMI,
    maxEligibleAmount,
    eligibilityStatus,
    recommendedAmount,
    lowestBureauScore,
    overallRiskCategory,
    applicantSummaries,
    policyDeviations,
    recommendations,
  };
}

function getScoreRiskRating(score: number | null): 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' {
  if (score === null || score <= 0) return 'UNKNOWN';
  if (score >= 750) return 'LOW';
  if (score >= 680) return 'MEDIUM';
  return 'HIGH';
}
