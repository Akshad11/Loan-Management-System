import prisma from '@/lib/prisma';
import { AuthContextUser, writeAuditLog } from '@/lib/serverAuth';

export interface AddCoApplicantParams {
  applicationId: string;
  existingCustomerId?: string;
  customerData?: {
    name: string;
    mobile: string;
    email?: string;
    pan?: string;
    dob?: string;
    gender?: string;
    employmentType?: string;
    employerName?: string;
    monthlyIncome?: number;
    existingObligations?: number;
    address?: any;
  };
  relationship: string;
  applicantType?: 'CO_APPLICANT' | 'GUARANTOR';
  ownershipShare?: number;
  actorUser: AuthContextUser;
  request?: Request;
}

export interface UpdateCoApplicantParams {
  applicationId: string;
  coApplicantId: string;
  relationship?: string;
  ownershipShare?: number;
  monthlyIncome?: number;
  existingObligations?: number;
  employmentType?: string;
  employerName?: string;
  notes?: string;
  actorUser: AuthContextUser;
  request?: Request;
}

/**
 * Searches existing customers by PAN, Mobile, Customer Number, or Name to prevent duplication.
 */
export async function searchExistingCustomers(query: string) {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { customerNumber: { contains: cleanQuery, mode: 'insensitive' } },
        { name: { contains: cleanQuery, mode: 'insensitive' } },
        { mobile: { contains: cleanQuery } },
        { panMasked: { contains: cleanQuery, mode: 'insensitive' } },
      ],
    },
    take: 10,
    select: {
      id: true,
      customerNumber: true,
      name: true,
      mobile: true,
      email: true,
      panMasked: true,
      status: true,
      monthlyIncome: true,
      cibilScore: true,
      totalOutstanding: true,
      branchName: true,
    },
  });

  return customers.map((c) => ({
    ...c,
    kycStatus: c.status === 'ACTIVE' ? 'VERIFIED' : 'PENDING',
    monthlyIncome: Number(c.monthlyIncome || 0),
    totalOutstanding: Number(c.totalOutstanding || 0),
  }));
}

/**
 * Adds a co-applicant to an application, either by linking an existing customer
 * or creating a new customer record after checking for duplicate prevention.
 */
export async function addCoApplicant(params: AddCoApplicantParams) {
  const {
    applicationId,
    existingCustomerId,
    customerData,
    relationship,
    applicantType = 'CO_APPLICANT',
    ownershipShare,
    actorUser,
    request,
  } = params;

  // 1. Verify application state
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { coApplicants: true },
  });

  if (!app) {
    throw new Error(`Loan application ${applicationId} not found.`);
  }

  if (['APPROVED', 'SANCTIONED', 'DISBURSED', 'CLOSED'].includes(app.status)) {
    throw new Error(`Cannot add co-applicants to an application in ${app.status} status.`);
  }

  let customerId = '';
  let customerNumber = '';
  let customerName = '';
  let mobile = '';
  let email: string | undefined;
  let pan: string | undefined;
  let panMasked: string | undefined;
  let dob: Date | undefined;
  let gender: string | undefined;
  let employmentType = 'SALARIED';
  let employerName: string | undefined;
  let monthlyIncome = 0;
  let existingObligations = 0;
  let address: any = null;
  let cibilScore: number | null = null;

  if (existingCustomerId) {
    // LINK EXISTING CUSTOMER
    const existingCust = await prisma.customer.findUnique({
      where: { id: existingCustomerId },
    });

    if (!existingCust) {
      throw new Error(`Customer with ID ${existingCustomerId} not found.`);
    }

    // Check if customer is already the primary borrower
    if (app.customerId === existingCust.id) {
      throw new Error('This customer is already the Primary Borrower on this application.');
    }

    // Check if customer is already a co-applicant on this application
    const isAlreadyCoApp = app.coApplicants.some((ca) => ca.customerId === existingCust.id);
    if (isAlreadyCoApp) {
      throw new Error('This customer is already added as a co-applicant on this application.');
    }

    customerId = existingCust.id;
    customerNumber = existingCust.customerNumber;
    customerName = existingCust.name;
    mobile = existingCust.mobile;
    email = existingCust.email || undefined;
    panMasked = existingCust.panMasked || undefined;
    monthlyIncome = Number(existingCust.monthlyIncome || 0);
    cibilScore = existingCust.cibilScore || null;
    employmentType = (existingCust as any).employmentType || 'SALARIED';
    employerName = (existingCust as any).employerName || undefined;
  } else {
    // CREATE NEW CUSTOMER (with duplicate prevention)
    if (!customerData || !customerData.name || !customerData.mobile) {
      throw new Error('Name and mobile number are required when adding a new co-applicant.');
    }

    const cleanMobile = customerData.mobile.trim();
    const cleanPan = customerData.pan?.trim().toUpperCase();

    // Check if a customer with this mobile already exists
    const duplicateCandidate = await prisma.customer.findFirst({
      where: {
        mobile: cleanMobile,
      },
    });

    if (duplicateCandidate) {
      // Re-use the existing customer instead of creating a duplicate
      if (app.customerId === duplicateCandidate.id) {
        throw new Error(`Customer with mobile ${cleanMobile} is already the primary applicant.`);
      }
      const isAlreadyCoApp = app.coApplicants.some((ca) => ca.customerId === duplicateCandidate.id);
      if (isAlreadyCoApp) {
        throw new Error(`Customer with mobile ${cleanMobile} is already added as a co-applicant.`);
      }

      customerId = duplicateCandidate.id;
      customerNumber = duplicateCandidate.customerNumber;
      customerName = duplicateCandidate.name;
      mobile = duplicateCandidate.mobile;
      email = duplicateCandidate.email || undefined;
      panMasked = duplicateCandidate.panMasked || (cleanPan ? `XXXXXX${cleanPan.slice(-4)}` : undefined);
      monthlyIncome = customerData.monthlyIncome || Number(duplicateCandidate.monthlyIncome || 0);
      existingObligations = customerData.existingObligations || 0;
      cibilScore = duplicateCandidate.cibilScore || null;
    } else {
      // Create fresh customer record
      const newCustNumber = `CUST-${Date.now().toString().slice(-6)}`;
      const nameParts = customerData.name.trim().split(' ');
      const firstName = nameParts[0] || 'Borrower';
      const lastName = nameParts.slice(1).join(' ') || 'CoApplicant';

      const newCust = await prisma.customer.create({
        data: {
          customerNumber: newCustNumber,
          firstName,
          lastName,
          name: customerData.name.trim(),
          dateOfBirth: customerData.dob || '1990-01-01',
          gender: customerData.gender || 'MALE',
          mobile: cleanMobile,
          email: customerData.email?.trim() || null,
          panMasked: cleanPan ? `XXXXXX${cleanPan.slice(-4)}` : 'XXXXXX0000',
          currentAddress: customerData.address || { addressLine1: 'Address', city: 'Mumbai', state: 'Maharashtra', pinCode: '400001' },
          permanentAddress: customerData.address || { addressLine1: 'Address', city: 'Mumbai', state: 'Maharashtra', pinCode: '400001' },
          branchId: app.branchId,
          branchName: app.branchName || 'Main Branch',
          monthlyIncome: customerData.monthlyIncome || 0,
          status: 'ACTIVE',
        },
      });

      customerId = newCust.id;
      customerNumber = newCust.customerNumber;
      customerName = newCust.name;
      mobile = newCust.mobile;
      email = newCust.email || undefined;
      pan = cleanPan;
      panMasked = newCust.panMasked || undefined;
      dob = customerData.dob ? new Date(customerData.dob) : undefined;
      gender = customerData.gender;
      employmentType = customerData.employmentType || 'SALARIED';
      employerName = customerData.employerName;
      monthlyIncome = customerData.monthlyIncome || 0;
      existingObligations = customerData.existingObligations || 0;
      address = customerData.address || null;
    }
  }

  // 2. Create CoApplicant record
  const coApplicant = await prisma.coApplicant.create({
    data: {
      applicationId,
      customerId,
      customerNumber,
      customerName,
      mobile,
      email,
      pan,
      panMasked,
      dob,
      gender,
      relationship,
      applicantType,
      ownershipShare: ownershipShare !== undefined ? ownershipShare : null,
      isPrimary: false,
      kycStatus: 'VERIFIED',
      monthlyIncome,
      existingObligations,
      employerName,
      employmentType,
      address,
      cibilScore,
      addedBy: actorUser.name,
    },
  });

  // 3. Application history & audit trail
  await prisma.applicationHistory.create({
    data: {
      applicationId,
      eventType: 'CO_APPLICANT_ADDED',
      action: 'Co-Applicant Added',
      actor: actorUser.name,
      actorRole: actorUser.roleName,
      description: `Added ${applicantType} ${customerName} (${relationship}) linked to Customer ${customerNumber}`,
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'CO_APPLICANT',
    entityId: coApplicant.id,
    entityName: customerName,
    action: 'ADD_CO_APPLICANT',
    details: `Added ${applicantType} ${customerName} to application ${app.applicationNumber}`,
    request,
  });

  return coApplicant;
}

/**
 * Updates co-applicant details.
 */
export async function updateCoApplicant(params: UpdateCoApplicantParams) {
  const {
    applicationId,
    coApplicantId,
    relationship,
    ownershipShare,
    monthlyIncome,
    existingObligations,
    employmentType,
    employerName,
    notes,
    actorUser,
    request,
  } = params;

  const coApp = await prisma.coApplicant.findFirst({
    where: { id: coApplicantId, applicationId },
  });

  if (!coApp) {
    throw new Error(`Co-Applicant ${coApplicantId} not found in application.`);
  }

  const updated = await prisma.coApplicant.update({
    where: { id: coApplicantId },
    data: {
      relationship: relationship || undefined,
      ownershipShare: ownershipShare !== undefined ? ownershipShare : undefined,
      monthlyIncome: monthlyIncome !== undefined ? monthlyIncome : undefined,
      existingObligations: existingObligations !== undefined ? existingObligations : undefined,
      employmentType: employmentType || undefined,
      employerName: employerName || undefined,
      notes: notes !== undefined ? notes : undefined,
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'CO_APPLICANT',
    entityId: coApplicantId,
    entityName: updated.customerName,
    action: 'UPDATE_CO_APPLICANT',
    details: `Updated co-applicant ${updated.customerName} in application ${applicationId}`,
    request,
  });

  return updated;
}

/**
 * Removes a co-applicant from an application before sanction.
 */
export async function removeCoApplicant(
  applicationId: string,
  coApplicantId: string,
  actorUser: AuthContextUser,
  request?: Request
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
  });

  if (!app) {
    throw new Error(`Application ${applicationId} not found.`);
  }

  if (['APPROVED', 'SANCTIONED', 'DISBURSED', 'CLOSED'].includes(app.status)) {
    throw new Error(`Cannot remove co-applicants from application in ${app.status} status.`);
  }

  const coApp = await prisma.coApplicant.findFirst({
    where: { id: coApplicantId, applicationId },
  });

  if (!coApp) {
    throw new Error(`Co-Applicant ${coApplicantId} not found.`);
  }

  await prisma.coApplicant.delete({
    where: { id: coApplicantId },
  });

  // Record in application history
  await prisma.applicationHistory.create({
    data: {
      applicationId,
      eventType: 'CO_APPLICANT_REMOVED',
      action: 'Co-Applicant Removed',
      actor: actorUser.name,
      actorRole: actorUser.roleName,
      description: `Removed co-applicant ${coApp.customerName}`,
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'CO_APPLICANT',
    entityId: coApplicantId,
    entityName: coApp.customerName,
    action: 'REMOVE_CO_APPLICANT',
    details: `Removed co-applicant ${coApp.customerName} from application ${app.applicationNumber}`,
    request,
  });

  return { success: true, removedId: coApplicantId };
}

/**
 * Swaps / designates a co-applicant as the primary borrower.
 */
export async function designatePrimaryApplicant(
  applicationId: string,
  coApplicantId: string,
  actorUser: AuthContextUser,
  request?: Request
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { customer: true, coApplicants: true },
  });

  if (!app) throw new Error('Application not found');
  if (['SANCTIONED', 'DISBURSED', 'CLOSED'].includes(app.status)) {
    throw new Error('Cannot change primary applicant after sanction or disbursement.');
  }

  const targetCoApp = app.coApplicants.find((ca) => ca.id === coApplicantId);
  if (!targetCoApp) throw new Error('Co-applicant not found');

  const oldPrimaryCustomer = app.customer;

  // 1. Update Application with new primary customer
  await prisma.loanApplication.update({
    where: { id: applicationId },
    data: {
      customerId: targetCoApp.customerId,
      customerNumber: targetCoApp.customerNumber,
      customerName: targetCoApp.customerName,
      customerMobile: targetCoApp.mobile,
      customerMonthlyIncome: targetCoApp.monthlyIncome,
    },
  });

  // 2. Remove target from coApplicants and demote former primary into coApplicant
  await prisma.coApplicant.delete({ where: { id: targetCoApp.id } });

  await prisma.coApplicant.create({
    data: {
      applicationId,
      customerId: oldPrimaryCustomer.id,
      customerNumber: oldPrimaryCustomer.customerNumber,
      customerName: oldPrimaryCustomer.name,
      mobile: oldPrimaryCustomer.mobile,
      email: oldPrimaryCustomer.email,
      panMasked: oldPrimaryCustomer.panMasked,
      relationship: 'CO_BORROWER',
      applicantType: 'CO_APPLICANT',
      monthlyIncome: oldPrimaryCustomer.monthlyIncome,
      cibilScore: oldPrimaryCustomer.cibilScore,
      addedBy: actorUser.name,
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'APPLICATION',
    entityId: applicationId,
    entityName: app.applicationNumber,
    action: 'DESIGNATE_PRIMARY_APPLICANT',
    details: `Designated ${targetCoApp.customerName} as primary applicant, demoted ${oldPrimaryCustomer.name} to co-applicant`,
    request,
  });

  return { success: true, newPrimary: targetCoApp.customerName };
}
