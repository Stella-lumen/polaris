import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { sentence, moduleOf, actorName, type AuditRow } from "@/lib/audit-display";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const fmt = (d: Date | null) => (d ? d.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "");
const esc = (s: string | null | undefined) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const [rows, users, org] = await Promise.all([
    prisma.auditLog.findMany({ where: { organization_id: DEMO_ORGANIZATION_ID }, orderBy: { timestamp: "desc" }, take: 5000 }),
    prisma.user.findMany({ select: { id: true, email: true, first_name: true, last_name: true } }),
    prisma.organization.findUnique({ where: { id: DEMO_ORGANIZATION_ID }, select: { name: true, logo_file_id: true } }),
  ]);
  const emailById = new Map(users.map((u) => [u.id, u.email ?? ""]));
  const nameOf = (r: AuditRow) => actorName(r, emailById);
  const data = rows.map((r) => ({
    Date: fmt(r.timestamp),
    Person: nameOf(r as AuditRow),
    "What happened": sentence(r as AuditRow, emailById),
    Module: moduleOf(r.table_name),
    Record: r.record_label ?? "",
  }));

  await logAudit("Audit logs", "export", "EXPORT", { message: `Exported ${data.length} audit entries to ${format === "pdf" ? "PDF" : "Excel"}` });

  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet([{ Date: "Polaris audit trail", Person: "", "What happened": `Exported ${fmt(new Date())} · ${org?.name ?? ""}`, Module: "", Record: "" }, ...data]);
    ws["!cols"] = [{ wch: 22 }, { wch: 26 }, { wch: 80 }, { wch: 20 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit trail");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="polaris-audit-trail.xlsx"' },
    });
  }

  const logo = org?.logo_file_id ? `<img src="/api/files/${org.logo_file_id}" style="height:60px" />` : "";
  const trs = data.map((d) => `<tr><td>${esc(d.Date)}</td><td>${esc(d.Person)}</td><td>${esc(d["What happened"])}</td><td>${esc(d.Module)}</td><td>${esc(d.Record)}</td></tr>`).join("");
  const html = `<html><head><style>@media print { button { display:none } } body{font-family:Arial,sans-serif;font-size:12px} td,th{padding:4px 6px;border:1px solid #ccc} th{background:#f97316;color:#fff}</style></head><body>
    ${logo}<h1>Audit trail</h1>
    <p><b>${esc(org?.name)}</b> · ${data.length} entries · exported ${fmt(new Date())} — Audit logs cannot be edited or deleted.</p>
    <button onclick="window.print()" style="padding:6px 14px;background:#f97316;color:#fff;border:0;border-radius:6px;cursor:pointer">Print or save as PDF</button>
    <table cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:8px">
      <tr><th>Date</th><th>Person</th><th>What happened</th><th>Module</th><th>Record</th></tr>
      ${trs}
    </table></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
