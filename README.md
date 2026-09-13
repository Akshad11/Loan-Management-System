# Enterprise Loan Management System (LMS)

A modern full-stack Digital Lending and Loan Servicing Platform built with Next.js, TypeScript, Tailwind CSS, and Prisma ORM.

## Core System Modules

1. **Customer Onboarding & KYC**: Single customer view (SCV), deduplication, CKYC/Tier 3, PAN/Aadhaar masking.
2. **Loan Applications & Form Builder**: Dynamic multi-step questionnaires, product configuration (HL, PL, VL, BL, GL).
3. **Parties & Collateral**: Co-applicants, personal/corporate guarantors, asset valuation, and LTV computation.
4. **Credit Bureau Integration**: Real-time CIBIL / Experian reporting, score bands, and delinquency analysis.
5. **Credit Assessment Workbench**: Financial ratio analysis (FOIR/DTI), policy deviation management, and Credit Appraisal Memo (CAM).
6. **Approval Matrix & Committee**: Multi-tier Delegation of Authority (DoA) limits, conditions precedent/subsequent.
7. **Sanction Management**: Regulatory Sanction Letter & Key Fact Statement (KFS) generation with customer acceptance.
8. **Disbursements**: Pre-disbursement checks, beneficiary penny drop verification, and NEFT/RTGS/IMPS banking rails payout.
9. **Loan Accounts & Servicing**: Automated reducing-balance amortization schedule generation, eNACH mandate auto-debit.
10. **Repayments, Delinquency & Recovery**: Automated waterfall payment allocation, SMA-0/1/2 DPD bucketing, restructuring, and legal recovery.
11. **Closure & Digital NOC**: Exact foreclosure quote computation, lien release, and QR-verifiable digital NOC certificate.

## Quick Start (Docker Deployment)

Launch the entire stack (PostgreSQL + Next.js with automated schema setup & default admin):

### Windows (1-Click Launcher):
```cmd
run.bat
```
*(Supports: `run.bat start`, `run.bat stop`, `run.bat restart`, `run.bat logs`, `run.bat seed`, `run.bat reset`)*

### Linux / macOS:
```bash
docker compose up --build -d
```

- **Web Application Portal**: [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Database**: `localhost:5432` (db: `loan_ms_db`, user: `postgres`)
- **Default Master Admin**: `admin@fintechlms.in` / `LmsAdmin@2026`

For detailed setup, container management, and troubleshooting, see [DOCKER.md](file:///g:/Coding/VS%20code/Loan%20ms/DOCKER.md) and [DEPLOYMENT.md](file:///g:/Coding/VS%20code/Loan%20ms/DEPLOYMENT.md).

