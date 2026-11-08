import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_customers');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          kycRecords: true,
          bankAccounts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }] },
          documents: true,
          applications: true,
          loans: true,
          history: { orderBy: { timestamp: 'desc' } },
        },
      });
      if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

      const latestKyc = customer.kycRecords[0];
      const primaryBank = customer.bankAccounts?.find((b: any) => b.isPrimary) || customer.bankAccounts?.[0];
      const bankName = customer.bankName || primaryBank?.bankName || null;
      const accountNumberMasked = customer.accountNumberMasked || primaryBank?.accountNumberMasked || (customer.accountNumber ? `•••• •••• ${customer.accountNumber.slice(-4)}` : null);
      const accountNumber = customer.accountNumber || primaryBank?.accountNumberEncrypted || null;
      const ifscCode = customer.ifscCode || primaryBank?.ifscCode || null;
      const panMasked = customer.panMasked || (latestKyc?.panRecord as any)?.idNumberMasked || null;
      const aadhaarMasked = customer.aadhaarMasked || (latestKyc?.aadhaarRecord as any)?.idNumberMasked || null;

      return NextResponse.json({
        ...customer,
        bankName,
        accountNumberMasked,
        accountNumber,
        ifscCode,
        panMasked,
        aadhaarMasked,
        monthlyIncome: Number(customer.monthlyIncome),
        totalOutstanding: Number(customer.totalOutstanding),
        totalOverdue: Number(customer.totalOverdue),
        createdDate: customer.createdAt ? customer.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        updatedDate: customer.updatedAt ? customer.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      });
    }

    const customers = await prisma.customer.findMany({
      include: {
        kycRecords: true,
        bankAccounts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }] },
        history: { orderBy: { timestamp: 'desc' }, take: 10 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = customers.map((c: any) => {
      const latestKyc = c.kycRecords[0];
      const primaryBank = c.bankAccounts?.find((b: any) => b.isPrimary) || c.bankAccounts?.[0];
      const bankName = c.bankName || primaryBank?.bankName || null;
      const accountNumberMasked = c.accountNumberMasked || primaryBank?.accountNumberMasked || (c.accountNumber ? `•••• •••• ${c.accountNumber.slice(-4)}` : null);
      const accountNumber = c.accountNumber || primaryBank?.accountNumberEncrypted || null;
      const ifscCode = c.ifscCode || primaryBank?.ifscCode || null;
      const panMasked = c.panMasked || (latestKyc?.panRecord as any)?.idNumberMasked || null;
      const aadhaarMasked = c.aadhaarMasked || (latestKyc?.aadhaarRecord as any)?.idNumberMasked || null;

      return {
        id: c.id,
        customerNumber: c.customerNumber,
        firstName: c.firstName,
        middleName: c.middleName,
        lastName: c.lastName,
        name: c.name,
        dateOfBirth: c.dateOfBirth,
        gender: c.gender,
        maritalStatus: c.maritalStatus,
        nationality: c.nationality,
        customerType: c.customerType,
        mobile: c.mobile,
        alternateMobile: c.alternateMobile,
        email: c.email,
        preferredContact: c.preferredContact,
        currentAddress: c.currentAddress,
        permanentAddress: c.permanentAddress,
        sameAsCurrentAddress: c.sameAsCurrentAddress,
        employmentType: c.employmentType,
        employerName: c.employerName,
        occupation: c.occupation,
        monthlyIncome: Number(c.monthlyIncome),
        employmentSince: c.employmentSince,
        bankName,
        accountNumberMasked,
        accountNumber,
        ifscCode,
        branchId: c.branchId,
        branchName: c.branchName,
        status: c.status,
        kycStatus: latestKyc?.status || 'UNVERIFIED',
        kycLevel: latestKyc?.kycLevel || 'TIER_1_BASIC',
        assignedOfficer: c.assignedOfficer,
        activeLoanCount: c.activeLoanCount,
        closedLoanCount: c.closedLoanCount,
        totalOutstanding: Number(c.totalOutstanding),
        totalOverdue: Number(c.totalOverdue),
        cibilScore: c.cibilScore || 720,
        panMasked,
        aadhaarMasked,
        archivedReason: c.archivedReason,
        archivedDate: c.archivedDate?.toISOString(),
        archivedBy: c.archivedBy,
        createdDate: c.createdAt ? c.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        updatedDate: c.updatedAt ? c.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /customers GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_customers');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();

    // Check if customerNumber is provided and whether it is already taken
    let customerNumber = body.customerNumber;
    if (customerNumber) {
      const existing = await prisma.customer.findUnique({
        where: { customerNumber },
      });
      if (existing && existing.id !== body.id) {
        // If customerNumber is already taken by another customer, auto-generate unique sequence
        customerNumber = null;
      }
    }

    if (!customerNumber) {
      const existingCustomers = await prisma.customer.findMany({
        select: { customerNumber: true },
      });
      let maxSeq = 100;
      for (const c of existingCustomers) {
        const match = c.customerNumber?.match(/(\d+)(?!.*\d)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      }
      let candidateSeq = maxSeq + 1;
      customerNumber = `CUS-000${candidateSeq}`;
      while (existingCustomers.some((c) => c.customerNumber === customerNumber)) {
        candidateSeq++;
        customerNumber = `CUS-000${candidateSeq}`;
      }
    }

    // Check if body.id is provided and already exists
    let targetId = body.id || undefined;
    if (targetId) {
      const existingById = await prisma.customer.findUnique({
        where: { id: targetId },
      });
      if (existingById) {
        targetId = undefined; // Let Prisma generate fresh UUID
      }
    }

    // Validate branch exists, fallback safely to null if no branch exists in DB
    let branchId: string | null = body.branchId || actorUser.branchId || null;
    let branch = branchId ? await prisma.branch.findUnique({ where: { id: branchId } }) : null;
    if (!branch) {
      const firstBranch = await prisma.branch.findFirst();
      if (firstBranch) {
        branchId = firstBranch.id;
        branch = firstBranch;
      } else {
        branchId = null;
      }
    }
    const branchName = branch ? branch.name : (body.branchName || actorUser.branchName || 'Main Office');

    const accNumber = body.accountNumber ? body.accountNumber.trim() : null;
    const maskedAcc = body.accountNumberMasked || (accNumber && accNumber.length > 4 ? `•••• •••• ${accNumber.slice(-4)}` : accNumber);

    let panMasked = body.panMasked || null;
    if (body.pan) {
      const p = body.pan.trim().toUpperCase();
      if (p.length === 10) panMasked = `${p.slice(0, 5)}••••${p.slice(-1)}`;
      else panMasked = p;
    }
    let aadhaarMasked = body.aadhaarMasked || null;
    if (body.aadhaar) {
      const a = body.aadhaar.replace(/\D/g, '');
      if (a.length >= 4) aadhaarMasked = `•••• •••• ${a.slice(-4)}`;
      else aadhaarMasked = a;
    }

    const customer = await prisma.customer.create({
      data: {
        id: targetId,
        customerNumber,
        firstName: body.firstName,
        middleName: body.middleName || null,
        lastName: body.lastName,
        name: `${body.firstName} ${body.lastName}`.trim(),
        dateOfBirth: body.dateOfBirth,
        gender: body.gender || 'MALE',
        maritalStatus: body.maritalStatus || 'SINGLE',
        nationality: body.nationality || 'Indian',
        customerType: body.customerType || 'INDIVIDUAL',
        mobile: body.mobile,
        alternateMobile: body.alternateMobile || null,
        email: body.email || null,
        preferredContact: body.preferredContact || 'MOBILE',
        currentAddress: body.currentAddress || {},
        permanentAddress: body.permanentAddress || {},
        sameAsCurrentAddress: body.sameAsCurrentAddress ?? true,
        employmentType: body.employmentType || 'SALARIED',
        employerName: body.employerName || null,
        occupation: body.occupation || null,
        monthlyIncome: body.monthlyIncome || 0,
        employmentSince: body.employmentSince || null,
        bankName: body.bankName ? body.bankName.trim() : null,
        accountNumberMasked: maskedAcc,
        accountNumber: accNumber,
        ifscCode: body.ifscCode ? body.ifscCode.trim().toUpperCase() : null,
        branchId,
        branchName,
        status: body.status || 'ACTIVE',
        assignedOfficer: body.assignedOfficer || actorUser.name,
        cibilScore: body.cibilScore || 750,
        panMasked,
        aadhaarMasked,
      },
    });

    // Create primary bank account record if banking details provided
    if (customer.bankName || customer.accountNumber || customer.ifscCode) {
      await prisma.customerBankAccount.create({
        data: {
          customerId: customer.id,
          accountHolderName: customer.name,
          accountNumberMasked: customer.accountNumberMasked || (accNumber ? `•••• •••• ${accNumber.slice(-4)}` : '•••• •••• 0000'),
          accountNumberEncrypted: customer.accountNumber,
          ifscCode: customer.ifscCode || '',
          bankName: customer.bankName || 'Primary Bank',
          isPrimary: true,
          verificationStatus: 'VERIFIED',
          purpose: 'DISBURSEMENT_AND_REPAYMENT',
        },
      }).catch((e) => console.warn('Could not create primary bank account record:', e));
    }

    // Create verified baseline KYC record if PAN or Aadhaar provided
    if (panMasked || aadhaarMasked) {
      await prisma.kycRecord.create({
        data: {
          customerId: customer.id,
          customerNumber: customer.customerNumber,
          customerName: customer.name,
          customerType: customer.customerType,
          status: 'VERIFIED',
          kycLevel: 'TIER_2_STANDARD',
          riskCategory: 'LOW',
          panRecord: panMasked ? {
            idType: 'PAN',
            idNumberMasked: panMasked,
            nameOnId: customer.name.toUpperCase(),
            isVerified: true,
            status: 'VALID',
          } : undefined,
          aadhaarRecord: aadhaarMasked ? {
            idType: 'AADHAAR',
            idNumberMasked: aadhaarMasked,
            nameOnId: customer.name,
            isVerified: true,
            status: 'VALID',
          } : undefined,
          verifiedBy: actorUser.name,
          verifiedAt: new Date(),
        },
      }).catch((e) => console.warn('Could not create KYC record:', e));
    }

    // Add initial history event
    await prisma.customerHistory.create({
      data: {
        customerId: customer.id,
        eventType: 'CUSTOMER_CREATED',
        title: 'Customer Onboarded',
        actor: actorUser.name,
        actorRole: actorUser.roleName,
        description: `Customer profile created with identification ${customerNumber}`,
        module: 'CUSTOMERS',
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'CUSTOMER',
      entityId: customer.id,
      entityName: customer.name,
      action: 'CREATE',
      details: `Created customer profile ${customerNumber} (${customer.name})`,
      request,
    });

    const formattedCustomer = {
      ...customer,
      monthlyIncome: Number(customer.monthlyIncome),
      totalOutstanding: Number(customer.totalOutstanding),
      totalOverdue: Number(customer.totalOverdue),
      createdDate: customer.createdAt.toISOString().split('T')[0],
      updatedDate: customer.updatedAt.toISOString().split('T')[0],
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedCustomer, { status: 201 });
  } catch (error: any) {
    console.error('API /customers POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, ['manage_customers', 'edit_customer', 'view_customers']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { id, ...data } = body;
    if (!id && !body.customerNumber) return NextResponse.json({ error: 'Customer ID or Customer Number required' }, { status: 400 });

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(body.customerNumber ? [{ customerNumber: body.customerNumber }] : []),
        ],
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const fName = data.firstName !== undefined ? data.firstName : existingCustomer.firstName;
      const lName = data.lastName !== undefined ? data.lastName : existingCustomer.lastName;
      updateData.firstName = fName;
      updateData.lastName = lName;
      updateData.name = `${fName || ''} ${lName || ''}`.trim();
    }
    if (data.middleName !== undefined) updateData.middleName = data.middleName || null;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.maritalStatus !== undefined) updateData.maritalStatus = data.maritalStatus;
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.customerType !== undefined) updateData.customerType = data.customerType;
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.alternateMobile !== undefined) updateData.alternateMobile = data.alternateMobile || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.preferredContact !== undefined) updateData.preferredContact = data.preferredContact;
    if (data.currentAddress !== undefined) updateData.currentAddress = data.currentAddress;
    if (data.permanentAddress !== undefined) updateData.permanentAddress = data.permanentAddress;
    if (data.sameAsCurrentAddress !== undefined) updateData.sameAsCurrentAddress = data.sameAsCurrentAddress;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.employerName !== undefined) updateData.employerName = data.employerName || null;
    if (data.occupation !== undefined) updateData.occupation = data.occupation || null;
    if (data.monthlyIncome !== undefined) updateData.monthlyIncome = data.monthlyIncome;
    if (data.employmentSince !== undefined) updateData.employmentSince = data.employmentSince || null;

    // Banking Information Updates
    if (data.bankName !== undefined) {
      updateData.bankName = data.bankName ? data.bankName.trim() : null;
    }
    if (data.accountNumber !== undefined) {
      const acc = data.accountNumber ? data.accountNumber.trim() : null;
      updateData.accountNumber = acc;
      if (acc && acc.length > 4) {
        updateData.accountNumberMasked = `•••• •••• ${acc.slice(-4)}`;
      } else {
        updateData.accountNumberMasked = data.accountNumberMasked || acc || null;
      }
    } else if (data.accountNumberMasked !== undefined) {
      updateData.accountNumberMasked = data.accountNumberMasked || null;
    }
    if (data.ifscCode !== undefined) {
      updateData.ifscCode = data.ifscCode ? data.ifscCode.trim().toUpperCase() : null;
    }

    if (data.pan !== undefined) {
      const p = data.pan ? data.pan.trim().toUpperCase() : null;
      if (p && p.length === 10) {
        updateData.panMasked = `${p.slice(0, 5)}••••${p.slice(-1)}`;
      } else {
        updateData.panMasked = data.panMasked || p || null;
      }
    } else if (data.panMasked !== undefined) {
      updateData.panMasked = data.panMasked || null;
    }

    if (data.aadhaar !== undefined) {
      const a = data.aadhaar ? data.aadhaar.replace(/\D/g, '') : null;
      if (a && a.length >= 4) {
        updateData.aadhaarMasked = `•••• •••• ${a.slice(-4)}`;
      } else {
        updateData.aadhaarMasked = data.aadhaarMasked || a || null;
      }
    } else if (data.aadhaarMasked !== undefined) {
      updateData.aadhaarMasked = data.aadhaarMasked || null;
    }

    if (data.status) updateData.status = data.status;
    if (data.cibilScore !== undefined) updateData.cibilScore = data.cibilScore;
    if (data.branchId) updateData.branchId = data.branchId;
    if (data.branchName) updateData.branchName = data.branchName;
    if (data.assignedOfficer !== undefined) updateData.assignedOfficer = data.assignedOfficer;
    if (data.archivedReason !== undefined) updateData.archivedReason = data.archivedReason;
    if (data.archivedDate) updateData.archivedDate = new Date(data.archivedDate);
    if (data.archivedBy !== undefined) updateData.archivedBy = data.archivedBy;

    const customer = await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: updateData,
    });

    // Sync primary bank account if banking fields were updated
    if (updateData.bankName !== undefined || updateData.accountNumber !== undefined || updateData.ifscCode !== undefined) {
      const primaryBank = await prisma.customerBankAccount.findFirst({
        where: { customerId: customer.id, isPrimary: true },
      });
      if (primaryBank) {
        await prisma.customerBankAccount.update({
          where: { id: primaryBank.id },
          data: {
            bankName: updateData.bankName !== undefined ? updateData.bankName : primaryBank.bankName,
            accountNumberMasked: updateData.accountNumberMasked !== undefined ? updateData.accountNumberMasked : primaryBank.accountNumberMasked,
            accountNumberEncrypted: updateData.accountNumber !== undefined ? updateData.accountNumber : primaryBank.accountNumberEncrypted,
            ifscCode: updateData.ifscCode !== undefined ? updateData.ifscCode : primaryBank.ifscCode,
          },
        }).catch((e) => console.warn('Could not update primary bank account:', e));
      } else if (customer.bankName || customer.accountNumber) {
        await prisma.customerBankAccount.create({
          data: {
            customerId: customer.id,
            accountHolderName: customer.name,
            accountNumberMasked: customer.accountNumberMasked || '•••• •••• 0000',
            accountNumberEncrypted: customer.accountNumber,
            ifscCode: customer.ifscCode || '',
            bankName: customer.bankName || 'Primary Bank',
            isPrimary: true,
            verificationStatus: 'VERIFIED',
          },
        }).catch((e) => console.warn('Could not create primary bank account:', e));
      }
    }

    // Sync KYC record if PAN or Aadhaar updated
    if (updateData.panMasked !== undefined || updateData.aadhaarMasked !== undefined) {
      const existingKyc = await prisma.kycRecord.findFirst({
        where: { customerId: customer.id },
      });
      if (existingKyc) {
        const panRecord = updateData.panMasked
          ? { ...(existingKyc.panRecord as any || {}), idType: 'PAN', idNumberMasked: updateData.panMasked, isVerified: true, status: 'VALID' }
          : existingKyc.panRecord;
        const aadhaarRecord = updateData.aadhaarMasked
          ? { ...(existingKyc.aadhaarRecord as any || {}), idType: 'AADHAAR', idNumberMasked: updateData.aadhaarMasked, isVerified: true, status: 'VALID' }
          : existingKyc.aadhaarRecord;
        await prisma.kycRecord.update({
          where: { id: existingKyc.id },
          data: {
            panRecord: panRecord as any,
            aadhaarRecord: aadhaarRecord as any,
          },
        }).catch((e) => console.warn('Could not update KYC record:', e));
      } else if (customer.panMasked || customer.aadhaarMasked) {
        await prisma.kycRecord.create({
          data: {
            customerId: customer.id,
            customerNumber: customer.customerNumber,
            customerName: customer.name,
            customerType: customer.customerType,
            status: 'VERIFIED',
            kycLevel: 'TIER_2_STANDARD',
            riskCategory: 'LOW',
            panRecord: customer.panMasked ? {
              idType: 'PAN',
              idNumberMasked: customer.panMasked,
              nameOnId: customer.name.toUpperCase(),
              isVerified: true,
              status: 'VALID',
            } : undefined,
            aadhaarRecord: customer.aadhaarMasked ? {
              idType: 'AADHAAR',
              idNumberMasked: customer.aadhaarMasked,
              nameOnId: customer.name,
              isVerified: true,
              status: 'VALID',
            } : undefined,
            verifiedBy: actorUser.name,
            verifiedAt: new Date(),
          },
        }).catch((e) => console.warn('Could not create KYC record:', e));
      }
    }

    await writeAuditLog({
      actorUser,
      entityType: 'CUSTOMER',
      entityId: customer.id,
      entityName: customer.name,
      action: 'UPDATE',
      details: `Customer profile updated for ${customer.customerNumber} (${customer.name})`,
      request,
    });

    return NextResponse.json({
      ...customer,
      monthlyIncome: Number(customer.monthlyIncome),
      totalOutstanding: Number(customer.totalOutstanding),
      totalOverdue: Number(customer.totalOverdue),
    });
  } catch (error: any) {
    console.error('API /customers PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
