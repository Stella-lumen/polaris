import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { getSessionUser } from "@/lib/auth";
import { computeFingerprint } from "@/lib/audit-chain";

/** Resolves a plain record name for the Record column. Extend as modules grow. */
async function recordLabel(table: string, recordId: string): Promise<string | null> {
  const T = table.toLowerCase();
  try {
    if (T === "tasks") return (await prisma.task.findUnique({ where: { id: recordId }, select: { title: true } }))?.title ?? null;
    if (T === "corrective actions") return (await prisma.correctiveAction.findUnique({ where: { id: recordId }, select: { action_description: true } }))?.action_description?.slice(0, 80) ?? null;
    if (T === "audit plans" || T === "annual audit plan periods") return (await prisma.annualAuditPlan.findUnique({ where: { id: recordId }, select: { name: true } }))?.name ?? null;
    if (T === "planned engagements") return (await prisma.plannedEngagement.findUnique({ where: { id: recordId }, select: { name: true } }))?.name ?? null;
    if (T === "guiding documents") return (await prisma.guidingDocument.findUnique({ where: { id: recordId }, select: { name: true } }))?.name ?? null;
    if (T === "users") {
      const u = await prisma.user.findUnique({ where: { id: recordId }, select: { first_name: true, last_name: true, email: true } });
      return u ? (`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email) : null;
    }
    if (T === "risk assessments") return (await prisma.riskAssessment.findUnique({ where: { id: recordId }, select: { auditable_entity: true } }))?.auditable_entity ?? null;
    if (T === "engagements") return (await prisma.engagement.findUnique({ where: { id: recordId }, select: { engagement_name: true } }))?.engagement_name ?? null;
    if (T === "organizations") return (await prisma.organization.findUnique({ where: { id: recordId }, select: { name: true } }))?.name ?? null;
    if (T === "api keys") return (await prisma.apiKey.findUnique({ where: { id: recordId }, select: { name: true } }))?.name ?? null;
    if (T === "sent emails") return (await prisma.sentEmail.findUnique({ where: { id: recordId }, select: { subject: true } }))?.subject?.slice(0, 80) ?? null;
    if (T === "working papers") return (await prisma.workingPaper.findUnique({ where: { id: recordId }, select: { title: true } }))?.title ?? null;
    if (T === "document template") return (await prisma.planningDocumentTemplate.findUnique({ where: { id: recordId }, select: { name: true } }))?.name ?? (await prisma.reportDocumentTemplate.findUnique({ where: { id: recordId }, select: { name: true } }))?.name ?? null;
    if (T === "engagement types") return (await prisma.engagementType.findUnique({ where: { id: recordId }, select: { name: true } }))?.name ?? null;
    if (T === "escalation rules") return "Escalation rule";
    if (T === "email settings") return "Email delivery settings";
    if (T === "security") return "Sign-in";
    if (T === "engagement finding and recommendations") return "Finding";
  } catch {
    /* label is cosmetic — never block the log write */
  }
  return null;
}

/**
 * The single write path for the audit trail. Every call stamps who acted
 * (or "System (automatic)"), a plain record name, a tamper-evident
 * fingerprint chained to the previous entry, and the caller's IP/session.
 * Audit entries are add-only — nothing anywhere updates or deletes them.
 */
export async function logAudit(
  table: string,
  recordId: string,
  op: string,
  values: unknown,
  opts: { system?: boolean; recordLabel?: string; userId?: string; actorLabel?: string; originalValues?: unknown; note?: string } = {},
) {
  const user = opts.system ? null : await getSessionUser().catch(() => null);
  const uid = opts.userId ?? user?.id ?? null;
  const actor =
    opts.actorLabel ??
    (uid && user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email : null) ??
    "System (automatic)";

  let ip: string | null = null;
  let session: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    const cookie = h.get("cookie")?.match(/polaris_session=([^;]+)/)?.[1];
    if (cookie) session = createHash("sha256").update(cookie).digest("hex").slice(0, 12);
  } catch {
    /* headers() unavailable outside a request (e.g. scheduled jobs) */
  }

  const label = opts.recordLabel ?? (await recordLabel(table, recordId).catch(() => null));
  const timestamp = new Date();
  const prev = await prisma.auditLog.findFirst({
    where: { fingerprint: { not: null } },
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    select: { fingerprint: true },
  });
  const vals = JSON.parse(JSON.stringify(values ?? {}));
  const fingerprint = computeFingerprint({
    prev: prev?.fingerprint ?? null,
    timestamp: timestamp.toISOString(),
    table, recordId, op, userId: uid, values: JSON.stringify(vals),
  });

  await prisma.auditLog.create({
    data: {
      organization_id: DEMO_ORGANIZATION_ID,
      schema_name: "public",
      table_name: table,
      record_id: recordId,
      record_label: label,
      actor_label: actor,
      operation_type: op,
      user_id: uid,
      timestamp,
      original_values: JSON.parse(JSON.stringify(opts.originalValues ?? {})),
      new_values: vals,
      query: opts.note ?? null,
      fingerprint,
      ip_address: ip,
      session_id: session,
    },
  });
}
