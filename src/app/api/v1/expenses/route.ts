import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "resources:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const url = new URL(req.url);
  const engagement = url.searchParams.get("engagement");
  const auditor = url.searchParams.get("auditor");
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(engagement ? { engagement_id: engagement } : {}),
    ...(auditor ? { user_id: auditor } : {}),
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "expense_date"], "updated_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: { r_user: { select: { first_name: true, last_name: true } }, r_engagement: { select: { engagement_name: true } } },
      orderBy,
      skip: (q.q.page - 1) * q.q.pageSize,
      take: q.q.pageSize,
    }),
  ]);
  return listResponse(
    auth.requestId,
    rows.map((r) => ({
      id: r.id,
      engagement_id: r.engagement_id,
      engagement_name: r.r_engagement?.engagement_name ?? null,
      claimed_by: r.r_user ? `${r.r_user.first_name} ${r.r_user.last_name}` : null,
      claimant_id: r.user_id,
      category: r.category,
      description: r.description,
      amount: r.amount != null ? Number(r.amount) : null,
      currency: "ZAR",
      expense_date: isoDate(r.expense_date),
      status: r.status,
      receipt_attached: !!r.receipt_file_id,
      approved_by: r.approved_by,
      approved_date: isoDate(r.approved_date),
      updated_at: isoDateTime(r.updated_at),
    })),
    total,
    q.q,
  );
}
