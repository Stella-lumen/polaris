import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "engagements:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status === "disabled" ? { disabled: true } : q.q.status ? { disabled: false } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["created_at", "updated_at"], "created_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows, signCounts, conflictCounts] = await Promise.all([
    prisma.declaration.count({ where }),
    prisma.declaration.findMany({
      where, orderBy, skip: (q.q.page - 1) * q.q.pageSize, take: q.q.pageSize,
      include: { r_declaration_section: { select: { name: true, custom_name: true } } },
    }),
    prisma.engagementAuditorDeclaration.groupBy({ by: ["declaration_id"], where: { deleted: false, OR: [{ status: "SIGNED" }, { status: "APPROVED" }] }, _count: true }),
    prisma.engagementAuditorDeclaration.groupBy({ by: ["declaration_id"], where: { deleted: false, status: "CONFLICT" }, _count: true }),
  ]);
  const signedByDecl = new Map(signCounts.map((c) => [c.declaration_id, c._count]));
  const conflictsByDecl = new Map(conflictCounts.map((c) => [c.declaration_id, c._count]));
  const data = rows.map((d) => ({
    id: d.id,
    section: d.r_declaration_section?.custom_name ?? d.r_declaration_section?.name ?? "Not assigned",
    text: d.custom_text ?? d.declaration_text,
    prescribed: d.prescribed,
    disabled: d.disabled,
    times_signed: signedByDecl.get(d.id) ?? 0,
    open_conflicts: conflictsByDecl.get(d.id) ?? 0,
    updated_at: d.updated_at,
  }));
  return listResponse(auth.requestId, data, total, q.q);
}
