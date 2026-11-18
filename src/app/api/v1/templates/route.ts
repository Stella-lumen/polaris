import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "templates:read");
  if ("error" in auth) return auth.error;
  const lq = listQuery(req, auth.requestId);
  if ("error" in lq) return lq.error;
  const q = lq.q;
  const url = new URL(req.url);
  const section = url.searchParams.get("section");   // planning | fieldwork | reporting
  const status = url.searchParams.get("status");     // draft | approved | retired
  const order = orderByFrom(q.sort, ["name", "reference", "updated_at"], "reference", auth.requestId);
  if (order instanceof NextResponse) return order;
  const where: Record<string, unknown> = { deleted: false, organization_id: auth.org };
  if (status) where.status = status.toUpperCase();
  const skip = { id: "none" };
  const [planning, report] = await Promise.all([
    prisma.planningDocumentTemplate.findMany({
      where: section === "reporting" ? skip : { ...where, ...(section === "fieldwork" ? { section: "fieldwork" } : section === "planning" ? { OR: [{ section: null }, { section: "planning" }] } : {}) },
      orderBy: order as object,
    }),
    prisma.reportDocumentTemplate.findMany({
      where: section && section !== "reporting" ? skip : where,
      orderBy: order as object,
    }),
  ]);
  const all = [
    ...planning.map((t) => ({ kind: t.section === "fieldwork" ? "fieldwork" : "planning", t })),
    ...report.map((t) => ({ kind: "reporting", t })),
  ];
  const rows = all.slice((q.page - 1) * q.pageSize, q.page * q.pageSize).map(({ kind, t }) => ({
    id: t.id,
    kind,
    reference: t.reference,
    name: t.name,
    description: t.description,
    version: t.version,
    status: t.status,
    required: t.required,
    engagement_types: t.engagement_types,
    fields: t.fields_json,
    approved_by: t.approved_by,
    approved_at: isoDateTime(t.approved_date),
    updated_at: isoDateTime(t.updated_at),
  }));
  return listResponse(auth.requestId, rows, all.length, q);
}
