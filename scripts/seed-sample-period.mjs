// Adds the approved sample period: "Sample 2027/28 financial year"
// (Closed — opens 1 April 2027; the 2026/27 FY is the current open one)
// plus its four quarters (Open). Idempotent — skips anything that exists.
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

const ROWS = [
  { name: "Sample 2027/28 financial year", description: "Sample — next financial year, opens 1 April 2027", type: "FY", status: "CLOSED", s: "2027-04-01", e: "2028-03-31" },
  { name: "2027/28 Quarter 1", description: "Sample — April to June 2027", type: "QUARTER", status: "OPEN", s: "2027-04-01", e: "2027-06-30" },
  { name: "2027/28 Quarter 2", description: "Sample — July to September 2027", type: "QUARTER", status: "OPEN", s: "2027-07-01", e: "2027-09-30" },
  { name: "2027/28 Quarter 3", description: "Sample — October to December 2027", type: "QUARTER", status: "OPEN", s: "2027-10-01", e: "2027-12-31" },
  { name: "2027/28 Quarter 4", description: "Sample — January to March 2028", type: "QUARTER", status: "OPEN", s: "2028-01-01", e: "2028-03-31" },
];

for (const r of ROWS) {
  const existing = await prisma.annualAuditPlanPeriod.findFirst({ where: { name: r.name, deleted: false } });
  if (existing) { console.log(`skip (exists): ${r.name}`); continue; }
  const p = await prisma.annualAuditPlanPeriod.create({
    data: {
      organization_id: ORG, name: r.name, description: r.description,
      period_type: r.type, status: r.status,
      start_date: new Date(r.s), end_date: new Date(r.e),
      created_by: actor?.id ?? null, created_at: new Date(),
      updated_by: actor?.id ?? null, updated_at: new Date(),
    },
  });
  const timestamp = new Date();
  const values = { message: `Created sample period "${r.name}"` };
  const fp = await fingerprint("Annual Audit Plan Periods", p.id, "INSERT", actor?.id ?? null, values, timestamp);
  await prisma.auditLog.create({
    data: {
      organization_id: ORG, schema_name: "public", table_name: "Annual Audit Plan Periods",
      record_id: p.id, record_label: r.name, actor_label: actorLabel,
      operation_type: "INSERT", user_id: actor?.id ?? null, timestamp,
      original_values: {}, new_values: values, fingerprint: fp,
    },
  });
  console.log(`created: ${r.name}`);
}
await prisma.$disconnect();
console.log("done");
