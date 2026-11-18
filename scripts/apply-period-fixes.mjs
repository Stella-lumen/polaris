// Applies the user-approved Part-0 fixes: archives the engagement-title
// record and tags period_type on the records explicitly approved.
// Idempotent. Does NOT rename, fix dates, or touch any other record.
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();
const ORG = "demo-organization";

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

const actor = await prisma.user.findFirst({ where: { role: "org:admin", deleted: false } });
const actorLabel = actor ? `${actor.first_name ?? ""} ${actor.last_name ?? ""}`.trim() || actor.email : "System (automatic)";

const FIXES = [
  { id: "period-1", data: { status: "ARCHIVED" }, note: "archived — engagement title saved as a period" },
  { id: "period-2", data: { period_type: "QUARTER" }, note: "type set to quarter" },
  { id: "period-3", data: { period_type: "QUARTER" }, note: "type set to quarter" },
  { id: "period-4", data: { period_type: "QUARTER" }, note: "type set to quarter" },
  { id: "period-5", data: { period_type: "QUARTER" }, note: "type set to quarter" },
  { id: "period-6", data: { period_type: "QUARTER" }, note: "type set to quarter" },
  { id: "period-9", data: { period_type: "FY" }, note: "type set to financial year" },
  { id: "period-10", data: { period_type: "SPECIAL" }, note: "type set to special review" },
  { id: "period-11", data: { period_type: "SPECIAL" }, note: "type set to special review" },
];

for (const f of FIXES) {
  const p = await prisma.annualAuditPlanPeriod.findUnique({ where: { id: f.id } });
  if (!p) { console.log(`missing: ${f.id}`); continue; }
  const already = Object.entries(f.data).every(([k, v]) => p[k] === v);
  if (already) { console.log(`skip (already set): ${p.name}`); continue; }
  await prisma.annualAuditPlanPeriod.update({ where: { id: f.id }, data: { ...f.data, updated_by: actor?.id ?? null, updated_at: new Date() } });
  const timestamp = new Date();
  const values = { message: `${f.note === "archived — engagement title saved as a period" ? "Archived" : "Updated"} period "${p.name}" — ${f.note}` };
  const fp = await fingerprint("Annual Audit Plan Periods", f.id, "UPDATE", actor?.id ?? null, values, timestamp);
  await prisma.auditLog.create({
    data: {
      organization_id: ORG, schema_name: "public", table_name: "Annual Audit Plan Periods",
      record_id: f.id, record_label: p.name, actor_label: actorLabel,
      operation_type: "UPDATE", user_id: actor?.id ?? null, timestamp,
      original_values: {}, new_values: values, fingerprint: fp,
    },
  });
  console.log(`${f.note}: ${p.name}`);
}
await prisma.$disconnect();
console.log("done");
