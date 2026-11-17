BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[annual_audit_plan_period] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [start_date] DATETIME2,
    [end_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [annual_audit_plan_period_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [annual_audit_plan_period_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [annual_audit_plan_period_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[annual_audit_plan] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [period_id] NVARCHAR(1000),
    [prepared_by_id] NVARCHAR(1000),
    [prepared_date] DATETIME2,
    [authorised_by_id] NVARCHAR(1000),
    [authorised_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [annual_audit_plan_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [annual_audit_plan_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [annual_audit_plan_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[guiding_document] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [files] NVARCHAR(max) NOT NULL,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [guiding_document_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [guiding_document_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [guiding_document_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[planned_engagement] (
    [id] NVARCHAR(1000) NOT NULL,
    [reference] NVARCHAR(1000),
    [engagement_type_id] NVARCHAR(1000),
    [name] NVARCHAR(1000),
    [objectives] NVARCHAR(1000),
    [scope] NVARCHAR(1000),
    [location] NVARCHAR(1000),
    [assigned_senior_auditor_id] NVARCHAR(1000),
    [planned_start_date] DATETIME2,
    [planned_end_date] DATETIME2,
    [planned_budget] DECIMAL(32,16),
    [actual_start_date] DATETIME2,
    [actual_end_date] DATETIME2,
    [actual_budget] DECIMAL(32,16),
    [prepared_by_id] NVARCHAR(1000),
    [prepared_date] DATETIME2,
    [authorised_by_id] NVARCHAR(1000),
    [authorised_date] DATETIME2,
    [annual_audit_plan_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [planned_engagement_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [planned_engagement_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [planned_engagement_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[audit_program_item_review_note] (
    [id] NVARCHAR(1000) NOT NULL,
    [engagement_audit_program_item_id] NVARCHAR(1000),
    [review_note_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [audit_program_item_review_note_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [audit_program_item_review_note_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [audit_program_item_review_note_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_audit_program_item] (
    [id] NVARCHAR(1000) NOT NULL,
    [risk_reference] NVARCHAR(1000),
    [risk] NVARCHAR(1000),
    [audit_objective] NVARCHAR(1000),
    [audit_procedure] NVARCHAR(1000),
    [engagement_id] NVARCHAR(1000),
    [prepared_by_engagement_auditor_id] NVARCHAR(1000),
    [prepared_date] DATETIME2,
    [nominated_reviewer_id] NVARCHAR(1000),
    [authorised_by_engagement_auditor_id] NVARCHAR(1000),
    [authorised_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [engagement_audit_program_item_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [engagement_audit_program_item_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [engagement_audit_program_item_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[declaration_section] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [custom_name] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [prescribed] BIT NOT NULL CONSTRAINT [declaration_section_prescribed_df] DEFAULT 0,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [declaration_section_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [declaration_section_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [declaration_section_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[declaration] (
    [id] NVARCHAR(1000) NOT NULL,
    [declaration_text] NVARCHAR(1000),
    [custom_text] NVARCHAR(1000),
    [prescribed] BIT NOT NULL CONSTRAINT [declaration_prescribed_df] DEFAULT 0,
    [declaration_section_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [declaration_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [declaration_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [declaration_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_auditor_declaration] (
    [id] NVARCHAR(1000) NOT NULL,
    [confirmation_date] DATETIME2,
    [engagement_id] NVARCHAR(1000),
    [engagement_auditor_id] NVARCHAR(1000),
    [declaration_id] NVARCHAR(1000),
    [authorised_by_engagement_auditor_id] NVARCHAR(1000),
    [authorised_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [engagement_auditor_declaration_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [engagement_auditor_declaration_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [engagement_auditor_declaration_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_auditor] (
    [id] NVARCHAR(1000) NOT NULL,
    [engagement_id] NVARCHAR(1000),
    [user_id] NVARCHAR(1000),
    [position_on_audit] NVARCHAR(1000),
    [qualifications] NVARCHAR(1000),
    [experience] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [engagement_auditor_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [engagement_auditor_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [engagement_auditor_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_type] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [engagement_type_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [engagement_type_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [engagement_type_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement] (
    [id] NVARCHAR(1000) NOT NULL,
    [annual_audit_plan_id] NVARCHAR(1000),
    [engagement_type_id] NVARCHAR(1000),
    [engagement_name] NVARCHAR(1000),
    [engagement_number] NVARCHAR(1000),
    [start_date] DATETIME2,
    [end_date] DATETIME2,
    [engagement_budget] DECIMAL(32,16),
    [engagement_spend] DECIMAL(32,16),
    [prepared_by_id] NVARCHAR(1000),
    [prepared_date] DATETIME2,
    [authorised_by_id] NVARCHAR(1000),
    [authorised_date] DATETIME2,
    [planned_engagement_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [engagement_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [engagement_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [engagement_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_fieldwork_document] (
    [id] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [document_reference] NVARCHAR(1000),
    [name] NVARCHAR(1000),
    [files] NVARCHAR(max) NOT NULL,
    [engagement_id] NVARCHAR(1000),
    [prepared_by_engagement_auditor_id] NVARCHAR(1000),
    [prepared_date] DATETIME2,
    [nominated_reviewer_id] NVARCHAR(1000),
    [authorised_by_engagement_auditor_id] NVARCHAR(1000),
    [authorised_date] DATETIME2,
    [engagement_audit_program_item_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [engagement_fieldwork_document_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [engagement_fieldwork_document_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [engagement_fieldwork_document_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[fieldwork_document_review_note] (
    [id] NVARCHAR(1000) NOT NULL,
    [engagement_fieldwork_document_id] NVARCHAR(1000),
    [review_note_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [fieldwork_document_review_note_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [fieldwork_document_review_note_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [fieldwork_document_review_note_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_finding_and_recommendations] (
    [id] NVARCHAR(1000) NOT NULL,
    [engagement_id] NVARCHAR(1000),
    [engagement_fieldwork_document_id] NVARCHAR(1000),
    [detailed_finding] NVARCHAR(1000),
    [root_cause] NVARCHAR(1000),
    [recommendations] NVARCHAR(1000),
    [management_comment] NVARCHAR(1000),
    [prepared_by_engagement_auditor_id] NVARCHAR(1000),
    [prepared_date] DATETIME2,
    [authorised_by_engagement_auditor_id] NVARCHAR(1000),
    [authorised_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [engagement_finding_and_recommendations_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [engagement_finding_and_recommendations_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [engagement_finding_and_recommendations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_planning_document] (
    [id] NVARCHAR(1000) NOT NULL,
    [document_reference] NVARCHAR(1000),
    [name] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [files] NVARCHAR(max) NOT NULL,
    [link] NVARCHAR(1000),
    [type] NVARCHAR(1000),
    [engagement_id] NVARCHAR(1000),
    [planning_document_template_id] NVARCHAR(1000),
    [prepared_by_engagement_auditor_id] NVARCHAR(1000),
    [prepared_date] DATETIME2,
    [nominated_reviewer_id] NVARCHAR(1000),
    [authorised_by_engagement_auditor_id] NVARCHAR(1000),
    [authorised_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [engagement_planning_document_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [engagement_planning_document_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [engagement_planning_document_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[planning_document_review_note] (
    [id] NVARCHAR(1000) NOT NULL,
    [engagement_planning_document_id] NVARCHAR(1000),
    [review_note_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [planning_document_review_note_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [planning_document_review_note_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [planning_document_review_note_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[planning_document_template] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [reference] NVARCHAR(1000),
    [required] BIT NOT NULL CONSTRAINT [planning_document_template_required_df] DEFAULT 0,
    [files] NVARCHAR(max) NOT NULL,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [planning_document_template_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [planning_document_template_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [planning_document_template_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[engagement_report_document] (
    [id] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [document_reference] NVARCHAR(1000),
    [name] NVARCHAR(1000),
    [files] NVARCHAR(max) NOT NULL,
    [link] NVARCHAR(1000),
    [type] NVARCHAR(1000),
    [engagement_id] NVARCHAR(1000),
    [report_document_template_id] NVARCHAR(1000),
    [prepared_by_engagement_auditor_id] NVARCHAR(1000),
    [prepared_date] DATETIME2,
    [nominated_reviewer_id] NVARCHAR(1000),
    [authorised_by_engagement_auditor_id] NVARCHAR(1000),
    [authorised_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [engagement_report_document_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [engagement_report_document_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [engagement_report_document_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[report_document_review_note] (
    [id] NVARCHAR(1000) NOT NULL,
    [engagement_report_document_id] NVARCHAR(1000),
    [review_note_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [report_document_review_note_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [report_document_review_note_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [report_document_review_note_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[report_document_template] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [reference] NVARCHAR(1000),
    [required] BIT NOT NULL CONSTRAINT [report_document_template_required_df] DEFAULT 0,
    [files] NVARCHAR(max) NOT NULL,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [report_document_template_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [report_document_template_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [report_document_template_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[review_note] (
    [id] NVARCHAR(1000) NOT NULL,
    [note] NVARCHAR(1000),
    [cleared_date] DATETIME2,
    [cleared_by_engagement_auditor_id] NVARCHAR(1000),
    [verified_date] DATETIME2,
    [verified_by_engagement_auditor_id] NVARCHAR(1000),
    [verified_by_cae_id] NVARCHAR(1000),
    [engagement_id] NVARCHAR(1000),
    [reviewer_engagement_auditor_id] NVARCHAR(1000),
    [reviewer_cae_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [review_note_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [review_note_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [review_note_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[api_key] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [key_hash] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [scopes] NVARCHAR(max) NOT NULL,
    [expires_at] DATETIME2,
    [disabled] BIT NOT NULL CONSTRAINT [api_key_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [api_key_deleted_df] DEFAULT 0,
    [last_used_at] DATETIME2,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [api_key_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[audit_log] (
    [id] NVARCHAR(1000) NOT NULL,
    [schema_name] NVARCHAR(1000),
    [table_name] NVARCHAR(1000),
    [record_id] NVARCHAR(1000),
    [operation_type] NVARCHAR(1000),
    [user_id] NVARCHAR(1000),
    [timestamp] DATETIME2,
    [original_values] NVARCHAR(max) NOT NULL,
    [new_values] NVARCHAR(max) NOT NULL,
    [query] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    CONSTRAINT [audit_log_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[organization] (
    [id] NVARCHAR(1000) NOT NULL,
    [clerk_id] NVARCHAR(1000),
    [name] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [organization_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [organization_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [organization_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sent_email] (
    [id] NVARCHAR(1000) NOT NULL,
    [resend_id] NVARCHAR(1000),
    [from_email] NVARCHAR(1000),
    [to_emails] NVARCHAR(max) NOT NULL,
    [bcc_emails] NVARCHAR(max) NOT NULL,
    [cc_emails] NVARCHAR(max) NOT NULL,
    [subject] NVARCHAR(1000),
    [body] NVARCHAR(1000),
    [scheduled_at] DATETIME2,
    [attachments] NVARCHAR(max) NOT NULL,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [sent_email_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [sent_email_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [sent_email_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[user] (
    [id] NVARCHAR(1000) NOT NULL,
    [clerk_id] NVARCHAR(1000),
    [first_name] NVARCHAR(1000),
    [last_name] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [phone_number] NVARCHAR(1000),
    [role] NVARCHAR(1000),
    [password_hash] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [user_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [user_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [user_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[stored_file] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [mime_type] NVARCHAR(1000),
    [size] INT,
    [data] VARBINARY(max),
    [entity_type] NVARCHAR(1000),
    [entity_id] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [stored_file_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [stored_file_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [stored_file_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[risk_assessment] (
    [id] NVARCHAR(1000) NOT NULL,
    [auditable_entity] NVARCHAR(1000),
    [risk_description] NVARCHAR(1000),
    [risk_category] NVARCHAR(1000),
    [inherent_likelihood] INT,
    [inherent_impact] INT,
    [inherent_score] INT,
    [existing_controls] NVARCHAR(1000),
    [residual_likelihood] INT,
    [residual_impact] INT,
    [residual_score] INT,
    [linked_planned_engagement_id] NVARCHAR(1000),
    [assessed_by_id] NVARCHAR(1000),
    [assessed_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [risk_assessment_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [risk_assessment_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [risk_assessment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[corrective_action] (
    [id] NVARCHAR(1000) NOT NULL,
    [finding_id] NVARCHAR(1000),
    [action_description] NVARCHAR(1000),
    [owner_user_id] NVARCHAR(1000),
    [due_date] DATETIME2,
    [status] NVARCHAR(1000),
    [progress] INT,
    [evidence] NVARCHAR(1000),
    [implemented_date] DATETIME2,
    [verified_by_id] NVARCHAR(1000),
    [verified_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [corrective_action_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [corrective_action_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [corrective_action_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[task] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [engagement_id] NVARCHAR(1000),
    [stage] NVARCHAR(1000),
    [assignee_user_id] NVARCHAR(1000),
    [due_date] DATETIME2,
    [status] NVARCHAR(1000),
    [escalated] BIT NOT NULL CONSTRAINT [task_escalated_df] DEFAULT 0,
    [completed_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [task_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [task_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [task_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[time_entry] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000),
    [engagement_id] NVARCHAR(1000),
    [work_date] DATETIME2,
    [hours] DECIMAL(32,16),
    [description] NVARCHAR(1000),
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [time_entry_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [time_entry_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [time_entry_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[expense] (
    [id] NVARCHAR(1000) NOT NULL,
    [engagement_id] NVARCHAR(1000),
    [user_id] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [amount] DECIMAL(32,16),
    [expense_date] DATETIME2,
    [organization_id] NVARCHAR(1000),
    [disabled] BIT NOT NULL CONSTRAINT [expense_disabled_df] DEFAULT 0,
    [deleted] BIT NOT NULL CONSTRAINT [expense_deleted_df] DEFAULT 0,
    [created_by] NVARCHAR(1000),
    [created_at] DATETIME2,
    [updated_by] NVARCHAR(1000),
    [updated_at] DATETIME2,
    [deleted_by] NVARCHAR(1000),
    [deleted_at] DATETIME2,
    CONSTRAINT [expense_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[annual_audit_plan_period] ADD CONSTRAINT [annual_audit_plan_period_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[annual_audit_plan] ADD CONSTRAINT [annual_audit_plan_period_id_fkey] FOREIGN KEY ([period_id]) REFERENCES [dbo].[annual_audit_plan_period]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[annual_audit_plan] ADD CONSTRAINT [annual_audit_plan_prepared_by_id_fkey] FOREIGN KEY ([prepared_by_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[annual_audit_plan] ADD CONSTRAINT [annual_audit_plan_authorised_by_id_fkey] FOREIGN KEY ([authorised_by_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[annual_audit_plan] ADD CONSTRAINT [annual_audit_plan_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[guiding_document] ADD CONSTRAINT [guiding_document_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planned_engagement] ADD CONSTRAINT [planned_engagement_engagement_type_id_fkey] FOREIGN KEY ([engagement_type_id]) REFERENCES [dbo].[engagement_type]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planned_engagement] ADD CONSTRAINT [planned_engagement_assigned_senior_auditor_id_fkey] FOREIGN KEY ([assigned_senior_auditor_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planned_engagement] ADD CONSTRAINT [planned_engagement_prepared_by_id_fkey] FOREIGN KEY ([prepared_by_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planned_engagement] ADD CONSTRAINT [planned_engagement_authorised_by_id_fkey] FOREIGN KEY ([authorised_by_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planned_engagement] ADD CONSTRAINT [planned_engagement_annual_audit_plan_id_fkey] FOREIGN KEY ([annual_audit_plan_id]) REFERENCES [dbo].[annual_audit_plan]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planned_engagement] ADD CONSTRAINT [planned_engagement_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[audit_program_item_review_note] ADD CONSTRAINT [audit_program_item_review_note_engagement_audit_program_item_id_fkey] FOREIGN KEY ([engagement_audit_program_item_id]) REFERENCES [dbo].[engagement_audit_program_item]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[audit_program_item_review_note] ADD CONSTRAINT [audit_program_item_review_note_review_note_id_fkey] FOREIGN KEY ([review_note_id]) REFERENCES [dbo].[review_note]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[audit_program_item_review_note] ADD CONSTRAINT [audit_program_item_review_note_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_audit_program_item] ADD CONSTRAINT [engagement_audit_program_item_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_audit_program_item] ADD CONSTRAINT [engagement_audit_program_item_prepared_by_engagement_auditor_id_fkey] FOREIGN KEY ([prepared_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_audit_program_item] ADD CONSTRAINT [engagement_audit_program_item_nominated_reviewer_id_fkey] FOREIGN KEY ([nominated_reviewer_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_audit_program_item] ADD CONSTRAINT [engagement_audit_program_item_authorised_by_engagement_auditor_id_fkey] FOREIGN KEY ([authorised_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_audit_program_item] ADD CONSTRAINT [engagement_audit_program_item_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[declaration_section] ADD CONSTRAINT [declaration_section_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[declaration] ADD CONSTRAINT [declaration_declaration_section_id_fkey] FOREIGN KEY ([declaration_section_id]) REFERENCES [dbo].[declaration_section]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[declaration] ADD CONSTRAINT [declaration_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_auditor_declaration] ADD CONSTRAINT [engagement_auditor_declaration_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_auditor_declaration] ADD CONSTRAINT [engagement_auditor_declaration_engagement_auditor_id_fkey] FOREIGN KEY ([engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_auditor_declaration] ADD CONSTRAINT [engagement_auditor_declaration_declaration_id_fkey] FOREIGN KEY ([declaration_id]) REFERENCES [dbo].[declaration]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_auditor_declaration] ADD CONSTRAINT [engagement_auditor_declaration_authorised_by_engagement_auditor_id_fkey] FOREIGN KEY ([authorised_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_auditor_declaration] ADD CONSTRAINT [engagement_auditor_declaration_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_auditor] ADD CONSTRAINT [engagement_auditor_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_auditor] ADD CONSTRAINT [engagement_auditor_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_auditor] ADD CONSTRAINT [engagement_auditor_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_type] ADD CONSTRAINT [engagement_type_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement] ADD CONSTRAINT [engagement_annual_audit_plan_id_fkey] FOREIGN KEY ([annual_audit_plan_id]) REFERENCES [dbo].[annual_audit_plan]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement] ADD CONSTRAINT [engagement_engagement_type_id_fkey] FOREIGN KEY ([engagement_type_id]) REFERENCES [dbo].[engagement_type]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement] ADD CONSTRAINT [engagement_prepared_by_id_fkey] FOREIGN KEY ([prepared_by_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement] ADD CONSTRAINT [engagement_authorised_by_id_fkey] FOREIGN KEY ([authorised_by_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement] ADD CONSTRAINT [engagement_planned_engagement_id_fkey] FOREIGN KEY ([planned_engagement_id]) REFERENCES [dbo].[planned_engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement] ADD CONSTRAINT [engagement_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_fieldwork_document] ADD CONSTRAINT [engagement_fieldwork_document_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_fieldwork_document] ADD CONSTRAINT [engagement_fieldwork_document_prepared_by_engagement_auditor_id_fkey] FOREIGN KEY ([prepared_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_fieldwork_document] ADD CONSTRAINT [engagement_fieldwork_document_nominated_reviewer_id_fkey] FOREIGN KEY ([nominated_reviewer_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_fieldwork_document] ADD CONSTRAINT [engagement_fieldwork_document_authorised_by_engagement_auditor_id_fkey] FOREIGN KEY ([authorised_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_fieldwork_document] ADD CONSTRAINT [engagement_fieldwork_document_engagement_audit_program_item_id_fkey] FOREIGN KEY ([engagement_audit_program_item_id]) REFERENCES [dbo].[engagement_audit_program_item]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_fieldwork_document] ADD CONSTRAINT [engagement_fieldwork_document_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[fieldwork_document_review_note] ADD CONSTRAINT [fieldwork_document_review_note_engagement_fieldwork_document_id_fkey] FOREIGN KEY ([engagement_fieldwork_document_id]) REFERENCES [dbo].[engagement_fieldwork_document]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[fieldwork_document_review_note] ADD CONSTRAINT [fieldwork_document_review_note_review_note_id_fkey] FOREIGN KEY ([review_note_id]) REFERENCES [dbo].[review_note]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[fieldwork_document_review_note] ADD CONSTRAINT [fieldwork_document_review_note_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_finding_and_recommendations] ADD CONSTRAINT [engagement_finding_and_recommendations_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_finding_and_recommendations] ADD CONSTRAINT [engagement_finding_and_recommendations_engagement_fieldwork_document_id_fkey] FOREIGN KEY ([engagement_fieldwork_document_id]) REFERENCES [dbo].[engagement_fieldwork_document]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_finding_and_recommendations] ADD CONSTRAINT [engagement_finding_and_recommendations_prepared_by_engagement_auditor_id_fkey] FOREIGN KEY ([prepared_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_finding_and_recommendations] ADD CONSTRAINT [engagement_finding_and_recommendations_authorised_by_engagement_auditor_id_fkey] FOREIGN KEY ([authorised_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_finding_and_recommendations] ADD CONSTRAINT [engagement_finding_and_recommendations_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_planning_document] ADD CONSTRAINT [engagement_planning_document_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_planning_document] ADD CONSTRAINT [engagement_planning_document_planning_document_template_id_fkey] FOREIGN KEY ([planning_document_template_id]) REFERENCES [dbo].[planning_document_template]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_planning_document] ADD CONSTRAINT [engagement_planning_document_prepared_by_engagement_auditor_id_fkey] FOREIGN KEY ([prepared_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_planning_document] ADD CONSTRAINT [engagement_planning_document_nominated_reviewer_id_fkey] FOREIGN KEY ([nominated_reviewer_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_planning_document] ADD CONSTRAINT [engagement_planning_document_authorised_by_engagement_auditor_id_fkey] FOREIGN KEY ([authorised_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_planning_document] ADD CONSTRAINT [engagement_planning_document_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planning_document_review_note] ADD CONSTRAINT [planning_document_review_note_engagement_planning_document_id_fkey] FOREIGN KEY ([engagement_planning_document_id]) REFERENCES [dbo].[engagement_planning_document]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planning_document_review_note] ADD CONSTRAINT [planning_document_review_note_review_note_id_fkey] FOREIGN KEY ([review_note_id]) REFERENCES [dbo].[review_note]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planning_document_review_note] ADD CONSTRAINT [planning_document_review_note_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[planning_document_template] ADD CONSTRAINT [planning_document_template_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_report_document] ADD CONSTRAINT [engagement_report_document_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_report_document] ADD CONSTRAINT [engagement_report_document_report_document_template_id_fkey] FOREIGN KEY ([report_document_template_id]) REFERENCES [dbo].[report_document_template]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_report_document] ADD CONSTRAINT [engagement_report_document_prepared_by_engagement_auditor_id_fkey] FOREIGN KEY ([prepared_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_report_document] ADD CONSTRAINT [engagement_report_document_nominated_reviewer_id_fkey] FOREIGN KEY ([nominated_reviewer_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_report_document] ADD CONSTRAINT [engagement_report_document_authorised_by_engagement_auditor_id_fkey] FOREIGN KEY ([authorised_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[engagement_report_document] ADD CONSTRAINT [engagement_report_document_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[report_document_review_note] ADD CONSTRAINT [report_document_review_note_engagement_report_document_id_fkey] FOREIGN KEY ([engagement_report_document_id]) REFERENCES [dbo].[engagement_report_document]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[report_document_review_note] ADD CONSTRAINT [report_document_review_note_review_note_id_fkey] FOREIGN KEY ([review_note_id]) REFERENCES [dbo].[review_note]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[report_document_review_note] ADD CONSTRAINT [report_document_review_note_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[report_document_template] ADD CONSTRAINT [report_document_template_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[review_note] ADD CONSTRAINT [review_note_cleared_by_engagement_auditor_id_fkey] FOREIGN KEY ([cleared_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[review_note] ADD CONSTRAINT [review_note_verified_by_engagement_auditor_id_fkey] FOREIGN KEY ([verified_by_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[review_note] ADD CONSTRAINT [review_note_verified_by_cae_id_fkey] FOREIGN KEY ([verified_by_cae_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[review_note] ADD CONSTRAINT [review_note_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[review_note] ADD CONSTRAINT [review_note_reviewer_engagement_auditor_id_fkey] FOREIGN KEY ([reviewer_engagement_auditor_id]) REFERENCES [dbo].[engagement_auditor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[review_note] ADD CONSTRAINT [review_note_reviewer_cae_id_fkey] FOREIGN KEY ([reviewer_cae_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[review_note] ADD CONSTRAINT [review_note_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[api_key] ADD CONSTRAINT [api_key_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[audit_log] ADD CONSTRAINT [audit_log_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[audit_log] ADD CONSTRAINT [audit_log_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sent_email] ADD CONSTRAINT [sent_email_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[user] ADD CONSTRAINT [user_organization_id_fkey] FOREIGN KEY ([organization_id]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[risk_assessment] ADD CONSTRAINT [risk_assessment_linked_planned_engagement_id_fkey] FOREIGN KEY ([linked_planned_engagement_id]) REFERENCES [dbo].[planned_engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[risk_assessment] ADD CONSTRAINT [risk_assessment_assessed_by_id_fkey] FOREIGN KEY ([assessed_by_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[corrective_action] ADD CONSTRAINT [corrective_action_finding_id_fkey] FOREIGN KEY ([finding_id]) REFERENCES [dbo].[engagement_finding_and_recommendations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[corrective_action] ADD CONSTRAINT [corrective_action_owner_user_id_fkey] FOREIGN KEY ([owner_user_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[task] ADD CONSTRAINT [task_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[task] ADD CONSTRAINT [task_assignee_user_id_fkey] FOREIGN KEY ([assignee_user_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[time_entry] ADD CONSTRAINT [time_entry_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[time_entry] ADD CONSTRAINT [time_entry_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[expense] ADD CONSTRAINT [expense_engagement_id_fkey] FOREIGN KEY ([engagement_id]) REFERENCES [dbo].[engagement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[expense] ADD CONSTRAINT [expense_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

