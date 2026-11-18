import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom } from "@/lib/api-auth";
import { moduleOf } from "@/lib/audit-display";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "auditlogs:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const url = new URL(req.url);
  const operation = url.searchParams.get("operation");
  const moduleParam = url.searchParams.get("module");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where = {
    organization_id: auth.org,
    ...(operation ? { operation_type: { contains: operation.toUpperCase() } } : {}),
    ...(moduleParam ? { table_name: { contains: moduleParam } } : {}),
    ...(from || to ? { timestamp: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    ...(q.q.updatedSince ? { timestamp: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["timestamp", "table_name"], "timestamp", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy, skip: (q.q.page - 1) * q.q.pageSize, take: q.q.pageSize }),
  ]);
  return listResponse(auth.requestId, rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    module: moduleOf(r.table_name),
    operation: r.operation_type,
    record: r.record_label,
    actor: r.actor_label ?? (r.user_id ? "user" : "System (automatic)"),
    details: r.new_values,
  })), total, q.q);
}
