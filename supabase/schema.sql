-- =====================================================================
-- POLARIS INTERNAL AUDIT — Supabase / PostgreSQL schema
-- Mapped from "Recommended Prisma Schema" (Engagement-centric, Excel V1)
-- Date: 17 November 2026
--
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Notes:
--   * IDs are TEXT (Prisma cuid()/uuid strings work as-is). The DB also
--     defaults them via gen_random_uuid() so manual inserts work in the
--     Supabase table editor.
--   * updated_at columns are maintained by a shared trigger (see bottom).
--   * RLS section at the end is commented out — enable when the app is
--     wired for per-org row isolation.
-- =====================================================================

create extension if not exists pgcrypto;

-- ============================ ENUMS ===================================

create type engagement_status as enum (
  'DRAFT', 'PLANNED', 'IN_PROGRESS', 'REPORTING', 'COMPLETED', 'CANCELLED'
);

create type finding_status as enum (
  'OPEN', 'MANAGEMENT_RESPONSE', 'UNDER_REVIEW', 'CLEARED', 'CLOSED'
);

create type review_status as enum (
  'DRAFT', 'PREPARED', 'UNDER_REVIEW', 'CLEARED', 'AUTHORISED'
);

create type declaration_status as enum (
  'PENDING', 'COMPLETED', 'OVERRIDDEN'
);

create type working_paper_type as enum (
  'EVIDENCE', 'ANALYSIS', 'MEMO', 'CORRESPONDENCE', 'OTHER'
);

-- ============================ CORE ====================================

create table organization (
  id         text primary key default gen_random_uuid()::text,
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_user (
  id              text primary key default gen_random_uuid()::text,
  organization_id text not null references organization(id) on delete cascade,
  user_id         text not null,            -- Clerk user id
  role            text not null,            -- ADMIN | CAE | SENIOR | AUDITOR | REVIEWER
  unique (organization_id, user_id)
);

-- ========================= ENGAGEMENT =================================

create table engagement (
  id                text primary key default gen_random_uuid()::text,
  organization_id   text not null references organization(id),
  name              text not null,
  number            text not null,
  type              text not null,          -- Financial | Operational | Compliance | IT Audit
  status            engagement_status not null default 'DRAFT',
  start_date        timestamptz,
  end_date          timestamptz,
  budget            numeric,
  spend             numeric default 0,
  auditor_in_charge text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index idx_engagement_org_status on engagement (organization_id, status);
create index idx_engagement_number on engagement (number);

create table engagement_team_member (
  id              text primary key default gen_random_uuid()::text,
  engagement_id   text not null references engagement(id) on delete cascade,
  user_id         text not null,
  name            text not null,
  position        text not null,            -- Auditor in Charge | Senior | Junior | Reviewer
  qualifications  text,
  experience_years int
);

-- ========================= INDEPENDENCE ===============================

create table independence_declaration (
  id                      text primary key default gen_random_uuid()::text,
  engagement_id           text not null references engagement(id) on delete cascade,
  user_id                 text not null,
  auditor_name            text not null,
  status                  declaration_status not null default 'PENDING',
  -- checklist answers (mirrors Excel Conflicts sheet)
  honesty_truthful        boolean,
  honesty_disclose_facts  boolean,
  ethical_expectations    boolean,
  legal_behaviour         boolean,
  report_violations       boolean,
  maintain_objectivity    boolean,
  no_gifts_or_favours     boolean,
  no_conflict_of_interest boolean,
  disclose_impairment     boolean,
  maintain_confidentiality boolean,
  signed_at               timestamptz,
  override_reason         text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (engagement_id, user_id)
);

-- ========================= PLANNING ===================================

create table planning_document (
  id            text primary key default gen_random_uuid()::text,
  engagement_id text not null references engagement(id) on delete cascade,
  doc_ref       text not null,              -- A1, A2, A3, A4...
  title         text not null,
  status        review_status not null default 'DRAFT',
  prepared_by   text,
  reviewed_by   text,
  authorised_by text,
  file_url      text,
  file_name     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ===================== AUDIT PROGRAMME ================================

create table programme_item (
  id                  text primary key default gen_random_uuid()::text,
  engagement_id       text not null references engagement(id) on delete cascade,
  sequence            int not null,
  risk_ref            text,
  risk_description    text,
  audit_objective     text,
  audit_procedure     text,
  wp_ref              text,                 -- links to working_paper.reference
  status              review_status not null default 'DRAFT',
  prepared_by         text,
  reviewed_by         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_programme_item_eng_seq on programme_item (engagement_id, sequence);

-- ================= FIELDWORK / WORKING PAPERS =========================

create table working_paper (
  id                       text primary key default gen_random_uuid()::text,
  engagement_id            text not null references engagement(id) on delete cascade,
  reference                text not null,   -- B1, B2, B3...
  title                    text not null,
  type                     working_paper_type not null default 'EVIDENCE',
  status                   review_status not null default 'DRAFT',
  prepared_by              text,
  reviewed_by              text,
  authorised_by            text,
  file_url                 text,
  file_name                text,
  file_mime_type           text,
  linked_programme_item_id text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (engagement_id, reference)
);

-- ========================= FINDINGS ===================================

create table finding (
  id                 text primary key default gen_random_uuid()::text,
  engagement_id      text not null references engagement(id) on delete cascade,
  sequence           int not null,
  wp_ref             text,
  detailed_finding   text not null,
  root_cause         text,
  recommendation     text,
  management_comment text,
  status             finding_status not null default 'OPEN',
  prepared_by        text,
  authorised_by      text,
  due_date           timestamptz,
  cleared_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_finding_eng_status on finding (engagement_id, status);

-- ========================= REPORTS ====================================

create table report (
  id            text primary key default gen_random_uuid()::text,
  engagement_id text not null references engagement(id) on delete cascade,
  doc_ref       text not null,              -- D1, D2, D3
  title         text not null,
  status        review_status not null default 'DRAFT',
  prepared_by   text,
  reviewed_by   text,
  authorised_by text,
  file_url      text,
  file_name     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ======================== FOLLOW-UPS ==================================

create table follow_up (
  id                 text primary key default gen_random_uuid()::text,
  engagement_id      text not null references engagement(id) on delete cascade,
  finding_id         text not null references finding(id) on delete cascade,
  action_required    text not null,
  responsible_person text,
  target_date        timestamptz,
  status             finding_status not null default 'OPEN',
  evidence_url       text,
  closed_at          timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ==================== SHARED REVIEW NOTES =============================

create table review_note (
  id                text primary key default gen_random_uuid()::text,
  -- polymorphic: exactly one of these is set
  engagement_id     text references engagement(id) on delete cascade,
  planning_doc_id   text references planning_document(id) on delete cascade,
  programme_item_id text references programme_item(id) on delete cascade,
  working_paper_id  text references working_paper(id) on delete cascade,
  finding_id        text references finding(id) on delete cascade,
  report_id         text references report(id) on delete cascade,
  author_id         text not null,
  author_name       text not null,
  note              text not null,
  cleared           boolean not null default false,
  verified          boolean not null default false,
  cleared_by        text,
  cleared_at        timestamptz,
  created_at        timestamptz not null default now(),
  -- enforce the polymorphic rule: exactly one parent set
  constraint review_note_one_parent check (
    num_nonnulls(
      engagement_id, planning_doc_id, programme_item_id,
      working_paper_id, finding_id, report_id
    ) = 1
  )
);

-- ================= updated_at trigger (doc note #1) ===================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organization_updated  before update on organization            for each row execute function set_updated_at();
create trigger trg_engagement_updated    before update on engagement              for each row execute function set_updated_at();
create trigger trg_independence_updated  before update on independence_declaration for each row execute function set_updated_at();
create trigger trg_planning_doc_updated  before update on planning_document       for each row execute function set_updated_at();
create trigger trg_programme_updated     before update on programme_item          for each row execute function set_updated_at();
create trigger trg_working_paper_updated before update on working_paper           for each row execute function set_updated_at();
create trigger trg_finding_updated       before update on finding                 for each row execute function set_updated_at();
create trigger trg_report_updated        before update on report                  for each row execute function set_updated_at();
create trigger trg_follow_up_updated     before update on follow_up               for each row execute function set_updated_at();

-- ===================== ROW LEVEL SECURITY =============================
-- Disabled by default so the app (service role / direct connection) just
-- works. When you wire per-org isolation, uncomment and write policies:
--
-- alter table organization              enable row level security;
-- alter table organization_user         enable row level security;
-- alter table engagement                enable row level security;
-- alter table engagement_team_member    enable row level security;
-- alter table independence_declaration  enable row level security;
-- alter table planning_document         enable row level security;
-- alter table programme_item            enable row level security;
-- alter table working_paper             enable row level security;
-- alter table finding                   enable row level security;
-- alter table report                    enable row level security;
-- alter table follow_up                 enable row level security;
-- alter table review_note               enable row level security;
