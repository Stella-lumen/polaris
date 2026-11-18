import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom } from "@/lib/api-auth";
import { delegationWarning } from "@/lib/delegations";

const fullName = (u: { first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined) =>
  u ? [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email : null;

const SCOPE_LABELS: Record<string, string> = {
  AUDIT_PLANS: "Audit plans",
  WORKING_PAPERS: "Working papers",
  REPORTS: "Reports",
  RISK_ASSESSMENTS: "Risk assessments",
  ENGAGEMENT: "One engagement",
};

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "delegations:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status ? { status: q.q.status.toUpperCase() } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["created_at", "updated_at", "end_date"], "created_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.delegation.count({ where }),
    prisma.delegation.findMany({
      where, orderBy, skip: (q.q.page - 1) * q.q.pageSize, take: q.q.pageSize,
      include: {
        r_delegate: { select: { first_name: true, last_name: true, email: true } },
        r_principal: { select: { first_name: true, last_name: true, email: true } },
        r_engagement: { select: { engagement_name: true } },
      },
    }),
  ]);
  const data = rows.map((d) => ({
    id: d.id,
    delegate: fullName(d.r_delegate) ?? "Not assigned",
    prepares_for: fullName(d.r_principal) ?? "Not assigned",
    scope: d.scope_kind === "ENGAGEMENT"
      ? d.r_engagement?.engagement_name ?? "One engagement (not assigned)"
      : SCOPE_LABELS[d.scope_kind ?? ""] ?? "Not assigned",
    start_date: d.start_date,
    end_date: d.end_date,
    status: d.status ?? "ACTIVE",
    reason: d.reason ?? "Not assigned",
    warning: delegationWarning(d),
    updated_at: d.updated_at,
  }));
  return listResponse(auth.requestId, data, total, q.q);
}
