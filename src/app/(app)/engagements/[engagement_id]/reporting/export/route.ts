import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

const esc = (s: string | null | undefined) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(_req: Request, { params }: { params: Promise<{ engagement_id: string }> }) {
  await requireUser();
  const { engagement_id } = await params;
  const e = await prisma.engagement.findUnique({ where: { id: engagement_id }, include: { r_engagement_type: true } });
  if (!e) return new NextResponse("Not found", { status: 404 });
  const findings = await prisma.engagementFindingAndRecommendations.findMany({ where: { engagement_id, deleted: false }, orderBy: { created_at: "asc" } });
  const org = e.organization_id ? await prisma.organization.findUnique({ where: { id: e.organization_id }, select: { name: true, logo_file_id: true } }) : null;
  const logo = org?.logo_file_id ? `<img src="/api/files/${org.logo_file_id}" style="height:60px" />` : "";
  const approver = e.report_approved_by ? await prisma.user.findUnique({ where: { id: e.report_approved_by }, select: { first_name: true, last_name: true } }) : null;
  const rows = findings.map((f, i) => `
    <h3>Finding ${i + 1}</h3>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%">
      <tr><td style="width:30%"><b>Finding</b></td><td>${esc(f.detailed_finding)}</td></tr>
      <tr><td><b>Root cause</b></td><td>${esc(f.root_cause)}</td></tr>
      <tr><td><b>Recommendation</b></td><td>${esc(f.recommendations)}</td></tr>
      <tr><td><b>Management comment</b></td><td>${esc(f.management_comment)}</td></tr>
    </table>`).join("");
  const html = `<html><body>
    ${logo}
    <h1>${esc(e.engagement_name)}</h1>
    <p><b>${esc(org?.name)}</b></p>
    <p><b>Type:</b> ${esc(e.r_engagement_type?.name)} &nbsp; <b>Period:</b> ${e.start_date?.toISOString().slice(0, 10)} to ${e.end_date?.toISOString().slice(0, 10)}</p>
    <h2>Objectives</h2><p>${esc(e.objectives)}</p>
    <h2>Scope</h2><p>${esc(e.scope_text)}</p>
    <h2>Findings and recommendations</h2>${rows || "<p>No findings recorded.</p>"}
    <h2>Approval</h2>
    <p>${e.report_approved_date ? `Approved by ${esc(approver ? `${approver.first_name} ${approver.last_name}` : "")} on ${e.report_approved_date.toISOString().slice(0, 10)}` : "Not yet approved."}</p>
  </body></html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "application/msword",
      "Content-Disposition": `attachment; filename="${(e.engagement_name ?? "report").replace(/[^a-z0-9]+/gi, "_")}_report.doc"`,
    },
  });
}
