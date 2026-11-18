import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDate, isoDateTime } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "documents:read");
  if ("error" in auth) return auth.error;
  const lq = listQuery(req, auth.requestId);
  if ("error" in lq) return lq.error;
  const q = lq.q;
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search")?.toLowerCase();
  const order = orderByFrom(q.sort, ["name", "updated_at", "category"], "updated_at", auth.requestId);
  if (order instanceof NextResponse) return order;
  const where: Record<string, unknown> = { deleted: false, organization_id: auth.org };
  if (category) where.category = category.toUpperCase();
  let docs = await prisma.guidingDocument.findMany({ where, orderBy: order as object });
  if (search) docs = docs.filter((d) => [d.name, d.description, d.text_extract].some((x) => x?.toLowerCase().includes(search)));
  const total = docs.length;
  const rows = docs.slice((q.page - 1) * q.pageSize, q.page * q.pageSize).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    category: d.category,
    version: d.version,
    effective_date: isoDate(d.effective_date),
    review_date: isoDate(d.review_date),
    approved_by: d.approved_by,
    approved_at: isoDateTime(d.approved_date),
    linked_engagements: d.engagement_ids,
    updated_at: isoDateTime(d.updated_at),
  }));
  return listResponse(auth.requestId, rows, total, q);
}
