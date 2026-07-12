# APMS — Architecture Practice Management Platform

A connected system for an architecture firm covering projects, external consultants, internal team management, and practice-wide financial/operational oversight.

Built for **Studio Meridian Architects** (demo office name — change freely).

## Tech stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4, React Router, TanStack Query
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL via Prisma ORM — works against any Postgres host (Neon, Supabase, Render, RDS, local). The schema avoids native `enum` types so it was originally developed against SQLite too; if you ever need a zero-install local DB again, `provider = "postgresql"` → `"sqlite"` in `apps/api/prisma/schema.prisma` plus a fresh `prisma migrate dev` is the only change needed
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
- A Postgres database — a free instance from [Neon](https://neon.tech) or [Supabase](https://supabase.com) takes under a minute to create and works fine for dev

## First-time setup

From the repo root:

```bash
npm install
cp apps/api/.env.example apps/api/.env   # then fill in DATABASE_URL and generate JWT secrets
npm run prisma:migrate    # applies the schema to your Postgres database
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

`apps/api/.env` (copy from `.env.example`):

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
PORT=4000
WEB_ORIGIN="http://localhost:5173"
```

`apps/web` reads `VITE_API_BASE_URL` at build time — leave it unset for local dev (Vite proxies `/api` to `localhost:4000`); set it to your deployed API's URL (e.g. `https://apms-api.onrender.com/api`) for a production frontend build.

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

## Deployment

The frontend and API deploy separately (Netlify only hosts static sites/functions, not a persistent Express process):

- **Frontend → Netlify**: `netlify.toml` at the repo root already has the correct build command and SPA redirect for this npm-workspaces monorepo. Set `VITE_API_BASE_URL` in Netlify's environment variables to your deployed API's `/api` URL, then redeploy.
- **API → Render**: `render.yaml` at the repo root is a Render Blueprint — in the Render dashboard use **New → Blueprint**, point it at this repo, and it provisions the web service with the right build/start commands. It reads `DATABASE_URL` and `WEB_ORIGIN` as required secrets you fill in during setup (JWT secrets are auto-generated). `WEB_ORIGIN` must be set to your Netlify site's URL for CORS + cookies to work — the refresh-token cookie is `sameSite=none; secure` in production specifically to support the frontend and API living on different domains.
- **Database**: any Postgres works — Neon and Supabase both have generous free tiers and give you a connection string instantly.
- Run `npm run prisma:migrate` (or let Render's start command run `prisma migrate deploy` automatically, as configured in `render.yaml`) and `npm run prisma:seed` once against the production database to get the demo data in.

## Known simplifications (documented, not hidden)

- **Profitability calculation** uses a single assumed blended hourly cost rate (visible in the Financials page) rather than real per-person salary data — there's no cost-rate field on `User` yet.
- **Email/WhatsApp** notifications are logged to the API console in dev mode rather than actually sent; the integration point (`apps/api/src/lib/email.ts`) is isolated for swapping in a real provider.
- **File storage** is local disk. This is fine on a single always-on server, but on Render's free tier the filesystem doesn't persist across deploys/restarts, so uploaded documents would be lost — move to S3-compatible storage (swap `apps/api/src/lib/storage.ts`) before relying on file uploads in production.
- **Multi-office** support exists in the data model (`Office`) but the UI assumes a single office per login.
