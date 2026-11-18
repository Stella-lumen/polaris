import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "notifications:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const type = new URL(req.url).searchParams.get("type");
  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(type ? { entity_type: type } : {}),
    ...(q.q.status ? { delivery_status: q.q.status.toUpperCase() } : {}),
    ...(q.q.updatedSince ? { created_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["created_at", "subject"], "created_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.sentEmail.count({ where }),
    prisma.sentEmail.findMany({ where, orderBy, skip: (q.q.page - 1) * q.q.pageSize, take: q.q.pageSize }),
  ]);
  return listResponse(auth.requestId, rows.map((e) => ({
    id: e.id,
    created_at: e.created_at,
    type: e.entity_type,
    reason: e.reason_label,
    subject: e.subject,
    to: e.to_emails,
    cc: e.cc_emails,
    delivery_status: (e.delivery_status ?? "QUEUED").toLowerCase(),
    delivery_error: e.delivery_error,
    retry_count: e.retry_count,
    related_item_id: e.entity_id,
  })), total, q.q);
}
