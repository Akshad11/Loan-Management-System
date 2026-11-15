# Enterprise Loan Management System (LMS) — Local Setup Guide (Without Docker)

This guide walks you through running the FinTech Loan Management System directly on your host machine using **Node.js**, **npm**, and **Prisma**, without Docker or Podman.

---

## 1. Prerequisites

Before running the application locally, make sure you have installed:

- **Node.js**: v18.18+ or v20+ / v22+ (`node -v`)
- **npm**: v9+ or v10+ (`npm -v`)
- **PostgreSQL**: Either:
  - **Option A (Cloud)**: Supabase Cloud PostgreSQL *(pre-configured, zero local installation required)*
  - **Option B (Local)**: Local PostgreSQL running on `localhost:5432`

---

## 2. 1-Click Launchers (Windows .bat)

In the project root directory, 3 automated batch files are available:

| File | Purpose | Description |
| :--- | :--- | :--- |
| [**`1_setup_db.bat`**](file:///g:/Coding/VS%20code/Loan%20ms/1_setup_db.bat) | **Initialize & Seed DB** | Verifies `node_modules`, generates Prisma client, pushes schema to PostgreSQL, and seeds master data & admin accounts. |
| [**`2_run_prod.bat`**](file:///g:/Coding/VS%20code/Loan%20ms/2_run_prod.bat) | **Build & Run Production** | Builds Next.js production bundle (`npm run build`) and starts the production server (`npm start`) on `http://localhost:3000`. |
| [**`3_update_db.bat`**](file:///g:/Coding/VS%20code/Loan%20ms/3_update_db.bat) | **Update SQL Schema** | Re-generates Prisma client and applies SQL schema updates (`npx prisma db push`), with an option to launch Prisma Studio. |

---

## 3. Manual Command Line Quick Start

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Sync schema with the database (SQL Update)
npx prisma db push

# 5. Seed initial master data & admin accounts (first-time only)
npm run prisma:seed

# 6. Start the local development server
npm run dev
```

The application will be accessible at:
👉 **`http://localhost:3000`**

---

## 3. Database Configuration (`.env`)

Configuration is managed in [`frontend/.env`](file:///g:/Coding/VS%20code/Loan%20ms/frontend/.env).

### Option A: Supabase Cloud PostgreSQL (Default)
To connect to the cloud database without installing PostgreSQL locally, ensure your `frontend/.env` contains:

```env
DB_PROVIDER="supabase"
NEXT_PUBLIC_AUTH_PROVIDER="hybrid"

# Supabase direct & pooler connection URLs
SUPABASE_DATABASE_URL="postgresql://postgres.xwyarykuzfzitvsjylih:hb_Thk!WXyGY%2F53@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
SUPABASE_DIRECT_URL="postgresql://postgres.xwyarykuzfzitvsjylih:hb_Thk!WXyGY%2F53@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
DATABASE_URL="postgresql://postgres.xwyarykuzfzitvsjylih:hb_Thk!WXyGY%2F53@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Option B: Local PostgreSQL (Installed on Host Machine)
If you run PostgreSQL locally on Windows or macOS:
1. Ensure the PostgreSQL service is active on port `5432`.
2. Create the target database:
   ```sql
   CREATE DATABASE loan_ms_db;
   ```
3. Update `frontend/.env`:
   ```env
   DB_PROVIDER="postgres"
   PGHOST="localhost"
   PGPORT="5432"
   PGUSER="postgres"
   PGPASSWORD="your_password"
   PGDATABASE="loan_ms_db"
   POSTGRES_DATABASE_URL="postgresql://postgres:your_password@localhost:5432/loan_ms_db?schema=public"
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/loan_ms_db?schema=public"
   ```

---

## 4. Database & SQL Update Commands

Whenever you modify [`frontend/prisma/schema.prisma`](file:///g:/Coding/VS%20code/Loan%20ms/frontend/prisma/schema.prisma) or need to sync SQL tables, use the following commands from inside `frontend/`:

| Task | npm Command | Direct npx Command | Description |
| :--- | :--- | :--- | :--- |
| **Push Schema to SQL** | `npm run prisma:push` | `npx prisma db push` | Pushes schema state directly to PostgreSQL (creates/alters tables, columns, constraints, and indexes without migration files). |
| **Generate Prisma Client** | `npm run prisma:generate` | `npx prisma generate` | Regenerates the TypeScript client and type definitions after schema changes. |
| **Seed Database** | `npm run prisma:seed` | `npx tsx prisma/seed.ts` | Populates roles, system admin account, branch data, and initial products. |
| **Interactive DB Studio** | `npm run prisma:studio` | `npx prisma studio` | Opens an interactive web GUI at `http://localhost:5555` to view, search, and edit database records. |
| **Create Migration** | — | `npx prisma migrate dev --name <migration_name>` | Generates a version-controlled SQL migration file in `prisma/migrations/`. |

### One-Step Command to Refresh DB & Client:
```bash
npx prisma generate && npx prisma db push && npm run prisma:seed
```

---

## 5. Running the Application

### Development Mode (Recommended for Coding & Debugging)
```bash
npm run dev
```
- Includes hot reload for instant feedback on code changes.
- Starts on `http://localhost:3000`.

### Production Build & Run (Test Production Performance Locally)
```bash
# Build the optimized production bundle
npm run build

# Start the production server
npm start
```

---

## 6. Default Login Credentials

After running `npm run prisma:seed`, the master administrative accounts are:

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Administrator** | `admin@fintechlms.in` | `LmsAdmin@2026` |
| **Checker / Approver** | `checker@fintechlms.in` | `LmsAdmin@2026` |

---

## 7. Troubleshooting

### 1. Port 3000 Already in Use
If another process or a previous Docker container is using port 3000:
```bash
# Run Next.js on a different port (e.g. 3001)
npx next dev -p 3001
```

### 2. Prisma Connection Error (`P1001: Can't reach database server`)
- Verify that your database is reachable.
- If using Supabase, ensure your IP has network access and your internet connection is active.
- If using local Postgres, verify the service is running:
  ```powershell
  # Windows PowerShell
  Get-Service -Name postgresql*
  ```

### 3. TypeScript / Build Discrepancy
If types are out of sync after modifying routes or models:
```bash
npx prisma generate
```
