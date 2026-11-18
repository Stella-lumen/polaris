-- CreateTable
CREATE TABLE "annual_audit_plan_period" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "description" TEXT,
    "period_type" TEXT,
    "status" TEXT DEFAULT 'OPEN',
    "start_date" DATETIME,
    "end_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "annual_audit_plan_period_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "annual_audit_plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "description" TEXT,
    "period_id" TEXT,
    "prepared_by_id" TEXT,
    "prepared_date" DATETIME,
    "authorised_by_id" TEXT,
    "authorised_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "annual_audit_plan_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "annual_audit_plan_period" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "annual_audit_plan_prepared_by_id_fkey" FOREIGN KEY ("prepared_by_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "annual_audit_plan_authorised_by_id_fkey" FOREIGN KEY ("authorised_by_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "annual_audit_plan_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guiding_document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "description" TEXT,
    "files" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "guiding_document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "planned_engagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT,
    "engagement_type_id" TEXT,
    "name" TEXT,
    "objectives" TEXT,
    "scope" TEXT,
    "location" TEXT,
    "assigned_senior_auditor_id" TEXT,
    "planned_start_date" DATETIME,
    "planned_end_date" DATETIME,
    "planned_budget" DECIMAL,
    "actual_start_date" DATETIME,
    "actual_end_date" DATETIME,
    "actual_budget" DECIMAL,
    "prepared_by_id" TEXT,
    "prepared_date" DATETIME,
    "authorised_by_id" TEXT,
    "authorised_date" DATETIME,
    "annual_audit_plan_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "planned_engagement_engagement_type_id_fkey" FOREIGN KEY ("engagement_type_id") REFERENCES "engagement_type" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "planned_engagement_assigned_senior_auditor_id_fkey" FOREIGN KEY ("assigned_senior_auditor_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "planned_engagement_prepared_by_id_fkey" FOREIGN KEY ("prepared_by_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "planned_engagement_authorised_by_id_fkey" FOREIGN KEY ("authorised_by_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "planned_engagement_annual_audit_plan_id_fkey" FOREIGN KEY ("annual_audit_plan_id") REFERENCES "annual_audit_plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "planned_engagement_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_program_item_review_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_audit_program_item_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "audit_program_item_review_note_engagement_audit_program_item_id_fkey" FOREIGN KEY ("engagement_audit_program_item_id") REFERENCES "engagement_audit_program_item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_program_item_review_note_review_note_id_fkey" FOREIGN KEY ("review_note_id") REFERENCES "review_note" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_program_item_review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "engagement_audit_program_item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "risk_reference" TEXT,
    "risk" TEXT,
    "audit_objective" TEXT,
    "audit_procedure" TEXT,
    "engagement_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" DATETIME,
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "engagement_audit_program_item_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_audit_program_item_prepared_by_engagement_auditor_id_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_audit_program_item_nominated_reviewer_id_fkey" FOREIGN KEY ("nominated_reviewer_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_audit_program_item_authorised_by_engagement_auditor_id_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_audit_program_item_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "declaration_section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "custom_name" TEXT,
    "description" TEXT,
    "prescribed" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "declaration_section_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "declaration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declaration_text" TEXT,
    "custom_text" TEXT,
    "prescribed" BOOLEAN NOT NULL DEFAULT false,
    "declaration_section_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "declaration_declaration_section_id_fkey" FOREIGN KEY ("declaration_section_id") REFERENCES "declaration_section" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "declaration_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "engagement_auditor_declaration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "confirmation_date" DATETIME,
    "signed_text" TEXT,
    "status" TEXT DEFAULT 'SIGNED',
    "conflict_reason" TEXT,
    "reviewed_by_user_id" TEXT,
    "review_comment" TEXT,
    "reviewed_at" DATETIME,
    "signed_at" DATETIME,
    "declared_year" INTEGER,
    "engagement_id" TEXT,
    "engagement_auditor_id" TEXT,
    "declaration_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "engagement_auditor_declaration_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_auditor_declaration_engagement_auditor_id_fkey" FOREIGN KEY ("engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_auditor_declaration_declaration_id_fkey" FOREIGN KEY ("declaration_id") REFERENCES "declaration" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_auditor_declaration_authorised_by_engagement_auditor_id_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_auditor_declaration_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "engagement_auditor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_id" TEXT,
    "user_id" TEXT,
    "position_on_audit" TEXT,
    "qualifications" TEXT,
    "experience" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "engagement_auditor_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_auditor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_auditor_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "engagement_type" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "description" TEXT,
    "default_templates" JSONB,
    "default_hours" DECIMAL,
    "default_budget" DECIMAL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "engagement_type_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "engagement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "annual_audit_plan_id" TEXT,
    "engagement_type_id" TEXT,
    "engagement_name" TEXT,
    "engagement_number" TEXT,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "engagement_budget" DECIMAL,
    "engagement_spend" DECIMAL,
    "prepared_by_id" TEXT,
    "prepared_date" DATETIME,
    "authorised_by_id" TEXT,
    "authorised_date" DATETIME,
    "planned_engagement_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "engagement_annual_audit_plan_id_fkey" FOREIGN KEY ("annual_audit_plan_id") REFERENCES "annual_audit_plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_engagement_type_id_fkey" FOREIGN KEY ("engagement_type_id") REFERENCES "engagement_type" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_prepared_by_id_fkey" FOREIGN KEY ("prepared_by_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_authorised_by_id_fkey" FOREIGN KEY ("authorised_by_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_planned_engagement_id_fkey" FOREIGN KEY ("planned_engagement_id") REFERENCES "planned_engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "engagement_fieldwork_document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "document_reference" TEXT,
    "name" TEXT,
    "files" JSONB NOT NULL,
    "engagement_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" DATETIME,
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" DATETIME,
    "engagement_audit_program_item_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "engagement_fieldwork_document_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_fieldwork_document_prepared_by_engagement_auditor_id_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_fieldwork_document_nominated_reviewer_id_fkey" FOREIGN KEY ("nominated_reviewer_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_fieldwork_document_authorised_by_engagement_auditor_id_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_fieldwork_document_engagement_audit_program_item_id_fkey" FOREIGN KEY ("engagement_audit_program_item_id") REFERENCES "engagement_audit_program_item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_fieldwork_document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fieldwork_document_review_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_fieldwork_document_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "fieldwork_document_review_note_engagement_fieldwork_document_id_fkey" FOREIGN KEY ("engagement_fieldwork_document_id") REFERENCES "engagement_fieldwork_document" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fieldwork_document_review_note_review_note_id_fkey" FOREIGN KEY ("review_note_id") REFERENCES "review_note" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fieldwork_document_review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "engagement_finding_and_recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_id" TEXT,
    "engagement_fieldwork_document_id" TEXT,
    "detailed_finding" TEXT,
    "root_cause" TEXT,
    "recommendations" TEXT,
    "management_comment" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" DATETIME,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "engagement_finding_and_recommendations_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_finding_and_recommendations_engagement_fieldwork_document_id_fkey" FOREIGN KEY ("engagement_fieldwork_document_id") REFERENCES "engagement_fieldwork_document" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_finding_and_recommendations_prepared_by_engagement_auditor_id_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_finding_and_recommendations_authorised_by_engagement_auditor_id_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_finding_and_recommendations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "engagement_planning_document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document_reference" TEXT,
    "name" TEXT,
    "description" TEXT,
    "files" JSONB NOT NULL,
    "link" TEXT,
    "type" TEXT,
    "engagement_id" TEXT,
    "planning_document_template_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" DATETIME,
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "engagement_planning_document_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_planning_document_planning_document_template_id_fkey" FOREIGN KEY ("planning_document_template_id") REFERENCES "planning_document_template" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_planning_document_prepared_by_engagement_auditor_id_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_planning_document_nominated_reviewer_id_fkey" FOREIGN KEY ("nominated_reviewer_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_planning_document_authorised_by_engagement_auditor_id_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_planning_document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "planning_document_review_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_planning_document_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "planning_document_review_note_engagement_planning_document_id_fkey" FOREIGN KEY ("engagement_planning_document_id") REFERENCES "engagement_planning_document" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "planning_document_review_note_review_note_id_fkey" FOREIGN KEY ("review_note_id") REFERENCES "review_note" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "planning_document_review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "planning_document_template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "reference" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "files" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "planning_document_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "engagement_report_document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "document_reference" TEXT,
    "name" TEXT,
    "files" JSONB NOT NULL,
    "link" TEXT,
    "type" TEXT,
    "engagement_id" TEXT,
    "report_document_template_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" DATETIME,
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "engagement_report_document_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_report_document_report_document_template_id_fkey" FOREIGN KEY ("report_document_template_id") REFERENCES "report_document_template" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_report_document_prepared_by_engagement_auditor_id_fkey" FOREIGN KEY ("prepared_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_report_document_nominated_reviewer_id_fkey" FOREIGN KEY ("nominated_reviewer_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_report_document_authorised_by_engagement_auditor_id_fkey" FOREIGN KEY ("authorised_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "engagement_report_document_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_document_review_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_report_document_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "report_document_review_note_engagement_report_document_id_fkey" FOREIGN KEY ("engagement_report_document_id") REFERENCES "engagement_report_document" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "report_document_review_note_review_note_id_fkey" FOREIGN KEY ("review_note_id") REFERENCES "review_note" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "report_document_review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_document_template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "reference" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "files" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "report_document_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "review_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "note" TEXT,
    "cleared_date" DATETIME,
    "cleared_by_engagement_auditor_id" TEXT,
    "verified_date" DATETIME,
    "verified_by_engagement_auditor_id" TEXT,
    "verified_by_cae_id" TEXT,
    "engagement_id" TEXT,
    "reviewer_engagement_auditor_id" TEXT,
    "reviewer_cae_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "review_note_cleared_by_engagement_auditor_id_fkey" FOREIGN KEY ("cleared_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "review_note_verified_by_engagement_auditor_id_fkey" FOREIGN KEY ("verified_by_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "review_note_verified_by_cae_id_fkey" FOREIGN KEY ("verified_by_cae_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "review_note_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "review_note_reviewer_engagement_auditor_id_fkey" FOREIGN KEY ("reviewer_engagement_auditor_id") REFERENCES "engagement_auditor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "review_note_reviewer_cae_id_fkey" FOREIGN KEY ("reviewer_cae_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "review_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "key_hash" TEXT,
    "organization_id" TEXT,
    "scopes" JSONB NOT NULL,
    "expires_at" DATETIME,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" DATETIME,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "api_key_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schema_name" TEXT,
    "table_name" TEXT,
    "record_id" TEXT,
    "operation_type" TEXT,
    "user_id" TEXT,
    "timestamp" DATETIME,
    "original_values" JSONB NOT NULL,
    "new_values" JSONB NOT NULL,
    "query" TEXT,
    "organization_id" TEXT,
    CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerk_id" TEXT,
    "name" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "sent_email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resend_id" TEXT,
    "from_email" TEXT,
    "to_emails" JSONB NOT NULL,
    "bcc_emails" JSONB NOT NULL,
    "cc_emails" JSONB NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "scheduled_at" DATETIME,
    "attachments" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "sent_email_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stored_file" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "mime_type" TEXT,
    "size" INTEGER,
    "data" BLOB,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "risk_assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditable_entity" TEXT,
    "risk_description" TEXT,
    "risk_category" TEXT,
    "inherent_likelihood" INTEGER,
    "inherent_impact" INTEGER,
    "inherent_score" INTEGER,
    "existing_controls" TEXT,
    "residual_likelihood" INTEGER,
    "residual_impact" INTEGER,
    "residual_score" INTEGER,
    "linked_planned_engagement_id" TEXT,
    "assessed_by_id" TEXT,
    "assessed_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "risk_assessment_linked_planned_engagement_id_fkey" FOREIGN KEY ("linked_planned_engagement_id") REFERENCES "planned_engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "risk_assessment_assessed_by_id_fkey" FOREIGN KEY ("assessed_by_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "corrective_action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "finding_id" TEXT,
    "action_description" TEXT,
    "owner_user_id" TEXT,
    "due_date" DATETIME,
    "status" TEXT,
    "progress" INTEGER,
    "evidence" TEXT,
    "implemented_date" DATETIME,
    "verified_by_id" TEXT,
    "verified_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "corrective_action_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "engagement_finding_and_recommendations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "corrective_action_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "description" TEXT,
    "engagement_id" TEXT,
    "stage" TEXT,
    "assignee_user_id" TEXT,
    "due_date" DATETIME,
    "status" TEXT,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "completed_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "task_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "task_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "time_entry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "engagement_id" TEXT,
    "work_date" DATETIME,
    "hours" DECIMAL,
    "description" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "time_entry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "time_entry_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagement_id" TEXT,
    "user_id" TEXT,
    "description" TEXT,
    "amount" DECIMAL,
    "expense_date" DATETIME,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME,
    "updated_by" TEXT,
    "updated_at" DATETIME,
    "deleted_by" TEXT,
    "deleted_at" DATETIME,
    CONSTRAINT "expense_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "engagement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "expense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

