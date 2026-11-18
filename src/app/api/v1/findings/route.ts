import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "findings:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status === "closed" ? { NOT: { authorised_date: null } } : {}),
    ...(q.q.status === "open" ? { authorised_date: null } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "prepared_date"], "updated_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.engagementFindingAndRecommendations.count({ where }),
    prisma.engagementFindingAndRecommendations.findMany({
      where,
      include: {
        r_engagement: { select: { id: true, engagement_name: true, engagement_number: true } },
        r_engagement_fieldwork_document: { select: { document_reference: true } },
        correctiveActions_finding: { select: { id: true, status: true, due_date: true } },
      },
      orderBy,
      skip: (q.q.page - 1) * q.q.pageSize,
      take: q.q.pageSize,
    }),
  ]);
  return listResponse(
    auth.requestId,
    rows.map((r) => ({
      id: r.id,
      detailed_finding: r.detailed_finding,
      root_cause: r.root_cause,
      recommendations: r.recommendations,
      management_comment: r.management_comment,
      status: (r.status ?? (r.authorised_date ? "CLOSED" : "OPEN")).toLowerCase(),
      engagement_id: r.engagement_id,
      engagement_name: r.r_engagement?.engagement_name ?? null,
      fieldwork_document_reference: r.r_engagement_fieldwork_document?.document_reference ?? null,
      prepared_date: isoDate(r.prepared_date),
      corrective_actions: r.correctiveActions_finding.map((c) => ({
        id: c.id, status: c.status, due_date: isoDate(c.due_date),
      })),
      updated_at: isoDateTime(r.updated_at),
    })),
    total,
    q.q,
  );
}
