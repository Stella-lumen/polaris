import { NextResponse } from "next/server";

const listParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
  { name: "page_size", in: "query", schema: { type: "integer", default: 50, maximum: 200 }, description: "Rows per page (max 200)" },
  { name: "status", in: "query", schema: { type: "string" }, description: "Status filter (endpoint-specific)" },
  { name: "updated_since", in: "query", schema: { type: "string", format: "date-time" }, description: "Only records updated after this ISO 8601 timestamp" },
  { name: "sort", in: "query", schema: { type: "string" }, description: "Sort field; prefix '-' for descending (e.g. -updated_at)" },
];

const listGet = (tag: string, summary: string, scope: string) => ({
  get: {
    tags: [tag],
    summary,
    security: [{ ApiKeyAuth: [] }],
    parameters: listParams,
    responses: {
      "200": { description: `${summary} — { data: [...], meta: { page, page_size, total } }. Scope: ${scope}` },
      "400": { description: "Invalid parameter" },
      "401": { description: "Missing, revoked or expired key" },
      "403": { description: "Key lacks the required scope" },
      "429": { description: "Rate limit exceeded (120 req/min) — see Retry-After" },
    },
  },
});

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Polaris Internal Audit API",
    version: "1.0.0",
    description:
      "Scoped, read-only REST access to the internal-audit platform for BI tools (Power BI, Excel), external systems and directory provisioning. " +
      "Authenticate with the `x-api-key` header — keys are created under Admin → API Keys. The key value is shown once; only its SHA-256 hash is stored. " +
      "Rate limit: 120 requests/minute per key. Every response carries an `x-request-id` header.",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key", description: "API key created under Admin → API Keys (format pk_…)" },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Validate the API key",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          "200": { description: "{ data: { status: 'ok', key_valid: true } }" },
          "401": { description: "Missing, revoked or expired key" },
        },
      },
    },
    "/engagements": listGet("Engagements", "List audit engagements", "engagements:read"),
    "/engagements/{id}": {
      get: {
        tags: ["Engagements"],
        summary: "Get one engagement",
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Engagement detail. Scope: engagements:read" },
          "401": { description: "Missing, revoked or expired key" },
          "403": { description: "Key lacks engagements:read" },
          "404": { description: "Not found" },
        },
      },
    },
    "/engagements/{id}/workspace": {
      get: {
        tags: ["Engagements"],
        summary: "Engagement workspace summary: lead, team, budget, progress, counts, approvals, working papers",
        security: [{ ApiKeyAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Workspace summary with counts (tasks, findings, open/overdue actions), budget vs spend, linked risks, planning/report approval and working papers. Scope: engagements:read" },
          "401": { description: "Missing, revoked or expired key" },
          "403": { description: "Key lacks engagements:read" },
          "404": { description: "Not found" },
        },
      },
    },
    "/audit-plans": listGet("Planning", "List annual audit plans", "audit-plan:read"),
    "/risk-assessments": {
      get: {
        tags: ["Risk"],
        summary: "List risk assessments with L×I scores, bands, coverage and ownership",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          ...listParams,
          { name: "band", in: "query", schema: { type: "string" }, description: "Residual band label (e.g. High, Extreme)" },
          { name: "category", in: "query", schema: { type: "string" }, description: "Risk category filter" },
          { name: "covered", in: "query", schema: { type: "string", enum: ["true", "false"] }, description: "true = has planned engagement, false = uncovered" },
        ],
        responses: {
          "200": { description: "Risks with inherent/residual likelihood, impact, score, band, control_effectiveness, owner, objective, status, next_review_date, planned_engagement, covered. status=high filters High/Extreme residual. Scope: risks:read" },
          "400": { description: "Invalid parameter" },
          "401": { description: "Missing, revoked or expired key" },
          "403": { description: "Key lacks risks:read" },
        },
      },
    },
    "/findings": listGet("Findings", "List findings with lifecycle status and corrective actions", "findings:read"),
    "/follow-ups": {
      get: {
        tags: ["Follow-up"],
        summary: "List corrective actions incl. AG findings, verification and escalation state",
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          ...listParams,
          { name: "source", in: "query", schema: { type: "string", enum: ["INTERNAL_AUDIT", "AG", "OTHER"] }, description: "Source filter — AG returns Auditor General actions" },
          { name: "overdue", in: "query", schema: { type: "string", enum: ["true", "false"] }, description: "Overdue flag filter" },
          { name: "due_before", in: "query", schema: { type: "string", format: "date" }, description: "Due on or before this date" },
        ],
        responses: {
          "200": { description: "Actions with source, ag_reference, ag_report_year, owner, supervisor, due/original_due dates, revision_count, status, percent_done, is_overdue, days_overdue, escalation_level, verification fields. Scope: followups:read" },
          "400": { description: "Invalid parameter" },
          "401": { description: "Missing, revoked or expired key" },
          "403": { description: "Key lacks followups:read" },
        },
      },
    },
    "/tasks": listGet("Tasks", "List scheduled tasks with assignees and due dates", "tasks:read"),
    "/resource-allocations": listGet("Resources", "List time entries / resource allocations", "resources:read"),
    "/reports/summary": {
      get: {
        tags: ["Reports"],
        summary: "Aggregated audit-portfolio summary",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          "200": { description: "Aggregate counts for engagements, findings, corrective actions, tasks and risks. Scope: reports:read" },
          "401": { description: "Missing, revoked or expired key" },
          "403": { description: "Key lacks reports:read" },
        },
      },
    },
    "/users/sync": {
      post: {
        tags: ["Provisioning"],
        summary: "Synchronise users from the corporate directory (AD/Entra ID)",
        security: [{ ApiKeyAuth: [] }],
        description:
          "Push-based directory provisioning: a scheduled job on the organisation's network POSTs a directory export. " +
          "Accounts are created/updated by email, AD groups map to application roles, and leavers can be deactivated. Scope: users:sync.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["users"],
                properties: {
                  deactivate_missing: { type: "boolean", default: false },
                  users: {
                    type: "array",
                    maxItems: 500,
                    items: {
                      type: "object",
                      properties: {
                        external_id: { type: "string" },
                        first_name: { type: "string" },
                        last_name: { type: "string" },
                        email: { type: "string", format: "email" },
                        ad_group: { type: "string", description: "AGR-IAA-ADMINS | AGR-IAA-CAE | AGR-IAA-AUDITORS | AGR-IAA-REGULATOR | AGR-IAA-PREPARERS" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "{ data: { created, updated, unchanged, deactivated, warnings } }" },
          "400": { description: "Invalid payload" },
          "401": { description: "Missing, revoked or expired key" },
          "403": { description: "Key lacks users:sync" },
        },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(spec);
}
