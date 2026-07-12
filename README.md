# APMS — Architecture Practice Management Platform

A connected system for an architecture firm covering projects, external consultants, internal team management, and practice-wide financial/operational oversight.

Built for **Studio Meridian Architects** (demo office name — change freely).

## Tech stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4, React Router, TanStack Query
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via Prisma ORM (local dev) — the schema avoids native `enum` types on purpose, so switching `provider = "sqlite"` to `"postgresql"` in `apps/api/prisma/schema.prisma` plus a real `DATABASE_URL` is the only change needed to move to Postgres in production
- **Auth**: Custom JWT (short-lived access token + httpOnly refresh cookie), bcrypt password hashing, role + project-membership based RBAC
- **File storage**: Local disk under `apps/api/storage/`, served through an authenticated route — swap for S3-compatible storage later by changing `apps/api/src/lib/storage.ts`
- **Email**: Dev-mode stub that logs instead of sending (`apps/api/src/lib/email.ts`) — swap in SendGrid/SES there
- **Exports**: `pdfkit` (PDF) and `exceljs` (Excel) for project reports

## Monorepo layout

```
apms/
  apps/api/     Express API (all business logic, RBAC, Prisma models)
  apps/web/     React frontend
  packages/shared/   Zod schemas, TS types, Role/Permission enums, shared constants
```

## Prerequisites

- Node.js 20+ (this repo was built and tested against Node 24 installed via `nvm`)
- npm 10+

No database server, Docker, or external services required to run locally — SQLite lives in `apps/api/prisma/dev.db`.

## First-time setup

From the repo root:

```bash
npm install
npm run prisma:migrate    # creates apps/api/prisma/dev.db and applies the schema
npm run prisma:seed       # populates a demo office, users, and two sample projects
```

## Running locally

In two terminals (or use your editor's task runner):

```bash
npm run dev:api    # http://localhost:4000
npm run dev:web     # http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the Express server on port 4000.

## Demo accounts

All seeded users share the password `password123`:

| Role | Email |
|---|---|
| Principal | `principal@studiomeridian.com` |
| Project Architect | `architect@studiomeridian.com` |
| Design Team | `designer1@studiomeridian.com`, `designer2@studiomeridian.com` |
| Admin/Office Manager | `admin@studiomeridian.com` |
| External Consultant (portal) | `consultant@bedrockstructural.com` |
| Client (portal) | `client@vantagedevelopers.com` |

## Environment variables

`apps/api/.env` (already created from `.env.example` with random JWT secrets during setup):

```
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
PORT=4000
WEB_ORIGIN="http://localhost:5173"
```

## Type checking

```bash
npm run typecheck   # runs tsc --noEmit across shared, api, and web
```

## What's implemented

- Full RBAC across 6 roles (Principal, Project Architect, Design Team, Admin Manager, Consultant, Client), enforced server-side per endpoint and per project membership — not just hidden in the UI
- Projects: setup, configurable phases, milestones with reminders, statutory approval checklist
- Consultants: directory, contracts, payment milestones, deliverable tracker, drawing exchange log, RFI thread, ratings
- Team: staff directory, Kanban task board, workload/utilization view, timesheets with approval workflow, leave requests, skill-based assignment suggestions
- Drawing register, RFI log, site visit log (with photo upload), versioned document repository
- Project workspace hub — every module reachable from one project page — plus a cross-project Gantt-style timeline
- Financials: client + consultant invoices, payment tracking, per-project profitability estimate (fee vs. approved-hours cost vs. consultant budget)
- Management dashboard: today's overdue items, upcoming deadlines, pending consultant submissions, today's meetings, pending approvals, firm-wide KPIs (revenue by typology, utilization, on-time delivery)
- Configurable, multi-step approval chains (drawing/invoice/contract) — office admins set the role chain, requests route and notify automatically
- Central calendar (milestones, meetings, site visits, leave, RFI due dates), global search, audit trail, PDF/Excel report export
- Consultant and Client limited-access portals, scoped so a consultant only ever sees their own firm's contracts/deliverables/RFIs
- Admin config screens: phase names, consultant categories, statutory checklist templates, approval chains, user role/active management — all editable per office, not hardcoded

## Known simplifications (documented, not hidden)

- **Profitability calculation** uses a single assumed blended hourly cost rate (visible in the Financials page) rather than real per-person salary data — there's no cost-rate field on `User` yet.
- **Email/WhatsApp** notifications are logged to the API console in dev mode rather than actually sent; the integration point (`apps/api/src/lib/email.ts`) is isolated for swapping in a real provider.
- **File storage** is local disk, fine for single-server deployment; move to S3-compatible storage for multi-instance deployments.
- **Multi-office** support exists in the data model (`Office`) but the UI assumes a single office per login.
