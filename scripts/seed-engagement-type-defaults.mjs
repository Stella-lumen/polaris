// Seeds the four approved "Sample" SETA engagement types with their
// default templates, stage checklist and hour guide. Idempotent: skips
// any type name that already exists. Never touches existing types.
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const ORG = "demo-organization";
const ulid = () => randomBytes(12).toString("hex");

const T = {
  engagementPlan: "pdt-1", // Audit Engagement Plan
  infoRequest: "pdt-2", // Information Request
  systemDoc: "pdt-3", // System Documentation
  rcm: "01M7Q3V36PN61A5TQPCGXDJ760", // Risk and control matrix
  programme: "01M7Q3V36XSPFN30M42YA02WCA", // Audit programme
  testing: "01M7Q3V375PYV529C5VKNFNR06", // Testing sheet
  sampling: "01M7Q3V37BZG45TSJG3VSNJH99", // Sampling sheet
  draftReport: "rdt-1", // Draft Internal Audit Report
};

const TYPES = [
  {
    name: "Performance information",
    description: "Sample — audit of reported KPIs against source data (validity, reliability, consistency)",
    hours: 120,
    templates: { planning: T.engagementPlan, fieldwork: T.testing, reporting: T.draftReport },
    tasks: [
      ["Review strategic plan and annual performance plan", "Planning", 3, "AUDITOR", 8],
      ["Understand KPI definitions and the reporting system", "Planning", 7, "LEAD", 8],
      ["Test validity of reported results against source data", "Fieldwork", 20, "AUDITOR", 24],
      ["Test reliability and consistency of indicators", "Fieldwork", 28, "AUDITOR", 16],
      ["Draft findings sheet on KPI misstatements", "Reporting", 35, "AUDITOR", 8],
      ["Draft report for management comments", "Reporting", 40, "LEAD", 12],
      ["Verify management action on KPI findings", "Follow-up", 75, "AUDITOR", 8],
    ],
  },
  {
    name: "Compliance (POPIA and PFMA)",
    description: "Sample — compliance audit covering PFMA requirements and POPIA data-protection controls",
    hours: 120,
    templates: { planning: T.infoRequest, fieldwork: T.programme, reporting: T.draftReport },
    tasks: [
      ["Identify applicable legislation and regulations", "Planning", 3, "AUDITOR", 6],
      ["Confirm compliance requirements with management", "Planning", 7, "LEAD", 6],
      ["Test PFMA compliance — procurement and irregular expenditure", "Fieldwork", 21, "AUDITOR", 24],
      ["Test POPIA controls — lawful processing and safeguards", "Fieldwork", 28, "AUDITOR", 16],
      ["Compile compliance findings and contraventions", "Reporting", 35, "AUDITOR", 10],
      ["Draft compliance report", "Reporting", 42, "LEAD", 12],
      ["Confirm compliance corrective actions", "Follow-up", 70, "AUDITOR", 8],
    ],
  },
  {
    name: "Grants and discretionary funding",
    description: "Sample — audit of grant selection, disbursement and beneficiary monitoring",
    hours: 110,
    templates: { planning: T.engagementPlan, fieldwork: T.sampling, reporting: T.draftReport },
    tasks: [
      ["Review grant framework and beneficiary criteria", "Planning", 5, "AUDITOR", 8],
      ["Test beneficiary selection against the criteria", "Fieldwork", 21, "AUDITOR", 20],
      ["Verify disbursements and that conditions were met", "Fieldwork", 28, "AUDITOR", 20],
      ["Sample-check beneficiary monitoring reports", "Fieldwork", 35, "AUDITOR", 12],
      ["Draft findings on grant controls", "Reporting", 42, "AUDITOR", 10],
      ["Final report", "Reporting", 49, "LEAD", 10],
      ["Confirm recovery or monitoring actions", "Follow-up", 80, "AUDITOR", 6],
    ],
  },
  {
    name: "ICT general controls",
    description: "Sample — IT general controls: access, change management, backup and operations",
    hours: 130,
    templates: { planning: T.systemDoc, fieldwork: T.rcm, reporting: T.draftReport },
    tasks: [
      ["Understand the IT environment and change process", "Planning", 5, "AUDITOR", 10],
      ["Test access management — joiners, movers, leavers, privileged", "Fieldwork", 18, "AUDITOR", 20],
      ["Test change management", "Fieldwork", 25, "AUDITOR", 16],
      ["Test backups, recovery and operations", "Fieldwork", 32, "AUDITOR", 14],
      ["Draft ITGC findings and risk ratings", "Reporting", 40, "AUDITOR", 12],
      ["Final ITGC report", "Reporting", 48, "LEAD", 12],
      ["Verify remediation of IT findings", "Follow-up", 78, "AUDITOR", 8],
    ],
  },
];

async function fingerprint(table, recordId, op, userId, values, timestamp) {
  const prev = await prisma.auditLog.findFirst({
    where: { fingerprint: { not: null } },
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    select: { fingerprint: true },
  });
  return createHash("sha256")
    .update([prev?.fingerprint ?? "GENESIS", timestamp.toISOString(), table, recordId, op, userId ?? "system", JSON.stringify(values)].join("|"))
    .digest("hex");
}

const actor = await prisma.user.findFirst({ where: { role: "org:admin", deleted: false }, select: { id: true, first_name: true, last_name: true, email: true } });
const actorLabel = actor ? `${actor.first_name ?? ""} ${actor.last_name ?? ""}`.trim() || actor.email : "System (automatic)";
let created = 0;

for (const cfg of TYPES) {
  const existing = await prisma.engagementType.findFirst({ where: { name: cfg.name, deleted: false } });
  if (existing) {
    console.log(`skip (exists): ${cfg.name}`);
    continue;
  }
  const t = await prisma.engagementType.create({
    data: {
      organization_id: ORG,
      name: cfg.name,
      description: cfg.description,
      default_templates: cfg.templates,
      default_hours: cfg.hours,
      created_by: actor?.id ?? null,
      created_at: new Date(),
      updated_by: actor?.id ?? null,
      updated_at: new Date(),
    },
  });
  let sort = 0;
  for (const [title, stage, days, role, hours] of cfg.tasks) {
    await prisma.taskTemplate.create({
      data: {
        organization_id: ORG,
        engagement_type_id: t.id,
        title, stage, days_offset: days, default_role: role, planned_hours: hours, sort: ++sort, created_at: new Date(),
      },
    });
  }
  const timestamp = new Date();
  const values = { message: `Created sample engagement type "${cfg.name}" with ${cfg.tasks.length} checklist tasks and a ${cfg.hours}-hour guide` };
  const fp = await fingerprint("Engagement Types", t.id, "INSERT", actor?.id ?? null, values, timestamp);
  await prisma.auditLog.create({
    data: {
      organization_id: ORG, schema_name: "public", table_name: "Engagement Types",
      record_id: t.id, record_label: cfg.name, actor_label: actorLabel,
      operation_type: "INSERT", user_id: actor?.id ?? null, timestamp,
      original_values: {}, new_values: values, fingerprint: fp,
    },
  });
  console.log(`created: ${cfg.name} (${t.id}) — ${cfg.tasks.length} tasks`);
  created++;
}
console.log(`done — ${created} type(s) created, ${TYPES.length - created} skipped`);
await prisma.$disconnect();
