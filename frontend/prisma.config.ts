import { defineConfig } from 'prisma/config';
import 'dotenv/config';

function getDatasourceUrl(): string {
  const provider = (process.env.DB_PROVIDER || '').trim().toLowerCase();
  const dbPassword = (process.env.SUPABASE_DB_PASSWORD || '').trim();
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'xwyarykuzfzitvsjylih';

  const formatSupabaseUrl = (rawUrl?: string): string | undefined => {
    if (!rawUrl) return undefined;
    let url = rawUrl.replace(/\[YOUR-PROJECT-REF\]/g, projectRef);
    if (dbPassword) {
      url = url.replace(/\[YOUR-PASSWORD\]/g, encodeURIComponent(dbPassword));
    }
    if (url.includes('[YOUR-PASSWORD]')) return undefined;
    return url;
  };

  const localPostgres =
    process.env.POSTGRES_DATABASE_URL ||
    process.env.DATABASE_URL ||
    `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'loan_ms_db'}?schema=public`;

  // If Supabase is selected, prioritize direct URL (Session mode / port 5432) for migrations
  if (provider === 'supabase') {
    const supaUrl =
      formatSupabaseUrl(process.env.SUPABASE_DIRECT_URL) ||
      formatSupabaseUrl(process.env.SUPABASE_DATABASE_URL) ||
      formatSupabaseUrl(process.env.SUPABASE_URL);

    return supaUrl || localPostgres;
  }

  // If Standard PostgreSQL is selected
  if (provider === 'postgres' || provider === 'local') {
    return localPostgres;
  }

  // Default fallback sequence
  const supaDirect = formatSupabaseUrl(process.env.SUPABASE_DIRECT_URL);
  if (supaDirect) return supaDirect;

  return localPostgres;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: getDatasourceUrl(),
  },
});
