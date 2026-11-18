import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "notifications:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const rows = await prisma.escalationRule.findMany({
    where: { deleted: false, organization_id: auth.org },
    orderBy: [{ entity_kind: "asc" }, { sort_order: "asc" }],
  });
  return listResponse(auth.requestId, rows.map((r) => ({
    id: r.id,
    applies_to: r.entity_kind ?? "corrective_action",
    trigger: r.trigger,
    days: r.days,
    notify_owner: r.notify_owner,
    notify_supervisor: r.notify_supervisor,
    notify_chief_audit_executive: r.notify_cae,
    notify_administrators: r.notify_hod,
  })), rows.length, q.q);
}
