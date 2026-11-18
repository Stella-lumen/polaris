import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/actions";
import { NextResponse } from "next/server";

const esc = (s: string | null | undefined) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rand = (n: number | null | undefined) => (n == null ? "—" : `R ${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`);

export async function GET(_req: Request, { params }: { params: Promise<{ aap_id: string }> }) {
  const user = await requireUser();
  const { aap_id } = await params;
  const plan = await prisma.annualAuditPlan.findUnique({ where: { id: aap_id }, include: { r_period: true, r_prepared_by: true, r_authorised_by: true } });
  if (!plan) return new NextResponse("Not found", { status: 404 });
  const [planned, org, risks] = await Promise.all([
    prisma.plannedEngagement.findMany({ where: { annual_audit_plan_id: aap_id, deleted: false }, include: { r_engagement_type: true } }),
    plan.organization_id ? prisma.organization.findUnique({ where: { id: plan.organization_id }, select: { name: true, logo_file_id: true } }) : null,
    prisma.riskAssessment.findMany({ where: { deleted: false, linked_planned_engagement_id: { in: (await prisma.plannedEngagement.findMany({ where: { annual_audit_plan_id: aap_id }, select: { id: true } })).map((x) => x.id) } }, select: { linked_planned_engagement_id: true, auditable_entity: true } }),
  ]);
  const riskByPe = new Map(risks.map((r) => [r.linked_planned_engagement_id, r.auditable_entity]));
  const logo = org?.logo_file_id ? `<img src="/api/files/${org.logo_file_id}" style="height:60px" />` : "";
  const rows = planned.map((p) => `<tr><td>${esc(p.reference)}</td><td>${esc(p.name)}</td><td>${esc(p.r_engagement_type?.name)}</td><td>${esc(riskByPe.get(p.id)) ?? "Not linked"}</td><td>${esc(p.quarter)}</td><td style="text-align:right">${esc(p.planned_hours != null ? String(p.planned_hours) : "")}</td><td style="text-align:right">${rand(p.planned_budget != null ? Number(p.planned_budget) : null)}</td></tr>`).join("");
  const html = `<html><body>
    ${logo}
    <h1>${esc(plan.name)}</h1>
    <p><b>${esc(org?.name)}</b> — Annual internal audit plan · ${esc(plan.r_period?.name)} · Version ${plan.version_no} · ${plan.status === "AUTHORISED" ? "Authorised" : plan.status === "SUBMITTED" ? "Submitted" : plan.status === "CLOSED" ? "Closed" : "Draft"}</p>
    <p>${esc(plan.description)}</p>
    <h2>Planned engagements</h2>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%">
      <tr><th>Ref</th><th>Engagement</th><th>Type</th><th>Linked risk</th><th>Quarter</th><th>Hours</th><th>Budget</th></tr>
      ${rows || "<tr><td colspan='7'>No planned engagements.</td></tr>"}
    </table>
    <h2>Approvals</h2>
    <p>Prepared by ${esc(plan.r_prepared_by ? `${plan.r_prepared_by.first_name} ${plan.r_prepared_by.last_name}` : "Not recorded")}${plan.prepared_date ? ` on ${plan.prepared_date.toISOString().slice(0, 10)}` : ""}<br/>
    ${plan.r_authorised_by ? `Authorised by ${esc(`${plan.r_authorised_by.first_name} ${plan.r_authorised_by.last_name}`)} on ${plan.authorised_date?.toISOString().slice(0, 10)}` : "Not yet authorised"}<br/>
    ${plan.committee_signed_date ? `Audit committee sign-off recorded on ${plan.committee_signed_date.toISOString().slice(0, 10)}` : "Committee sign-off not yet recorded"}</p>
  </body></html>`;
  await logAudit("Audit plans", aap_id, "DOWNLOAD", { exported: plan.name, by: user.id });
  return new NextResponse(html, {
    headers: { "Content-Type": "application/msword", "Content-Disposition": `attachment; filename="${(plan.name ?? "plan").replace(/[^a-z0-9]+/gi, "_")}.doc"` },
  });
}
