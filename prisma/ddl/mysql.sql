-- CreateTable
CREATE TABLE `annual_audit_plan_period` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `period_type` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'OPEN',
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `annual_audit_plan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `period_id` VARCHAR(191) NULL,
    `prepared_by_id` VARCHAR(191) NULL,
    `prepared_date` DATETIME(3) NULL,
    `prepared_on_behalf_of_user_id` VARCHAR(191) NULL,
    `authorised_by_id` VARCHAR(191) NULL,
    `authorised_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'DRAFT',
    `committee_signed_by` VARCHAR(191) NULL,
    `committee_signed_date` DATETIME(3) NULL,
    `revision_reason` VARCHAR(191) NULL,
    `version_no` INTEGER NOT NULL DEFAULT 1,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guiding_document` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `version` VARCHAR(191) NULL,
    `version_no` INTEGER NOT NULL DEFAULT 1,
    `effective_date` DATETIME(3) NULL,
    `review_date` DATETIME(3) NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_date` DATETIME(3) NULL,
    `view_roles` JSON NULL,
    `edit_roles` JSON NULL,
    `engagement_ids` JSON NULL,
    `text_extract` VARCHAR(191) NULL,
    `files` JSON NOT NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planned_engagement` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `engagement_type_id` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `objectives` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `assigned_senior_auditor_id` VARCHAR(191) NULL,
    `planned_start_date` DATETIME(3) NULL,
    `planned_end_date` DATETIME(3) NULL,
    `planned_budget` DECIMAL(65, 30) NULL,
    `actual_start_date` DATETIME(3) NULL,
    `actual_end_date` DATETIME(3) NULL,
    `actual_budget` DECIMAL(65, 30) NULL,
    `planned_hours` DECIMAL(65, 30) NULL,
    `quarter` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'PLANNED',
    `lead_user_id` VARCHAR(191) NULL,
    `risk_id` VARCHAR(191) NULL,
    `prepared_by_id` VARCHAR(191) NULL,
    `prepared_date` DATETIME(3) NULL,
    `authorised_by_id` VARCHAR(191) NULL,
    `authorised_date` DATETIME(3) NULL,
    `annual_audit_plan_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_program_item_review_note` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_audit_program_item_id` VARCHAR(191) NULL,
    `review_note_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement_audit_program_item` (
    `id` VARCHAR(191) NOT NULL,
    `risk_reference` VARCHAR(191) NULL,
    `risk` VARCHAR(191) NULL,
    `audit_objective` VARCHAR(191) NULL,
    `audit_procedure` VARCHAR(191) NULL,
    `wp_ref` VARCHAR(191) NULL,
    `engagement_id` VARCHAR(191) NULL,
    `prepared_by_engagement_auditor_id` VARCHAR(191) NULL,
    `prepared_date` DATETIME(3) NULL,
    `nominated_reviewer_id` VARCHAR(191) NULL,
    `authorised_by_engagement_auditor_id` VARCHAR(191) NULL,
    `authorised_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `declaration_section` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `custom_name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `prescribed` BOOLEAN NOT NULL DEFAULT false,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `declaration` (
    `id` VARCHAR(191) NOT NULL,
    `declaration_text` VARCHAR(191) NULL,
    `custom_text` VARCHAR(191) NULL,
    `prescribed` BOOLEAN NOT NULL DEFAULT false,
    `declaration_section_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement_auditor_declaration` (
    `id` VARCHAR(191) NOT NULL,
    `confirmation_date` DATETIME(3) NULL,
    `signed_text` TEXT NULL,
    `status` VARCHAR(191) NULL DEFAULT 'SIGNED',
    `conflict_reason` TEXT NULL,
    `reviewed_by_user_id` VARCHAR(191) NULL,
    `review_comment` TEXT NULL,
    `reviewed_at` DATETIME(3) NULL,
    `signed_at` DATETIME(3) NULL,
    `declared_year` INT NULL,
    `signature_image` TEXT NULL,
    `signer_name` VARCHAR(191) NULL,
    `signer_designation` VARCHAR(191) NULL,
    `engagement_id` VARCHAR(191) NULL,
    `engagement_auditor_id` VARCHAR(191) NULL,
    `declaration_id` VARCHAR(191) NULL,
    `authorised_by_engagement_auditor_id` VARCHAR(191) NULL,
    `authorised_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement_auditor` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NULL,
    `position_on_audit` VARCHAR(191) NULL,
    `qualifications` VARCHAR(191) NULL,
    `experience` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement_type` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `default_templates` JSON NULL,
    `default_hours` DECIMAL(65,30) NULL,
    `default_budget` DECIMAL(65,30) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement` (
    `id` VARCHAR(191) NOT NULL,
    `annual_audit_plan_id` VARCHAR(191) NULL,
    `engagement_type_id` VARCHAR(191) NULL,
    `engagement_name` VARCHAR(191) NULL,
    `engagement_number` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `engagement_budget` DECIMAL(65, 30) NULL,
    `engagement_spend` DECIMAL(65, 30) NULL,
    `objectives` VARCHAR(191) NULL,
    `scope_text` VARCHAR(191) NULL,
    `planning_approved_by` VARCHAR(191) NULL,
    `planning_approved_date` DATETIME(3) NULL,
    `report_template_id` VARCHAR(191) NULL,
    `report_approved_by` VARCHAR(191) NULL,
    `report_approved_date` DATETIME(3) NULL,
    `report_status` VARCHAR(191) NULL,
    `prepared_by_id` VARCHAR(191) NULL,
    `prepared_date` DATETIME(3) NULL,
    `authorised_by_id` VARCHAR(191) NULL,
    `authorised_date` DATETIME(3) NULL,
    `planned_engagement_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,
    `planned_hours` DECIMAL(65, 30) NULL,
    `planned_expense_budget` DECIMAL(65, 30) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement_fieldwork_document` (
    `id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `document_reference` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `files` JSON NOT NULL,
    `engagement_id` VARCHAR(191) NULL,
    `prepared_by_engagement_auditor_id` VARCHAR(191) NULL,
    `prepared_date` DATETIME(3) NULL,
    `nominated_reviewer_id` VARCHAR(191) NULL,
    `authorised_by_engagement_auditor_id` VARCHAR(191) NULL,
    `authorised_date` DATETIME(3) NULL,
    `engagement_audit_program_item_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fieldwork_document_review_note` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_fieldwork_document_id` VARCHAR(191) NULL,
    `review_note_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement_finding_and_recommendations` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_id` VARCHAR(191) NULL,
    `engagement_fieldwork_document_id` VARCHAR(191) NULL,
    `detailed_finding` VARCHAR(191) NULL,
    `root_cause` VARCHAR(191) NULL,
    `recommendations` VARCHAR(191) NULL,
    `management_comment` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'OPEN',
    `source_risk_id` VARCHAR(191) NULL,
    `prepared_by_engagement_auditor_id` VARCHAR(191) NULL,
    `prepared_date` DATETIME(3) NULL,
    `authorised_by_engagement_auditor_id` VARCHAR(191) NULL,
    `authorised_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `strategic_objective` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `sort_order` INTEGER NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `is_sample` BOOLEAN NOT NULL DEFAULT true,
    `confirmed_by` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_rating_band` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `min_score` INTEGER NULL,
    `max_score` INTEGER NULL,
    `color` VARCHAR(191) NULL,
    `sort_order` INTEGER NULL,
    `meaning` VARCHAR(191) NULL,
    `expected_response` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `is_sample` BOOLEAN NOT NULL DEFAULT false,
    `is_alert_floor` BOOLEAN NOT NULL DEFAULT false,
    `organization_id` VARCHAR(191) NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement_planning_document` (
    `id` VARCHAR(191) NOT NULL,
    `document_reference` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `files` JSON NOT NULL,
    `link` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `engagement_id` VARCHAR(191) NULL,
    `planning_document_template_id` VARCHAR(191) NULL,
    `prepared_by_engagement_auditor_id` VARCHAR(191) NULL,
    `prepared_date` DATETIME(3) NULL,
    `nominated_reviewer_id` VARCHAR(191) NULL,
    `authorised_by_engagement_auditor_id` VARCHAR(191) NULL,
    `authorised_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planning_document_review_note` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_planning_document_id` VARCHAR(191) NULL,
    `review_note_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planning_document_template` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `reference` VARCHAR(191) NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `section` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `fields_json` JSON NULL,
    `description` VARCHAR(191) NULL,
    `logo_file_id` VARCHAR(191) NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_date` DATETIME(3) NULL,
    `engagement_types` JSON NULL,
    `files` JSON NOT NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement_report_document` (
    `id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `document_reference` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `files` JSON NOT NULL,
    `link` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `engagement_id` VARCHAR(191) NULL,
    `report_document_template_id` VARCHAR(191) NULL,
    `prepared_by_engagement_auditor_id` VARCHAR(191) NULL,
    `prepared_date` DATETIME(3) NULL,
    `nominated_reviewer_id` VARCHAR(191) NULL,
    `authorised_by_engagement_auditor_id` VARCHAR(191) NULL,
    `authorised_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_document_review_note` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_report_document_id` VARCHAR(191) NULL,
    `review_note_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_document_template` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `reference` VARCHAR(191) NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `section` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `fields_json` JSON NULL,
    `description` VARCHAR(191) NULL,
    `logo_file_id` VARCHAR(191) NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_date` DATETIME(3) NULL,
    `engagement_types` JSON NULL,
    `files` JSON NOT NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_note` (
    `id` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `cleared_date` DATETIME(3) NULL,
    `cleared_by_engagement_auditor_id` VARCHAR(191) NULL,
    `verified_date` DATETIME(3) NULL,
    `verified_by_engagement_auditor_id` VARCHAR(191) NULL,
    `verified_by_cae_id` VARCHAR(191) NULL,
    `engagement_id` VARCHAR(191) NULL,
    `reviewer_engagement_auditor_id` VARCHAR(191) NULL,
    `reviewer_cae_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_key` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `key_hash` VARCHAR(191) NULL,
    `key_prefix` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `scopes` JSON NOT NULL,
    `expires_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,
    `purpose` VARCHAR(191) NULL,
    `calls_30d` INTEGER NOT NULL DEFAULT 0,
    `calls_30d_since` DATETIME(3) NULL,
    `last_error` VARCHAR(191) NULL,
    `last_error_at` DATETIME(3) NULL,
    `test_flag_dismissed` BOOLEAN NOT NULL DEFAULT false,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `last_used_at` DATETIME(3) NULL,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `schema_name` VARCHAR(191) NULL,
    `fingerprint` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `session_id` VARCHAR(191) NULL,
    `record_label` VARCHAR(191) NULL,
    `actor_label` VARCHAR(191) NULL,
    `table_name` VARCHAR(191) NULL,
    `record_id` VARCHAR(191) NULL,
    `operation_type` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NULL,
    `original_values` JSON NOT NULL,
    `new_values` JSON NOT NULL,
    `query` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization` (
    `id` VARCHAR(191) NOT NULL,
    `clerk_id` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `contact_email` VARCHAR(191) NULL,
    `contact_phone` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `registration_number` VARCHAR(191) NULL,
    `logo_file_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sent_email` (
    `id` VARCHAR(191) NOT NULL,
    `resend_id` VARCHAR(191) NULL,
    `delivery_status` VARCHAR(191) NULL,
    `delivery_error` VARCHAR(191) NULL,
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `entity_type` VARCHAR(191) NULL,
    `entity_id` VARCHAR(191) NULL,
    `reason_label` VARCHAR(191) NULL,
    `level` INTEGER NULL,
    `from_email` VARCHAR(191) NULL,
    `to_emails` JSON NOT NULL,
    `bcc_emails` JSON NOT NULL,
    `cc_emails` JSON NOT NULL,
    `subject` VARCHAR(191) NULL,
    `body` VARCHAR(191) NULL,
    `scheduled_at` DATETIME(3) NULL,
    `attachments` JSON NOT NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `clerk_id` VARCHAR(191) NULL,
    `first_name` VARCHAR(191) NULL,
    `last_name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone_number` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stored_file` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `mime_type` VARCHAR(191) NULL,
    `size` INTEGER NULL,
    `data` LONGBLOB NULL,
    `entity_type` VARCHAR(191) NULL,
    `entity_id` VARCHAR(191) NULL,
    `view_roles` JSON NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_assessment` (
    `id` VARCHAR(191) NOT NULL,
    `risk_ref` VARCHAR(191) NULL,
    `auditable_entity` VARCHAR(191) NULL,
    `risk_description` VARCHAR(191) NULL,
    `risk_category` VARCHAR(191) NULL,
    `inherent_likelihood` INTEGER NULL,
    `inherent_impact` INTEGER NULL,
    `inherent_score` INTEGER NULL,
    `existing_controls` VARCHAR(191) NULL,
    `control_effectiveness` VARCHAR(191) NULL,
    `residual_likelihood` INTEGER NULL,
    `residual_impact` INTEGER NULL,
    `residual_score` INTEGER NULL,
    `linked_planned_engagement_id` VARCHAR(191) NULL,
    `risk_owner_id` VARCHAR(191) NULL,
    `strategic_objective_id` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL DEFAULT 'INTERNAL_AUDIT',
    `status` VARCHAR(191) NULL DEFAULT 'OPEN',
    `next_review_date` DATETIME(3) NULL,
    `assessed_by_id` VARCHAR(191) NULL,
    `assessed_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `escalation_rule` (
    `id` VARCHAR(191) NOT NULL,
    `trigger` VARCHAR(191) NULL,
    `entity_kind` VARCHAR(191) NULL,
    `days` INTEGER NULL,
    `notify_owner` BOOLEAN NOT NULL DEFAULT false,
    `notify_supervisor` BOOLEAN NOT NULL DEFAULT false,
    `notify_cae` BOOLEAN NOT NULL DEFAULT false,
    `notify_hod` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NULL,
    `organization_id` VARCHAR(191) NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `corrective_action` (
    `id` VARCHAR(191) NOT NULL,
    `finding_id` VARCHAR(191) NULL,
    `action_description` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL DEFAULT 'INTERNAL_AUDIT',
    `ag_reference` VARCHAR(191) NULL,
    `ag_report_year` INTEGER NULL,
    `management_response` VARCHAR(191) NULL,
    `management_comments` VARCHAR(191) NULL,
    `owner_user_id` VARCHAR(191) NULL,
    `supervisor_user_id` VARCHAR(191) NULL,
    `due_date` DATETIME(3) NULL,
    `original_due_date` DATETIME(3) NULL,
    `revision_count` INTEGER NOT NULL DEFAULT 0,
    `revision_reason` VARCHAR(191) NULL,
    `revision_approved_by` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `progress` INTEGER NULL,
    `evidence` VARCHAR(191) NULL,
    `implemented_date` DATETIME(3) NULL,
    `verified_by_id` VARCHAR(191) NULL,
    `verified_date` DATETIME(3) NULL,
    `verification_outcome` VARCHAR(191) NULL,
    `verification_comments` VARCHAR(191) NULL,
    `reopened_reason` VARCHAR(191) NULL,
    `escalation_level` INTEGER NOT NULL DEFAULT 0,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `engagement_id` VARCHAR(191) NULL,
    `stage` VARCHAR(191) NULL,
    `assignee_user_id` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NULL,
    `due_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NULL,
    `planned_hours` DECIMAL(65, 30) NULL,
    `supervisor_user_id` VARCHAR(191) NULL,
    `review_status` VARCHAR(191) NULL,
    `reviewed_by` VARCHAR(191) NULL,
    `reviewed_date` DATETIME(3) NULL,
    `review_comment` VARCHAR(191) NULL,
    `risk_id` VARCHAR(191) NULL,
    `escalation_level` INTEGER NOT NULL DEFAULT 0,
    `escalated` BOOLEAN NOT NULL DEFAULT false,
    `completed_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_entry` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `engagement_id` VARCHAR(191) NULL,
    `work_date` DATETIME(3) NULL,
    `hours` DECIMAL(65, 30) NULL,
    `description` VARCHAR(191) NULL,
    `activity_type` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `task_id` VARCHAR(191) NULL,
    `timesheet_id` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expense` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `amount` DECIMAL(65, 30) NULL,
    `expense_date` DATETIME(3) NULL,
    `category` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `receipt_file_id` VARCHAR(191) NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_date` DATETIME(3) NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `engagement_team_member` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `planned_hours` DECIMAL(65, 30) NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_request` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `leave_type` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_date` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `public_holiday` (
    `id` VARCHAR(191) NOT NULL,
    `holiday_date` DATETIME(3) NULL,
    `name` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timesheet` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `week_start` DATETIME(3) NULL,
    `status` VARCHAR(191) NULL,
    `submitted_date` DATETIME(3) NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_date` DATETIME(3) NULL,
    `comment` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resource_setting` (
    `id` VARCHAR(191) NOT NULL,
    `setting_key` VARCHAR(191) NULL,
    `setting_value` VARCHAR(191) NULL,
    `organization_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_dependency` (
    `id` VARCHAR(191) NOT NULL,
    `task_id` VARCHAR(191) NULL,
    `depends_on_task_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_template` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_type_id` VARCHAR(191) NULL,
    `stage` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `days_offset` INTEGER NULL,
    `default_role` VARCHAR(191) NULL,
    `planned_hours` DECIMAL(65, 30) NULL,
    `sort` INTEGER NULL,
    `organization_id` VARCHAR(191) NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_stage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `sort` INTEGER NULL,
    `organization_id` VARCHAR(191) NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `working_paper` (
    `id` VARCHAR(191) NOT NULL,
    `engagement_id` VARCHAR(191) NULL,
    `reference` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `preparer_id` VARCHAR(191) NULL,
    `prepared_date` DATETIME(3) NULL,
    `reviewer_id` VARCHAR(191) NULL,
    `reviewed_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NULL,
    `review_comment` VARCHAR(191) NULL,
    `finding_id` VARCHAR(191) NULL,
    `template_id` VARCHAR(191) NULL,
    `values_json` JSON NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_version` (
    `id` VARCHAR(191) NOT NULL,
    `template_id` VARCHAR(191) NOT NULL,
    `template_kind` VARCHAR(191) NULL,
    `version` INTEGER NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `fields_json` JSON NULL,
    `changed_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_date` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_acknowledgement` (
    `id` VARCHAR(191) NOT NULL,
    `document_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NULL,
    `acked_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_version` (
    `id` VARCHAR(191) NOT NULL,
    `document_id` VARCHAR(191) NULL,
    `version_no` INTEGER NULL,
    `file_id` VARCHAR(191) NULL,
    `effective_date` DATETIME(3) NULL,
    `review_date` DATETIME(3) NULL,
    `approved_by` VARCHAR(191) NULL,
    `approved_date` DATETIME(3) NULL,
    `uploaded_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_version` (
    `id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NULL,
    `version_no` INTEGER NULL,
    `snapshot` JSON NULL,
    `revised_by` VARCHAR(191) NULL,
    `revision_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_setting` (
    `id` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'DEMO',
    `sender_name` VARCHAR(191) NULL,
    `sender_email` VARCHAR(191) NULL,
    `restrict_to_approved` BOOLEAN NOT NULL DEFAULT true,
    `redirect_all_to` VARCHAR(191) NULL,
    `approved_addresses` JSON NULL,
    `last_run_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `annual_audit_plan_period` ADD CONSTRAINT `annual_audit_plan_period_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `annual_audit_plan` ADD CONSTRAINT `annual_audit_plan_period_id_fkey` FOREIGN KEY (`period_id`) REFERENCES `annual_audit_plan_period`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `annual_audit_plan` ADD CONSTRAINT `annual_audit_plan_prepared_by_id_fkey` FOREIGN KEY (`prepared_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `annual_audit_plan` ADD CONSTRAINT `annual_audit_plan_authorised_by_id_fkey` FOREIGN KEY (`authorised_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `annual_audit_plan` ADD CONSTRAINT `annual_audit_plan_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guiding_document` ADD CONSTRAINT `guiding_document_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planned_engagement` ADD CONSTRAINT `planned_engagement_engagement_type_id_fkey` FOREIGN KEY (`engagement_type_id`) REFERENCES `engagement_type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planned_engagement` ADD CONSTRAINT `planned_engagement_assigned_senior_auditor_id_fkey` FOREIGN KEY (`assigned_senior_auditor_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planned_engagement` ADD CONSTRAINT `planned_engagement_prepared_by_id_fkey` FOREIGN KEY (`prepared_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planned_engagement` ADD CONSTRAINT `planned_engagement_authorised_by_id_fkey` FOREIGN KEY (`authorised_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planned_engagement` ADD CONSTRAINT `planned_engagement_annual_audit_plan_id_fkey` FOREIGN KEY (`annual_audit_plan_id`) REFERENCES `annual_audit_plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planned_engagement` ADD CONSTRAINT `planned_engagement_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_program_item_review_note` ADD CONSTRAINT `audit_program_item_review_note_engagement_audit_program_ite_fkey` FOREIGN KEY (`engagement_audit_program_item_id`) REFERENCES `engagement_audit_program_item`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_program_item_review_note` ADD CONSTRAINT `audit_program_item_review_note_review_note_id_fkey` FOREIGN KEY (`review_note_id`) REFERENCES `review_note`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_program_item_review_note` ADD CONSTRAINT `audit_program_item_review_note_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_audit_program_item` ADD CONSTRAINT `engagement_audit_program_item_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_audit_program_item` ADD CONSTRAINT `engagement_audit_program_item_prepared_by_engagement_audito_fkey` FOREIGN KEY (`prepared_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_audit_program_item` ADD CONSTRAINT `engagement_audit_program_item_nominated_reviewer_id_fkey` FOREIGN KEY (`nominated_reviewer_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_audit_program_item` ADD CONSTRAINT `engagement_audit_program_item_authorised_by_engagement_audi_fkey` FOREIGN KEY (`authorised_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_audit_program_item` ADD CONSTRAINT `engagement_audit_program_item_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `declaration_section` ADD CONSTRAINT `declaration_section_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `declaration` ADD CONSTRAINT `declaration_declaration_section_id_fkey` FOREIGN KEY (`declaration_section_id`) REFERENCES `declaration_section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `declaration` ADD CONSTRAINT `declaration_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_auditor_declaration` ADD CONSTRAINT `engagement_auditor_declaration_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_auditor_declaration` ADD CONSTRAINT `engagement_auditor_declaration_engagement_auditor_id_fkey` FOREIGN KEY (`engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_auditor_declaration` ADD CONSTRAINT `engagement_auditor_declaration_declaration_id_fkey` FOREIGN KEY (`declaration_id`) REFERENCES `declaration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_auditor_declaration` ADD CONSTRAINT `engagement_auditor_declaration_authorised_by_engagement_aud_fkey` FOREIGN KEY (`authorised_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_auditor_declaration` ADD CONSTRAINT `engagement_auditor_declaration_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_auditor` ADD CONSTRAINT `engagement_auditor_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_auditor` ADD CONSTRAINT `engagement_auditor_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_auditor` ADD CONSTRAINT `engagement_auditor_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_type` ADD CONSTRAINT `engagement_type_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement` ADD CONSTRAINT `engagement_annual_audit_plan_id_fkey` FOREIGN KEY (`annual_audit_plan_id`) REFERENCES `annual_audit_plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement` ADD CONSTRAINT `engagement_engagement_type_id_fkey` FOREIGN KEY (`engagement_type_id`) REFERENCES `engagement_type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement` ADD CONSTRAINT `engagement_prepared_by_id_fkey` FOREIGN KEY (`prepared_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement` ADD CONSTRAINT `engagement_authorised_by_id_fkey` FOREIGN KEY (`authorised_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement` ADD CONSTRAINT `engagement_planned_engagement_id_fkey` FOREIGN KEY (`planned_engagement_id`) REFERENCES `planned_engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement` ADD CONSTRAINT `engagement_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_fieldwork_document` ADD CONSTRAINT `engagement_fieldwork_document_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_fieldwork_document` ADD CONSTRAINT `engagement_fieldwork_document_prepared_by_engagement_audito_fkey` FOREIGN KEY (`prepared_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_fieldwork_document` ADD CONSTRAINT `engagement_fieldwork_document_nominated_reviewer_id_fkey` FOREIGN KEY (`nominated_reviewer_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_fieldwork_document` ADD CONSTRAINT `engagement_fieldwork_document_authorised_by_engagement_audi_fkey` FOREIGN KEY (`authorised_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_fieldwork_document` ADD CONSTRAINT `engagement_fieldwork_document_engagement_audit_program_item_fkey` FOREIGN KEY (`engagement_audit_program_item_id`) REFERENCES `engagement_audit_program_item`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_fieldwork_document` ADD CONSTRAINT `engagement_fieldwork_document_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fieldwork_document_review_note` ADD CONSTRAINT `fieldwork_document_review_note_engagement_fieldwork_documen_fkey` FOREIGN KEY (`engagement_fieldwork_document_id`) REFERENCES `engagement_fieldwork_document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fieldwork_document_review_note` ADD CONSTRAINT `fieldwork_document_review_note_review_note_id_fkey` FOREIGN KEY (`review_note_id`) REFERENCES `review_note`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fieldwork_document_review_note` ADD CONSTRAINT `fieldwork_document_review_note_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_finding_and_recommendations` ADD CONSTRAINT `engagement_finding_and_recommendations_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_finding_and_recommendations` ADD CONSTRAINT `engagement_finding_and_recommendations_engagement_fieldwork_fkey` FOREIGN KEY (`engagement_fieldwork_document_id`) REFERENCES `engagement_fieldwork_document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_finding_and_recommendations` ADD CONSTRAINT `engagement_finding_and_recommendations_source_risk_id_fkey` FOREIGN KEY (`source_risk_id`) REFERENCES `risk_assessment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_finding_and_recommendations` ADD CONSTRAINT `engagement_finding_and_recommendations_prepared_by_engageme_fkey` FOREIGN KEY (`prepared_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_finding_and_recommendations` ADD CONSTRAINT `engagement_finding_and_recommendations_authorised_by_engage_fkey` FOREIGN KEY (`authorised_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_finding_and_recommendations` ADD CONSTRAINT `engagement_finding_and_recommendations_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `strategic_objective` ADD CONSTRAINT `strategic_objective_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_rating_band` ADD CONSTRAINT `risk_rating_band_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_planning_document` ADD CONSTRAINT `engagement_planning_document_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_planning_document` ADD CONSTRAINT `engagement_planning_document_planning_document_template_id_fkey` FOREIGN KEY (`planning_document_template_id`) REFERENCES `planning_document_template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_planning_document` ADD CONSTRAINT `engagement_planning_document_prepared_by_engagement_auditor_fkey` FOREIGN KEY (`prepared_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_planning_document` ADD CONSTRAINT `engagement_planning_document_nominated_reviewer_id_fkey` FOREIGN KEY (`nominated_reviewer_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_planning_document` ADD CONSTRAINT `engagement_planning_document_authorised_by_engagement_audit_fkey` FOREIGN KEY (`authorised_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_planning_document` ADD CONSTRAINT `engagement_planning_document_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planning_document_review_note` ADD CONSTRAINT `planning_document_review_note_engagement_planning_document__fkey` FOREIGN KEY (`engagement_planning_document_id`) REFERENCES `engagement_planning_document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planning_document_review_note` ADD CONSTRAINT `planning_document_review_note_review_note_id_fkey` FOREIGN KEY (`review_note_id`) REFERENCES `review_note`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planning_document_review_note` ADD CONSTRAINT `planning_document_review_note_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planning_document_template` ADD CONSTRAINT `planning_document_template_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_report_document` ADD CONSTRAINT `engagement_report_document_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_report_document` ADD CONSTRAINT `engagement_report_document_report_document_template_id_fkey` FOREIGN KEY (`report_document_template_id`) REFERENCES `report_document_template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_report_document` ADD CONSTRAINT `engagement_report_document_prepared_by_engagement_auditor_i_fkey` FOREIGN KEY (`prepared_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_report_document` ADD CONSTRAINT `engagement_report_document_nominated_reviewer_id_fkey` FOREIGN KEY (`nominated_reviewer_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_report_document` ADD CONSTRAINT `engagement_report_document_authorised_by_engagement_auditor_fkey` FOREIGN KEY (`authorised_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_report_document` ADD CONSTRAINT `engagement_report_document_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_document_review_note` ADD CONSTRAINT `report_document_review_note_engagement_report_document_id_fkey` FOREIGN KEY (`engagement_report_document_id`) REFERENCES `engagement_report_document`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_document_review_note` ADD CONSTRAINT `report_document_review_note_review_note_id_fkey` FOREIGN KEY (`review_note_id`) REFERENCES `review_note`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_document_review_note` ADD CONSTRAINT `report_document_review_note_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_document_template` ADD CONSTRAINT `report_document_template_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_note` ADD CONSTRAINT `review_note_cleared_by_engagement_auditor_id_fkey` FOREIGN KEY (`cleared_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_note` ADD CONSTRAINT `review_note_verified_by_engagement_auditor_id_fkey` FOREIGN KEY (`verified_by_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_note` ADD CONSTRAINT `review_note_verified_by_cae_id_fkey` FOREIGN KEY (`verified_by_cae_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_note` ADD CONSTRAINT `review_note_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_note` ADD CONSTRAINT `review_note_reviewer_engagement_auditor_id_fkey` FOREIGN KEY (`reviewer_engagement_auditor_id`) REFERENCES `engagement_auditor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_note` ADD CONSTRAINT `review_note_reviewer_cae_id_fkey` FOREIGN KEY (`reviewer_cae_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_note` ADD CONSTRAINT `review_note_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_key` ADD CONSTRAINT `api_key_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sent_email` ADD CONSTRAINT `sent_email_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessment` ADD CONSTRAINT `risk_assessment_linked_planned_engagement_id_fkey` FOREIGN KEY (`linked_planned_engagement_id`) REFERENCES `planned_engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessment` ADD CONSTRAINT `risk_assessment_risk_owner_id_fkey` FOREIGN KEY (`risk_owner_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessment` ADD CONSTRAINT `risk_assessment_strategic_objective_id_fkey` FOREIGN KEY (`strategic_objective_id`) REFERENCES `strategic_objective`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risk_assessment` ADD CONSTRAINT `risk_assessment_assessed_by_id_fkey` FOREIGN KEY (`assessed_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `escalation_rule` ADD CONSTRAINT `escalation_rule_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `corrective_action` ADD CONSTRAINT `corrective_action_finding_id_fkey` FOREIGN KEY (`finding_id`) REFERENCES `engagement_finding_and_recommendations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `corrective_action` ADD CONSTRAINT `corrective_action_owner_user_id_fkey` FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `corrective_action` ADD CONSTRAINT `corrective_action_supervisor_user_id_fkey` FOREIGN KEY (`supervisor_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task` ADD CONSTRAINT `task_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task` ADD CONSTRAINT `task_assignee_user_id_fkey` FOREIGN KEY (`assignee_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entry` ADD CONSTRAINT `time_entry_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entry` ADD CONSTRAINT `time_entry_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entry` ADD CONSTRAINT `time_entry_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entry` ADD CONSTRAINT `time_entry_timesheet_id_fkey` FOREIGN KEY (`timesheet_id`) REFERENCES `timesheet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense` ADD CONSTRAINT `expense_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expense` ADD CONSTRAINT `expense_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_team_member` ADD CONSTRAINT `engagement_team_member_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `engagement_team_member` ADD CONSTRAINT `engagement_team_member_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_request` ADD CONSTRAINT `leave_request_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timesheet` ADD CONSTRAINT `timesheet_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `working_paper` ADD CONSTRAINT `working_paper_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;



-- CreateTable
CREATE TABLE `delegation` (
    `id` VARCHAR(191) NOT NULL,
    `delegate_user_id` VARCHAR(191) NULL,
    `principal_user_id` VARCHAR(191) NULL,
    `scope_kind` VARCHAR(191) NULL,
    `engagement_id` VARCHAR(191) NULL,
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `status` VARCHAR(191) NULL DEFAULT 'ACTIVE',
    `reason` TEXT NULL,
    `revoked_by_user_id` VARCHAR(191) NULL,
    `revoked_at` DATETIME(3) NULL,
    `organization_id` VARCHAR(191) NULL,
    `disabled` BOOLEAN NOT NULL DEFAULT false,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(191) NULL,
    `deleted_at` DATETIME(3) NULL,
    PRIMARY KEY (`id`)
);

ALTER TABLE `annual_audit_plan` ADD CONSTRAINT `annual_audit_plan_prepared_on_behalf_of_user_id_fkey` FOREIGN KEY (`prepared_on_behalf_of_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `delegation` ADD CONSTRAINT `delegation_delegate_user_id_fkey` FOREIGN KEY (`delegate_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `delegation` ADD CONSTRAINT `delegation_principal_user_id_fkey` FOREIGN KEY (`principal_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `delegation` ADD CONSTRAINT `delegation_engagement_id_fkey` FOREIGN KEY (`engagement_id`) REFERENCES `engagement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `delegation` ADD CONSTRAINT `delegation_revoked_by_user_id_fkey` FOREIGN KEY (`revoked_by_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `delegation` ADD CONSTRAINT `delegation_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
