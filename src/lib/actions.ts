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

export async function logAudit(table: string, recordId: string, op: string, values: unknown) {
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
  let logo_file_id: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const sf = await prisma.storedFile.create({
      data: {
        organization_id: DEMO_ORGANIZATION_ID,
        created_by: admin.id,
        updated_by: admin.id,
        name: logo.name,
        mime_type: logo.type || "image/png",
        size: logo.size,
        data: Buffer.from(await logo.arrayBuffer()),
        entity_type: "organization_logo",
        entity_id: id,
      },
    });
    logo_file_id = sf.id;
  }
  const o = await prisma.organization.update({
    where: { id },
    data: {
      name: str(formData.get("name")),
      clerk_id: str(formData.get("clerk_id")),
      address: str(formData.get("address")),
      contact_email: str(formData.get("contact_email")),
      contact_phone: str(formData.get("contact_phone")),
      website: str(formData.get("website")),
      registration_number: str(formData.get("registration_number")),
      ...(logo_file_id ? { logo_file_id } : {}),
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
      wp_ref: str(formData.get("wp_ref")),
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
const RISK_ROLES = ["org:admin", "org:chief_audit_executive", "org:member"];

function riskData(formData: FormData) {
  const il = Number(formData.get("inherent_likelihood")) || null;
  const ii = Number(formData.get("inherent_impact")) || null;
  const rl = Number(formData.get("residual_likelihood")) || null;
  const ri = Number(formData.get("residual_impact")) || null;
  return {
    auditable_entity: str(formData.get("auditable_entity")),
    risk_description: str(formData.get("risk_description")),
    risk_category: str(formData.get("risk_category")),
    inherent_likelihood: il,
    inherent_impact: ii,
    inherent_score: il && ii ? il * ii : null,
    existing_controls: str(formData.get("existing_controls")),
    control_effectiveness: str(formData.get("control_effectiveness")),
    residual_likelihood: rl,
    residual_impact: ri,
    residual_score: rl && ri ? rl * ri : null,
    linked_planned_engagement_id: str(formData.get("linked_planned_engagement_id")),
    risk_owner_id: str(formData.get("risk_owner_id")),
    strategic_objective_id: str(formData.get("strategic_objective_id")),
    status: str(formData.get("status")) ?? "OPEN",
    next_review_date: date(formData.get("next_review_date")),
  };
}

export async function createRiskAssessment(formData: FormData) {
  await requireRole(RISK_ROLES);
  const uid = await actorId();
  const r = await prisma.riskAssessment.create({
    data: {
      ...(await scope()),
      ...riskData(formData),
      risk_ref: str(formData.get("risk_ref")),
      source: "INTERNAL_AUDIT",
      assessed_by_id: uid,
      assessed_date: new Date(),
    },
  });
  await logAudit("Risk Assessments", r.id, "INSERT", r);
  revalidatePath("/risk-assessment");
}

/** Re-assessment: updates risk fields; the audit log captures old→new as history. */
export async function updateRiskAssessment(id: string, formData: FormData) {
  await requireRole(RISK_ROLES);
  const uid = await actorId();
  const old = await prisma.riskAssessment.findUnique({ where: { id } });
  if (!old) return;
  const data = riskData(formData);
  await prisma.riskAssessment.update({ where: { id }, data: { ...data, updated_by: uid, updated_at: new Date() } });
  const changed: Record<string, { old: unknown; new: unknown }> = {};
  for (const [k, v] of Object.entries(data)) {
    const o = (old as Record<string, unknown>)[k];
    if (String(o ?? "") !== String(v ?? "")) changed[k] = { old: o ?? null, new: v ?? null };
  }
  if (Object.keys(changed).length) await logAudit("Risk Assessments", id, "UPDATE", changed);
  revalidatePath("/risk-assessment");
  revalidatePath(`/risk-assessment/${id}`);
}

/** Risk → plan: creates a proposed engagement under the chosen audit-plan period and covers the risk. */
export async function addRiskToPlan(riskId: string, planId: string) {
  await requireRole(RISK_ROLES);
  const r = await prisma.riskAssessment.findUnique({ where: { id: riskId } });
  if (!r || r.linked_planned_engagement_id) return;
  const uid = await actorId();
  const pe = await prisma.plannedEngagement.create({
    data: {
      organization_id: r.organization_id,
      annual_audit_plan_id: planId,
      name: `Audit of ${r.auditable_entity ?? "auditable entity"}`,
      objectives: r.risk_description,
      created_by: uid,
      created_at: new Date(),
    },
  });
  await prisma.riskAssessment.update({ where: { id: riskId }, data: { linked_planned_engagement_id: pe.id, updated_by: uid, updated_at: new Date() } });
  await logAudit("Planned Engagements", pe.id, "INSERT", { from_risk: riskId, name: pe.name });
  await logAudit("Risk Assessments", riskId, "UPDATE", { linked_planned_engagement_id: { old: null, new: pe.id } });
  revalidatePath("/risk-assessment");
  revalidatePath("/annual-audit-plan");
}

/** Register import — upserts on risk_ref so a re-import updates rather than duplicates. */
export async function importRiskRegister(rows: Record<string, unknown>[]) {
  await requireRole(RISK_ROLES);
  const uid = await actorId();
  const ctx = await scope();
  let created = 0, updated = 0, skipped = 0;
  for (const row of rows) {
    const entity = String(row.auditable_entity ?? "").trim();
    const desc = String(row.risk_description ?? "").trim();
    if (!entity || !desc) { skipped++; continue; }
    const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null; };
    const il = num(row.inherent_likelihood), ii = num(row.inherent_impact);
    const rl = num(row.residual_likelihood), ri = num(row.residual_impact);
    const data = {
      auditable_entity: entity,
      risk_description: desc,
      risk_category: String(row.risk_category ?? "") || null,
      inherent_likelihood: il, inherent_impact: ii, inherent_score: il && ii ? il * ii : null,
      existing_controls: String(row.existing_controls ?? "") || null,
      control_effectiveness: String(row.control_effectiveness ?? "") || null,
      residual_likelihood: rl, residual_impact: ri, residual_score: rl && ri ? rl * ri : null,
      source: "IMPORTED",
    };
    const ref = String(row.risk_ref ?? "").trim();
    const existing = ref ? await prisma.riskAssessment.findFirst({ where: { risk_ref: ref, deleted: false } }) : null;
    if (existing) {
      await prisma.riskAssessment.update({ where: { id: existing.id }, data: { ...data, updated_by: uid, updated_at: new Date() } });
      await logAudit("Risk Assessments", existing.id, "UPDATE", { ...data, import_source: "register" });
      updated++;
    } else {
      const r = await prisma.riskAssessment.create({ data: { ...ctx, ...data, risk_ref: ref || null, assessed_by_id: uid, assessed_date: new Date(), created_by: uid, created_at: new Date() } });
      await logAudit("Risk Assessments", r.id, "INSERT", { ...data, import_source: "register" });
      created++;
    }
  }
  await logAudit("Risk Assessments", "register-import", "IMPORT", { created, updated, skipped });
  revalidatePath("/risk-assessment");
  return { created, updated, skipped };
}

/** Audit-log a register export (called after the client-side xlsx download). */
export async function logRiskExport(count: number) {
  const uid = await actorId();
  await prisma.auditLog.create({
    data: { organization_id: DEMO_ORGANIZATION_ID, schema_name: "public", table_name: "Risk Assessments", record_id: "register-export", operation_type: "EXPORT", user_id: uid, timestamp: new Date(), original_values: {}, new_values: { rows: count, format: "xlsx" }, query: "risk-export" },
  });
}

export async function createStrategicObjective(formData: FormData) {
  await requireRole(["org:admin"]);
  const o = await prisma.strategicObjective.create({
    data: { ...(await scope()), name: str(formData.get("name")), description: str(formData.get("description")), sort_order: Number(formData.get("sort_order")) || null },
  });
  await logAudit("Strategic Objectives", o.id, "INSERT", o);
  revalidatePath("/admin/strategic-objectives");
}

export async function createRiskRatingBand(formData: FormData) {
  await requireRole(["org:admin"]);
  const b = await prisma.riskRatingBand.create({
    data: {
      ...(await scope()),
      label: str(formData.get("label")),
      min_score: Number(formData.get("min_score")) || null,
      max_score: Number(formData.get("max_score")) || null,
      color: str(formData.get("color")),
      sort_order: Number(formData.get("sort_order")) || null,
    },
  });
  await logAudit("Risk Rating Bands", b.id, "INSERT", b);
  revalidatePath("/admin/risk-bands");
}

// ---------- corrective actions (follow-up) ----------
export async function createCorrectiveAction(formData: FormData) {
  const a = await prisma.correctiveAction.create({
    data: {
      ...(await scope()),
      finding_id: str(formData.get("finding_id")),
      action_description: str(formData.get("action_description")),
      source: str(formData.get("source")) ?? "INTERNAL_AUDIT",
      ag_reference: str(formData.get("ag_reference")),
      ag_report_year: Number(formData.get("ag_report_year")) || null,
      management_response: str(formData.get("management_response")),
      management_comments: str(formData.get("management_comments")),
      owner_user_id: str(formData.get("owner_user_id")),
      supervisor_user_id: str(formData.get("supervisor_user_id")),
      due_date: date(formData.get("due_date")),
      original_due_date: date(formData.get("due_date")),
      status: "OPEN",
      progress: 0,
    },
  });
  await logAudit("Corrective Actions", a.id, "INSERT", a);
  revalidatePath("/follow-up");
}

/**
 * Progress / field updates + status transitions.
 * IMPLEMENTED is gated: progress must be 100 AND at least one evidence file
 * must be attached to the action in the document repository.
 */
const CA_ORDER = ["OPEN", "IN_PROGRESS", "IMPLEMENTED", "VERIFIED"];

export async function updateCorrectiveAction(id: string, formData: FormData) {
  const user = await requireUser();
  const status = str(formData.get("status"));
  const current = await prisma.correctiveAction.findUnique({ where: { id } });
  if (!current) throw new Error("Action not found");

  // Progress is only written when explicitly provided — a status-only
  // update must never wipe it back to 0.
  const data: Record<string, unknown> = {
    updated_by: user.id,
    management_comments: str(formData.get("management_comments")) ?? current.management_comments,
  };
  if (formData.get("progress") != null && formData.get("progress") !== "") {
    data.progress = Number(formData.get("progress"));
  }

  if (status) {
    const from = CA_ORDER.indexOf(current.status ?? "OPEN");
    const to = CA_ORDER.indexOf(status);
    if (to > CA_ORDER.indexOf("IMPLEMENTED") && current.status !== "IMPLEMENTED") {
      throw new Error("An action must be Implemented before it can be Verified");
    }
    if (status === "IMPLEMENTED") {
      const evidence = await prisma.storedFile.count({ where: { entity_type: "corrective-action", entity_id: id, deleted: false } });
      const prog = data.progress ?? current.progress ?? 0;
      if (Number(prog) < 100 || evidence === 0) {
        throw new Error(`Cannot mark Implemented — requires 100% done (currently ${prog}%) and at least one evidence file (${evidence} attached).`);
      }
      data.status = status;
      data.progress = 100;
      data.implemented_date = new Date();
    } else if (status === "VERIFIED") {
      throw new Error("Use Verify action — verification records outcome, verifier and comments");
    } else if (to >= 0 && to > from) {
      data.status = status;
    } else if (to >= 0 && to < from) {
      data.status = status; // reopen/rollback allowed (logged below)
    }
  }
  const a = await prisma.correctiveAction.update({ where: { id }, data });
  await logAudit("Corrective Actions", id, "UPDATE", { ...(data.status ? { status: { old: current.status, new: data.status } } : {}), ...(data.progress != null ? { progress: { old: current.progress, new: data.progress } } : {}) });
  revalidatePath("/follow-up");
  return a;
}

/**
 * IA verification of an implemented action — segregation of duties:
 * the verifier cannot be the action owner. NOT_EFFECTIVE reopens it.
 */
export async function verifyCorrectiveAction(id: string, formData: FormData) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only Internal Audit (Admin/CAE) can verify actions");
  const a = await prisma.correctiveAction.findUnique({ where: { id } });
  if (!a) throw new Error("Action not found");
  if (a.owner_user_id === user.id) throw new Error("The action owner cannot verify their own action — segregation of duties");
  if (a.status !== "IMPLEMENTED") throw new Error("Only Implemented actions can be verified");
  const evidence = await prisma.storedFile.count({ where: { entity_type: "corrective-action", entity_id: id, deleted: false } });
  if (evidence === 0) throw new Error("Cannot verify — no evidence file is attached to this action");
  if ((a.progress ?? 0) < 100) throw new Error(`Cannot verify — the action is ${a.progress ?? 0}% done, not 100%`);

  const outcome = str(formData.get("outcome")) ?? "EFFECTIVE";
  const comments = str(formData.get("verification_comments"));
  const effective = outcome === "EFFECTIVE";
  await prisma.correctiveAction.update({
    where: { id },
    data: {
      status: effective ? "VERIFIED" : "OPEN",
      verified_by_id: user.id,
      verified_date: new Date(),
      verification_outcome: outcome,
      verification_comments: comments,
      reopened_reason: effective ? null : str(formData.get("reopened_reason")) ?? "Verification outcome: Not Effective",
      updated_by: user.id,
      updated_at: new Date(),
    },
  });
  await logAudit("Corrective Actions", id, "UPDATE", { verification: { outcome, comments, verified_by: user.id } });
  revalidatePath("/follow-up");
}

/** Revised due date — requires a reason; the approver is the supervisor or a CAE/admin. */
export async function reviseDueDate(id: string, formData: FormData) {
  const user = await requireUser();
  const a = await prisma.correctiveAction.findUnique({ where: { id } });
  if (!a) throw new Error("Action not found");
  const reason = str(formData.get("revision_reason"));
  if (!reason) throw new Error("A reason is required to revise the due date");
  const isApprover = canAuthorise(user) || a.supervisor_user_id === user.id;
  if (!isApprover) throw new Error("Only the supervisor or CAE/admin can approve a due-date revision");
  const due = date(formData.get("due_date"));
  if (!due) throw new Error("New due date required");
  await prisma.correctiveAction.update({
    where: { id },
    data: {
      due_date: due,
      original_due_date: a.original_due_date ?? a.due_date,
      revision_count: (a.revision_count ?? 0) + 1,
      revision_reason: reason,
      revision_approved_by: user.id,
      updated_by: user.id,
      updated_at: new Date(),
    },
  });
  await logAudit("Corrective Actions", id, "UPDATE", { due_date: { old: a.due_date, new: due }, reason });
  revalidatePath("/follow-up");
}

/** Evidence upload for a corrective action — goes into the document repository. */
export async function uploadActionEvidence(id: string, formData: FormData) {
  const user = await requireUser();
  await saveFiles("corrective-action", id, formData);
  await logAudit("Corrective Actions", id, "EVIDENCE", { uploaded_by: user.id, files: formData.getAll("files").map((f) => (f as File).name) });
  revalidatePath(`/follow-up/${id}`);
}

/** Reopen a verified action (Internal Audit only) with a reason. */
export async function reopenCorrectiveAction(id: string, formData: FormData) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only Internal Audit (Admin/CAE) can reopen actions");
  const reason = str(formData.get("reopened_reason")) ?? "Reopened by Internal Audit";
  await prisma.correctiveAction.update({
    where: { id },
    data: { status: "OPEN", reopened_reason: reason, updated_by: user.id, updated_at: new Date() },
  });
  await logAudit("Corrective Actions", id, "UPDATE", { status: { old: "VERIFIED", new: "OPEN" }, reason });
  revalidatePath(`/follow-up/${id}`);
}

// ---------- working papers ----------
export async function addWorkingPaper(engagementId: string, formData: FormData) {
  const user = await requireUser();
  const wp = await prisma.workingPaper.create({
    data: {
      ...(await scope()),
      engagement_id: engagementId,
      reference: str(formData.get("reference")),
      title: str(formData.get("title")),
      preparer_id: str(formData.get("preparer_id")) ?? user.id,
      prepared_date: new Date(),
      status: "PREPARED",
    },
  });
  await saveFiles("working_paper", wp.id, formData);
  await logAudit("Working Papers", wp.id, "INSERT", wp);
  revalidatePath(`/engagements/${engagementId}/working-papers`);
}

export async function reviewWorkingPaper(id: string, engagementId: string, approve: boolean, comment?: string) {
  const user = await requireUser();
  const wp = await prisma.workingPaper.findUnique({ where: { id } });
  if (!wp) throw new Error("Working paper not found");
  if (wp.preparer_id === user.id) throw new Error("The preparer cannot review their own working paper");
  if (!canAuthorise(user) && wp.reviewer_id !== user.id) throw new Error("Only a supervisor can review working papers");
  await prisma.workingPaper.update({
    where: { id },
    data: {
      status: approve ? "APPROVED" : "SENT_BACK",
      reviewer_id: user.id,
      reviewed_date: new Date(),
      review_comment: comment ?? null,
      updated_by: user.id,
    },
  });
  await logAudit("Working Papers", id, approve ? "APPROVE" : "SEND_BACK", { by: user.id, comment });
  revalidatePath(`/engagements/${engagementId}/working-papers`);
}

export async function approveWorkingPaperForm(id: string, engagementId: string) { await reviewWorkingPaper(id, engagementId, true); }
export async function sendBackWorkingPaperForm(id: string, engagementId: string, formData: FormData) {
  await reviewWorkingPaper(id, engagementId, false, str(formData.get("comment")) ?? undefined);
}

export async function uploadWorkingPaperFiles(id: string, engagementId: string, formData: FormData) {
  await requireUser();
  await saveFiles("working_paper", id, formData);
  revalidatePath(`/engagements/${engagementId}/working-papers`);
}

export async function markWorkingPaperReviewed(id: string, engagementId: string) {
  const user = await requireUser();
  const wp = await prisma.workingPaper.findUnique({ where: { id } });
  if (!wp) throw new Error("Working paper not found");
  if (wp.preparer_id === user.id) throw new Error("The preparer cannot mark their own paper as reviewed");
  await prisma.workingPaper.update({ where: { id }, data: { status: "REVIEWED", reviewer_id: user.id, reviewed_date: new Date() } });
  await logAudit("Working Papers", id, "REVIEW", { by: user.id });
  revalidatePath(`/engagements/${engagementId}/working-papers`);
}

/** Save engagement objectives and scope. */
export async function updateEngagementScope(engagementId: string, formData: FormData) {
  const user = await requireUser();
  await prisma.engagement.update({
    where: { id: engagementId },
    data: { objectives: str(formData.get("objectives")), scope_text: str(formData.get("scope_text")), updated_by: user.id },
  });
  await logAudit("Engagement", engagementId, "UPDATE", { objectives: formData.get("objectives"), scope_text: formData.get("scope_text"), by: user.id });
  revalidatePath(`/engagements/${engagementId}/planning`);
}

/** Approve the planning stage of an engagement (supervisor only). */
export async function approveEngagementPlanning(engagementId: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can approve the planning");
  const e = await prisma.engagement.findUnique({ where: { id: engagementId } });
  if (e?.prepared_by_id === user.id) throw new Error("The preparer cannot approve their own planning");
  await prisma.engagement.update({ where: { id: engagementId }, data: { planning_approved_by: user.id, planning_approved_date: new Date() } });
  await logAudit("Engagements", engagementId, "APPROVE_PLANNING", { by: user.id });
  revalidatePath(`/engagements/${engagementId}/planning`);
}

/** Approve the engagement report (supervisor only, not the preparer). */
export async function approveEngagementReport(engagementId: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can approve the report");
  const e = await prisma.engagement.findUnique({ where: { id: engagementId } });
  if (e?.prepared_by_id === user.id) throw new Error("The preparer cannot approve their own report");
  await prisma.engagement.update({ where: { id: engagementId }, data: { report_status: "APPROVED", report_approved_by: user.id, report_approved_date: new Date() } });
  await logAudit("Engagements", engagementId, "APPROVE_REPORT", { by: user.id });
  revalidatePath(`/engagements/${engagementId}/reporting`);
}

/** Bulk/manual reminder — queues a sent_email to the owner + supervisor. */
export async function sendActionReminder(id: string) {
  const user = await requireUser();
  const a = await prisma.correctiveAction.findUnique({ where: { id }, include: { r_owner: true, r_supervisor: true } });
  if (!a) return;
  const to = [a.r_owner?.email, a.r_supervisor?.email].filter(Boolean) as string[];
  if (!to.length) to.push("notifications@polaris.internal");
  await prisma.sentEmail.create({
    data: {
      resend_id: `manual-reminder:${id}:${Date.now()}`,
      from_email: "notifications@polaris.internal",
      to_emails: to,
      cc_emails: [],
      bcc_emails: [],
      subject: `[REMINDER] Corrective action due ${a.due_date?.toISOString().slice(0, 10) ?? "soon"}`,
      body: `Reminder: "${(a.action_description ?? "").slice(0, 140)}" — status ${a.status}, ${a.progress}% done, due ${a.due_date?.toISOString().slice(0, 10) ?? "—"}. Sent by ${user.first_name} ${user.last_name}.`,
      attachments: [],
      scheduled_at: new Date(),
      organization_id: DEMO_ORGANIZATION_ID,
      created_by: user.id,
      created_at: new Date(),
    },
  });
  await logAudit("Corrective Actions", id, "REMINDER", { to });
}

/** Reassign owner (bulk or single) — keeps full audit trail. */
export async function reassignCorrectiveAction(id: string, formData: FormData) {
  const user = await requireUser();
  const a = await prisma.correctiveAction.findUnique({ where: { id } });
  const newOwner = str(formData.get("owner_user_id"));
  if (!a || !newOwner) return;
  await prisma.correctiveAction.update({ where: { id }, data: { owner_user_id: newOwner, updated_by: user.id, updated_at: new Date() } });
  await logAudit("Corrective Actions", id, "UPDATE", { owner_user_id: { old: a.owner_user_id, new: newOwner } });
  revalidatePath("/follow-up");
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
      supervisor_user_id: str(formData.get("supervisor_user_id")),
      start_date: date(formData.get("start_date")),
      due_date: date(formData.get("due_date")),
      priority: str(formData.get("priority")),
      planned_hours: Number(formData.get("planned_hours")) || null,
      risk_id: str(formData.get("risk_id")),
      status: "OPEN",
    },
  });
  await logAudit("Tasks", t.id, "INSERT", t);
  revalidatePath("/tasks");
}

export async function updateTaskStatus(id: string, status: string) {
  const uid = await actorId();
  const t = await prisma.task.findUnique({ where: { id } });
  if (!t) throw new Error("Task not found");
  if (status === "DONE") throw new Error("Tasks are only Done when a supervisor approves them — use Ready for review");
  if (status === "IN_PROGRESS") {
    const pending = await prisma.taskDependency.findMany({ where: { task_id: id } });
    if (pending.length) {
      const preds = await prisma.task.findMany({ where: { id: { in: pending.map((p) => p.depends_on_task_id ?? "") } }, select: { status: true, title: true } });
      const open = preds.filter((p) => p.status !== "DONE");
      if (open.length) console.warn(`Started before predecessor done: ${open.map((p) => p.title).join(", ")}`);
    }
  }
  const updated = await prisma.task.update({
    where: { id },
    data: { status, updated_by: uid, updated_at: new Date() },
  });
  await logAudit("Tasks", id, "UPDATE", { status: { old: t.status, new: status } });
  revalidatePath("/tasks");
  return updated;
}

/** Assignee submits the task for supervisor review. */
export async function submitTaskForReview(id: string) {
  const user = await requireUser();
  const t = await prisma.task.findUnique({ where: { id } });
  if (!t) throw new Error("Task not found");
  if (t.assignee_user_id !== user.id && !canAuthorise(user)) throw new Error("Only the assignee can submit this task for review");
  await prisma.task.update({ where: { id }, data: { status: "IN_PROGRESS", review_status: "READY_FOR_REVIEW", updated_by: user.id, updated_at: new Date() } });
  await logAudit("Tasks", id, "SUBMIT_REVIEW", { by: user.id });
  revalidatePath("/tasks");
}

/** Supervisor approves (Done) or sends back with a comment. */
export async function reviewTask(id: string, approve: boolean, comment?: string) {
  const user = await requireUser();
  const t = await prisma.task.findUnique({ where: { id } });
  if (!t) throw new Error("Task not found");
  if (t.assignee_user_id === user.id) throw new Error("You cannot approve your own task");
  if (!canAuthorise(user) && t.supervisor_user_id !== user.id) throw new Error("Only the task supervisor can review it");
  if (t.review_status !== "READY_FOR_REVIEW") throw new Error("This task is not waiting for review");
  await prisma.task.update({
    where: { id },
    data: {
      status: approve ? "DONE" : "IN_PROGRESS",
      review_status: approve ? "APPROVED" : "RETURNED",
      reviewed_by: user.id,
      reviewed_date: new Date(),
      review_comment: comment ?? null,
      completed_date: approve ? new Date() : null,
      updated_by: user.id,
    },
  });
  await logAudit("Tasks", id, approve ? "APPROVE" : "RETURN", { by: user.id, comment });
  revalidatePath("/tasks");
}

export async function approveTaskForm(id: string) { await reviewTask(id, true); }
export async function sendBackTaskForm(id: string, formData: FormData) { await reviewTask(id, false, str(formData.get("comment")) ?? undefined); }

/** Add a dependency — blocks cycles. */
export async function addTaskDependency(taskId: string, dependsOn: string) {
  const user = await requireUser();
  if (taskId === dependsOn) throw new Error("A task cannot depend on itself");
  // Cycle check: walk depends_on chain from dependsOn; if we reach taskId, it's a cycle.
  const seen = new Set<string>();
  let frontier = [dependsOn];
  while (frontier.length) {
    const next = frontier.pop()!;
    if (next === taskId) throw new Error("This would create a circular dependency");
    if (seen.has(next)) continue;
    seen.add(next);
    const deps = await prisma.taskDependency.findMany({ where: { task_id: next } });
    frontier.push(...deps.map((d) => d.depends_on_task_id ?? "").filter(Boolean));
  }
  const dep = await prisma.taskDependency.create({ data: { task_id: taskId, depends_on_task_id: dependsOn } });
  await logAudit("Tasks", taskId, "DEPENDENCY", { depends_on: dependsOn });
  revalidatePath("/tasks");
  return dep;
}

/** Generate standard tasks from templates for an engagement. */
export async function generateStandardTasks(engagementId: string, formData: FormData) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can generate standard tasks");
  const eng = await prisma.engagement.findUnique({ where: { id: engagementId }, include: { teamMembers_engagement: { where: { deleted: false } } } });
  if (!eng) throw new Error("Engagement not found");
  const templates = await prisma.taskTemplate.findMany({ where: { deleted: false, OR: [{ engagement_type_id: eng.engagement_type_id }, { engagement_type_id: null }] }, orderBy: { sort: "asc" } });
  if (!templates.length) throw new Error("No task templates defined — ask Admin to add them");
  const base = eng.start_date ?? eng.created_at ?? new Date();
  const roleMap: Record<string, string | null> = {};
  for (const m of eng.teamMembers_engagement) if (m.role && !roleMap[m.role]) roleMap[m.role] = m.user_id;
  const lead = eng.teamMembers_engagement.find((m) => m.role === "LEAD")?.user_id ?? eng.teamMembers_engagement[0]?.user_id ?? null;
  let created = 0;
  for (const tp of templates) {
    if (await prisma.task.findFirst({ where: { engagement_id: engagementId, title: tp.title, deleted: false } })) continue;
    const due = new Date(base); due.setDate(due.getDate() + (tp.days_offset ?? 0));
    await prisma.task.create({
      data: {
        organization_id: eng.organization_id, created_by: user.id,
        title: tp.title, stage: tp.stage, engagement_id: engagementId,
        assignee_user_id: roleMap[tp.default_role ?? ""] ?? lead,
        supervisor_user_id: lead,
        due_date: due, planned_hours: tp.planned_hours, status: "OPEN",
      },
    });
    created++;
  }
  await logAudit("Tasks", engagementId, "GENERATE", { created });
  revalidatePath("/tasks");
  revalidatePath(`/engagements/${engagementId}/dashboard`);
}

// Finding lifecycle: OPEN → MANAGEMENT_RESPONSE → UNDER_REVIEW → CLEARED → CLOSED
const FINDING_STEPS = ["OPEN", "MANAGEMENT_RESPONSE", "UNDER_REVIEW", "CLEARED", "CLOSED"];

export async function updateFindingStatus(id: string, status: string) {
  const user = await requireUser();
  if (!FINDING_STEPS.includes(status)) throw new Error("Invalid status");
  const f = await prisma.engagementFindingAndRecommendations.findUnique({ where: { id } });
  if (!f) throw new Error("Finding not found");
  if ((status === "CLEARED" || status === "CLOSED") && !canAuthorise(user)) {
    throw new Error("Only Admin or CAE can clear or close findings");
  }
  // CLEARED stamps the authorise chain — resolve the session user's auditor record on this engagement
  let authorise: Record<string, unknown> = {};
  if (status === "CLEARED" && f.authorised_date == null && f.engagement_id) {
    const auditor = await prisma.engagementAuditor.findFirst({
      where: { engagement_id: f.engagement_id, user_id: user.id, deleted: false },
    });
    authorise = { authorised_date: new Date(), authorised_by_engagement_auditor_id: auditor?.id ?? null };
  }
  const updated = await prisma.engagementFindingAndRecommendations.update({
    where: { id },
    data: { status, ...authorise, updated_by: user.id },
  });
  await logAudit("Engagement Finding And Recommendations", id, "UPDATE", { status });
  revalidatePath(`/engagements/${f.engagement_id}/findings-and-recommendations`);
  return updated;
}

// ---------- resource allocation ----------
export async function createTimeEntry(formData: FormData) {
  const user = await requireUser();
  const userId = str(formData.get("user_id")) ?? user.id;
  const confirmed = str(formData.get("confirmed")) === "yes";
  const workDate = date(formData.get("work_date"));
  const hours = Number(formData.get("hours")) || 0;
  if (!confirmed && workDate) {
    const { timeEntryWarnings } = await import("@/lib/resource-logic");
    const holidays = new Set((await prisma.publicHoliday.findMany({ where: { deleted: false } })).map((h) => h.holiday_date?.toISOString().slice(0, 10) ?? ""));
    const warnings = timeEntryWarnings({ date: workDate, hours, holidays });
    if (warnings.length) throw new Error("CONFIRM:" + warnings.join(" "));
  }
  const t = await prisma.timeEntry.create({
    data: {
      ...(await scope()),
      user_id: userId,
      engagement_id: str(formData.get("engagement_id")),
      work_date: workDate,
      hours: hours || null,
      description: str(formData.get("description")),
      activity_type: str(formData.get("activity_type")),
      task_id: str(formData.get("task_id")),
      status: "DRAFT",
    },
  });
  await logAudit("Time Entries", t.id, "INSERT", t);
  revalidatePath("/resources");
}

export async function updateTimeEntry(id: string, formData: FormData) {
  const user = await requireUser();
  const t = await prisma.timeEntry.findUnique({ where: { id } });
  if (!t) throw new Error("Time entry not found");
  if (t.user_id !== user.id && !canAuthorise(user)) throw new Error("You can only change your own time entries");
  if (t.status === "APPROVED") throw new Error("This time entry is approved and locked — ask your supervisor to reopen the timesheet first");
  const data = {
    work_date: date(formData.get("work_date")) ?? t.work_date,
    hours: formData.get("hours") ? Number(formData.get("hours")) : t.hours,
    description: str(formData.get("description")) ?? t.description,
    activity_type: str(formData.get("activity_type")) ?? t.activity_type,
    updated_by: user.id,
    updated_at: new Date(),
  };
  await prisma.timeEntry.update({ where: { id }, data });
  await logAudit("Time Entries", id, "UPDATE", { old: { hours: t.hours, description: t.description, work_date: t.work_date }, new: data });
  revalidatePath("/resources");
}

export async function deleteTimeEntry(id: string) {
  const user = await requireUser();
  const t = await prisma.timeEntry.findUnique({ where: { id } });
  if (!t) throw new Error("Time entry not found");
  if (t.user_id !== user.id && !canAuthorise(user)) throw new Error("You can only remove your own time entries");
  if (t.status === "APPROVED") throw new Error("This time entry is approved and locked — ask your supervisor to reopen the timesheet first");
  await prisma.timeEntry.update({ where: { id }, data: { deleted: true, deleted_by: user.id, deleted_at: new Date() } });
  await logAudit("Time Entries", id, "DELETE", t);
  revalidatePath("/resources");
}

/** Submit a week of the caller's draft entries for approval. */
export async function submitTimesheet(weekStartIso: string) {
  const user = await requireUser();
  const ws = new Date(weekStartIso);
  let ts = await prisma.timesheet.findFirst({ where: { user_id: user.id, week_start: ws, deleted: false } });
  if (ts?.status === "APPROVED") throw new Error("This timesheet is already approved");
  if (!ts) ts = await prisma.timesheet.create({ data: { user_id: user.id, week_start: ws, organization_id: user.organization_id, created_by: user.id } });
  const we = new Date(ws); we.setDate(we.getDate() + 7);
  const n = await prisma.timeEntry.updateMany({
    where: { user_id: user.id, deleted: false, status: { in: ["DRAFT", "RETURNED"] }, work_date: { gte: ws, lt: we } },
    data: { timesheet_id: ts.id, status: "SUBMITTED", updated_by: user.id, updated_at: new Date() },
  });
  await prisma.timesheet.update({ where: { id: ts.id }, data: { status: "SUBMITTED", submitted_date: new Date() } });
  await logAudit("Timesheets", ts.id, "SUBMIT", { week_start: weekStartIso, entries: n.count });
  revalidatePath("/resources");
}

export async function approveTimesheet(id: string, approve: boolean, comment?: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can approve timesheets");
  const ts = await prisma.timesheet.findUnique({ where: { id } });
  if (!ts) throw new Error("Timesheet not found");
  if (ts.user_id === user.id) throw new Error("You cannot approve your own timesheet");
  const status = approve ? "APPROVED" : "RETURNED";
  await prisma.timesheet.update({ where: { id }, data: { status, approved_by: user.id, approved_date: new Date(), comment: comment ?? null } });
  await prisma.timeEntry.updateMany({ where: { timesheet_id: id }, data: { status, updated_by: user.id, updated_at: new Date() } });
  await logAudit("Timesheets", id, approve ? "APPROVE" : "RETURN", { by: user.id, comment });
  revalidatePath("/resources");
}

export async function approveTimesheetForm(id: string) { await approveTimesheet(id, true); }
export async function approveExpenseForm(id: string) { await approveExpense(id, true); }
export async function approveLeaveForm(id: string) { await approveLeave(id, true); }
export async function rejectLeaveForm(id: string) { await approveLeave(id, false); }

export async function returnTimesheet(id: string, formData: FormData) {
  await approveTimesheet(id, false, str(formData.get("comment")) ?? undefined);
}

export async function rejectExpense(id: string, formData: FormData) {
  await approveExpense(id, false, str(formData.get("reason")) ?? undefined);
}

/** Supervisor reopens an approved timesheet with a reason. */
export async function reopenTimesheet(id: string, formData: FormData) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can reopen a timesheet");
  const reason = str(formData.get("reason")) ?? "Reopened by supervisor";
  await prisma.timesheet.update({ where: { id }, data: { status: "RETURNED", comment: reason } });
  await prisma.timeEntry.updateMany({ where: { timesheet_id: id }, data: { status: "RETURNED" } });
  await logAudit("Timesheets", id, "REOPEN", { by: user.id, reason });
  revalidatePath("/resources");
}

export async function createExpense(formData: FormData) {
  const user = await requireUser();
  const amount = Number(formData.get("amount")) || 0;
  const limitRow = await prisma.resourceSetting.findFirst({ where: { setting_key: "receipt_limit" } });
  const limit = Number(limitRow?.setting_value ?? 500);
  await saveFiles("expense_receipt", "pending", formData); // no-op unless files present
  const receiptCount = formData.getAll("files").filter((f) => f instanceof File && f.size > 0).length;
  if (amount > limit && receiptCount === 0) {
    throw new Error(`A receipt is required for amounts over ${fmtR(limit)} — this claim is ${fmtR(amount)}`);
  }
  const e = await prisma.expense.create({
    data: {
      ...(await scope()),
      engagement_id: str(formData.get("engagement_id")),
      user_id: str(formData.get("user_id")) ?? user.id,
      description: str(formData.get("description")),
      amount: amount || null,
      expense_date: date(formData.get("expense_date")),
      category: str(formData.get("category")),
      status: "CLAIMED",
    },
  });
  const files = formData.getAll("files");
  if (files.length) {
    for (const f of files) {
      if (f instanceof File && f.size > 0) {
        const sf = await prisma.storedFile.create({
          data: { ...(await scope()), name: f.name, mime_type: f.type || null, size: f.size, data: Buffer.from(await f.arrayBuffer()), entity_type: "expense", entity_id: e.id },
        });
        await prisma.expense.update({ where: { id: e.id }, data: { receipt_file_id: sf.id } });
      }
    }
  }
  await logAudit("Expenses", e.id, "INSERT", e);
  revalidatePath("/resources");
}

const fmtR = (n: number) => "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 2 }).replace(/,/g, " ");

export async function approveExpense(id: string, approve: boolean, reason?: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can approve expense claims");
  const e = await prisma.expense.findUnique({ where: { id } });
  if (!e) throw new Error("Expense not found");
  if (e.user_id === user.id) throw new Error("You cannot approve your own expense claim");
  await prisma.expense.update({
    where: { id },
    data: { status: approve ? "APPROVED" : "REJECTED", approved_by: user.id, approved_date: new Date(), rejection_reason: approve ? null : reason ?? "Rejected", updated_by: user.id },
  });
  await logAudit("Expenses", id, approve ? "APPROVE" : "REJECT", { by: user.id, reason });
  revalidatePath("/resources");
}

export async function markExpensePaid(id: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can mark expenses as paid");
  await prisma.expense.update({ where: { id }, data: { status: "PAID", updated_by: user.id } });
  await logAudit("Expenses", id, "PAID", { by: user.id });
  revalidatePath("/resources");
}

// ---------- team allocation, leave, budgets ----------
export async function addTeamMember(engagementId: string, formData: FormData) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can change the engagement team");
  const m = await prisma.engagementTeamMember.create({
    data: {
      ...(await scope()),
      engagement_id: engagementId,
      user_id: str(formData.get("user_id")),
      role: str(formData.get("role")),
      planned_hours: Number(formData.get("planned_hours")) || null,
      start_date: date(formData.get("start_date")),
      end_date: date(formData.get("end_date")),
    },
  });
  await logAudit("Engagement Team", m.id, "INSERT", m);
  revalidatePath(`/engagements/${engagementId}/dashboard`);
  revalidatePath("/resources");
}

export async function removeTeamMember(id: string, engagementId: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can change the engagement team");
  await prisma.engagementTeamMember.update({ where: { id }, data: { deleted: true, deleted_by: user.id, deleted_at: new Date() } });
  await logAudit("Engagement Team", id, "DELETE", {});
  revalidatePath(`/engagements/${engagementId}/dashboard`);
  revalidatePath("/resources");
}

export async function setEngagementBudget(engagementId: string, formData: FormData) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can set the budget");
  await prisma.engagement.update({
    where: { id: engagementId },
    data: { planned_hours: Number(formData.get("planned_hours")) || null, planned_expense_budget: Number(formData.get("planned_expense_budget")) || null, updated_by: user.id },
  });
  await logAudit("Engagements", engagementId, "UPDATE", { planned_hours: formData.get("planned_hours"), planned_expense_budget: formData.get("planned_expense_budget") });
  revalidatePath(`/engagements/${engagementId}/dashboard`);
  revalidatePath("/resources");
}

export async function requestLeave(formData: FormData) {
  const user = await requireUser();
  const l = await prisma.leaveRequest.create({
    data: {
      ...(await scope()),
      user_id: user.id,
      leave_type: str(formData.get("leave_type")),
      start_date: date(formData.get("start_date")),
      end_date: date(formData.get("end_date")),
      status: "REQUESTED",
      reason: str(formData.get("reason")),
    },
  });
  await logAudit("Leave", l.id, "INSERT", l);
  revalidatePath("/resources");
}

export async function approveLeave(id: string, approve: boolean) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can approve leave");
  const l = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!l) throw new Error("Leave request not found");
  if (l.user_id === user.id) throw new Error("You cannot approve your own leave request");
  await prisma.leaveRequest.update({ where: { id }, data: { status: approve ? "APPROVED" : "REJECTED", approved_by: user.id, approved_date: new Date() } });
  await logAudit("Leave", id, approve ? "APPROVE" : "REJECT", { by: user.id });
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
      key_prefix: plain.slice(0, 10),
      scopes: requested.length ? requested : API_SCOPES,
      expires_at: date(formData.get("expires_at")) ?? new Date(Date.now() + 90 * 86400_000),
    },
  });
  await logAudit("Api Keys", k.id, "INSERT", { name: k.name, scopes: k.scopes });
  revalidatePath("/admin/api-keys");
  return { key: plain };
}

export async function revokeApiKey(id: string) {
  await requireRole(["org:admin"]);
  const uid = await actorId();
  await prisma.apiKey.update({ where: { id }, data: { disabled: true, revoked_at: new Date(), updated_by: uid } });
  await logAudit("Api Keys", id, "UPDATE", { disabled: true, revoked_at: new Date() });
  revalidatePath("/admin/api-keys");
}

/** Hard-delete is only allowed on keys that are already revoked or expired. */
export async function deleteApiKey(id: string) {
  await requireRole(["org:admin"]);
  const k = await prisma.apiKey.findUnique({ where: { id } });
  if (!k || k.deleted) return;
  const expired = k.expires_at && k.expires_at < new Date();
  if (!k.disabled && !expired) throw new Error("Only revoked or expired keys can be deleted.");
  const uid = await actorId();
  await prisma.apiKey.update({ where: { id }, data: { deleted: true, deleted_at: new Date(), deleted_by: uid } });
  await logAudit("Api Keys", id, "DELETE", { name: k.name });
  revalidatePath("/admin/api-keys");
}


// ---------- document templates ----------
const templateModel = (kind: string) => (kind === "report" ? prisma.reportDocumentTemplate : prisma.planningDocumentTemplate);

async function snapshotTemplate(kind: string, t: { id: string; name: string | null; description: string | null; fields_json: unknown; version: number | null }, userId: string, approvedBy?: string | null) {
  await prisma.templateVersion.create({
    data: {
      template_id: t.id, template_kind: kind, version: t.version ?? 1,
      name: t.name, description: t.description,
      fields_json: (t.fields_json ?? []) as object,
      changed_by: userId, created_at: new Date(),
      approved_by: approvedBy ?? null, approved_date: approvedBy ? new Date() : null,
    },
  });
}

export async function updateTemplate(kind: string, id: string, formData: FormData) {
  const user = await requireUser();
  const m = templateModel(kind) as any;
  const t = await m.findUnique({ where: { id } });
  if (!t) throw new Error("Template not found");
  let fields: unknown = t.fields_json;
  try { const f = formData.get("fields_json"); if (f) fields = JSON.parse(String(f)); } catch { /* keep existing */ }
  const etVals = formData.getAll("et").map(String).filter(Boolean);
  const types = etVals.length ? etVals.join(",") : String(formData.get("engagement_types") ?? "");
  const nextVersion = (t.version ?? 1) + 1;
  await m.update({
    where: { id },
    data: {
      name: str(formData.get("name")) ?? t.name,
      description: str(formData.get("description")),
      required: formData.get("required") === "on" || formData.get("required") === "true",
      fields_json: fields as object,
      engagement_types: types ? types.split(",").filter(Boolean) : t.engagement_types,
      version: nextVersion,
      status: "DRAFT",
      updated_by: user.id, updated_at: new Date(),
    },
  });
  await saveFiles("template_logo_" + kind, id, formData);
  const updated = await m.findUnique({ where: { id } });
  await snapshotTemplate(kind, updated, user.id);
  await logAudit(kind === "report" ? "Report template" : "Document template", id, "UPDATE", { name: updated.name, version: nextVersion, by: user.id });
  revalidatePath("/templates");
}

export async function setTemplateLogo(kind: string, id: string, formData: FormData) {
  const user = await requireUser();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return;
  const f = files[0];
  const rec = await prisma.storedFile.create({
    data: { ...(await scope()), name: f.name, mime_type: f.type || null, size: f.size, data: Buffer.from(await f.arrayBuffer()), entity_type: "template_logo", entity_id: id },
  });
  await (templateModel(kind) as any).update({ where: { id }, data: { logo_file_id: rec.id, updated_by: user.id } });
  await logAudit("Document template", id, "UPDATE", { logo: f.name, by: user.id });
  revalidatePath("/templates");
}

export async function copyTemplate(kind: string, id: string, formData: FormData) {
  const user = await requireUser();
  const m = templateModel(kind) as any;
  const t = await m.findUnique({ where: { id } });
  if (!t) throw new Error("Template not found");
  const copy = await m.create({
    data: {
      ...(await scope()),
      name: str(formData.get("name")) ?? `${t.name} (copy)`,
      reference: str(formData.get("reference")) ?? `${t.reference}-copy`,
      required: t.required, files: [], section: t.section, status: "DRAFT", version: 1,
      description: t.description, fields_json: t.fields_json ?? undefined,
      engagement_types: t.engagement_types ?? undefined, logo_file_id: t.logo_file_id,
    },
  });
  await snapshotTemplate(kind, copy, user.id);
  await logAudit("Document template", copy.id, "INSERT", { copied_from: t.name, name: copy.name, by: user.id });
  revalidatePath("/templates");
}

export async function approveTemplate(kind: string, id: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can approve templates");
  const m = templateModel(kind) as any;
  const t = await m.findUnique({ where: { id } });
  if (!t) throw new Error("Template not found");
  if (t.updated_by === user.id && t.status === "DRAFT") throw new Error("The person who last edited a template cannot approve it");
  await m.update({ where: { id }, data: { status: "APPROVED", approved_by: user.id, approved_date: new Date() } });
  await snapshotTemplate(kind, { ...t, status: "APPROVED" }, user.id, user.id);
  await logAudit("Document template", id, "UPDATE", { status: "Approved", by: user.id });
  revalidatePath("/templates");
}

export async function retireTemplate(kind: string, id: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can retire templates");
  await (templateModel(kind) as any).update({ where: { id }, data: { status: "RETIRED", updated_by: user.id } });
  await logAudit("Document template", id, "UPDATE", { status: "Retired", by: user.id });
  revalidatePath("/templates");
}

export async function toggleTemplateRequired(kind: string, id: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can change the required flag");
  const m = templateModel(kind) as any;
  const t = await m.findUnique({ where: { id } });
  if (!t) throw new Error("Template not found");
  await m.update({ where: { id }, data: { required: !t.required, updated_by: user.id } });
  await logAudit("Document template", id, "UPDATE", { required: !t.required, by: user.id });
  revalidatePath("/templates");
}

/** Create a working paper pre-filled from an approved fieldwork template. */
export async function startWorkingPaperFromTemplate(engagementId: string, formData: FormData) {
  const user = await requireUser();
  const tplId = String(formData.get("template_id") ?? "");
  const tpl = await prisma.planningDocumentTemplate.findUnique({ where: { id: tplId } });
  if (!tpl || tpl.status !== "APPROVED") throw new Error("Choose an approved template");
  const count = await prisma.workingPaper.count({ where: { engagement_id: engagementId, deleted: false } });
  const wp = await prisma.workingPaper.create({
    data: {
      ...(await scope()),
      engagement_id: engagementId,
      reference: `WP-${String(count + 1).padStart(2, "0")}`,
      title: tpl.name,
      preparer_id: user.id,
      prepared_date: new Date(),
      status: "PREPARED",
      template_id: tpl.id,
      values_json: {},
    },
  });
  await logAudit("Working Papers", wp.id, "INSERT", { template: tpl.name, by: user.id });
  revalidatePath(`/engagements/${engagementId}/working-papers`);
}

// ---------- guiding documents ----------
const ALL_ROLES = ["org:admin", "org:chief_audit_executive", "org:member"];

export async function updateGuidingDocument(id: string, formData: FormData) {
  const user = await requireUser();
  const doc = await prisma.guidingDocument.findUnique({ where: { id } });
  if (!doc) throw new Error("Document not found");
  const edits = Array.isArray(doc.edit_roles) && (doc.edit_roles as string[]).length
    ? (doc.edit_roles as string[]).includes(user.role ?? "")
    : true;
  if (!edits && user.role !== "org:admin") throw new Error("You do not have edit access to this document");
  const viewRoles = formData.getAll("view_roles").map(String).filter(Boolean);
  const editRoles = formData.getAll("edit_roles").map(String).filter(Boolean);
  const engIds = formData.getAll("engagements").map(String).filter(Boolean);
  await prisma.guidingDocument.update({
    where: { id },
    data: {
      name: str(formData.get("name")) ?? doc.name,
      description: str(formData.get("description")),
      category: str(formData.get("category")) ?? doc.category,
      version: str(formData.get("version")) ?? doc.version,
      effective_date: formData.get("effective_date") ? new Date(String(formData.get("effective_date"))) : doc.effective_date,
      review_date: formData.get("review_date") ? new Date(String(formData.get("review_date"))) : doc.review_date,
      view_roles: viewRoles.length ? viewRoles : ALL_ROLES,
      edit_roles: editRoles,
      engagement_ids: engIds,
      updated_by: user.id, updated_at: new Date(),
    },
  });
  // propagate view rules to its files
  await prisma.storedFile.updateMany({
    where: { entity_type: "guiding_document", entity_id: id },
    data: { view_roles: viewRoles.length ? viewRoles : ALL_ROLES },
  });
  await logAudit("Guiding Documents", id, "UPDATE", { name: doc.name, by: user.id });
  revalidatePath("/guiding-documents");
}

export async function uploadDocumentVersion(id: string, formData: FormData) {
  const user = await requireUser();
  const doc = await prisma.guidingDocument.findUnique({ where: { id } });
  if (!doc) throw new Error("Document not found");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) throw new Error("Choose a file to upload");
  const f = files[0];
  const nextV = (doc.version_no ?? 1) + 1;
  const rec = await prisma.storedFile.create({
    data: {
      ...(await scope()), name: f.name, mime_type: f.type || null, size: f.size,
      data: Buffer.from(await f.arrayBuffer()),
      entity_type: "guiding_document", entity_id: id,
      view_roles: doc.view_roles ?? ALL_ROLES,
    },
  });
  await prisma.documentVersion.create({
    data: { document_id: id, version_no: nextV, file_id: rec.id, effective_date: doc.effective_date, review_date: doc.review_date, uploaded_by: user.id, created_at: new Date() },
  });
  await prisma.guidingDocument.update({ where: { id }, data: { version_no: nextV, version: str(formData.get("version")) ?? String(nextV), updated_by: user.id, approved_by: null, approved_date: null } });
  await logAudit("Guiding Documents", id, "UPDATE", { new_version: nextV, file: f.name, by: user.id });
  revalidatePath("/guiding-documents");
}

export async function approveGuidingDocument(id: string) {
  const user = await requireUser();
  if (!canAuthorise(user)) throw new Error("Only a supervisor can approve documents");
  const doc = await prisma.guidingDocument.findUnique({ where: { id } });
  if (!doc) throw new Error("Document not found");
  if (doc.updated_by === user.id) throw new Error("The person who last edited a document cannot approve it");
  await prisma.guidingDocument.update({ where: { id }, data: { approved_by: user.id, approved_date: new Date() } });
  await logAudit("Guiding Documents", id, "APPROVE", { name: doc.name, by: user.id });
  revalidatePath("/guiding-documents");
}

export async function acknowledgeDocument(id: string) {
  const user = await requireUser();
  const ex = await prisma.documentAcknowledgement.findFirst({ where: { document_id: id, user_id: user.id } });
  if (!ex) {
    await prisma.documentAcknowledgement.create({ data: { document_id: id, user_id: user.id, acked_at: new Date() } });
    const doc = await prisma.guidingDocument.findUnique({ where: { id }, select: { name: true } });
    await logAudit("Guiding Documents", id, "ACKNOWLEDGE", { name: doc?.name, by: user.id });
  }
  revalidatePath("/guiding-documents");
}

export async function bulkCreateGuidingDocuments(formData: FormData) {
  const user = await requireUser();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) throw new Error("Choose one or more files");
  const category = str(formData.get("category")) ?? "OTHER";
  const b = await scope();
  for (const f of files) {
    const doc = await prisma.guidingDocument.create({ data: { ...b, name: f.name.replace(/\.[^.]+$/, ""), description: `Uploaded ${new Date().toISOString().slice(0, 10)}`, category, files: [] } });
    await prisma.storedFile.create({
      data: { ...b, name: f.name, mime_type: f.type || null, size: f.size, data: Buffer.from(await f.arrayBuffer()), entity_type: "guiding_document", entity_id: doc.id, view_roles: ALL_ROLES },
    });
    await logAudit("Guiding Documents", doc.id, "INSERT", { name: doc.name, file: f.name, by: user.id });
  }
  revalidatePath("/guiding-documents");
}
