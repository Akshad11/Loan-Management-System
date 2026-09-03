# Enterprise Loan Management System (LMS) — Vercel Deployment Runbook

This document details the configuration, environment requirements, database setup, and post-deployment verification procedures for deploying the FinTech Loan Management System to **Vercel**.

---

## 1. Vercel Project Settings

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | Next.js | Automatically detected |
| **Root Directory** | `frontend` | The Next.js application root |
| **Build Command** | `prisma generate && next build` | Configured in `package.json` |
| **Install Command** | `npm install` | Executes `postinstall: prisma generate` |
| **Node.js Version** | 20.x or 22.x | Standard LTS runtime |

---

## 2. Required Production Environment Variables

Configure the following environment variables in **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

| Variable Name | Environment | Sample / Description | Required? |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Production & Preview | `postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DB]?sslmode=require` | **YES** |
| `AUTH_SECRET` | Production & Preview | `32-byte-hex-secret-generated-for-jwt-signing` | **YES** |
| `NEXT_PUBLIC_APP_URL` | Production | `https://your-domain.vercel.app` (Canonical domain) | **YES** |
| `NODE_ENV` | Production | `production` | Recommended |

> [!IMPORTANT]
> `DATABASE_URL` must point to a publicly reachable cloud PostgreSQL instance (e.g. Neon, Supabase, AWS RDS, Railway, or Vercel Postgres). Localhost (`localhost:5432`) will not be reachable from Vercel serverless functions.

---

## 3. Remote Database Setup & Initial Seeding

When deploying against a fresh cloud PostgreSQL instance, initialize the database schema and seed the baseline system administrator:

### Step 1: Push Database Schema
From your local machine in the `frontend/` directory, set the remote database URL and push the Prisma schema:
```powershell
cd "g:\Coding\VS code\Loan ms\frontend"
$env:DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DB]?sslmode=require"
npx prisma db push
```

### Step 2: Seed Default Roles, Branches & System Admin
Run the automated seed script to populate baseline RBAC roles, initial branches, and the master administrator account:
```powershell
npx tsx prisma/seed.ts
```

### Default Credentials After Seeding:
- **Corporate Login Portal**: `/` or `/login`
- **Administrator Email**: `admin@fintechlms.in` (or username: `admin`)
- **Default Password**: `LmsAdmin@2026`

---

## 4. Production Architecture & Security Highlights

1. **Stateless Serverless Execution**:
   - All uploaded documents are tracked via database metadata records and external asset pointers. No state is written to the ephemeral Vercel filesystem.
2. **Search Engine Protection (No-Index)**:
   - All authenticated financial routes (`/dashboard`, `/customers`, `/loans`, `/applications`, `/repayments`, etc.) are disallowed in `robots.txt` and protected by `robots: { index: false, follow: false }` metadata.
3. **HTTP Security Headers**:
   - Configured in `next.config.ts`:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: SAMEORIGIN`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
     - `X-Powered-By` header stripped
4. **Health Check Monitoring Endpoints**:
   - `/api/health`: Lightweight HTTP 200 ping returning service uptime.
   - `/api/health/db`: Database connectivity verification with latency metrics (sanitized in production to prevent leaking configuration internals).

---

## 5. Post-Deployment Verification Checklist

Once deployed to Vercel, verify the following:

- [ ] **Health Endpoint**: `https://your-domain.vercel.app/api/health` returns `{"status":"healthy"}`.
- [ ] **Database Connectivity**: `https://your-domain.vercel.app/api/health/db` returns `{"status":"healthy","database":"connected"}`.
- [ ] **Sign-In Flow**: Sign in using `admin@fintechlms.in` / `LmsAdmin@2026`.
- [ ] **Dashboard Stats**: Verify metrics cards, loan status breakdown, and recent activities load properly.
- [ ] **Mobile Navigation**: Open on mobile viewport (< 768px) and verify the hamburger menu slides out the navigation drawer.
- [ ] **Branch Persistence**: In **System Settings** → **Branches**, register or update a branch and confirm it persists across refreshes.
- [ ] **Loan Products & Form Builder**: Verify form builder renders dynamic multi-page questionnaires with clean word-wrapping on long question labels.
- [ ] **Robots & Sitemap**: Access `/robots.txt` and `/sitemap.xml` to verify correct indexing boundaries.
