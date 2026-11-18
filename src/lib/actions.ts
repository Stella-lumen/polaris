"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { actorId, requireUser, requireRole, canAuthorise, hashPassword } from "@/lib/auth";
import { API_SCOPES } from "@/lib/api-scopes";

async function scope() {
  const uid = await actorId();
  return { organization_id: DEMO_ORGANIZATION_ID, created_by: uid, updated_by: uid };
}

async function logAudit(table: string, recordId: string, op: string, values: unknown) {
  const uid = await actorId();
  await prisma.auditLog.create({
    data: {
      organization_id: DEMO_ORGANIZATION_ID,
      schema_name: "public",
      table_name: table,
      record_id: recordId,
      operation_type: op,
      user_id: uid,
      timestamp: new Date(),
      original_values: {},
      new_values: JSON.parse(JSON.stringify(values)),
    },
  });
}

const str = (v: unknown) => String(v ?? "").trim() || null;
const date = (v: unknown) => (v ? new Date(String(v)) : null);

export async function importEngagements(rows: Record<string, unknown>[]) {
  await requireRole(["org:admin", "org:chief_audit_executive"]);
  const types = await prisma.engagementType.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID } });
  const typeByName = new Map(types.map((t) => [t.name?.toLowerCase(), t.id]));
  let created = 0;
  for (const r of rows) {
    const name = String(r["Name"] ?? r["engagement_name"] ?? "").trim();
    if (!name) continue;
    const e = await prisma.engagement.create({
      data: {
        ...(await scope()),
        engagement_name: name,
        engagement_number: str(r["Number"] ?? r["engagement_number"] ?? null),
        engagement_type_id: typeByName.get(String(r["Type"] ?? "").toLowerCase()) ?? null,
        start_date: date(r["Start Date"] ?? r["start_date"] ?? null),
        end_date: date(r["End Date"] ?? r["end_date"] ?? null),
        engagement_budget: r["Budget"] ? Number(r["Budget"]) : null,
        engagement_spend: r["Spend"] ? Number(r["Spend"]) : null,
      },
    });
    await logAudit("Engagement", e.id, "INSERT", e);
    created++;
  }
  revalidatePath("/engagements");
  return { created };
}

export async function createEngagement(payload: {
  engagement_name: string;
  engagement_number: string;
  annual_audit_plan_id: string | null;
  planned_engagement_id: string | null;
  engagement_type_id: string | null;
  start_date: string | null;
  end_date: string | null;
  engagement_budget: number | null;
  engagement_spend: number | null;
  outsourced_party_id: string | null;
  authorise: boolean;
  team: { user_id: string; position: string }[];
}) {
  const user = await requireUser();
  const mayAuthorise = payload.authorise && canAuthorise(user);
  const e = await prisma.engagement.create({
    data: {
      ...(await scope()),
      engagement_name: payload.engagement_name || null,
      engagement_number: payload.engagement_number || null,
      annual_audit_plan_id: payload.annual_audit_plan_id,
      planned_engagement_id: payload.planned_engagement_id,
      engagement_type_id: payload.engagement_type_id,
      start_date: date(payload.start_date),
      end_date: date(payload.end_date),
      engagement_budget: payload.engagement_budget,
      engagement_spend: payload.engagement_spend,
      prepared_by_id: user.id,
      prepared_date: new Date(),
      authorised_by_id: mayAuthorise ? user.id : null,
      authorised_date: mayAuthorise ? new Date() : null,
    },
  });
  const auditors = [
    ...(payload.outsourced_party_id
      ? [{ user_id: payload.outsourced_party_id, position_on_audit: "OUTSOURCED_PARTY" }]
      : []),
    ...payload.team.map((t) => ({ user_id: t.user_id, position_on_audit: t.position })),
  ];
  if (auditors.length) {
    const b = await scope();
    await prisma.engagementAuditor.createMany({
      data: auditors.map((a) => ({ ...b, engagement_id: e.id, ...a })),
    });
  }
  await logAudit("Engagement", e.id, "INSERT", e);
  revalidatePath("/engagements");
  return e.id;
}

export async function updateUserProfile(formData: FormData) {
  const uid = await actorId();
  const u = await prisma.user.update({
    where: { id: uid },
    data: {
      first_name: str(formData.get("first_name")),
      last_name: str(formData.get("last_name")),
      email: str(formData.get("email")),
      updated_by: uid,
    },
  });
  await logAudit("Users", u.id, "UPDATE", u);
}

export async function createUser(formData: FormData) {
  await requireRole(["org:admin"]);
  const u = await prisma.user.create({
    data: {
      ...(await scope()),
      clerk_id: `local-${Date.now()}`,
      first_name: str(formData.get("first_name")),
      last_name: str(formData.get("last_name")),
      email: str(formData.get("email")),
      role: str(formData.get("role")),
      // New users get the demo default password; they can change it in Manage account → Security
      password_hash: hashPassword(String(formData.get("password") || "Polaris2026!")),
    },
  });
  await logAudit("Users", u.id, "INSERT", u);
  revalidatePath("/admin/users");
}

export async function setUserDisabled(userId: string, disabled: boolean) {
  const admin = await requireRole(["org:admin"]);
  if (userId === admin.id && disabled) throw new Error("You cannot disable your own account");
  const u = await prisma.user.update({
    where: { id: userId },
    data: { disabled, updated_by: admin.id, updated_at: new Date() },
  });
  await logAudit("Users", u.id, "UPDATE", { disabled });
  revalidatePath("/admin/users");
}

export async function updateUserRole(userId: string, role: string) {
  const admin = await requireRole(["org:admin"]);
  const allowed = new Set(["org:admin", "org:chief_audit_executive", "org:member", "org:regulator", "org:delegated_preparer"]);
  if (role && !allowed.has(role)) throw new Error("Invalid role");
  const u = await prisma.user.update({
    where: { id: userId },
    data: { role: role || null, updated_by: admin.id, updated_at: new Date() },
  });
  await logAudit("Users", u.id, "UPDATE", { role });
  revalidatePath("/admin/users");
}

export async function createOrganization(formData: FormData) {
  await requireRole(["org:admin"]);
  const o = await prisma.organization.create({
    data: {
      name: str(formData.get("name")),
      clerk_id: str(formData.get("clerk_id")),
      disabled: formData.get("disabled") === "on",
      created_by: await actorId(),
      created_at: new Date(),
    },
  });
  await logAudit("Organizations", o.id, "INSERT", o);
  revalidatePath("/admin/organizations");
}

export async function updateOrganization(id: string, formData: FormData) {
  const admin = await requireRole(["org:admin"]);
  const o = await prisma.organization.update({
    where: { id },
    data: {
      name: str(formData.get("name")),
      clerk_id: str(formData.get("clerk_id")),
      disabled: formData.get("disabled") === "on",
      updated_by: admin.id,
      updated_at: new Date(),
    },
  });
  await logAudit("Organizations", o.id, "UPDATE", o);
  revalidatePath("/admin/organizations");
}

export async function setOrganizationDisabled(id: string, disabled: boolean) {
  const admin = await requireRole(["org:admin"]);
  if (id === DEMO_ORGANIZATION_ID && disabled) {
    throw new Error("You cannot disable the active organization");
  }
  const o = await prisma.organization.update({
    where: { id },
    data: { disabled, updated_by: admin.id, updated_at: new Date() },
  });
  await logAudit("Organizations", o.id, "UPDATE", { disabled });
  revalidatePath("/admin/organizations");
}

export async function createEngagementType(formData: FormData) {
  await requireRole(["org:admin"]);
  const t = await prisma.engagementType.create({
    data: {
      ...(await scope()),
      name: str(formData.get("name")),
      description: str(formData.get("description")),
      disabled: formData.get("disabled") === "on",
    },
  });
  await logAudit("Engagement Types", t.id, "INSERT", t);
  revalidatePath("/admin/engagement-types");
}

export async function createPeriod(formData: FormData) {
  await requireRole(["org:admin"]);
  const p = await prisma.annualAuditPlanPeriod.create({
    data: {
      ...(await scope()),
      name: str(formData.get("name")),
      description: str(formData.get("description")),
      start_date: date(formData.get("start_date")),
      end_date: date(formData.get("end_date")),
    },
  });
  await logAudit("Annual Audit Plan Periods", p.id, "INSERT", p);
  revalidatePath("/admin/periods");
}

export async function createDeclaration(formData: FormData) {
  await requireRole(["org:admin"]);
  const text = str(formData.get("declaration_text"));
  const d = await prisma.declaration.create({
    data: {
      ...(await scope()),
      declaration_text: text,
      custom_text: str(formData.get("custom_text")) ?? text,
      prescribed: formData.get("prescribed") === "on",
      declaration_section_id: str(formData.get("declaration_section_id")),
    },
  });
  await logAudit("Declarations", d.id, "INSERT", d);
  revalidatePath("/admin/declarations");
}

export async function updateDeclaration(id: string, formData: FormData) {
  const u = await requireRole(["org:admin"]);
  const text = str(formData.get("declaration_text"));
  const d = await prisma.declaration.update({
    where: { id },
    data: {
      declaration_text: text,
      custom_text: str(formData.get("custom_text")) ?? text,
      prescribed: formData.get("prescribed") === "on",
      declaration_section_id: str(formData.get("declaration_section_id")),
      updated_by: u.id, updated_at: new Date(),
    },
  });
  await logAudit("Declarations", d.id, "UPDATE", d);
  revalidatePath("/admin/declarations");
}

export async function createDeclarationSection(formData: FormData) {
  await requireRole(["org:admin"]);
  const name = str(formData.get("name"));
  const s = await prisma.declarationSection.create({
    data: {
      ...(await scope()),
      name,
      custom_name: str(formData.get("custom_name")) ?? name,
      description: str(formData.get("description")),
      prescribed: formData.get("prescribed") === "on",
    },
  });
  await logAudit("Declaration Sections", s.id, "INSERT", s);
  revalidatePath("/admin/declarations");
}

export async function updateDeclarationSection(id: string, formData: FormData) {
  const u = await requireRole(["org:admin"]);
  const name = str(formData.get("name"));
  const s = await prisma.declarationSection.update({
    where: { id },
    data: {
      name,
      custom_name: str(formData.get("custom_name")) ?? name,
      description: str(formData.get("description")),
      prescribed: formData.get("prescribed") === "on",
      updated_by: u.id, updated_at: new Date(),
    },
  });
  await logAudit("Declaration Sections", s.id, "UPDATE", s);
  revalidatePath("/admin/declarations");
}

/** Toggle disabled on a row from the combined declarations grid — id is "sec:{id}" or "dec:{id}". */
export async function setDeclRowDisabled(rowId: string, disabled: boolean) {
  const admin = await requireRole(["org:admin"]);
  const [kind, id] = rowId.split(":", 2);
  const model = kind === "sec" ? prisma.declarationSection : kind === "dec" ? prisma.declaration : null;
  if (!model || !id) throw new Error("Unknown declaration row");
  await (model as typeof prisma.declaration).update({
    where: { id },
    data: { disabled, updated_by: admin.id, updated_at: new Date() },
  });
  await logAudit(kind === "sec" ? "Declaration Sections" : "Declarations", id, "UPDATE", { disabled });
  revalidatePath("/admin/declarations");
}

export async function addDelegatedPreparer(formData: FormData) {
  await requireRole(["org:admin"]);
  const userId = str(formData.get("user_id"));
  if (userId) {
    const u = await prisma.user.update({ where: { id: userId }, data: { role: "org:delegated_preparer" } });
    await logAudit("Users", u.id, "UPDATE", u);
  }
  revalidatePath("/admin/delegated-preparers");
  revalidatePath("/admin/users");
}

export async function createGuidingDocument(formData: FormData) {
  await requireRole(["org:admin", "org:chief_audit_executive"]);
  const g = await prisma.guidingDocument.create({
    data: { ...(await scope()), name: str(formData.get("name")), description: str(formData.get("description")), files: fileMeta(formData) },
  });
  await saveFiles("guiding_document", g.id, formData);
  await logAudit("Guiding Documents", g.id, "INSERT", g);
  revalidatePath("/guiding-documents");
}

const fileMeta = (formData: FormData) =>
  formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .map((f) => ({ name: f.name, size: f.size, type: f.type }));

export async function createPlanningTemplate(formData: FormData) {
  await requireRole(["org:admin", "org:chief_audit_executive"]);
  const t = await prisma.planningDocumentTemplate.create({
    data: {
      ...(await scope()),
      name: str(formData.get("name")),
      reference: str(formData.get("reference")),
      required: formData.get("required") === "on",
      files: fileMeta(formData),
    },
  });
  await saveFiles("planning_template", t.id, formData);
  await logAudit("Planning Document Templates", t.id, "INSERT", t);
  revalidatePath("/templates/planning");
}

export async function createReportTemplate(formData: FormData) {
  await requireRole(["org:admin", "org:chief_audit_executive"]);
  const t = await prisma.reportDocumentTemplate.create({
    data: {
      ...(await scope()),
      name: str(formData.get("name")),
      reference: str(formData.get("reference")),
      required: formData.get("required") === "on",
      files: fileMeta(formData),
    },
  });
  await saveFiles("report_template", t.id, formData);
  await logAudit("Report Document Templates", t.id, "INSERT", t);
  revalidatePath("/templates/reporting");
}

// ---------- file storage ----------
async function saveFiles(entityType: string, entityId: string, formData: FormData) {
  const b = await scope();
  const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file
  for (const f of formData.getAll("files")) {
    if (f instanceof File && f.size > 0) {
      if (f.size > MAX_FILE_BYTES) throw new Error(`File "${f.name}" exceeds the 25 MB limit`);
      await prisma.storedFile.create({
        data: { ...b, name: f.name, mime_type: f.type || null, size: f.size, data: Buffer.from(await f.arrayBuffer()), entity_type: entityType, entity_id: entityId },
      });
    }
  }
}

// ---------- stage documents & sign-off ----------
const stageModels = {
  planning: "engagementPlanningDocument",
  fieldwork: "engagementFieldworkDocument",
  report: "engagementReportDocument",
  declaration: "engagementAuditorDeclaration",
  finding: "engagementFindingAndRecommendations",
  program: "engagementAuditProgramItem",
} as const;
type Stage = keyof typeof stageModels;

async function auditorFor(engagementId: string, userId: string) {
  let a = await prisma.engagementAuditor.findFirst({
    where: { engagement_id: engagementId, user_id: userId, deleted: false },
  });
  if (!a) {
    const u = await prisma.user.findUnique({ where: { id: userId } });
    a = await prisma.engagementAuditor.create({
      data: {
        ...(await scope()),
        engagement_id: engagementId,
        user_id: userId,
        position_on_audit: u?.role === "org:chief_audit_executive" ? "CAE" : "AUDITOR",
      },
    });
  }
  return a;
}

export async function createStageDocument(stage: "planning" | "fieldwork" | "report", engagementId: string, formData: FormData) {
  const b = await scope();
  const data = {
    ...b,
    engagement_id: engagementId,
    name: str(formData.get("name")),
    document_reference: str(formData.get("reference")),
    description: str(formData.get("description")),
    type: str(formData.get("type")) ?? "CUSTOM",
    files: fileMeta(formData),
  };
  const doc =
    stage === "planning"
      ? await prisma.engagementPlanningDocument.create({ data: { ...data, link: str(formData.get("link")) } })
      : stage === "fieldwork"
        ? await prisma.engagementFieldworkDocument.create({ data })
        : await prisma.engagementReportDocument.create({ data: { ...data, link: str(formData.get("link")) } });
  await saveFiles(`${stage}_document`, doc.id, formData);
  await logAudit("Engagement Documents", doc.id, "INSERT", doc);
  revalidatePath(`/engagements/${engagementId}`);
}

export async function createAuditProgramItem(engagementId: string, formData: FormData) {
  const b = await scope();
  const i = await prisma.engagementAuditProgramItem.create({
    data: {
      ...b,
      engagement_id: engagementId,
      risk_reference: str(formData.get("risk_reference")),
      risk: str(formData.get("risk")),
      audit_objective: str(formData.get("audit_objective")),
      audit_procedure: str(formData.get("audit_procedure")),
    },
  });
  await logAudit("Engagement Audit Program Items", i.id, "INSERT", i);
  revalidatePath(`/engagements/${engagementId}/audit-program`);
}

export async function createFinding(engagementId: string, formData: FormData) {
  const b = await scope();
  const f = await prisma.engagementFindingAndRecommendations.create({
    data: {
      ...b,
      engagement_id: engagementId,
      detailed_finding: str(formData.get("detailed_finding")),
      root_cause: str(formData.get("root_cause")),
      recommendations: str(formData.get("recommendations")),
      management_comment: str(formData.get("management_comment")),
      engagement_fieldwork_document_id: str(formData.get("fieldwork_document_id")),
    },
  });
  await logAudit("Engagement Finding And Recommendations", f.id, "INSERT", f);
  revalidatePath(`/engagements/${engagementId}/fieldwork`);
  revalidatePath(`/engagements/${engagementId}/findings-and-recommendations`);
}

/** Master-data save: update engagement fields + replace audit team rows. */
export async function updateEngagement(engagementId: string, payload: {
  engagement_name: string;
  engagement_number: string;
  annual_audit_plan_id: string | null;
  planned_engagement_id: string | null;
  engagement_type_id: string | null;
  start_date: string | null;
  end_date: string | null;
  engagement_budget: number | null;
  engagement_spend: number | null;
  outsourced_party_id: string | null;
  authorise: boolean;
  team: { user_id: string; position: string; qualifications?: string; experience?: string }[];
}) {
  const user = await requireUser();
  const mayAuthorise = payload.authorise && canAuthorise(user);
  const e = await prisma.engagement.update({
    where: { id: engagementId },
    data: {
      engagement_name: payload.engagement_name || null,
      engagement_number: payload.engagement_number || null,
      annual_audit_plan_id: payload.annual_audit_plan_id,
      planned_engagement_id: payload.planned_engagement_id,
      engagement_type_id: payload.engagement_type_id,
      start_date: date(payload.start_date),
      end_date: date(payload.end_date),
      engagement_budget: payload.engagement_budget,
      engagement_spend: payload.engagement_spend,
      updated_by: user.id,
      authorised_by_id: mayAuthorise ? user.id : undefined,
      authorised_date: mayAuthorise ? new Date() : undefined,
    },
  });
  // Replace team: soft-delete removed auditors, upsert kept/new ones (position = uniqueness key)
  const wanted = [
    ...(payload.outsourced_party_id
      ? [{ user_id: payload.outsourced_party_id, position_on_audit: "OUTSOURCED_PARTY", qualifications: null, experience: null }]
      : []),
    ...payload.team.map((t) => ({
      user_id: t.user_id, position_on_audit: t.position,
      qualifications: t.qualifications || null, experience: t.experience || null,
    })),
  ];
  const existing = await prisma.engagementAuditor.findMany({ where: { engagement_id: engagementId, deleted: false } });
  const wantedKeys = new Set(wanted.map((w) => `${w.user_id}:${w.position_on_audit}`));
  const b = await scope();
  for (const ex of existing) {
    if (!wantedKeys.has(`${ex.user_id}:${ex.position_on_audit}`)) {
      await prisma.engagementAuditor.update({ where: { id: ex.id }, data: { deleted: true, deleted_by: user.id, deleted_at: new Date() } });
    }
  }
  for (const w of wanted) {
    const match = existing.find((ex) => ex.user_id === w.user_id && ex.position_on_audit === w.position_on_audit);
    if (match) {
      await prisma.engagementAuditor.update({ where: { id: match.id }, data: { qualifications: w.qualifications, experience: w.experience, updated_by: user.id } });
    } else {
      await prisma.engagementAuditor.create({ data: { ...b, engagement_id: engagementId, ...w } });
    }
  }
  await logAudit("Engagement", engagementId, "UPDATE", payload);
  await ensureStageDocs(engagementId);
  revalidatePath(`/engagements/${engagementId}`);
}

/** Live app auto-creates A1-A4 planning docs and D1-D3 report docs per engagement. */
export async function ensureStageDocs(engagementId: string) {
  const b = await scope();
  const planning = [
    ["A1", "Audit Engagement Plan"], ["A2", "Information Request"],
    ["A3", "System Documentation"], ["A4", "Audit Program"],
  ];
  const reporting = [
    ["D1", "Schedule of Findings and Recommendations"],
    ["D2", "Draft Internal Audit Report"], ["D3", "Final Internal Audit Report"],
  ];
  for (const [ref, name] of planning) {
    const ex = await prisma.engagementPlanningDocument.findFirst({ where: { engagement_id: engagementId, document_reference: ref, deleted: false } });
    if (!ex) {
      await prisma.engagementPlanningDocument.create({ data: { ...b, engagement_id: engagementId, document_reference: ref, name, description: name, type: "CUSTOM", files: [] } });
    }
  }
  for (const [ref, name] of reporting) {
    const ex = await prisma.engagementReportDocument.findFirst({ where: { engagement_id: engagementId, document_reference: ref, deleted: false } });
    if (!ex) {
      await prisma.engagementReportDocument.create({ data: { ...b, engagement_id: engagementId, document_reference: ref, name, description: name, type: "CUSTOM", files: [] } });
    }
  }
}

/** Confirm/toggle a declaration cell for an auditor (the declarations matrix). */
export async function confirmDeclaration(engagementId: string, engagementAuditorId: string, declarationId: string) {
  const user = await requireUser();
  const b = await scope();
  const ex = await prisma.engagementAuditorDeclaration.findFirst({
    where: { engagement_id: engagementId, engagement_auditor_id: engagementAuditorId, declaration_id: declarationId, deleted: false },
  });
  if (ex) {
    await prisma.engagementAuditorDeclaration.update({
      where: { id: ex.id },
      data: { confirmation_date: ex.confirmation_date ? null : new Date(), updated_by: user.id },
    });
  } else {
    await prisma.engagementAuditorDeclaration.create({
      data: { ...b, engagement_id: engagementId, engagement_auditor_id: engagementAuditorId, declaration_id: declarationId, confirmation_date: new Date() },
    });
  }
  await logAudit("Engagement Auditor Declarations", ex?.id ?? `${engagementAuditorId}/${declarationId}`, "UPDATE", { confirmed: !ex?.confirmation_date });
  revalidatePath(`/engagements/${engagementId}/auditor-declarations`);
}

/** Create a review note linked to a stage document. */
export async function createReviewNote(engagementId: string, stage: "planning" | "fieldwork" | "report" | "program", formData: FormData) {
  const user = await requireUser();
  const aud = await auditorFor(engagementId, user.id);
  const b = await scope();
  const note = await prisma.reviewNote.create({
    data: {
      ...b,
      engagement_id: engagementId,
      note: str(formData.get("note")),
      reviewer_engagement_auditor_id: aud.id,
    },
  });
  const docId = str(formData.get("document_id"));
  const join = { ...b, review_note_id: note.id };
  if (stage === "planning") await prisma.planningDocumentReviewNote.create({ data: { ...join, engagement_planning_document_id: docId } });
  else if (stage === "fieldwork") await prisma.fieldworkDocumentReviewNote.create({ data: { ...join, engagement_fieldwork_document_id: docId } });
  else if (stage === "report") await prisma.reportDocumentReviewNote.create({ data: { ...join, engagement_report_document_id: docId } });
  else await prisma.auditProgramItemReviewNote.create({ data: { ...join, engagement_audit_program_item_id: docId } });
  await logAudit("Review Notes", note.id, "INSERT", note);
  revalidatePath(`/engagements/${engagementId}`);
}

/** Advance a review note: open → cleared → verified (verify = CAE/admin). */
export async function advanceReviewNote(engagementId: string, noteId: string, step: "clear" | "verify") {
  const user = await requireUser();
  const aud = await auditorFor(engagementId, user.id);
  const data = step === "clear"
    ? { cleared_date: new Date(), cleared_by_engagement_auditor_id: aud.id, updated_by: user.id }
    : { verified_date: new Date(), verified_by_engagement_auditor_id: aud.id, verified_by_cae_id: user.id, updated_by: user.id };
  if (step === "verify" && !canAuthorise(user)) throw new Error("Only Admin or CAE can verify review notes");
  await prisma.reviewNote.update({ where: { id: noteId }, data });
  await logAudit("Review Notes", noteId, "UPDATE", data);
  revalidatePath(`/engagements/${engagementId}`);
}

export async function createDeclarationAssignment(engagementId: string, formData: FormData) {
  await requireRole(["org:admin", "org:chief_audit_executive"]);
  const b = await scope();
  const d = await prisma.engagementAuditorDeclaration.create({
    data: {
      ...b,
      engagement_id: engagementId,
      declaration_id: str(formData.get("declaration_id")),
      engagement_auditor_id: str(formData.get("engagement_auditor_id")),
    },
  });
  await logAudit("Engagement Auditor Declarations", d.id, "INSERT", d);
  revalidatePath(`/engagements/${engagementId}/auditor-declarations`);
}

/** Next sign-off step on a stage row: prepare → review → authorise */
export async function signoffDoc(
  stage: Stage,
  id: string,
  engagementId: string,
  step: "prepare" | "review" | "authorise",
  reviewerId?: string,
) {
  const user = await requireUser();
  const aud = await auditorFor(engagementId, user.id);
  let data: Record<string, unknown> = { updated_by: user.id };
  if (step === "prepare") {
    data = stage === "declaration"
      ? { ...data, confirmation_date: new Date() }
      : { ...data, prepared_by_engagement_auditor_id: aud.id, prepared_date: new Date() };
  } else if (step === "review") {
    if (stage === "declaration" || stage === "finding") throw new Error("This item has no review step");
    data = { ...data, nominated_reviewer_id: reviewerId ?? aud.id };
  } else {
    if (!canAuthorise(user)) throw new Error("Only Admin or CAE can authorise");
    data = { ...data, authorised_by_engagement_auditor_id: aud.id, authorised_date: new Date() };
  }
  const model = stageModels[stage];
  const updated =
    stage === "planning" ? await prisma.engagementPlanningDocument.update({ where: { id }, data })
    : stage === "fieldwork" ? await prisma.engagementFieldworkDocument.update({ where: { id }, data })
    : stage === "report" ? await prisma.engagementReportDocument.update({ where: { id }, data })
    : stage === "finding" ? await prisma.engagementFindingAndRecommendations.update({ where: { id }, data })
    : stage === "program" ? await prisma.engagementAuditProgramItem.update({ where: { id }, data })
    : await prisma.engagementAuditorDeclaration.update({ where: { id }, data });
  await logAudit(model, id, "UPDATE", { step, ...data });
  revalidatePath(`/engagements/${engagementId}`);
  return updated;
}

// ---------- risk assessment ----------
export async function createRiskAssessment(formData: FormData) {
  const il = Number(formData.get("inherent_likelihood")) || null;
  const ii = Number(formData.get("inherent_impact")) || null;
  const rl = Number(formData.get("residual_likelihood")) || null;
  const ri = Number(formData.get("residual_impact")) || null;
  const uid = await actorId();
  const r = await prisma.riskAssessment.create({
    data: {
      ...(await scope()),
      auditable_entity: str(formData.get("auditable_entity")),
      risk_description: str(formData.get("risk_description")),
      risk_category: str(formData.get("risk_category")),
      inherent_likelihood: il,
      inherent_impact: ii,
      inherent_score: il && ii ? il * ii : null,
      existing_controls: str(formData.get("existing_controls")),
      residual_likelihood: rl,
      residual_impact: ri,
      residual_score: rl && ri ? rl * ri : null,
      linked_planned_engagement_id: str(formData.get("linked_planned_engagement_id")),
      assessed_by_id: uid,
      assessed_date: new Date(),
    },
  });
  await logAudit("Risk Assessments", r.id, "INSERT", r);
  revalidatePath("/risk-assessment");
}

// ---------- corrective actions (follow-up) ----------
export async function createCorrectiveAction(formData: FormData) {
  const a = await prisma.correctiveAction.create({
    data: {
      ...(await scope()),
      finding_id: str(formData.get("finding_id")),
      action_description: str(formData.get("action_description")),
      owner_user_id: str(formData.get("owner_user_id")),
      due_date: date(formData.get("due_date")),
      status: "OPEN",
      progress: 0,
    },
  });
  await logAudit("Corrective Actions", a.id, "INSERT", a);
  revalidatePath("/follow-up");
}

export async function updateCorrectiveAction(id: string, formData: FormData) {
  const user = await requireUser();
  const status = str(formData.get("status"));
  const data: Record<string, unknown> = { updated_by: user.id, status, progress: Number(formData.get("progress")) || 0 };
  if (status === "IMPLEMENTED") data.implemented_date = new Date();
  if (status === "VERIFIED") {
    if (!canAuthorise(user)) throw new Error("Only Admin or CAE can verify actions");
    data.verified_by_id = user.id;
    data.verified_date = new Date();
  }
  const a = await prisma.correctiveAction.update({ where: { id }, data });
  await logAudit("Corrective Actions", id, "UPDATE", { status });
  revalidatePath("/follow-up");
  return a;
}

// ---------- tasks & scheduling ----------
export async function createTask(formData: FormData) {
  const t = await prisma.task.create({
    data: {
      ...(await scope()),
      title: str(formData.get("title")),
      description: str(formData.get("description")),
      engagement_id: str(formData.get("engagement_id")),
      stage: str(formData.get("stage")),
      assignee_user_id: str(formData.get("assignee_user_id")),
      due_date: date(formData.get("due_date")),
      status: "OPEN",
    },
  });
  await logAudit("Tasks", t.id, "INSERT", t);
  revalidatePath("/tasks");
}

export async function updateTaskStatus(id: string, status: string) {
  const uid = await actorId();
  const t = await prisma.task.update({
    where: { id },
    data: { status, completed_date: status === "DONE" ? new Date() : null, updated_by: uid },
  });
  await logAudit("Tasks", id, "UPDATE", { status });
  revalidatePath("/tasks");
  return t;
}

// ---------- resource allocation ----------
export async function createTimeEntry(formData: FormData) {
  const t = await prisma.timeEntry.create({
    data: {
      ...(await scope()),
      user_id: str(formData.get("user_id")),
      engagement_id: str(formData.get("engagement_id")),
      work_date: date(formData.get("work_date")),
      hours: Number(formData.get("hours")) || null,
      description: str(formData.get("description")),
    },
  });
  await logAudit("Time Entries", t.id, "INSERT", t);
  revalidatePath("/resources");
}

export async function createExpense(formData: FormData) {
  const e = await prisma.expense.create({
    data: {
      ...(await scope()),
      engagement_id: str(formData.get("engagement_id")),
      user_id: str(formData.get("user_id")),
      description: str(formData.get("description")),
      amount: Number(formData.get("amount")) || null,
      expense_date: date(formData.get("expense_date")),
    },
  });
  await logAudit("Expenses", e.id, "INSERT", e);
  revalidatePath("/resources");
}

// ---------- api keys (integration) ----------
export async function createApiKey(formData: FormData) {
  await requireRole(["org:admin"]);
  const { createHash, randomBytes } = await import("node:crypto");
  const plain = `pk_${randomBytes(24).toString("hex")}`;
  const requested = formData.getAll("scopes").map(String).filter((s) => API_SCOPES.includes(s));
  const k = await prisma.apiKey.create({
    data: {
      ...(await scope()),
      name: str(formData.get("name")),
      key_hash: createHash("sha256").update(plain).digest("hex"),
      scopes: requested.length ? requested : API_SCOPES,
      expires_at: date(formData.get("expires_at")),
    },
  });
  await logAudit("Api Keys", k.id, "INSERT", { name: k.name, scopes: k.scopes });
  revalidatePath("/admin/api-keys");
  return { key: plain };
}

export async function revokeApiKey(id: string) {
  await requireRole(["org:admin"]);
  const uid = await actorId();
  await prisma.apiKey.update({ where: { id }, data: { disabled: true, updated_by: uid } });
  await logAudit("Api Keys", id, "UPDATE", { disabled: true });
  revalidatePath("/admin/api-keys");
}

