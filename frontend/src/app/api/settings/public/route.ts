import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public settings endpoint — no auth required
// Returns only settings marked isPublic: true
// Used by login page, browser title, etc.
export async function GET(request: Request) {
  try {
    const settings = await (prisma as any).applicationSetting.findMany({
      where: { isPublic: true },
      select: { key: true, value: true, category: true },
    });

    const flat: Record<string, string> = {};
    for (const s of settings) {
      flat[s.key] = s.value;
    }

    return NextResponse.json(flat);
  } catch (error: any) {
    // Return safe defaults if settings table doesn't exist yet
    return NextResponse.json({
      'application.name': 'Loan Management System',
      'application.shortName': 'LMS',
      'company.name': 'ABC Finance Pvt Ltd',
      'branding.primaryColor': '#2563eb',
      'branding.loginTagline': 'Empowering Financial Decisions',
      'localization.currency': 'INR',
      'localization.currencySymbol': '₹',
    });
  }
}
