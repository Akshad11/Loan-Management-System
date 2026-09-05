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
