// Enums recovered from the original bundle
export const EngagementAuditorRole = {
  OUTSOURCED_PARTY: "OUTSOURCED_PARTY",
  SENIOR_AUDITOR: "SENIOR_AUDITOR",
  AUDITOR: "AUDITOR",
  ADMIN: "ADMIN",
} as const;
export type EngagementAuditorRole =
  (typeof EngagementAuditorRole)[keyof typeof EngagementAuditorRole];

export const DocumentType = { DOCUMENT: "DOCUMENT", APP_LINK: "APP_LINK" } as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

// Clerk org roles observed in the app
export const OrgRole = {
  SL_ADMIN: "org:sl_admin",
  STELLA_LUMEN: "org:stella_lumen",
  ADMIN: "org:admin",
  CHIEF_AUDIT_EXECUTIVE: "org:chief_audit_executive",
  MEMBER: "org:member",
  DELEGATED_PREPARER: "org:delegated_preparer",
} as const;

// Document reference taxonomy (enforced by zod regexes in the original)
export const REF_PATTERNS = {
  PLANNING: /^A\d+$/,            // A4 = Audit Program (reserved), A1-A3 reserved templates
  FIELDWORK: /^B\d+(?:\.\d+)?$/, // dotted sub-refs = groups
  REPORT: /^D\d+$/,              // D1 = Schedule of Findings & Recommendations (reserved)
  RISK: /^R\d+$/,
} as const;
