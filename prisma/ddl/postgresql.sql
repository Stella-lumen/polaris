-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "annual_audit_plan_period" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "annual_audit_plan_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_audit_plan" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "period_id" TEXT,
    "prepared_by_id" TEXT,
    "prepared_date" TIMESTAMP(3),
    "authorised_by_id" TEXT,
    "authorised_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "annual_audit_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guiding_document" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "files" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "guiding_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_engagement" (
    "id" TEXT NOT NULL,
    "reference" TEXT,
    "engagement_type_id" TEXT,
    "name" TEXT,
    "objectives" TEXT,
    "scope" TEXT,
    "location" TEXT,
    "assigned_senior_auditor_id" TEXT,
    "planned_start_date" TIMESTAMP(3),
    "planned_end_date" TIMESTAMP(3),
    "planned_budget" DECIMAL(65,30),
    "actual_start_date" TIMESTAMP(3),
    "actual_end_date" TIMESTAMP(3),
    "actual_budget" DECIMAL(65,30),
    "prepared_by_id" TEXT,
    "prepared_date" TIMESTAMP(3),
    "authorised_by_id" TEXT,
    "authorised_date" TIMESTAMP(3),
    "annual_audit_plan_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "planned_engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_program_item_review_note" (
    "id" TEXT NOT NULL,
    "engagement_audit_program_item_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "audit_program_item_review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_audit_program_item" (
    "id" TEXT NOT NULL,
    "risk_reference" TEXT,
    "risk" TEXT,
    "audit_objective" TEXT,
    "audit_procedure" TEXT,
    "engagement_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMP(3),
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "engagement_audit_program_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "declaration_section" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "custom_name" TEXT,
    "description" TEXT,
    "prescribed" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "declaration_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "declaration" (
    "id" TEXT NOT NULL,
    "declaration_text" TEXT,
    "custom_text" TEXT,
    "prescribed" BOOLEAN NOT NULL DEFAULT false,
    "declaration_section_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_auditor_declaration" (
    "id" TEXT NOT NULL,
    "confirmation_date" TIMESTAMP(3),
    "engagement_id" TEXT,
    "engagement_auditor_id" TEXT,
    "declaration_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "engagement_auditor_declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_auditor" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT,
    "user_id" TEXT,
    "position_on_audit" TEXT,
    "qualifications" TEXT,
    "experience" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "engagement_auditor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_type" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "engagement_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement" (
    "id" TEXT NOT NULL,
    "annual_audit_plan_id" TEXT,
    "engagement_type_id" TEXT,
    "engagement_name" TEXT,
    "engagement_number" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "engagement_budget" DECIMAL(65,30),
    "engagement_spend" DECIMAL(65,30),
    "prepared_by_id" TEXT,
    "prepared_date" TIMESTAMP(3),
    "authorised_by_id" TEXT,
    "authorised_date" TIMESTAMP(3),
    "planned_engagement_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_fieldwork_document" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "document_reference" TEXT,
    "name" TEXT,
    "files" JSONB NOT NULL,
    "engagement_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMP(3),
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMP(3),
    "engagement_audit_program_item_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "engagement_fieldwork_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fieldwork_document_review_note" (
    "id" TEXT NOT NULL,
    "engagement_fieldwork_document_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "fieldwork_document_review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_finding_and_recommendations" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT,
    "engagement_fieldwork_document_id" TEXT,
    "detailed_finding" TEXT,
    "root_cause" TEXT,
    "recommendations" TEXT,
    "management_comment" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMP(3),
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "engagement_finding_and_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_planning_document" (
    "id" TEXT NOT NULL,
    "document_reference" TEXT,
    "name" TEXT,
    "description" TEXT,
    "files" JSONB NOT NULL,
    "link" TEXT,
    "type" TEXT,
    "engagement_id" TEXT,
    "planning_document_template_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMP(3),
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "engagement_planning_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_document_review_note" (
    "id" TEXT NOT NULL,
    "engagement_planning_document_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "planning_document_review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_document_template" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "reference" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "files" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "planning_document_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_report_document" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "document_reference" TEXT,
    "name" TEXT,
    "files" JSONB NOT NULL,
    "link" TEXT,
    "type" TEXT,
    "engagement_id" TEXT,
    "report_document_template_id" TEXT,
    "prepared_by_engagement_auditor_id" TEXT,
    "prepared_date" TIMESTAMP(3),
    "nominated_reviewer_id" TEXT,
    "authorised_by_engagement_auditor_id" TEXT,
    "authorised_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "engagement_report_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_document_review_note" (
    "id" TEXT NOT NULL,
    "engagement_report_document_id" TEXT,
    "review_note_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "report_document_review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_document_template" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "reference" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "files" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "report_document_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_note" (
    "id" TEXT NOT NULL,
    "note" TEXT,
    "cleared_date" TIMESTAMP(3),
    "cleared_by_engagement_auditor_id" TEXT,
    "verified_date" TIMESTAMP(3),
    "verified_by_engagement_auditor_id" TEXT,
    "verified_by_cae_id" TEXT,
    "engagement_id" TEXT,
    "reviewer_engagement_auditor_id" TEXT,
    "reviewer_cae_id" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "review_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "key_hash" TEXT,
    "organization_id" TEXT,
    "scopes" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3),
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "schema_name" TEXT,
    "table_name" TEXT,
    "record_id" TEXT,
    "operation_type" TEXT,
    "user_id" TEXT,
    "timestamp" TIMESTAMP(3),
    "original_values" JSONB NOT NULL,
    "new_values" JSONB NOT NULL,
    "query" TEXT,
    "organization_id" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT,
    "name" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sent_email" (
    "id" TEXT NOT NULL,
    "resend_id" TEXT,
    "from_email" TEXT,
    "to_emails" JSONB NOT NULL,
    "bcc_emails" JSONB NOT NULL,
    "cc_emails" JSONB NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "attachments" JSONB NOT NULL,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sent_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_file" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "stored_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessment" (
    "id" TEXT NOT NULL,
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
    "assessed_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "risk_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corrective_action" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT,
    "action_description" TEXT,
    "owner_user_id" TEXT,
    "due_date" TIMESTAMP(3),
    "status" TEXT,
    "progress" INTEGER,
    "evidence" TEXT,
    "implemented_date" TIMESTAMP(3),
    "verified_by_id" TEXT,
    "verified_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "corrective_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "engagement_id" TEXT,
    "stage" TEXT,
    "assignee_user_id" TEXT,
    "due_date" TIMESTAMP(3),
    "status" TEXT,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "completed_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entry" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "engagement_id" TEXT,
    "work_date" TIMESTAMP(3),
    "hours" DECIMAL(65,30),
    "description" TEXT,
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "time_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT,
    "user_id" TEXT,
    "description" TEXT,
    "amount" DECIMAL(65,30),
    "expense_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

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

