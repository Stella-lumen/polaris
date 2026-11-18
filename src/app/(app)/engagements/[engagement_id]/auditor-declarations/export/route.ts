import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

const fmt = (d: Date | null | undefined) => (d ? new Date(d).toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "");
const esc = (s: string | null | undefined) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const STATUS_WORDS: Record<string, string> = {
  SIGNED: "Signed",
  CONFLICT: "Conflict disclosed — awaiting review",
  APPROVED: "Approved with conditions",
  REASSIGNED: "Work reassigned",
};

export async function GET(req: Request, ctx: { params: Promise<{ engagement_id: string }> }) {
  const user = await requireUser();
  const { engagement_id } = await ctx.params;
  const url = new URL(req.url);
  const auditorId = url.searchParams.get("auditor");

  const [engagement, rows, org] = await Promise.all([
    prisma.engagement.findFirst({ where: { id: engagement_id, deleted: false }, select: { id: true, engagement_name: true, engagement_number: true } }),
    prisma.engagementAuditorDeclaration.findMany({
      where: { engagement_id, deleted: false, ...(auditorId ? { engagement_auditor_id: auditorId } : {}) },
      include: {
        r_declaration: { include: { r_declaration_section: true } },
        r_engagement_auditor: { include: { r_user: true } },
      },
      orderBy: [{ engagement_auditor_id: "asc" }, { declaration_id: "asc" }],
    }),
    prisma.organization.findUnique({ where: { id: DEMO_ORGANIZATION_ID }, select: { name: true, logo_file_id: true } }),
  ]);
  if (!engagement) return new NextResponse("Engagement not found", { status: 404 });
  if (!rows.length) return new NextResponse("No signed declarations to export", { status: 404 });

  const reviewers = new Set(rows.map((r) => r.reviewed_by_user_id).filter(Boolean) as string[]);
  const reviewerRows = reviewers.size ? await prisma.user.findMany({ where: { id: { in: [...reviewers] } }, select: { id: true, first_name: true, last_name: true, email: true } }) : [];
  const reviewerName = new Map(reviewerRows.map((u) => [u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email]));

  const scopeLabel = auditorId
    ? (rows[0]?.r_engagement_auditor?.r_user ? `${rows[0].r_engagement_auditor.r_user.first_name ?? ""} ${rows[0].r_engagement_auditor.r_user.last_name ?? ""}`.trim() : "one person")
    : "whole team";

  await logAudit("Engagement Auditor Declarations", engagement_id, "EXPORT",
    { message: `Exported ${rows.length} signed declaration${rows.length === 1 ? "" : "s"} for "${engagement.engagement_name}" (${scopeLabel})` },
    { userId: user.id });

  const logo = org?.logo_file_id ? `<img src="/api/files/${org.logo_file_id}" style="height:60px" />` : "";
  const trs = rows.map((r) => {
    const person = r.r_engagement_auditor?.r_user
      ? `${r.r_engagement_auditor.r_user.first_name ?? ""} ${r.r_engagement_auditor.r_user.last_name ?? ""}`.trim() || r.r_engagement_auditor.r_user.email
      : "";
    const section = r.r_declaration?.r_declaration_section?.custom_name ?? r.r_declaration?.r_declaration_section?.name ?? "";
    const wording = r.signed_text ?? r.r_declaration?.custom_text ?? r.r_declaration?.declaration_text ?? "";
    const reviewed = r.reviewed_by_user_id ? `Reviewed by ${reviewerName.get(r.reviewed_by_user_id) ?? "a supervisor"}${r.review_comment ? ` — “${esc(r.review_comment)}”` : ""}` : "";
    const sigCell = r.signature_image
      ? `<img src="${r.signature_image}" style="height:44px" /><br/><span style="color:#666">${esc(r.signer_name ?? "")}${r.signer_designation ? `, ${esc(r.signer_designation)}` : ""}</span>`
      : `<span style="color:#999">Signed without a captured signature</span>`;
    return `<tr>
      <td>${esc(person)}</td><td>${esc(section)}</td><td>${esc(wording)}</td>
      <td>${STATUS_WORDS[r.status ?? "SIGNED"] ?? r.status}<br/><span style="color:#666">${esc(r.conflict_reason ? `Reason: ${r.conflict_reason}` : "")}</span><br/><span style="color:#666">${reviewed}</span></td>
      <td>${fmt(r.signed_at ?? r.confirmation_date)}</td><td>${sigCell}</td>
    </tr>`;
  }).join("");

  const html = `<html><head><style>
    @media print { button { display:none } }
    body{font-family:Arial,sans-serif;font-size:12px;color:#111}
    td,th{padding:5px 7px;border:1px solid #ccc;vertical-align:top} th{background:#f97316;color:#fff;text-align:left}
  </style></head><body>
    ${logo}
    <h1>Signed independence and ethics declarations</h1>
    <p><b>${esc(org?.name)}</b> · ${esc(engagement.engagement_name)} (${esc(engagement.engagement_number)}) · ${rows.length} declaration${rows.length === 1 ? "" : "s"} · ${esc(scopeLabel)} · exported ${fmt(new Date())}</p>
    <p style="color:#555">Each entry shows the exact wording as it stood when signed.</p>
    <button onclick="window.print()" style="padding:6px 14px;background:#f97316;color:#fff;border:0;border-radius:6px;cursor:pointer">Print or save as PDF</button>
    <table cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:8px">
      <tr><th>Person</th><th>Section</th><th>Declaration as signed</th><th>Status</th><th>When</th><th>Signature</th></tr>
      ${trs}
    </table></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
