import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Perform a raw query to check direct PostgreSQL connection
    const result = await prisma.$queryRaw<Array<{ now: Date; version: string }>>`
      SELECT NOW() as now, version() as version;
    `;

    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to PostgreSQL database via Prisma.',
      database: process.env.PGDATABASE || 'unknown',
      host: process.env.PGHOST || 'unknown',
      port: process.env.PGPORT || '5432',
      serverTime: result[0]?.now ?? new Date().toISOString(),
      postgresVersion: result[0]?.version ?? 'unknown',
    });
  } catch (error: any) {
    console.error('PostgreSQL Connection Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to PostgreSQL database.',
        error: error?.message || String(error),
        hint: 'Please check your PGHOST, PGPORT, PGUSER, PGPASSWORD, and PGDATABASE variables in .env and verify that PostgreSQL is running.',
      },
      { status: 500 }
    );
  }
}
