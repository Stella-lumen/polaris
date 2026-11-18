# Polaris on AWS — Deployment Runbook

*"Two boxes, one connection string, zero magic."*

This is the complete, step-by-step plan for taking Polaris from a developer
laptop to a production deployment on AWS — written so that anyone reasonably
comfortable with a console can follow it, and so the tender evaluation committee
can see exactly what the infrastructure claim means in practice.

---

## The shape of the thing

```
                        Internet (HTTPS :443 only)
                                 │
                    ┌────────────▼────────────┐
                    │  Application Load       │   ← TLS certificate lives here
                    │  Balancer               │     HTTP→HTTPS redirect
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
   ┌──────────▼───────────┐           ┌─────────────▼─────────────┐
   │ EC2 — Windows Server │  :5432    │ RDS — PostgreSQL 16       │
   │ 2022 · app tier      ├──────────▶│ · data tier               │
   │  Node.js + Polaris   │ private   │ · automated snapshots     │
   │  next start (NSSM)   │           │ · pg_dump → S3 (12mo+)    │
   └──────────────────────┘           └───────────────────────────┘
            af-south-1 — Cape Town — data stays in South Africa
```

Two tiers. The tender asks for exactly this split — requirement 4 is satisfied
by the architecture itself, not by a workaround.

---

## Phase 0 — Before touching AWS (30 min, free)

| Step | What | Why |
|---|---|---|
| 0.1 | Create an IAM user `polaris-deploy` | Never work as root. Least privilege: EC2 + RDS access only |
| 0.2 | Install AWS CLI, `aws configure` | Everything below runs from the console or CLI — your choice |
| 0.3 | Choose region **af-south-1** | Data residency in South Africa, answered once at region level |
| 0.4 | Budget alarm at R3,000 | Billing alarm before anything costs real money |

## Phase 1 — The data tier (RDS PostgreSQL 16)

1. **RDS → Create database → PostgreSQL 16**
   - Engine version 16.x · instance `db.t3.small` (plenty for an audit system)
   - Master username `polaris_admin`, strong generated password
   - Initial database name: `polaris`
   - **Public access: No.** The database must never be reachable from the internet
   - Enable automated backups (7-day snapshot window) — this is the safety net
     *under* our own exports
2. **Security group `sg-polaris-db`:** inbound 5432 **only** from `sg-polaris-app`.
   Nothing else. Ever.
3. Copy the endpoint: `polaris.abc123.af-south-1.rds.amazonaws.com`

> Tender check: ✓ PostgreSQL 16 · ✓ separate data tier · ✓ cloud hosting

## Phase 2 — The app tier (EC2 Windows Server 2022)

1. **EC2 → Launch instance**
   - AMI: Windows Server 2022 Base · `t3.medium`
   - Security group `sg-polaris-app`: inbound **443** from 0.0.0.0/0,
     **3389** (RDP) from *your IP only*. Outbound 5432 → `sg-polaris-db`
   - Elastic IP — so the address doesn't wander between reboots
2. RDP in and prepare:
   - Install **Node.js LTS** (22.x)
   - Copy the Polaris app folder (git clone or RDP drag-and-drop)
   - `.env`:
     ```
     DATABASE_URL=postgresql://polaris_admin:PASS@polaris.abc123.af-south-1.rds.amazonaws.com:5432/polaris
     AUTH_SECRET=<64 random chars>
     CRON_SECRET=<64 random chars>
     BREVO_API_KEY=<when live email is needed>
     ```
   - `npm ci` → `npx prisma generate` → `npm run build`
3. Seed the database:
   - Apply `prisma/ddl/postgresql.sql` against RDS
   - `node prisma/seed.mjs` for the first admin user

> Tender check: ✓ Windows Server 2022 · ✓ presentation/logic tier

## Phase 3 — Make it a service, make it HTTPS

1. **NSSM** → `nssm install Polaris` → `next start -- -p 3005` → auto-start,
   auto-restart on crash. The app now survives reboots.
2. **Application Load Balancer:**
   - Target group → the EC2 instance on port 3005
   - Listener 443 with a **free ACM certificate** (AWS issues it for your domain)
   - Listener 80 → redirect to 443. *This is "HTTPS enforced in production" —
     it becomes a true statement here, not a promise.*
3. DNS: `polaris.your-domain.co.za` → the ALB

## Phase 4 — The boring machinery that wins tenders

| Job | Tool | Schedule | Proof |
|---|---|---|---|
| `pg_dump` export → S3 | `scripts/backup.ps1` via Task Scheduler | Daily | Files in S3, 1095-day retention |
| Weekly/monthly backup report | Scheduled job → Sent Emails | Weekly Fri, monthly 1st | Admin inbox + Sent Emails log |
| Escalation engine | Task Scheduler → `POST /api/escalation/run` | Daily 07:00 | Sent Emails + Audit Logs |
| AD/Entra user sync (if used) | `scripts/sync-ad-users.mjs` | Daily 06:30 | Audit trail per sync |

## Phase 5 — Prove it (the acceptance checklist)

- [ ] Browse to `https://polaris.your-domain.co.za` → login page loads over HTTPS
- [ ] `http://` URL redirects to `https://`
- [ ] Log in as admin → dashboard renders live data
- [ ] `curl -H "x-api-key: …" https://…/api/v1/health` → 200
- [ ] Kill the `next` process → NSSM restarts it in seconds
- [ ] Reboot the VM → service comes back on its own
- [ ] Wait a day → a `pg_dump` file lands in S3
- [ ] `psql` from your laptop → connection refused (the DB is private — correct)

## Phase 6 — Tear it down (demo-only deployments)

For a demo-week deployment: keep a `teardown` checklist — delete the ALB,
terminate EC2, take a final RDS snapshot then delete the instance. Total cost
for a 7-day demo: **~R400–600** instead of ~R3,000/month.

## Cost card

| Item | Spec | ~Monthly |
|---|---|---|
| EC2 Windows | t3.medium | R1,100–1,500 |
| RDS PostgreSQL 16 | db.t3.small | R550–900 |
| Load balancer + cert | ALB + ACM (cert free) | R330 |
| S3 + data transfer | backups, small | R20–50 |
| **Total** | | **~R2,000–2,800** |

## What this plan deliberately does NOT claim

- No AD/Entra SSO (file-based directory sync only — stated honestly in docs)
- No multi-region failover (not required by the tender)
- No auto-scaling group (an audit system for a SETA is sized by the team,
  not by traffic — a single well-run VM is the honest answer)
- Weekly/monthly backup *reports* are built into the plan but are the one
  line item scheduled as implementation work, marked as such

---

*Prepared for the AgriSETA Internal Audit Software tender. The infrastructure
requirements (§10, items 1–6) map one-to-one to Phases 1–4 above.*
