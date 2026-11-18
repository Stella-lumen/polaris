# Compliance Matrix — AgriSETA Internal Audit Software Solution

**Bid:** BID DOCUMENT FOR INTERNAL AUDIT SOFTWARE SOLUTION
**Bidder:** [Company name]
**Date:** [Submission date]

This matrix maps every scored and mandatory requirement of the bid document to the
proposed solution's capabilities and the evidence provided in this proposal.
Section references point to the proposal document; screen references point to the
live system demonstrated in Phase 3.

| Status key | |
|---|---|
| **C** | Fully compliant — demonstrated in the system |
| **D** | Compliant — evidenced by submitted documentation |
| **P** | Delivered during implementation phase |

---

## 1. Phase 1 — Technical Mandatory Requirements

| # | Requirement | Status | Evidence / Response |
|---|---|---|---|
| 1 | Proof of manufacturer accreditation to resell, install, support and maintain the proposed system (valid OEM letter) | D | **[Bidder to complete]** — the proposed platform is developed and owned by the bidder; manufacturer/ownership declaration attached as Annexure [x]. |

## 2. Administrative Returnables

| # | Requirement | Status |
|---|---|---|
| 1 | Documents labelled "Original" and "Copy" | D |
| 2 | Company profile accompanying proposal | D |
| 3 | All SBD forms completed and signed (SBD 1, 3.1, 4, 6.1) | D |
| 4 | CSD report with tax-compliant status | D |
| 5 | SBD 3.1 pricing schedule in the prescribed format | D |
| 6 | Section 4 of AgriSETA SBD 6.1 completed with proof for points claimed | D |

## 3. Functionality — Company Experience (10 pts)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Reference letters (internal audit software supply/implementation/maintenance), not older than 5 years, company letterhead, signed, with description of services, contact person and project duration | D | [x] reference letters attached — Annexure [x] |
| 2 | CVs + certified qualifications (≤6 months) of two trainers — NQF 6 Internal Audit / ICT / IT Audit or CISA; ≥6 years training experience | D | CVs and certificates — Annexure [x] |

## 4. Functionality — Implementation Support, 12 months (5 pts)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Implementation support plan on bidder letterhead | D | Section [x]: Implementation Plan |
| 2 | Detailed deliverables | D | Section [x]: milestones & deliverables table |
| 3 | Post-implementation support plan | D | Section [x]: 12-month support model |
| 4 | System maintenance support plan | D | Section [x]: maintenance schedule |
| 5 | Detailed tracking of implementation milestones | D | Section [x]: milestone tracker |

## 5. Functionality — Customisation (15 pts)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Plan to customise AgriSETA's audit templates and reports within the first 3–6 months of implementation | D | Section [x]: Customisation Plan — template/report workshops in months 1–2, delivery months 3–6. Planning and report template engines already exist in the system (Admin → Document Templates). |

## 6. Functionality — Internal Audit Methodology (25 pts)

| # | Tender requirement | Status | Demonstrated in |
|---|---|---|---|
| 1 | Supports risk-based audit plan (incl. conducting risk assessments) | C | Risk Assessment register (`/risk-assessment`) — inherent & residual scoring feeds the Annual Audit Plan (`/annual-audit-plan`) |
| 2 | Planning the audit engagement | C | Engagement → Planning stage — scope, objectives, audit programme with WP cross-references, templates, planning review sign-off |
| 3 | Performing the audit engagement (fieldwork) | C | Engagement → Fieldwork stage — working papers, test results, review notes, sign-off chain |
| 4 | Reporting on the audit engagement | C | Engagement → Reporting stage — draft/final report documents, review, authorisation |
| 5 | Follow-up reporting (tracking implementation of corrective actions) | C | `/follow-up` — corrective actions with progress %, due dates, overdue flags, Findings lifecycle (Open → Management Response → Under Review → Cleared/Closed) |
| 6 | Scheduling of tasks | C | `/tasks` — task board with assignees, stages, due dates, escalation flags |
| 7 | Managing audit teams | C | Engagement team management — auditors per engagement with roles; Admin → Users, Delegated Preparers |
| 8 | Allocation of resources | C | `/resources` — time entries, expenses, utilisation view per engagement/auditor |

## 7. Functionality — Information Sharing (15 pts)

| # | Tender requirement | Status | Demonstrated in |
|---|---|---|---|
| 1 | Single secured repository/database for audit documentation | C | Database-backed file store — all working papers, templates, reports stored per organisation |
| 2 | Identification & institutional security protocols/passwords | C | Session auth, bcrypt password hashing, login throttling, secure cookies |
| 3 | Segregation — functional access by assigned profiles | C | RBAC roles (Admin, Chief Audit Executive, Member, Regulator, Delegated Preparer) enforced server-side on every action |
| 4 | Export/import documents to/from external systems | C | REST API `/api/v1` + Excel/Word/PDF report exports + bulk import |
| 5 | Audit trails, supervisory reviews and approvals | C | Append-only audit log (Admin → Audit Logs); Prepare → Review → Authorise sign-off on every stage |
| 6 | Built-in automated escalation to supervisors/managers of incomplete or near-due tasks | C | Escalation engine queues notifications to assignee + supervisors/CAE (Admin → Sent Emails outbox) |
| 7 | Work off-site, linked directly to the server | C | Hosted web application + REST API — access from any location over HTTPS |
| 8 | Audit documentation supporting multiple file formats (PDF, MS Office, etc.) | C | File store accepts PDF, Word, Excel, images, e-mail files — metadata + secure download |

## 8. Functionality — Integration with Existing Systems (5 pts)

| # | Tender requirement | Status | Demonstrated in |
|---|---|---|---|
| 1 | Integration capacity with AgriSETA's current ICT systems (e.g. Active Directory) without disruptions | C | Scoped REST API (`/api/v1`) with OpenAPI 3.0 spec and interactive Swagger docs (`/api/docs`); `POST /api/v1/users/sync` provisions users from an AD/Entra ID export with group→role mapping. Directory connectivity is configured with AgriSETA ICT during implementation — no disruption, no custom development. |

## 9. Functionality — Data Analytics (10 pts)

| # | Tender requirement | Status | Demonstrated in |
|---|---|---|---|
| 1 | Integrated analytics | C | Dashboard — live engagement/finding/task/risk analytics from operational data |
| 2 | Generate reports and dashboards | C | `/reports` — findings, follow-up, resource and risk reports exportable to Excel/Word/PDF; `/api/v1/reports/summary` feeds external BI (Power BI steps in API docs) |

## 10. Functionality — Infrastructure (10 pts)

| # | Tender requirement | Status | Evidence |
|---|---|---|---|
| 1 | Cloud hosting environment | C | Deployable to Azure/AWS/Supabase cloud; containerised Next.js architecture |
| 2 | Runs on Windows Server 2022 or later | C | Node.js runtime — supported on Windows Server 2022; also Linux containers |
| 3 | Persistent data in SQL Server 2022 / MySQL 8.3 / PostgreSQL 16 | C | PostgreSQL 16 supported (production DDL included); SQL Server/MySQL via ORM configuration |
| 4 | Data tier on a separate VM from presentation/logic tier | C | Application tier connects to remote DB host via `DATABASE_URL` — standard two-tier deployment |
| 5 | Daily data backups + weekly and monthly reports | C | `scripts/backup.ps1` scheduled daily backup; backup reports via platform reporting |
| 6 | Backup retention for the 12-month contract duration | P | Retention policy configured at deployment (12-month rotation) |

## 11. Scope of Work (a–p)

| # | Deliverable | Status | Evidence |
|---|---|---|---|
| a | Fully functional internal audit software | C | Live system — Phase 3 demonstration |
| b | User manuals and training materials | D | Section [x]; in-app API documentation as reference model |
| c | Training & development for current/future staff | D | Training plan, Section [x] |
| d | Technical support and maintenance plan | D | Section [x]: support SLA |
| e | Documentation of customisation and integration processes | D | API docs `/api/docs`, OpenAPI spec; integration guide Section [x] |
| f | Customisation of audit methodology, templates, reports | C/D | Template engines in system + 3–6 month customisation plan |
| g | Scheduling — manage audit teams and allocate resources | C | Tasks, team management, resource allocation |
| h | Reporting on IA resources incl. time and expenses | C | Resource module — time entries & expenses per engagement |
| i | Audit documentation with working-paper cross-referencing | C | WP Ref field on audit programme items; file references on findings/documents |
| j | Multiple file formats (PDF, MS Office, e-mail) | C | Stored-file repository, format-agnostic |
| k | Information sharing | C | Section 7 above |
| l | IA reporting & tracking of findings (audit database) | C | Findings register with lifecycle + corrective-action tracking |
| m | Dashboard reporting | C | Executive dashboard — portfolio, overdue, risk posture |
| n | Data analytics | C | Section 9 above |
| o | Technology road-map / post-implementation support | D | Section [x]: roadmap & continuous-improvement plan |
| p | Training for minimum 4 users | D | Training plan covers [x] users — Section [x] |

## 12. Conduct of the Work (1–6)

| # | Requirement | Status |
|---|---|---|
| 1 | Supply and implement software tailored to AgriSETA's needs | C/D — customisation plan |
| 2 | Integrate risk management informing the risk assessment | C — risk register feeds audit plan |
| 3 | Train internal audit staff | D — training plan + trainer CVs |
| 4 | 3 years ongoing technical support & maintenance | D — support/maintenance plan |
| 5 | Seamless integration with existing systems | C — REST API + directory sync |
| 6 | Customise to AgriSETA's methodology & reporting requirements | C/D — template/report engines + customisation plan |

---

## Notes for the bidder (remove before submission)

1. **The OEM letter is disqualifying** — if you are the software owner, state so
   explicitly and provide a manufacturer/ownership declaration on letterhead.
2. **Fill every [x]** — annexure numbers, section numbers, letter count, user count.
3. Reference letters must each have: letterhead, signature, description of services,
   contact person, project duration, date within 5 years.
4. CVs need certified copies of qualifications (certification ≤6 months old).
5. Phase 3 is a live demonstration — this matrix's "Demonstrated in" column is your
   demo script; rehearse clicking through every C row.
