import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdminAuth, writeAuditLog } from '@/lib/withAdminAuth';

export const dynamic = 'force-dynamic';

// Default settings to seed if DB is empty
const DEFAULT_SETTINGS = [
  // Application Identity
  { key: 'application.name', value: 'Loan Management System', category: 'application', label: 'Application Name', description: 'Full name shown in browser title and headers', isPublic: true },
  { key: 'application.shortName', value: 'LMS', category: 'application', label: 'Short Name', description: 'Abbreviated name for sidebar and compact views', isPublic: true },
  { key: 'application.version', value: '2.4.0', category: 'application', label: 'Version', description: 'Current application version', isPublic: true },
  { key: 'application.supportEmail', value: 'support@lms.local', category: 'application', label: 'Support Email', description: 'Contact email shown on login page', isPublic: true },
  { key: 'application.supportPhone', value: '+91 98765 43210', category: 'application', label: 'Support Phone', description: 'Support helpline number', isPublic: true },
  { key: 'application.website', value: 'https://lms.local', category: 'application', label: 'Website URL', description: 'Organization website', isPublic: true },

  // Company Settings
  { key: 'company.name', value: 'ABC Finance Pvt Ltd', category: 'company', label: 'Company Name', description: 'Trading name of the organization', isPublic: true },
  { key: 'company.legalName', value: 'ABC Finance Private Limited', category: 'company', label: 'Legal Company Name', description: 'Full legal registered name', isPublic: false },
  { key: 'company.registrationNumber', value: 'CIN/U65923/MH/2018/PTC123456', category: 'company', label: 'Registration Number', description: 'Company registration or CIN number', isPublic: false },
  { key: 'company.gstNumber', value: 'GSTIN27AABCA1234C1Z5', category: 'company', label: 'GST Number', description: 'Goods and Services Tax identification number', isPublic: false },
  { key: 'company.panNumber', value: 'AABCA1234C', category: 'company', label: 'PAN Number', description: 'Permanent Account Number', isPublic: false },
  { key: 'company.email', value: 'info@abcfinance.local', category: 'company', label: 'Company Email', description: 'Primary company contact email', isPublic: true },
  { key: 'company.phone', value: '+91 22 6789 0123', category: 'company', label: 'Company Phone', description: 'Primary contact phone number', isPublic: true },
  { key: 'company.addressLine1', value: '5th Floor, Finance Tower', category: 'company', label: 'Address Line 1', description: 'Building name and street', isPublic: false },
  { key: 'company.addressLine2', value: 'Bandra Kurla Complex', category: 'company', label: 'Address Line 2', description: 'Area / locality', isPublic: false },
  { key: 'company.city', value: 'Mumbai', category: 'company', label: 'City', description: 'City of registered office', isPublic: false },
  { key: 'company.state', value: 'Maharashtra', category: 'company', label: 'State', description: 'State of registered office', isPublic: false },
  { key: 'company.pincode', value: '400051', category: 'company', label: 'PIN Code', description: 'Postal code of registered office', isPublic: false },
  { key: 'company.country', value: 'India', category: 'company', label: 'Country', description: 'Country', isPublic: false },

  // Branding
  { key: 'branding.logo', value: '', category: 'branding', label: 'Logo', description: 'Base64-encoded logo image or URL', isPublic: true },
  { key: 'branding.favicon', value: '', category: 'branding', label: 'Favicon', description: 'Base64-encoded favicon image', isPublic: true },
  { key: 'branding.primaryColor', value: '#2563eb', category: 'branding', label: 'Primary Color', description: 'Main brand color (hex)', isPublic: true },
  { key: 'branding.loginTagline', value: 'Empowering Financial Decisions', category: 'branding', label: 'Login Tagline', description: 'Tagline displayed on the login page', isPublic: true },

  // Localization
  { key: 'localization.currency', value: 'INR', category: 'localization', label: 'Currency Code', description: 'ISO 4217 currency code', isPublic: true },
  { key: 'localization.currencySymbol', value: '₹', category: 'localization', label: 'Currency Symbol', description: 'Currency symbol displayed in UI', isPublic: true },
  { key: 'localization.timezone', value: 'Asia/Kolkata', category: 'localization', label: 'Timezone', description: 'Default timezone for dates/times', isPublic: true },
  { key: 'localization.dateFormat', value: 'DD/MM/YYYY', category: 'localization', label: 'Date Format', description: 'Display format for dates', isPublic: true },
  { key: 'localization.language', value: 'en-IN', category: 'localization', label: 'Language', description: 'Default UI language locale', isPublic: true },

  // Security
  { key: 'security.sessionTimeoutMinutes', value: '30', category: 'security', label: 'Session Timeout (minutes)', description: 'Auto-logout after inactivity', isPublic: false },
  { key: 'security.maxFailedLogins', value: '5', category: 'security', label: 'Max Failed Login Attempts', description: 'Account locked after this many failures', isPublic: false },
  { key: 'security.passwordMinLength', value: '8', category: 'security', label: 'Minimum Password Length', description: 'Minimum length for user passwords', isPublic: false },
  { key: 'security.requireMfa', value: 'false', category: 'security', label: 'Require MFA', description: 'Enforce multi-factor authentication', isPublic: false },
];

async function ensureDefaultSettings() {
  const count = await (prisma as any).applicationSetting.count();
  if (count === 0) {
    await (prisma as any).applicationSetting.createMany({
      data: DEFAULT_SETTINGS.map((s) => ({
        key: s.key,
        value: s.value,
        category: s.category,
        label: s.label,
        description: s.description,
        isPublic: s.isPublic,
      })),
      skipDuplicates: true,
    });
  }
}

export async function GET(request: Request) {
  try {
    await ensureDefaultSettings();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const userId = request.headers.get('x-user-id');
    const isAuthenticated = !!userId;

    const where: any = {};
    if (category) where.category = category;
    if (!isAuthenticated) where.isPublic = true;

    const settings = await (prisma as any).applicationSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const s of settings) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push({
        key: s.key,
        value: s.value,
        category: s.category,
        label: s.label,
        description: s.description,
        isPublic: s.isPublic,
        updatedAt: s.updatedAt.toISOString(),
        updatedBy: s.updatedBy,
      });
    }

    return NextResponse.json({ settings: grouped, flat: settings });
  } catch (error: any) {
    console.error('API /settings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await withAdminAuth(request, 'manage_users_roles');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { updates } = body as { updates: Record<string, string> };

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates object required' }, { status: 400 });
    }

    const before: Record<string, string> = {};
    const after: Record<string, string> = {};

    for (const [key, value] of Object.entries(updates)) {
      const existing = await (prisma as any).applicationSetting.findUnique({ where: { key } });
      if (existing) {
        before[key] = existing.value;
        after[key] = String(value);
        await (prisma as any).applicationSetting.update({
          where: { key },
          data: { value: String(value), updatedBy: actorUser.id },
        });
      } else {
        // Create new setting if key is unknown (future extensibility)
        after[key] = String(value);
        await (prisma as any).applicationSetting.create({
          data: {
            key,
            value: String(value),
            category: key.split('.')[0] || 'general',
            isPublic: false,
            updatedBy: actorUser.id,
          },
        });
      }
    }

    await writeAuditLog({
      actorUser,
      entityType: 'SETTINGS',
      entityId: 'application_settings',
      entityName: 'Application Settings',
      action: 'UPDATE',
      details: `Updated ${Object.keys(updates).length} setting(s): ${Object.keys(updates).join(', ')}`,
      changes: { before, after },
      request,
    });

    return NextResponse.json({ success: true, updatedKeys: Object.keys(updates) });
  } catch (error: any) {
    console.error('API /settings PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
