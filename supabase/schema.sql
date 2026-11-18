-- =====================================================================
-- POLARIS INTERNAL AUDIT — COMPLETE Supabase / PostgreSQL schema
-- Generated from the FULL app schema (prisma/schema.prisma — 50 tables)
--
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Notes:
--   * Table/column names match the app's @@map names exactly — the
--     existing Prisma client can point at this DB unchanged.
--   * "user" is quoted throughout (reserved word in Postgres). In
--     Supabase it lives in the public schema — no clash with auth.users.
--   * TEXT ids default to gen_random_uuid() for manual inserts; the app
--     supplies its own ulid() ids on write, which remains valid.
--   * updated_at is maintained by set_updated_at() triggers (bottom).
-- =====================================================================

create extension if not exists pgcrypto;

-- CreateTable
CREATE TABLE "annual_audit_plan_period" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "description" TEXT,
    "period_type" TEXT,
    "status" TEXT DEFAULT 'OPEN',
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "annual_audit_plan_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_audit_plan" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "description" TEXT,
    "period_id" TEXT,
    "prepared_by_id" TEXT,
    "prepared_date" TIMESTAMPTZ,
    "prepared_on_behalf_of_user_id" TEXT,
    "authorised_by_id" TEXT,
    "authorised_date" TIMESTAMPTZ,
    "status" TEXT DEFAULT 'DRAFT',
    "committee_signed_by" TEXT,
    "committee_signed_date" TIMESTAMPTZ,
    "revision_reason" TEXT,
    "version_no" INTEGER NOT NULL DEFAULT 1,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "annual_audit_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guiding_document" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "description" TEXT,
    "category" TEXT,
    "version" TEXT,
    "version_no" INTEGER NOT NULL DEFAULT 1,
    "effective_date" TIMESTAMPTZ,
    "review_date" TIMESTAMPTZ,
    "approved_by" TEXT,
    "approved_date" TIMESTAMPTZ,
    "view_roles" JSONB,
    "edit_roles" JSONB,
    "engagement_ids" JSONB,
    "text_extract" TEXT,
    "files" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "guiding_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_engagement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "reference" TEXT,
    "engagement_type_id" TEXT,
    "name" TEXT,
    "objectives" TEXT,
    "scope" TEXT,
    "location" TEXT,
    "assigned_senior_auditor_id" TEXT,
    "planned_start_date" TIMESTAMPTZ,
    "planned_end_date" TIMESTAMPTZ,
    "planned_budget" DECIMAL(65,30),
    "actual_start_date" TIMESTAMPTZ,
    "actual_end_date" TIMESTAMPTZ,
    "actual_budget" DECIMAL(65,30),
    "planned_hours" DECIMAL(65,30),
    "quarter" TEXT,
    "status" TEXT DEFAULT 'PLANNED',
    "lead_user_id" TEXT,
    "risk_id" TEXT,
    "prepared_by_id" TEXT,
    "prepared_date" TIMESTAMPTZ,
    "authorised_by_id" TEXT,
    "authorised_date" TIMESTAMPTZ,
    "annual_audit_plan_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "planned_engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_program_item_review_note" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_audit_program_item_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "audit_program_item_review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_audit_program_item" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "risk_reference" TEXT,
    "risk" TEXT,
    "audit_objective" TEXT,
    "audit_procedure" TEXT,
    "wp_ref" TEXT,
    "engagement_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMPTZ,
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "engagement_audit_program_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "declaration_section" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "custom_name" TEXT,
    "description" TEXT,
    "prescribed" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "declaration_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "declaration" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "declaration_text" TEXT,
    "custom_text" TEXT,
    "prescribed" BOOLEAN NOT NULL DEFAULT false,
    "declaration_section_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_auditor_declaration" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "confirmation_date" TIMESTAMPTZ,
    "signed_text" text,
    "status" text default 'SIGNED',
    "conflict_reason" text,
    "reviewed_by_user_id" text,
    "review_comment" text,
    "reviewed_at" timestamptz,
    "signed_at" timestamptz,
    "declared_year" integer,
    "signature_image" text,
    "signer_name" text,
    "signer_designation" text,
    "engagement_id" TEXT,
    "engagement_auditor_id" TEXT,
    "declaration_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "engagement_auditor_declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_auditor" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_id" TEXT,
    "user_id" TEXT,
    "position_on_audit" TEXT,
    "qualifications" TEXT,
    "experience" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "engagement_auditor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_type" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "description" TEXT,
    "default_templates" JSONB,
    "default_hours" DECIMAL(65,30),
    "default_budget" DECIMAL(65,30),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "engagement_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "annual_audit_plan_id" TEXT,
    "engagement_type_id" TEXT,
    "engagement_name" TEXT,
    "engagement_number" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "engagement_budget" DECIMAL(65,30),
    "engagement_spend" DECIMAL(65,30),
    "objectives" TEXT,
    "scope_text" TEXT,
    "planning_approved_by" TEXT,
    "planning_approved_date" TIMESTAMPTZ,
    "report_template_id" TEXT,
    "report_approved_by" TEXT,
    "report_approved_date" TIMESTAMPTZ,
    "report_status" TEXT,
    "prepared_by_id" TEXT,
    "prepared_date" TIMESTAMPTZ,
    "authorised_by_id" TEXT,
    "authorised_date" TIMESTAMPTZ,
    "planned_engagement_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "planned_hours" DECIMAL(65,30),
    "planned_expense_budget" DECIMAL(65,30),

    CONSTRAINT "engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_fieldwork_document" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "description" TEXT,
    "document_reference" TEXT,
    "name" TEXT,
    "files" JSONB NOT NULL,
    "engagement_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMPTZ,
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMPTZ,
    "engagement_audit_program_item_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "engagement_fieldwork_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fieldwork_document_review_note" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_fieldwork_document_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "fieldwork_document_review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_finding_and_recommendations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_id" TEXT,
    "engagement_fieldwork_document_id" TEXT,
    "detailed_finding" TEXT,
    "root_cause" TEXT,
    "recommendations" TEXT,
    "management_comment" TEXT,
    "status" TEXT DEFAULT 'OPEN',
    "source_risk_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMPTZ,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "engagement_finding_and_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_objective" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "description" TEXT,
    "sort_order" INTEGER,
    "disabled" boolean not null default false,
    "is_sample" boolean not null default true,
    "confirmed_by" text,
    "organization_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "strategic_objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_rating_band" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "label" TEXT,
    "min_score" INTEGER,
    "max_score" INTEGER,
    "color" TEXT,
    "sort_order" INTEGER,
    "organization_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "risk_rating_band_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_planning_document" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "document_reference" TEXT,
    "name" TEXT,
    "description" TEXT,
    "files" JSONB NOT NULL,
    "link" TEXT,
    "type" TEXT,
    "engagement_id" TEXT,
    "planning_document_template_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMPTZ,
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "engagement_planning_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_document_review_note" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_planning_document_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "planning_document_review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_document_template" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "reference" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "section" TEXT,
    "status" TEXT DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "fields_json" JSONB,
    "description" TEXT,
    "logo_file_id" TEXT,
    "approved_by" TEXT,
    "approved_date" TIMESTAMPTZ,
    "engagement_types" JSONB,
    "files" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "planning_document_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_report_document" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "description" TEXT,
    "document_reference" TEXT,
    "name" TEXT,
    "files" JSONB NOT NULL,
    "link" TEXT,
    "type" TEXT,
    "engagement_id" TEXT,
    "report_document_template_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMPTZ,
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "engagement_report_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_document_review_note" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_report_document_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "report_document_review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_document_template" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "reference" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "section" TEXT,
    "status" TEXT DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "fields_json" JSONB,
    "description" TEXT,
    "logo_file_id" TEXT,
    "approved_by" TEXT,
    "approved_date" TIMESTAMPTZ,
    "engagement_types" JSONB,
    "files" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "report_document_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_note" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "note" TEXT,
    "cleared_date" TIMESTAMPTZ,
    "cleared_by_engagement_auditor_id" TEXT,
    "verified_date" TIMESTAMPTZ,
    "verified_by_engagement_auditor_id" TEXT,
    "verified_by_cae_id" TEXT,
    "engagement_id" TEXT,
    "reviewer_engagement_auditor_id" TEXT,
    "reviewer_cae_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "key_hash" TEXT,
    "key_prefix" TEXT,
    "organization_id" TEXT,
    "scopes" JSONB NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "purpose" text,
    "calls_30d" integer not null default 0,
    "calls_30d_since" timestamptz,
    "last_error" text,
    "last_error_at" timestamptz,
    "test_flag_dismissed" boolean not null default false,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" TIMESTAMPTZ,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "schema_name" TEXT,
    "fingerprint" TEXT,
    "ip_address" TEXT,
    "session_id" TEXT,
    "record_label" TEXT,
    "actor_label" TEXT,
    "table_name" TEXT,
    "record_id" TEXT,
    "operation_type" TEXT,
    "user_id" TEXT,
    "timestamp" TIMESTAMPTZ,
    "original_values" JSONB NOT NULL,
    "new_values" JSONB NOT NULL,
    "query" TEXT,
    "organization_id" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clerk_id" TEXT,
    "name" TEXT,
    "address" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "website" TEXT,
    "registration_number" TEXT,
    "logo_file_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sent_email" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "resend_id" TEXT,
    "delivery_status" TEXT,
    "delivery_error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "reason_label" TEXT,
    "level" INTEGER,
    "from_email" TEXT,
    "to_emails" JSONB NOT NULL,
    "bcc_emails" JSONB NOT NULL,
    "cc_emails" JSONB NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "scheduled_at" TIMESTAMPTZ,
    "attachments" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "sent_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "clerk_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "role" TEXT,
    "password_hash" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_file" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "mime_type" TEXT,
    "size" INTEGER,
    "data" BYTEA,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "view_roles" JSONB,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "stored_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "risk_ref" TEXT,
    "auditable_entity" TEXT,
    "risk_description" TEXT,
    "risk_category" TEXT,
    "inherent_likelihood" INTEGER,
    "inherent_impact" INTEGER,
    "inherent_score" INTEGER,
    "existing_controls" TEXT,
    "control_effectiveness" TEXT,
    "residual_likelihood" INTEGER,
    "residual_impact" INTEGER,
    "residual_score" INTEGER,
    "linked_planned_engagement_id" TEXT,
    "risk_owner_id" TEXT,
    "strategic_objective_id" TEXT,
    "source" TEXT DEFAULT 'INTERNAL_AUDIT',
    "status" TEXT DEFAULT 'OPEN',
    "next_review_date" TIMESTAMPTZ,
    "assessed_by_id" TEXT,
    "assessed_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "risk_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalation_rule" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "trigger" TEXT,
    "entity_kind" TEXT,
    "days" INTEGER,
    "notify_owner" BOOLEAN NOT NULL DEFAULT false,
    "notify_supervisor" BOOLEAN NOT NULL DEFAULT false,
    "notify_cae" BOOLEAN NOT NULL DEFAULT false,
    "notify_hod" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER,
    "organization_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "escalation_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corrective_action" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "finding_id" TEXT,
    "action_description" TEXT,
    "source" TEXT DEFAULT 'INTERNAL_AUDIT',
    "ag_reference" TEXT,
    "ag_report_year" INTEGER,
    "management_response" TEXT,
    "management_comments" TEXT,
    "owner_user_id" TEXT,
    "supervisor_user_id" TEXT,
    "due_date" TIMESTAMPTZ,
    "original_due_date" TIMESTAMPTZ,
    "revision_count" INTEGER NOT NULL DEFAULT 0,
    "revision_reason" TEXT,
    "revision_approved_by" TEXT,
    "status" TEXT,
    "progress" INTEGER,
    "evidence" TEXT,
    "implemented_date" TIMESTAMPTZ,
    "verified_by_id" TEXT,
    "verified_date" TIMESTAMPTZ,
    "verification_outcome" TEXT,
    "verification_comments" TEXT,
    "reopened_reason" TEXT,
    "escalation_level" INTEGER NOT NULL DEFAULT 0,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "corrective_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT,
    "description" TEXT,
    "engagement_id" TEXT,
    "stage" TEXT,
    "assignee_user_id" TEXT,
    "start_date" TIMESTAMPTZ,
    "due_date" TIMESTAMPTZ,
    "status" TEXT,
    "priority" TEXT,
    "planned_hours" DECIMAL(65,30),
    "supervisor_user_id" TEXT,
    "review_status" TEXT,
    "reviewed_by" TEXT,
    "reviewed_date" TIMESTAMPTZ,
    "review_comment" TEXT,
    "risk_id" TEXT,
    "escalation_level" INTEGER NOT NULL DEFAULT 0,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "completed_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT,
    "engagement_id" TEXT,
    "work_date" TIMESTAMPTZ,
    "hours" DECIMAL(65,30),
    "description" TEXT,
    "activity_type" TEXT,
    "status" TEXT,
    "task_id" TEXT,
    "timesheet_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "time_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_id" TEXT,
    "user_id" TEXT,
    "description" TEXT,
    "amount" DECIMAL(65,30),
    "expense_date" TIMESTAMPTZ,
    "category" TEXT,
    "status" TEXT,
    "receipt_file_id" TEXT,
    "approved_by" TEXT,
    "approved_date" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_team_member" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_id" TEXT,
    "user_id" TEXT,
    "role" TEXT,
    "planned_hours" DECIMAL(65,30),
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "engagement_team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_request" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT,
    "leave_type" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "status" TEXT,
    "reason" TEXT,
    "approved_by" TEXT,
    "approved_date" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "leave_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_holiday" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "holiday_date" TIMESTAMPTZ,
    "name" TEXT,
    "organization_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "public_holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheet" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT,
    "week_start" TIMESTAMPTZ,
    "status" TEXT,
    "submitted_date" TIMESTAMPTZ,
    "approved_by" TEXT,
    "approved_date" TIMESTAMPTZ,
    "comment" TEXT,
    "organization_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_setting" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "setting_key" TEXT,
    "setting_value" TEXT,
    "organization_id" TEXT,

    CONSTRAINT "resource_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_dependency" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "task_id" TEXT,
    "depends_on_task_id" TEXT,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "task_dependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_template" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_type_id" TEXT,
    "stage" TEXT,
    "title" TEXT,
    "days_offset" INTEGER,
    "default_role" TEXT,
    "planned_hours" DECIMAL(65,30),
    "sort" INTEGER,
    "organization_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "task_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_stage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "sort" INTEGER,
    "organization_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "task_stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_paper" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "engagement_id" TEXT,
    "reference" TEXT,
    "title" TEXT,
    "preparer_id" TEXT,
    "prepared_date" TIMESTAMPTZ,
    "reviewer_id" TEXT,
    "reviewed_date" TIMESTAMPTZ,
    "status" TEXT,
    "review_comment" TEXT,
    "finding_id" TEXT,
    "template_id" TEXT,
    "values_json" JSONB,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "working_paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_version" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "template_id" TEXT NOT NULL,
    "template_kind" TEXT,
    "version" INTEGER,
    "name" TEXT,
    "description" TEXT,
    "fields_json" JSONB,
    "changed_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "approved_by" TEXT,
    "approved_date" TIMESTAMPTZ,

    CONSTRAINT "template_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_acknowledgement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "document_id" TEXT,
    "user_id" TEXT,
    "acked_at" TIMESTAMPTZ,

    CONSTRAINT "document_acknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_version" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "document_id" TEXT,
    "version_no" INTEGER,
    "file_id" TEXT,
    "effective_date" TIMESTAMPTZ,
    "review_date" TIMESTAMPTZ,
    "approved_by" TEXT,
    "approved_date" TIMESTAMPTZ,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "document_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_version" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "plan_id" TEXT,
    "version_no" INTEGER,
    "snapshot" JSONB,
    "revised_by" TEXT,
    "revision_reason" TEXT,
    "created_at" TIMESTAMPTZ,

    CONSTRAINT "plan_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_setting" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "mode" TEXT NOT NULL DEFAULT 'DEMO',
    "sender_name" TEXT,
    "sender_email" TEXT,
    "restrict_to_approved" BOOLEAN NOT NULL DEFAULT true,
    "redirect_all_to" TEXT,
    "approved_addresses" JSONB,
    "last_run_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "organization_id" TEXT,

    CONSTRAINT "email_setting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "annual_audit_plan_period" ADD CONSTRAINT "annual_audit_plan_period_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_audit_plan" ADD CONSTRAINT "annual_audit_plan_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "annual_audit_plan_period"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_audit_plan" ADD CONSTRAINT "annual_audit_plan_prepared_by_id_fkey" FOREIGN KEY ("prepared_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_audit_plan" ADD CONSTRAINT "annual_audit_plan_authorised_by_id_fkey" FOREIGN KEY ("authorised_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_audit_plan" ADD CONSTRAINT "annual_audit_plan_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guiding_document" ADD CONSTRAINT "guiding_document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_engagement" ADD CONSTRAINT "planned_engagement_engagement_type_id_fkey" FOREIGN KEY ("engagement_type_id") REFERENCES "engagement_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_engagement" ADD CONSTRAINT "planned_engagement_assigned_senior_auditor_id_fkey" FOREIGN KEY ("assigned_senior_auditor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_engagement" ADD CONSTRAINT "planned_engagement_prepared_by_id_fkey" FOREIGN KEY ("prepared_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_engagement" ADD CONSTRAINT "planned_engagement_authorised_by_id_fkey" FOREIGN KEY ("authorised_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_engagement" ADD CONSTRAINT "planned_engagement_annual_audit_plan_id_fkey" FOREIGN KEY ("annual_audit_plan_id") REFERENCES "annual_audit_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_engagement" ADD CONSTRAINT "planned_engagement_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_program_item_review_note" ADD CONSTRAINT "audit_program_item_review_note_engagement_audit_program_it_fkey" FOREIGN KEY ("engagement_audit_program_item_id") REFERENCES "engagement_audit_program_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_program_item_review_note" ADD CONSTRAINT "audit_program_item_review_note_review_note_id_fkey" FOREIGN KEY ("review_note_id") REFERENCES "review_note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_program_item_review_note" ADD CONSTRAINT "audit_program_item_review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_audit_program_item" ADD CONSTRAINT "engagement_audit_program_item_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_audit_program_item" ADD CONSTRAINT "engagement_audit_program_item_prepared_by_engagement_audit_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_audit_program_item" ADD CONSTRAINT "engagement_audit_program_item_nominated_reviewer_id_fkey" FOREIGN KEY ("nominated_reviewer_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_audit_program_item" ADD CONSTRAINT "engagement_audit_program_item_authorised_by_engagement_aud_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_audit_program_item" ADD CONSTRAINT "engagement_audit_program_item_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declaration_section" ADD CONSTRAINT "declaration_section_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declaration" ADD CONSTRAINT "declaration_declaration_section_id_fkey" FOREIGN KEY ("declaration_section_id") REFERENCES "declaration_section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declaration" ADD CONSTRAINT "declaration_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_auditor_declaration" ADD CONSTRAINT "engagement_auditor_declaration_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_auditor_declaration" ADD CONSTRAINT "engagement_auditor_declaration_engagement_auditor_id_fkey" FOREIGN KEY ("engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_auditor_declaration" ADD CONSTRAINT "engagement_auditor_declaration_declaration_id_fkey" FOREIGN KEY ("declaration_id") REFERENCES "declaration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_auditor_declaration" ADD CONSTRAINT "engagement_auditor_declaration_authorised_by_engagement_au_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_auditor_declaration" ADD CONSTRAINT "engagement_auditor_declaration_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_auditor" ADD CONSTRAINT "engagement_auditor_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_auditor" ADD CONSTRAINT "engagement_auditor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_auditor" ADD CONSTRAINT "engagement_auditor_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_type" ADD CONSTRAINT "engagement_type_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_annual_audit_plan_id_fkey" FOREIGN KEY ("annual_audit_plan_id") REFERENCES "annual_audit_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_engagement_type_id_fkey" FOREIGN KEY ("engagement_type_id") REFERENCES "engagement_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_prepared_by_id_fkey" FOREIGN KEY ("prepared_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_authorised_by_id_fkey" FOREIGN KEY ("authorised_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_planned_engagement_id_fkey" FOREIGN KEY ("planned_engagement_id") REFERENCES "planned_engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement" ADD CONSTRAINT "engagement_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_fieldwork_document" ADD CONSTRAINT "engagement_fieldwork_document_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_fieldwork_document" ADD CONSTRAINT "engagement_fieldwork_document_prepared_by_engagement_audit_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_fieldwork_document" ADD CONSTRAINT "engagement_fieldwork_document_nominated_reviewer_id_fkey" FOREIGN KEY ("nominated_reviewer_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_fieldwork_document" ADD CONSTRAINT "engagement_fieldwork_document_authorised_by_engagement_aud_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_fieldwork_document" ADD CONSTRAINT "engagement_fieldwork_document_engagement_audit_program_ite_fkey" FOREIGN KEY ("engagement_audit_program_item_id") REFERENCES "engagement_audit_program_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_fieldwork_document" ADD CONSTRAINT "engagement_fieldwork_document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fieldwork_document_review_note" ADD CONSTRAINT "fieldwork_document_review_note_engagement_fieldwork_docume_fkey" FOREIGN KEY ("engagement_fieldwork_document_id") REFERENCES "engagement_fieldwork_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fieldwork_document_review_note" ADD CONSTRAINT "fieldwork_document_review_note_review_note_id_fkey" FOREIGN KEY ("review_note_id") REFERENCES "review_note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fieldwork_document_review_note" ADD CONSTRAINT "fieldwork_document_review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_finding_and_recommendations" ADD CONSTRAINT "engagement_finding_and_recommendations_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_finding_and_recommendations" ADD CONSTRAINT "engagement_finding_and_recommendations_engagement_fieldwor_fkey" FOREIGN KEY ("engagement_fieldwork_document_id") REFERENCES "engagement_fieldwork_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_finding_and_recommendations" ADD CONSTRAINT "engagement_finding_and_recommendations_source_risk_id_fkey" FOREIGN KEY ("source_risk_id") REFERENCES "risk_assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_finding_and_recommendations" ADD CONSTRAINT "engagement_finding_and_recommendations_prepared_by_engagem_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_finding_and_recommendations" ADD CONSTRAINT "engagement_finding_and_recommendations_authorised_by_engag_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_finding_and_recommendations" ADD CONSTRAINT "engagement_finding_and_recommendations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strategic_objective" ADD CONSTRAINT "strategic_objective_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_rating_band" ADD CONSTRAINT "risk_rating_band_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_planning_document" ADD CONSTRAINT "engagement_planning_document_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_planning_document" ADD CONSTRAINT "engagement_planning_document_planning_document_template_id_fkey" FOREIGN KEY ("planning_document_template_id") REFERENCES "planning_document_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_planning_document" ADD CONSTRAINT "engagement_planning_document_prepared_by_engagement_audito_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_planning_document" ADD CONSTRAINT "engagement_planning_document_nominated_reviewer_id_fkey" FOREIGN KEY ("nominated_reviewer_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_planning_document" ADD CONSTRAINT "engagement_planning_document_authorised_by_engagement_audi_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_planning_document" ADD CONSTRAINT "engagement_planning_document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_document_review_note" ADD CONSTRAINT "planning_document_review_note_engagement_planning_document_fkey" FOREIGN KEY ("engagement_planning_document_id") REFERENCES "engagement_planning_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_document_review_note" ADD CONSTRAINT "planning_document_review_note_review_note_id_fkey" FOREIGN KEY ("review_note_id") REFERENCES "review_note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_document_review_note" ADD CONSTRAINT "planning_document_review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_document_template" ADD CONSTRAINT "planning_document_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_report_document" ADD CONSTRAINT "engagement_report_document_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_report_document" ADD CONSTRAINT "engagement_report_document_report_document_template_id_fkey" FOREIGN KEY ("report_document_template_id") REFERENCES "report_document_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_report_document" ADD CONSTRAINT "engagement_report_document_prepared_by_engagement_auditor__fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_report_document" ADD CONSTRAINT "engagement_report_document_nominated_reviewer_id_fkey" FOREIGN KEY ("nominated_reviewer_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_report_document" ADD CONSTRAINT "engagement_report_document_authorised_by_engagement_audito_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_report_document" ADD CONSTRAINT "engagement_report_document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_document_review_note" ADD CONSTRAINT "report_document_review_note_engagement_report_document_id_fkey" FOREIGN KEY ("engagement_report_document_id") REFERENCES "engagement_report_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_document_review_note" ADD CONSTRAINT "report_document_review_note_review_note_id_fkey" FOREIGN KEY ("review_note_id") REFERENCES "review_note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_document_review_note" ADD CONSTRAINT "report_document_review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_document_template" ADD CONSTRAINT "report_document_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_cleared_by_engagement_auditor_id_fkey" FOREIGN KEY ("cleared_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_verified_by_engagement_auditor_id_fkey" FOREIGN KEY ("verified_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_verified_by_cae_id_fkey" FOREIGN KEY ("verified_by_cae_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_reviewer_engagement_auditor_id_fkey" FOREIGN KEY ("reviewer_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_reviewer_cae_id_fkey" FOREIGN KEY ("reviewer_cae_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_note" ADD CONSTRAINT "review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sent_email" ADD CONSTRAINT "sent_email_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessment" ADD CONSTRAINT "risk_assessment_linked_planned_engagement_id_fkey" FOREIGN KEY ("linked_planned_engagement_id") REFERENCES "planned_engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessment" ADD CONSTRAINT "risk_assessment_risk_owner_id_fkey" FOREIGN KEY ("risk_owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessment" ADD CONSTRAINT "risk_assessment_strategic_objective_id_fkey" FOREIGN KEY ("strategic_objective_id") REFERENCES "strategic_objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessment" ADD CONSTRAINT "risk_assessment_assessed_by_id_fkey" FOREIGN KEY ("assessed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalation_rule" ADD CONSTRAINT "escalation_rule_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_action" ADD CONSTRAINT "corrective_action_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "engagement_finding_and_recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_action" ADD CONSTRAINT "corrective_action_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_action" ADD CONSTRAINT "corrective_action_supervisor_user_id_fkey" FOREIGN KEY ("supervisor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "timesheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_team_member" ADD CONSTRAINT "engagement_team_member_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_team_member" ADD CONSTRAINT "engagement_team_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet" ADD CONSTRAINT "timesheet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_paper" ADD CONSTRAINT "working_paper_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Tamper protection: audit_log is add-only -- no UPDATE or DELETE, even by
-- privileged roles. To maintain the table a superuser must first drop these
-- triggers; that action is outside the app and visible in the database log.
CREATE OR REPLACE FUNCTION audit_log_no_modify() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log entries cannot be edited or deleted';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON "audit_log" FOR EACH ROW EXECUTE FUNCTION audit_log_no_modify();
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON "audit_log" FOR EACH ROW EXECUTE FUNCTION audit_log_no_modify();

-- ================= updated_at triggers =================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_annual_audit_plan_period_updated before update on "annual_audit_plan_period" for each row execute function set_updated_at();
create trigger trg_annual_audit_plan_updated before update on "annual_audit_plan" for each row execute function set_updated_at();
create trigger trg_guiding_document_updated before update on "guiding_document" for each row execute function set_updated_at();
create trigger trg_planned_engagement_updated before update on "planned_engagement" for each row execute function set_updated_at();
create trigger trg_audit_program_item_review_note_updated before update on "audit_program_item_review_note" for each row execute function set_updated_at();
create trigger trg_engagement_audit_program_item_updated before update on "engagement_audit_program_item" for each row execute function set_updated_at();
create trigger trg_declaration_section_updated before update on "declaration_section" for each row execute function set_updated_at();
create trigger trg_declaration_updated before update on "declaration" for each row execute function set_updated_at();
create trigger trg_engagement_auditor_declaration_updated before update on "engagement_auditor_declaration" for each row execute function set_updated_at();
create trigger trg_engagement_auditor_updated before update on "engagement_auditor" for each row execute function set_updated_at();
create trigger trg_engagement_type_updated before update on "engagement_type" for each row execute function set_updated_at();
create trigger trg_engagement_updated before update on "engagement" for each row execute function set_updated_at();
create trigger trg_engagement_fieldwork_document_updated before update on "engagement_fieldwork_document" for each row execute function set_updated_at();
create trigger trg_fieldwork_document_review_note_updated before update on "fieldwork_document_review_note" for each row execute function set_updated_at();
create trigger trg_engagement_finding_and_recommendations_updated before update on "engagement_finding_and_recommendations" for each row execute function set_updated_at();
create trigger trg_strategic_objective_updated before update on "strategic_objective" for each row execute function set_updated_at();
create trigger trg_risk_rating_band_updated before update on "risk_rating_band" for each row execute function set_updated_at();
create trigger trg_engagement_planning_document_updated before update on "engagement_planning_document" for each row execute function set_updated_at();
create trigger trg_planning_document_review_note_updated before update on "planning_document_review_note" for each row execute function set_updated_at();
create trigger trg_planning_document_template_updated before update on "planning_document_template" for each row execute function set_updated_at();
create trigger trg_engagement_report_document_updated before update on "engagement_report_document" for each row execute function set_updated_at();
create trigger trg_report_document_review_note_updated before update on "report_document_review_note" for each row execute function set_updated_at();
create trigger trg_report_document_template_updated before update on "report_document_template" for each row execute function set_updated_at();
create trigger trg_review_note_updated before update on "review_note" for each row execute function set_updated_at();
create trigger trg_api_key_updated before update on "api_key" for each row execute function set_updated_at();
create trigger trg_audit_log_updated before update on "audit_log" for each row execute function set_updated_at();
create trigger trg_organization_updated before update on "organization" for each row execute function set_updated_at();
create trigger trg_sent_email_updated before update on "sent_email" for each row execute function set_updated_at();
create trigger trg_user_updated before update on "user" for each row execute function set_updated_at();
create trigger trg_stored_file_updated before update on "stored_file" for each row execute function set_updated_at();
create trigger trg_risk_assessment_updated before update on "risk_assessment" for each row execute function set_updated_at();
create trigger trg_escalation_rule_updated before update on "escalation_rule" for each row execute function set_updated_at();
create trigger trg_corrective_action_updated before update on "corrective_action" for each row execute function set_updated_at();
create trigger trg_task_updated before update on "task" for each row execute function set_updated_at();
create trigger trg_time_entry_updated before update on "time_entry" for each row execute function set_updated_at();
create trigger trg_expense_updated before update on "expense" for each row execute function set_updated_at();
create trigger trg_engagement_team_member_updated before update on "engagement_team_member" for each row execute function set_updated_at();
create trigger trg_leave_request_updated before update on "leave_request" for each row execute function set_updated_at();
create trigger trg_public_holiday_updated before update on "public_holiday" for each row execute function set_updated_at();
create trigger trg_timesheet_updated before update on "timesheet" for each row execute function set_updated_at();
create trigger trg_resource_setting_updated before update on "resource_setting" for each row execute function set_updated_at();
create trigger trg_task_dependency_updated before update on "task_dependency" for each row execute function set_updated_at();
create trigger trg_task_template_updated before update on "task_template" for each row execute function set_updated_at();
create trigger trg_task_stage_updated before update on "task_stage" for each row execute function set_updated_at();
create trigger trg_working_paper_updated before update on "working_paper" for each row execute function set_updated_at();
create trigger trg_template_version_updated before update on "template_version" for each row execute function set_updated_at();
create trigger trg_document_acknowledgement_updated before update on "document_acknowledgement" for each row execute function set_updated_at();
create trigger trg_document_version_updated before update on "document_version" for each row execute function set_updated_at();
create trigger trg_plan_version_updated before update on "plan_version" for each row execute function set_updated_at();
create trigger trg_email_setting_updated before update on "email_setting" for each row execute function set_updated_at();

-- ===================== ROW LEVEL SECURITY =============================
-- Left DISABLED: the app connects as service role / direct connection.
-- Enable per-table once per-organisation isolation is wired:
--
-- alter table "annual_audit_plan_period" enable row level security;
-- alter table "annual_audit_plan" enable row level security;
-- alter table "guiding_document" enable row level security;
-- alter table "planned_engagement" enable row level security;
-- alter table "audit_program_item_review_note" enable row level security;
-- alter table "engagement_audit_program_item" enable row level security;
-- alter table "declaration_section" enable row level security;
-- alter table "declaration" enable row level security;
-- alter table "engagement_auditor_declaration" enable row level security;
-- alter table "engagement_auditor" enable row level security;
-- alter table "engagement_type" enable row level security;
-- alter table "engagement" enable row level security;
-- alter table "engagement_fieldwork_document" enable row level security;
-- alter table "fieldwork_document_review_note" enable row level security;
-- alter table "engagement_finding_and_recommendations" enable row level security;
-- alter table "strategic_objective" enable row level security;
-- alter table "risk_rating_band" enable row level security;
-- alter table "engagement_planning_document" enable row level security;
-- alter table "planning_document_review_note" enable row level security;
-- alter table "planning_document_template" enable row level security;
-- alter table "engagement_report_document" enable row level security;
-- alter table "report_document_review_note" enable row level security;
-- alter table "report_document_template" enable row level security;
-- alter table "review_note" enable row level security;
-- alter table "api_key" enable row level security;
-- alter table "audit_log" enable row level security;
-- alter table "organization" enable row level security;
-- alter table "sent_email" enable row level security;
-- alter table "user" enable row level security;
-- alter table "stored_file" enable row level security;
-- alter table "risk_assessment" enable row level security;
-- alter table "escalation_rule" enable row level security;
-- alter table "corrective_action" enable row level security;
-- alter table "task" enable row level security;
-- alter table "time_entry" enable row level security;
-- alter table "expense" enable row level security;
-- alter table "engagement_team_member" enable row level security;
-- alter table "leave_request" enable row level security;
-- alter table "public_holiday" enable row level security;
-- alter table "timesheet" enable row level security;
-- alter table "resource_setting" enable row level security;
-- alter table "task_dependency" enable row level security;
-- alter table "task_template" enable row level security;
-- alter table "task_stage" enable row level security;
-- alter table "working_paper" enable row level security;
-- alter table "template_version" enable row level security;
-- alter table "document_acknowledgement" enable row level security;
-- alter table "document_version" enable row level security;
-- alter table "plan_version" enable row level security;
-- alter table "email_setting" enable row level security;


-- One open financial year at a time per organization
CREATE UNIQUE INDEX "one_open_financial_year" ON "annual_audit_plan_period" ("organization_id") WHERE "period_type" = 'FY' AND "status" = 'OPEN' AND "deleted" = false;


-- CreateTable
CREATE TABLE "delegation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "delegate_user_id" TEXT,
    "principal_user_id" TEXT,
    "scope_kind" TEXT,
    "engagement_id" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "status" TEXT DEFAULT 'ACTIVE',
    "reason" TEXT,
    "revoked_by_user_id" TEXT,
    "revoked_at" TIMESTAMPTZ,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "delegation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "annual_audit_plan" ADD CONSTRAINT "annual_audit_plan_prepared_on_behalf_of_user_id_fkey" FOREIGN KEY ("prepared_on_behalf_of_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "delegation" ADD CONSTRAINT "delegation_delegate_user_id_fkey" FOREIGN KEY ("delegate_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "delegation" ADD CONSTRAINT "delegation_principal_user_id_fkey" FOREIGN KEY ("principal_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "delegation" ADD CONSTRAINT "delegation_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "delegation" ADD CONSTRAINT "delegation_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "delegation" ADD CONSTRAINT "delegation_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
