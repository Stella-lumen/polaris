import { z } from "zod";
import { EngagementAuditorRole, REF_PATTERNS } from "./types";

// ── Deminified zod schemas recovered per route (see docs/zod-schemas.json) ──

const fileOrUrl = z.union([z.array(z.any()), z.any()]);

// /admin/users — create user
export const createUserSchema = z.object({
  firstName: z.string().min(1, "First Name is required").max(100),
  lastName: z.string().min(1, "Last Name is required").max(100),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required").max(100),
});
export const userIdSchema = z.object({ userId: z.string().min(1, "User ID is required") });

// /admin/engagement-types
export const engagementTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(100),
  disabled: z.boolean().optional(),
});

// /admin/periods
export const periodSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(100),
  startDate: z.date("Start date is required"),
  endDate: z.date("End date is required"),
});

// /admin/declarations
export const declarationSectionSchema = z.object({
  name: z.string(), description: z.string(), customName: z.string(),
});
export const declarationSchema = z.object({
  declarationSectionId: z.string(), declarationText: z.string(), customText: z.string(),
});

// /admin/delegated-preparers
export const delegatedPreparerSchema = z.object({ userId: z.string(), isAdd: z.boolean() });

// /annual-audit-plan/[aap_id] — plan + planned engagement
export const annualAuditPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(100),
  periodId: z.string().min(1, "Period is required"),
});
export const plannedEngagementSchema = z.object({
  name: z.string().min(1, "Name is required"),
  reference: z.string().min(1, "Reference is required"),
  engagementTypeId: z.string().min(1, "Engagement type is required"),
  objectives: z.string().min(1, "Objectives are required"),
  scope: z.string().min(1, "Scope is required"),
  location: z.string().min(1, "Location is required"),
  assignedSeniorAuditorId: z.string().min(1, "Senior auditor is required"),
  plannedStartDate: z.date(),
  plannedEndDate: z.date(),
  plannedBudget: z.number().min(0),
  actualStartDate: z.date().optional(),
  actualEndDate: z.date().optional(),
  actualSpend: z.number().optional(),
});

// /engagements/[engagement_id] — master data / add form
export const engagementSchema = z.object({
  annualAuditPlanId: z.string().min(1, "Annual Audit Plan is required"),
  plannedEngagementId: z.string().optional(),
  engagementName: z.string().min(1, "Engagement Name is required"),
  engagementNumber: z.string().min(1, "Engagement Number is required"),
  engagementTypeId: z.string().min(1, "Engagement Type is required"),
  startDate: z.date(),
  endDate: z.date().min(new Date(), "End Date cannot be in the past").optional(),
  engagementBudget: z.coerce.number().min(0, "Engagement Budget must be greater than 0"),
  engagementSpend: z.coerce.number().min(0, "Engagement Spend must be greater than 0").optional(),
  outsourcedParty: z.string().min(1, "Outsourced Party is required"),
  engagementAuditors: z
    .array(
      z.object({
        userId: z.string().min(1, "User is required"),
        positionOnAudit: z.nativeEnum(EngagementAuditorRole),
        qualifications: z.string().min(1, "Qualifications are required"),
        experience: z.string().min(1, "Experience is required"),
      }),
    )
    .optional(),
});

// Engagement stage documents (A/B/D refs share one shape)
const stageDoc = (ref: RegExp, msg: string) =>
  z.object({
    documentReference: z.string().min(1, "Document reference is required").regex(ref, msg),
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    files: fileOrUrl,
    engagementId: z.string().min(1, "Engagement ID is required"),
    nominatedReviewerId: z.string().min(1, "Nominated reviewer ID is required"),
    templateId: z.string().optional(),
  });
export const planningDocSchema = stageDoc(REF_PATTERNS.PLANNING, "Document reference must start with 'A' followed by digits");
export const fieldworkDocSchema = stageDoc(REF_PATTERNS.FIELDWORK, "Document reference must start with 'B' followed by digits and optionally a dot and more digits");
export const reportDocSchema = stageDoc(REF_PATTERNS.REPORT, "Document reference must start with 'D' followed by digits");

// /engagements/[id]/audit-program — program items
export const auditProgramItemSchema = z.object({
  riskReference: z.string().min(1, "Risk reference is required").regex(REF_PATTERNS.RISK, "Risk reference must start with 'R' followed by digits"),
  risk: z.string().min(1, "Risk is required"),
  auditObjective: z.string().min(1, "Audit objective is required"),
  auditProcedure: z.string().min(1, "Audit procedure is required"),
  engagementId: z.string().min(1, "Engagement ID is required"),
  engagementFieldworkDocumentGroupReference: z.string().optional(),
  nominatedReviewerId: z.string().min(1, "Nominated reviewer ID is required"),
});

// /engagements/[id]/auditor-declarations — submit
export const submitDeclarationsSchema = z.object({
  engagementId: z.string().min(1, "Engagement is required"),
  declarations: z.array(
    z.object({
      declarationId: z.string().min(1, "Declaration is required"),
      confirmed: z.boolean().refine((v) => v, "Declaration must be confirmed"),
    }),
  ),
});

// /guiding-documents — upload
export const guidingDocumentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  files: fileOrUrl,
});
