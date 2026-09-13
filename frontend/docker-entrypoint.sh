#!/bin/sh
set -e

echo "======================================================="
echo "   FinTech Enterprise Loan Management System (LMS)     "
echo "======================================================="

# Ensure DATABASE_URL is constructed if individual variables were supplied
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://${PGUSER:-postgres}:${PGPASSWORD:-postgres}@${PGHOST:-postgres}:${PGPORT:-5432}/${PGDATABASE:-loan_ms_db}?schema=public"
fi

echo "⏳ Checking PostgreSQL connection..."
node -e '
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDatabase(maxAttempts = 30, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1;");
      client.release();
      await pool.end();
      console.log("✅ PostgreSQL is reachable and accepting connections.");
      process.exit(0);
    } catch (err) {
      console.log(`[Attempt ${attempt}/${maxAttempts}] Database not ready yet: ${err.message}. Retrying in ${delayMs/1000}s...`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  console.error("❌ Timed out waiting for PostgreSQL.");
  process.exit(1);
}
checkDatabase();
'

echo "📦 Synchronizing Prisma database schema..."
npx prisma db push --accept-data-loss

echo "🔍 Evaluating database seed status..."
SEED_REQUIRED=$(node -e '
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function evaluateSeed() {
  if (process.env.FORCE_SEED === "true") {
    process.stdout.write("YES");
    await pool.end();
    return;
  }
  try {
    const res = await pool.query("SELECT COUNT(*) FROM users;");
    const userCount = parseInt(res.rows[0].count, 10);
    if (userCount === 0) {
      process.stdout.write("YES");
    } else {
      process.stdout.write("NO");
    }
  } catch (err) {
    process.stdout.write("YES");
  } finally {
    await pool.end();
  }
}
evaluateSeed();
')

if [ "$SEED_REQUIRED" = "YES" ]; then
  echo "🌱 Database empty or FORCE_SEED active. Seeding baseline master data & administrator..."
  npx tsx prisma/seed.ts
  echo "✅ Database seed completed successfully."
else
  echo ">> Database already contains user records. Preserving existing data."
fi


echo "🚀 Launching Next.js Production Web Server on port ${PORT:-3000}..."
exec "$@"
