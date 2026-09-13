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
npx prisma db push --skip-generate

echo "🔍 Evaluating database seed status..."
node -e '
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function evaluateSeed() {
  if (process.env.FORCE_SEED === "true") {
    console.log(">> FORCE_SEED=true detected. Proceeding with database seed.");
    process.exit(10);
  }
  try {
    const res = await pool.query("SELECT COUNT(*) FROM users;");
    const userCount = parseInt(res.rows[0].count, 10);
    if (userCount === 0) {
      console.log(">> Database has 0 users. Performing initial baseline seed.");
      process.exit(10);
    } else {
      console.log(`>> Database already contains ${userCount} user(s). Skipping automatic wipe & seed.`);
      process.exit(0);
    }
  } catch (err) {
    console.log(">> Could not query users table:", err.message, "Proceeding with seed.");
    process.exit(10);
  } finally {
    await pool.end();
  }
}
evaluateSeed();
'
SEED_DECISION=$?

if [ "$SEED_DECISION" -eq 10 ]; then
  echo "🌱 Seeding initial roles, branches, products, and default administrator..."
  npx tsx prisma/seed.ts
  echo "✅ Database seed completed successfully."
fi

echo "🚀 Launching Next.js Production Web Server on port ${PORT:-3000}..."
exec "$@"
