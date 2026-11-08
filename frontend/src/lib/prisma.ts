import { Pool, PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Parses connection_limit from DATABASE_URL if present.
 * node-postgres does not natively parse connection_limit from query parameters,
 * so we extract it manually to respect configured connection boundaries.
 */
function getConnectionLimit(urlStr?: string): number | undefined {
  if (!urlStr) return undefined;
  try {
    const url = new URL(urlStr);
    const limit = url.searchParams.get('connection_limit');
    if (limit) {
      const parsed = parseInt(limit, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    const match = urlStr.match(/[?&]connection_limit=(\d+)/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return undefined;
}

/**
 * Resolves the active connection string based on DB_PROVIDER or available environment variables.
 * Supports:
 * - Supabase Cloud Database (SUPABASE_DATABASE_URL / SUPABASE_URL)
 * - Standard PostgreSQL (DATABASE_URL / POSTGRES_DATABASE_URL / POSTGRES_URL)
 */
function resolveConnectionString(): string | undefined {
  const provider = (process.env.DB_PROVIDER || '').trim().toLowerCase();
  const dbPassword = (process.env.SUPABASE_DB_PASSWORD || '').trim();
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'xwyarykuzfzitvsjylih';

  const formatSupabaseUrl = (rawUrl?: string): string | undefined => {
    if (!rawUrl) return undefined;
    let url = rawUrl.replace(/\[YOUR-PROJECT-REF\]/g, projectRef);
    if (dbPassword) {
      url = url.replace(/\[YOUR-PASSWORD\]/g, encodeURIComponent(dbPassword));
    }
    // If it still contains placeholder, it cannot connect to cloud DB
    if (url.includes('[YOUR-PASSWORD]')) {
      console.warn(
        '[LMS Database] SUPABASE_DATABASE_URL contains placeholder "[YOUR-PASSWORD]". ' +
        'Please set your Supabase database password in .env (SUPABASE_DB_PASSWORD="...") or update SUPABASE_DATABASE_URL. ' +
        'Temporarily falling back to local PostgreSQL.'
      );
      return undefined;
    }
    return url;
  };

  if (provider === 'supabase') {
    const supaUrl =
      formatSupabaseUrl(process.env.SUPABASE_DATABASE_URL) ||
      formatSupabaseUrl(process.env.SUPABASE_DIRECT_URL) ||
      formatSupabaseUrl(process.env.SUPABASE_URL);

    if (supaUrl) {
      return supaUrl;
    }

    // Fall back to local postgres if Supabase credentials are placeholders
    return (
      process.env.POSTGRES_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL
    );
  }

  if (provider === 'postgres' || provider === 'local') {
    return (
      process.env.POSTGRES_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL
    );
  }

  // Automatic detection fallback
  const directSupa = formatSupabaseUrl(process.env.SUPABASE_DATABASE_URL);
  if (directSupa) {
    return directSupa;
  }

  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PRISMA_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL
  );
}

let connectionString = resolveConnectionString();

// Detect database provider characteristics
const isSupabase = Boolean(
  connectionString &&
    (connectionString.includes('supabase.co') ||
      connectionString.includes('supabase.com') ||
      connectionString.includes('pooler.supabase.com'))
);

const isMigrationRole = Boolean(
  connectionString && connectionString.includes('prisma_migration')
);

// Auto-append connection_limit=1 if this is the single-connection Prisma Cloud migration role
if (connectionString && isMigrationRole && !connectionString.includes('connection_limit')) {
  const separator = connectionString.includes('?') ? '&' : '?';
  connectionString = `${connectionString}${separator}connection_limit=1`;
}

const parsedLimit = getConnectionLimit(connectionString);

// Conservative connection cap:
// - If using single-connection migration role: hard-cap to 1
// - If using Supabase pooled URL: default to 10 (or explicit limit)
// - Defaults: 3 in development, 10 in production
const maxConnections =
  isMigrationRole
    ? 1
    : parsedLimit ??
      (process.env.PGMAX_CONNECTIONS
        ? parseInt(process.env.PGMAX_CONNECTIONS, 10)
        : process.env.NODE_ENV === 'production'
        ? 10
        : 3);

// SSL configuration: Supabase and cloud providers require SSL with rejectUnauthorized: false
const requiresSsl =
  isSupabase ||
  Boolean(connectionString && connectionString.includes('sslmode=require'));

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const poolConfig: PoolConfig = connectionString
  ? {
      connectionString,
      max: maxConnections,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'loan_ms_db',
      max: maxConnections,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    };

// Singleton pg.Pool: Reused across Next.js module re-evaluations and hot reloads
const pool = globalForPrisma.pool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.pool = pool;
}

const adapter = new PrismaPg(pool);

// Singleton PrismaClient
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { pool, isSupabase };
export default prisma;
