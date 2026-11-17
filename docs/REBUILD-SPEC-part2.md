## Routes

```
/                         Clerk sign-in gate (SignIn, withSignUp:false, hash routing)
/dashboard                  Stats cards + Recharts; NOTE: "Recent Activity" is mock data in original
/annual-audit-plan          AG Grid; /add; /[aap_id] detail (plans contain planned engagements)
/guiding-documents          AG Grid; ?id=add|<ulid> pattern
/templates/{planning,reporting}  Template grids (A-series planning refs, D-series report refs)
/engagements                AG Grid: name/number/type/dates/budget/spend; /add; Export/Import/AI Analysis btns
/engagements/[engagement_id]          Master data form (= add form)
/engagements/[engagement_id]/dashboard        5-stage checklist w/ PENDING counts
/engagements/[engagement_id]/auditor-declarations   Stage 1: independence declarations (confirm + authorise)
/engagements/[engagement_id]/planning               Stage 2: planning docs (A-refs, template-driven)
/engagements/[engagement_id]/audit-program          Stage 3: program items (R-refs: risk/objective/procedure)
/engagements/[engagement_id]/fieldwork              Stage 4: fieldwork docs (B-refs) + findings
/engagements/[engagement_id]/reporting              Stage 5: report docs (D-refs)
/admin/users              User grid + create/toggle (roles: org:* Clerk roles)
/admin/engagement-types   name/description/disabled
/admin/periods            AAP periods (name/desc/dates)
/admin/declarations       Declaration sections + declarations (prescribed flag, custom_text)
/admin/delegated-preparers  userId + isAdd flag
/admin/audit-logs         Audit trail grid (expandable rows, old/new values)
/admin/organizations      Dead nav link — no page (implement or drop)
```

## Grid columns (all pages)

Annual Audit Plan: Name, Period(period.name), Start/End dates, Prepared By/Date, Authorised By/Date
AAP detail + planned engagements: Reference, Name, Engagement Type, Objectives, Scope, Location, Assigned Senior Auditor, Planned Start/End/Budget, Actual Start/End/Budget
Engagements: Name(engagement_name), Number(engagement_number), Type(engagement_type.name), Start/End Date, Budget(engagement_budget), Spend(engagement_spend), Audit Team, Auditor in Charge
Planning/Report templates: Reference, Name, Required, Files
Audit program: Risk Reference, Risk, Audit Objective, Audit Procedure, Fieldwork Document Reference
Docs (planning/fieldwork/report): Document Reference, Name, Description, Type(DOCUMENT|APP_LINK), Files/Link, Prepared By/Date, Authorised By/Date
Declarations: Section/Declaration, Declaration, Prescribed, Confirmed
Users: First/Last Name, Email, Role, Disabled (+ Disable toggle btn)
Audit logs: ID, Timestamp, Operation(operation_type), Table(table_name), User(user_email); expandable → original_values/new_values/query
Delegated preparers: userId, isAdd

## Roles (Clerk org roles)

org:sl_admin, org:stella_lumen (vendor side) · org:admin, org:chief_audit_executive (CAE), org:member, org:delegated_preparer (client side)
Grids show labels: AppAdmin, Chief Audit Executive, Regulator, Member, (blank)
EngagementAuditorRole: ADMIN | SENIOR_AUDITOR | AUDITOR | OUTSOURCED_PARTY
DocumentType: DOCUMENT | APP_LINK
Trial watermark: "For Trial Use Only" (TRIAL constant present)

## Document reference taxonomy (from zod regexes)

- A\d+      planning template/doc refs. Reserved: A1-A3 templates; **A4 = Audit Program** (auto-created)
- B\d+(\.\d+)?  fieldwork document refs (dotted sub-refs allowed — groups)
- D\d+      report doc refs. Reserved: **D1 = Schedule of Findings & Recommendations**; D2/D3 reserved
- R\d+      audit-program risk refs
- Engagement "reference" = free [A-Z0-9]+ uppercase

## Workflow invariants (schema-derived)

1. Every entity: organization_id tenancy, disabled flag, soft-delete (deleted + deleted_by/at), created/updated_by/at
2. Sign-off chain on plans/engagements/docs/program items/findings:
   prepared_by(_engagement_auditor)_id + prepared_date → nominated_reviewer_id → authorised_by(_engagement_auditor)_id + authorised_date
3. ReviewNote lifecycle: note → cleared (cleared_date/by_auditor) → verified (verified_date/by_auditor + verified_by_cae)
4. Declarations: prescribed sections/declarations + custom; auditor confirms (confirmation_date) then authorised
5. Engagement links: planned_engagement_id → PlannedEngagement (plan conversion), annual_audit_plan_id → AAP
6. AuditLog: DB-level trigger trail — schema_name, table_name, record_id, operation_type, user_id, original_values, new_values, query

## Not-yet-known (server-side, not recoverable from client)

- Action implementations/validation rules beyond client zod
- File storage backend (files JSON shape = [{name,url,type}]; uploads via FormData to actions — storage likely Vercel Blob/S3/db)
- Email templates (SentEmail stores rendered subject/body; Resend resend_id)
- /api/image/optimize impl; AI feature surface (gpt-4o-mini, disabled)
- Import (engagements) format; export* output formats (xlsx via SheetJS client-side probable)

## Build notes

- Login page: centered logo + <SignIn withSignUp={false} routing="hash"/> in Card; ClerkProvider+ThemeProvider in root layout; fonts: 2× next/font woff2
- Engagement [id] page = master data form; "add" is same page with engagement_id="add"
- guiding-documents & templates use ?id= query pattern not route params
- audit-logs fetched via getAuditLogs action (not RSC)
- invalidateCacheAction called after mutations (revalidatePath)
