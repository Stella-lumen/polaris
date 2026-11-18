-- =====================================================================
-- POLARIS INTERNAL AUDIT — COMPLETE Supabase / PostgreSQL schema
-- Generated from the FULL app schema (prisma/schema.prisma — 33 tables)
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

-- CreateSchema

-- CreateTable
CREATE TABLE "annual_audit_plan_period" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "description" TEXT,
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
    "authorised_by_id" TEXT,
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

    CONSTRAINT "annual_audit_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guiding_document" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "description" TEXT,
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
CREATE TABLE "strategic_objective" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT,
    "description" TEXT,
    "sort_order" INTEGER,
    "organization_id" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ,
    "updated_by" TEXT,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "strategic_objective_pkey" PRIMARY KEY ("id")
);

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
    "due_date" TIMESTAMPTZ,
    "status" TEXT,
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
ALTER TABLE "engagement_finding_and_recommendations" ADD CONSTRAINT "engagement_finding_and_recommendations_prepared_by_engagem_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_finding_and_recommendations" ADD CONSTRAINT "engagement_finding_and_recommendations_authorised_by_engag_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_finding_and_recommendations" ADD CONSTRAINT "engagement_finding_and_recommendations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "risk_assessment" ADD CONSTRAINT "risk_assessment_assessed_by_id_fkey" FOREIGN KEY ("assessed_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_action" ADD CONSTRAINT "corrective_action_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "engagement_finding_and_recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_action" ADD CONSTRAINT "corrective_action_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


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
create trigger trg_corrective_action_updated before update on "corrective_action" for each row execute function set_updated_at();
create trigger trg_task_updated before update on "task" for each row execute function set_updated_at();
create trigger trg_time_entry_updated before update on "time_entry" for each row execute function set_updated_at();
create trigger trg_expense_updated before update on "expense" for each row execute function set_updated_at();

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
-- alter table "corrective_action" enable row level security;
-- alter table "task" enable row level security;
-- alter table "time_entry" enable row level security;
-- alter table "expense" enable row level security;

-- =====================================================================
-- INDEXES
-- Postgres does NOT auto-index foreign key columns. Without these, joins
-- and ON DELETE checks do full table scans as data grows.
-- =====================================================================

-- Uniqueness (login identity + API key lookup)
create unique index if not exists "user_email_lower_key" on "user" (lower("email")) where "email" is not null;
create unique index if not exists "api_key_key_hash_key" on "api_key" ("key_hash") where "key_hash" is not null;

-- One index per foreign key column
create index if not exists "annual_audit_plan_authorised_by_id_idx" on "annual_audit_plan" ("authorised_by_id");
create index if not exists "annual_audit_plan_organization_id_idx" on "annual_audit_plan" ("organization_id");
create index if not exists "annual_audit_plan_period_id_idx" on "annual_audit_plan" ("period_id");
create index if not exists "annual_audit_plan_prepared_by_id_idx" on "annual_audit_plan" ("prepared_by_id");
create index if not exists "annual_audit_plan_period_organization_id_idx" on "annual_audit_plan_period" ("organization_id");
create index if not exists "api_key_organization_id_idx" on "api_key" ("organization_id");
create index if not exists "audit_log_organization_id_idx" on "audit_log" ("organization_id");
create index if not exists "audit_log_user_id_idx" on "audit_log" ("user_id");
create index if not exists "audit_program_item_review_note_engagement_audit_program_item_id_idx" on "audit_program_item_review_note" ("engagement_audit_program_item_id");
create index if not exists "audit_program_item_review_note_organization_id_idx" on "audit_program_item_review_note" ("organization_id");
create index if not exists "audit_program_item_review_note_review_note_id_idx" on "audit_program_item_review_note" ("review_note_id");
create index if not exists "corrective_action_finding_id_idx" on "corrective_action" ("finding_id");
create index if not exists "corrective_action_owner_user_id_idx" on "corrective_action" ("owner_user_id");
create index if not exists "declaration_declaration_section_id_idx" on "declaration" ("declaration_section_id");
create index if not exists "declaration_organization_id_idx" on "declaration" ("organization_id");
create index if not exists "declaration_section_organization_id_idx" on "declaration_section" ("organization_id");
create index if not exists "engagement_annual_audit_plan_id_idx" on "engagement" ("annual_audit_plan_id");
create index if not exists "engagement_authorised_by_id_idx" on "engagement" ("authorised_by_id");
create index if not exists "engagement_engagement_type_id_idx" on "engagement" ("engagement_type_id");
create index if not exists "engagement_organization_id_idx" on "engagement" ("organization_id");
create index if not exists "engagement_planned_engagement_id_idx" on "engagement" ("planned_engagement_id");
create index if not exists "engagement_prepared_by_id_idx" on "engagement" ("prepared_by_id");
create index if not exists "engagement_audit_program_item_authorised_by_engagement_auditor_id_idx" on "engagement_audit_program_item" ("authorised_by_engagement_auditor_id");
create index if not exists "engagement_audit_program_item_engagement_id_idx" on "engagement_audit_program_item" ("engagement_id");
create index if not exists "engagement_audit_program_item_nominated_reviewer_id_idx" on "engagement_audit_program_item" ("nominated_reviewer_id");
create index if not exists "engagement_audit_program_item_organization_id_idx" on "engagement_audit_program_item" ("organization_id");
create index if not exists "engagement_audit_program_item_prepared_by_engagement_auditor_id_idx" on "engagement_audit_program_item" ("prepared_by_engagement_auditor_id");
create index if not exists "engagement_auditor_engagement_id_idx" on "engagement_auditor" ("engagement_id");
create index if not exists "engagement_auditor_organization_id_idx" on "engagement_auditor" ("organization_id");
create index if not exists "engagement_auditor_user_id_idx" on "engagement_auditor" ("user_id");
create index if not exists "engagement_auditor_declaration_authorised_by_engagement_auditor_id_idx" on "engagement_auditor_declaration" ("authorised_by_engagement_auditor_id");
create index if not exists "engagement_auditor_declaration_declaration_id_idx" on "engagement_auditor_declaration" ("declaration_id");
create index if not exists "engagement_auditor_declaration_engagement_auditor_id_idx" on "engagement_auditor_declaration" ("engagement_auditor_id");
create index if not exists "engagement_auditor_declaration_engagement_id_idx" on "engagement_auditor_declaration" ("engagement_id");
create index if not exists "engagement_auditor_declaration_organization_id_idx" on "engagement_auditor_declaration" ("organization_id");
create index if not exists "engagement_fieldwork_document_authorised_by_engagement_auditor_id_idx" on "engagement_fieldwork_document" ("authorised_by_engagement_auditor_id");
create index if not exists "engagement_fieldwork_document_engagement_audit_program_item_id_idx" on "engagement_fieldwork_document" ("engagement_audit_program_item_id");
create index if not exists "engagement_fieldwork_document_engagement_id_idx" on "engagement_fieldwork_document" ("engagement_id");
create index if not exists "engagement_fieldwork_document_nominated_reviewer_id_idx" on "engagement_fieldwork_document" ("nominated_reviewer_id");
create index if not exists "engagement_fieldwork_document_organization_id_idx" on "engagement_fieldwork_document" ("organization_id");
create index if not exists "engagement_fieldwork_document_prepared_by_engagement_auditor_id_idx" on "engagement_fieldwork_document" ("prepared_by_engagement_auditor_id");
create index if not exists "engagement_finding_and_recommendations_authorised_by_engagement_auditor_id_idx" on "engagement_finding_and_recommendations" ("authorised_by_engagement_auditor_id");
create index if not exists "engagement_finding_and_recommendations_engagement_fieldwork_document_id_idx" on "engagement_finding_and_recommendations" ("engagement_fieldwork_document_id");
create index if not exists "engagement_finding_and_recommendations_engagement_id_idx" on "engagement_finding_and_recommendations" ("engagement_id");
create index if not exists "engagement_finding_and_recommendations_organization_id_idx" on "engagement_finding_and_recommendations" ("organization_id");
create index if not exists "engagement_finding_and_recommendations_prepared_by_engagement_auditor_id_idx" on "engagement_finding_and_recommendations" ("prepared_by_engagement_auditor_id");
create index if not exists "engagement_planning_document_authorised_by_engagement_auditor_id_idx" on "engagement_planning_document" ("authorised_by_engagement_auditor_id");
create index if not exists "engagement_planning_document_engagement_id_idx" on "engagement_planning_document" ("engagement_id");
create index if not exists "engagement_planning_document_nominated_reviewer_id_idx" on "engagement_planning_document" ("nominated_reviewer_id");
create index if not exists "engagement_planning_document_organization_id_idx" on "engagement_planning_document" ("organization_id");
create index if not exists "engagement_planning_document_planning_document_template_id_idx" on "engagement_planning_document" ("planning_document_template_id");
create index if not exists "engagement_planning_document_prepared_by_engagement_auditor_id_idx" on "engagement_planning_document" ("prepared_by_engagement_auditor_id");
create index if not exists "engagement_report_document_authorised_by_engagement_auditor_id_idx" on "engagement_report_document" ("authorised_by_engagement_auditor_id");
create index if not exists "engagement_report_document_engagement_id_idx" on "engagement_report_document" ("engagement_id");
create index if not exists "engagement_report_document_nominated_reviewer_id_idx" on "engagement_report_document" ("nominated_reviewer_id");
create index if not exists "engagement_report_document_organization_id_idx" on "engagement_report_document" ("organization_id");
create index if not exists "engagement_report_document_prepared_by_engagement_auditor_id_idx" on "engagement_report_document" ("prepared_by_engagement_auditor_id");
create index if not exists "engagement_report_document_report_document_template_id_idx" on "engagement_report_document" ("report_document_template_id");
create index if not exists "engagement_type_organization_id_idx" on "engagement_type" ("organization_id");
create index if not exists "expense_engagement_id_idx" on "expense" ("engagement_id");
create index if not exists "expense_user_id_idx" on "expense" ("user_id");
create index if not exists "fieldwork_document_review_note_engagement_fieldwork_document_id_idx" on "fieldwork_document_review_note" ("engagement_fieldwork_document_id");
create index if not exists "fieldwork_document_review_note_organization_id_idx" on "fieldwork_document_review_note" ("organization_id");
create index if not exists "fieldwork_document_review_note_review_note_id_idx" on "fieldwork_document_review_note" ("review_note_id");
create index if not exists "guiding_document_organization_id_idx" on "guiding_document" ("organization_id");
create index if not exists "planned_engagement_annual_audit_plan_id_idx" on "planned_engagement" ("annual_audit_plan_id");
create index if not exists "planned_engagement_assigned_senior_auditor_id_idx" on "planned_engagement" ("assigned_senior_auditor_id");
create index if not exists "planned_engagement_authorised_by_id_idx" on "planned_engagement" ("authorised_by_id");
create index if not exists "planned_engagement_engagement_type_id_idx" on "planned_engagement" ("engagement_type_id");
create index if not exists "planned_engagement_organization_id_idx" on "planned_engagement" ("organization_id");
create index if not exists "planned_engagement_prepared_by_id_idx" on "planned_engagement" ("prepared_by_id");
create index if not exists "planning_document_review_note_engagement_planning_document_id_idx" on "planning_document_review_note" ("engagement_planning_document_id");
create index if not exists "planning_document_review_note_organization_id_idx" on "planning_document_review_note" ("organization_id");
create index if not exists "planning_document_review_note_review_note_id_idx" on "planning_document_review_note" ("review_note_id");
create index if not exists "planning_document_template_organization_id_idx" on "planning_document_template" ("organization_id");
create index if not exists "report_document_review_note_engagement_report_document_id_idx" on "report_document_review_note" ("engagement_report_document_id");
create index if not exists "report_document_review_note_organization_id_idx" on "report_document_review_note" ("organization_id");
create index if not exists "report_document_review_note_review_note_id_idx" on "report_document_review_note" ("review_note_id");
create index if not exists "report_document_template_organization_id_idx" on "report_document_template" ("organization_id");
create index if not exists "review_note_cleared_by_engagement_auditor_id_idx" on "review_note" ("cleared_by_engagement_auditor_id");
create index if not exists "review_note_engagement_id_idx" on "review_note" ("engagement_id");
create index if not exists "review_note_organization_id_idx" on "review_note" ("organization_id");
create index if not exists "review_note_reviewer_cae_id_idx" on "review_note" ("reviewer_cae_id");
create index if not exists "review_note_reviewer_engagement_auditor_id_idx" on "review_note" ("reviewer_engagement_auditor_id");
create index if not exists "review_note_verified_by_cae_id_idx" on "review_note" ("verified_by_cae_id");
create index if not exists "review_note_verified_by_engagement_auditor_id_idx" on "review_note" ("verified_by_engagement_auditor_id");
create index if not exists "risk_assessment_assessed_by_id_idx" on "risk_assessment" ("assessed_by_id");
create index if not exists "risk_assessment_linked_planned_engagement_id_idx" on "risk_assessment" ("linked_planned_engagement_id");
create index if not exists "sent_email_organization_id_idx" on "sent_email" ("organization_id");
create index if not exists "task_assignee_user_id_idx" on "task" ("assignee_user_id");
create index if not exists "task_engagement_id_idx" on "task" ("engagement_id");
create index if not exists "time_entry_engagement_id_idx" on "time_entry" ("engagement_id");
create index if not exists "time_entry_user_id_idx" on "time_entry" ("user_id");
create index if not exists "user_organization_id_idx" on "user" ("organization_id");

-- Hot query paths (dashboard escalation, reports, REST API updated_since)
create index if not exists "audit_log_org_timestamp_idx" on "audit_log" ("organization_id", "timestamp" desc);
create index if not exists "audit_log_table_record_idx" on "audit_log" ("table_name", "record_id");
create index if not exists "task_org_status_due_idx" on "task" ("organization_id", "status", "due_date");
create index if not exists "corrective_action_org_status_due_idx" on "corrective_action" ("organization_id", "status", "due_date");
create index if not exists "engagement_org_updated_idx" on "engagement" ("organization_id", "updated_at" desc);
create index if not exists "finding_org_updated_idx" on "engagement_finding_and_recommendations" ("organization_id", "updated_at" desc);

-- task scheduling additions
alter table task add column if not exists start_date timestamptz;
alter table task add column if not exists priority text;
alter table task add column if not exists planned_hours numeric;
alter table task add column if not exists supervisor_user_id text;
alter table task add column if not exists review_status text;
alter table task add column if not exists reviewed_by text;
alter table task add column if not exists reviewed_date timestamptz;
alter table task add column if not exists review_comment text;
alter table task add column if not exists risk_id text;
alter table task add column if not exists escalation_level int default 0;
create table if not exists task_dependency (id text primary key, task_id text, depends_on_task_id text, created_at timestamptz);
create table if not exists task_template (id text primary key, engagement_type_id text, stage text, title text, days_offset int, default_role text, planned_hours numeric, sort int, organization_id text, deleted boolean default false, created_at timestamptz);
create table if not exists task_stage (id text primary key, name text, sort int, organization_id text, deleted boolean default false);

-- Engagement workspace additions (additive)
ALTER TABLE "engagement" ADD COLUMN IF NOT EXISTS "objectives" TEXT;
ALTER TABLE "engagement" ADD COLUMN IF NOT EXISTS "scope_text" TEXT;
ALTER TABLE "engagement" ADD COLUMN IF NOT EXISTS "planning_approved_by" TEXT;
ALTER TABLE "engagement" ADD COLUMN IF NOT EXISTS "planning_approved_date" TIMESTAMPTZ;
ALTER TABLE "engagement" ADD COLUMN IF NOT EXISTS "report_template_id" TEXT;
ALTER TABLE "engagement" ADD COLUMN IF NOT EXISTS "report_approved_by" TEXT;
ALTER TABLE "engagement" ADD COLUMN IF NOT EXISTS "report_approved_date" TIMESTAMPTZ;
ALTER TABLE "engagement" ADD COLUMN IF NOT EXISTS "report_status" TEXT;

CREATE TABLE IF NOT EXISTS "working_paper" (
  "id" TEXT PRIMARY KEY,
  "engagement_id" TEXT REFERENCES "engagement"("id"),
  "reference" TEXT,
  "title" TEXT,
  "preparer_id" TEXT,
  "prepared_date" TIMESTAMPTZ,
  "reviewer_id" TEXT,
  "reviewed_date" TIMESTAMPTZ,
  "status" TEXT,
  "review_comment" TEXT,
  "finding_id" TEXT,
  "organization_id" TEXT,
  "disabled" BOOLEAN DEFAULT false,
  "deleted" BOOLEAN DEFAULT false,
  "created_by" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_by" TEXT,
  "updated_at" TIMESTAMPTZ
);

-- Document template customisation (additive)
ALTER TABLE "planning_document_template" ADD COLUMN IF NOT EXISTS "section" TEXT;
ALTER TABLE "planning_document_template" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'DRAFT';
ALTER TABLE "planning_document_template" ADD COLUMN IF NOT EXISTS "version" INT DEFAULT 1;
ALTER TABLE "planning_document_template" ADD COLUMN IF NOT EXISTS "fields_json" JSONB;
ALTER TABLE "planning_document_template" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "planning_document_template" ADD COLUMN IF NOT EXISTS "logo_file_id" TEXT;
ALTER TABLE "planning_document_template" ADD COLUMN IF NOT EXISTS "approved_by" TEXT;
ALTER TABLE "planning_document_template" ADD COLUMN IF NOT EXISTS "approved_date" TIMESTAMPTZ;
ALTER TABLE "planning_document_template" ADD COLUMN IF NOT EXISTS "engagement_types" JSONB;
ALTER TABLE "report_document_template" ADD COLUMN IF NOT EXISTS "section" TEXT;
ALTER TABLE "report_document_template" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'DRAFT';
ALTER TABLE "report_document_template" ADD COLUMN IF NOT EXISTS "version" INT DEFAULT 1;
ALTER TABLE "report_document_template" ADD COLUMN IF NOT EXISTS "fields_json" JSONB;
ALTER TABLE "report_document_template" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "report_document_template" ADD COLUMN IF NOT EXISTS "logo_file_id" TEXT;
ALTER TABLE "report_document_template" ADD COLUMN IF NOT EXISTS "approved_by" TEXT;
ALTER TABLE "report_document_template" ADD COLUMN IF NOT EXISTS "approved_date" TIMESTAMPTZ;
ALTER TABLE "report_document_template" ADD COLUMN IF NOT EXISTS "engagement_types" JSONB;
ALTER TABLE "working_paper" ADD COLUMN IF NOT EXISTS "template_id" TEXT;
ALTER TABLE "working_paper" ADD COLUMN IF NOT EXISTS "values_json" JSONB;

CREATE TABLE IF NOT EXISTS "template_version" (
  "id" TEXT PRIMARY KEY,
  "template_id" TEXT,
  "template_kind" TEXT,
  "version" INT,
  "name" TEXT,
  "description" TEXT,
  "fields_json" JSONB,
  "changed_by" TEXT,
  "created_at" TIMESTAMPTZ,
  "approved_by" TEXT,
  "approved_date" TIMESTAMPTZ
);

-- Guiding document repository (additive)
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "version" TEXT;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "version_no" INT DEFAULT 1;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "effective_date" TIMESTAMPTZ;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "review_date" TIMESTAMPTZ;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "approved_by" TEXT;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "approved_date" TIMESTAMPTZ;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "view_roles" JSONB;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "edit_roles" JSONB;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "engagement_ids" JSONB;
ALTER TABLE "guiding_document" ADD COLUMN IF NOT EXISTS "text_extract" TEXT;
ALTER TABLE "stored_file" ADD COLUMN IF NOT EXISTS "view_roles" JSONB;

CREATE TABLE IF NOT EXISTS "document_acknowledgement" (
  "id" TEXT PRIMARY KEY, "document_id" TEXT, "user_id" TEXT, "acked_at" TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS "document_version" (
  "id" TEXT PRIMARY KEY, "document_id" TEXT, "version_no" INT, "file_id" TEXT,
  "effective_date" TIMESTAMPTZ, "review_date" TIMESTAMPTZ,
  "approved_by" TEXT, "approved_date" TIMESTAMPTZ, "uploaded_by" TEXT, "created_at" TIMESTAMPTZ
);

-- Risk-based audit plan (additive)
ALTER TABLE "annual_audit_plan" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'DRAFT';
ALTER TABLE "annual_audit_plan" ADD COLUMN IF NOT EXISTS "committee_signed_by" TEXT;
ALTER TABLE "annual_audit_plan" ADD COLUMN IF NOT EXISTS "committee_signed_date" TIMESTAMPTZ;
ALTER TABLE "annual_audit_plan" ADD COLUMN IF NOT EXISTS "revision_reason" TEXT;
ALTER TABLE "annual_audit_plan" ADD COLUMN IF NOT EXISTS "version_no" INT DEFAULT 1;
ALTER TABLE "planned_engagement" ADD COLUMN IF NOT EXISTS "planned_hours" NUMERIC;
ALTER TABLE "planned_engagement" ADD COLUMN IF NOT EXISTS "quarter" TEXT;
ALTER TABLE "planned_engagement" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PLANNED';
ALTER TABLE "planned_engagement" ADD COLUMN IF NOT EXISTS "lead_user_id" TEXT;
ALTER TABLE "planned_engagement" ADD COLUMN IF NOT EXISTS "risk_id" TEXT;

CREATE TABLE IF NOT EXISTS "plan_version" (
  "id" TEXT PRIMARY KEY, "plan_id" TEXT, "version_no" INT, "snapshot" JSONB,
  "revised_by" TEXT, "revision_reason" TEXT, "created_at" TIMESTAMPTZ
);
