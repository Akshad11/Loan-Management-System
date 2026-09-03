import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  try {
    const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now;`;
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latencyMs,
      timestamp: result[0]?.now ?? new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('PostgreSQL Connection Error:', error?.message);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: process.env.NODE_ENV === 'production' ? 'Database connection unavailable' : error?.message,
      },
      { status: 503 }
    );
  }
}
