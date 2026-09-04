import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { searchExistingCustomers } from '@/services/coApplicant/coApplicantService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_customers');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const results = await searchExistingCustomers(q);
    return NextResponse.json({ customers: results });
  } catch (error: any) {
    console.error('GET /api/customers/search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
