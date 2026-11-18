import { prisma } from "@/lib/db";
import { apiKeyAuth } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { isEffective } from "@/lib/declarations";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await apiKeyAuth(req, "engagements:read");
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const engagement = await prisma.engagement.findFirst({
    where: { id, deleted: false, organization_id: auth.org },
    select: { id: true, engagement_name: true },
  });
  if (!engagement) return NextResponse.json({ error: "Engagement not found" }, { status: 404 });

  const [auditors, activeDecls, signRows] = await Promise.all([
    prisma.engagementAuditor.findMany({
      where: { engagement_id: id, deleted: false },
      include: { r_user: { select: { id: true, first_name: true, last_name: true, email: true } } },
    }),
    prisma.declaration.findMany({ where: { deleted: false, disabled: false }, select: { id: true } }),
    prisma.engagementAuditorDeclaration.findMany({ where: { engagement_id: id, deleted: false } }),
  ]);

  const rowsByAud = new Map<string, typeof signRows>();
  for (const r of signRows) {
    if (!r.engagement_auditor_id) continue;
    if (!rowsByAud.has(r.engagement_auditor_id)) rowsByAud.set(r.engagement_auditor_id, []);
    rowsByAud.get(r.engagement_auditor_id)!.push(r);
  }

  const members = auditors.map((a) => {
    const mine = rowsByAud.get(a.id) ?? [];
    const effective = mine.filter((r) => isEffective(r) && r.declaration_id);
    const signedIds = new Set(effective.map((r) => r.declaration_id as string));
    const openConflicts = mine.filter((r) => r.status === "CONFLICT").length;
    return {
      name: a.r_user ? `${a.r_user.first_name ?? ""} ${a.r_user.last_name ?? ""}`.trim() || a.r_user.email : "Team member",
      position: a.position_on_audit,
      signed: signedIds.size,
      required: activeDecls.length,
      fully_signed: signedIds.size >= activeDecls.length && activeDecls.length > 0,
      open_conflicts: openConflicts,
      can_be_allocated: signedIds.size >= activeDecls.length && activeDecls.length > 0,
      last_signed: effective.map((r) => r.signed_at ?? r.confirmation_date).filter(Boolean).sort().pop() ?? null,
    };
  });

  const fullySigned = members.filter((m) => m.fully_signed).length;
  return NextResponse.json({
    data: {
      engagement: engagement.engagement_name,
      declarations_required: activeDecls.length,
      members_signed: `${fullySigned} of ${members.length}`,
      members,
    },
  });
}
