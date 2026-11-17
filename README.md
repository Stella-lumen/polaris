# Polaris — Internal Audit Management

A Next.js internal-audit management platform: engagement workflow, audit
programs, working papers, findings, corrective-action follow-up, risk
register, resource/time tracking, dashboards, and reporting — backed by
Prisma + SQLite (dev) with a PostgreSQL/Supabase migration path.

## Stack

- Next.js (App Router) + React + TypeScript
- Prisma ORM — SQLite dev database (`prisma/dev.db`)
- AG Grid data tables, Tailwind-style utility CSS, lucide icons
- Server actions in `src/lib/actions.ts`; signed-cookie auth + RBAC
- REST v1 API (`/api/v1`) — API-key auth, scopes, rate limiting
- Excel export via `xlsx`; DDL for Postgres / SQL Server / MySQL in `prisma/ddl/`

## Getting started

```bash
npm install
npx prisma generate
npx prisma db push
node prisma/seed.mjs
npm run dev        # http://localhost:3005
```

Seed users (role → login): `sinethemba@stella-lumen.com` (org:admin),
`lusanda@tzulu.co.za` (CAE), `amahle@stella-lumen.com` (member).
Dev password is set by the seed — see `prisma/seed.mjs`.

## Key areas

| Path | What |
|---|---|
| `/dashboard` | Live counts, charts, escalation alerts |
| `/annual-audit-plan` | Plans → planned engagements → engagements |
| `/engagements/{id}` | 5-stage workflow, declarations matrix, review notes, findings |
| `/admin/*` | Users, engagement types, periods, declarations, delegated preparers, organizations, API keys, audit logs |
| `/risk-assessment`, `/tasks`, `/follow-up`, `/resources` | Tender modules |
| `/reports` | Filterable report previews + PDF/Word/Excel export |
| `/api-docs.html` | REST API documentation |

## REST API

Read-only v1 API + `POST /api/v1/users/sync` (directory/AD user
provisioning). Keys are generated under Admin → API Keys, stored as
SHA-256 hashes, scoped per resource. See `public/api-docs.html` and
`scripts/sync-ad-users.mjs`.

## Supabase

`supabase/schema.sql` — engagement-centric Postgres DDL (enums, triggers,
indexes) for the recommended rebuild schema. `prisma/ddl/postgresql.sql`
contains DDL matching the current Prisma schema.

Generated with [Devin](https://devin.ai)
