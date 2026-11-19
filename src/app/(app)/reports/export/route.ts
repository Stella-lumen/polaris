import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getReport, REPORTS } from "@/lib/reports/catalogue";
import { periodRange } from "@/lib/reports/filters";
import { buildPdf } from "@/lib/reports/export-pdf";
import { buildDocx, type DocxBlock } from "@/lib/reports/export-docx";
import { buildXlsx } from "@/lib/reports/export-xlsx";
import type { FilterValues } from "@/lib/reports/types";

const ADMIN_ROLES = new Set(["org:admin", "org:chief_audit_executive"]);

const FILTER_LABELS: Record<string, string> = {
  period: "Period", from: "From", to: "To", engagement: "Engagement",
  status: "Status", engagement_type: "Engagement type", lead_auditor: "Lead auditor",
  risk_rating: "Risk rating", category: "Category", source: "Source",
  auditor: "Auditor", assignee: "Assignee", user: "User",
  activity_type: "Activity type", owner: "Owner", overdue: "Overdue",
  report_year: "Report year", search: "Search", signins: "Sign-ins shown",
};

const person = (u: { first_name: string | null; last_name: string | null } | null) =>
  u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : "Unknown";

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "pdf";
  const isAdmin = ADMIN_ROLES.has(user.role ?? "");

  const catalogue = REPORTS.filter((r) => !r.adminOnly || isAdmin);
  const report = catalogue.find((r) => r.id === url.searchParams.get("report")) ?? getReport("engagement-status");

  const filters: FilterValues = {};
  url.searchParams.forEach((v, k) => {
    if (!["format", "report"].includes(k) && v && v !== "all") filters[k] = v;
  });

  const result = await report.run(filters);
  const period = filters.period
    ? periodRange(filters.period, filters.from, filters.to).label
    : "All time";
  const meta = {
    org: "AgriSETA",
    title: report.title,
    period,
    filters,
    filterLabels: FILTER_LABELS,
    preparedBy: person(user),
    dataAt: new Date(),
    contents: report.id === "committee-pack"
      ? ["Summary", "Plan progress", "Top risks", "Findings by status", "Follow-up status & ageing", "Resource use"]
      : undefined,
  };
  const fileBase = report.id + "-report";

  await logAudit("Reports", report.id, "EXPORT", {
    message: `${person(user)} exported the ${report.title} as ${format.toUpperCase()} (${result.rows.length} records)`,
  }, { recordLabel: report.title });

  if (format === "excel") {
    const buf = buildXlsx(result, meta);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileBase}.xlsx"`,
      },
    });
  }

  if (format === "word") {
    const blocks: DocxBlock[] = [
      { kind: "title", text: `${meta.org} — Internal Audit` },
      { kind: "heading", text: report.title, level: 1 },
      { kind: "para", text: `Period: ${period} · Prepared by: ${meta.preparedBy} · Data as at ${meta.dataAt.toLocaleString("en-ZA")}`, small: true },
      { kind: "para", text: `Filters: ${Object.keys(filters).length ? "see Filters below" : "none (all records)"} · ${result.rows.length} records`, small: true },
      ...(meta.contents ? [{ kind: "heading", text: "Contents", level: 2 } as DocxBlock, ...meta.contents.map((c, i) => ({ kind: "para", text: `${i + 1}. ${c}` }) as DocxBlock)] : []),
      { kind: "heading", text: "Summary", level: 2 },
      { kind: "table", header: result.summary.map((s) => s.label), rows: [result.summary.map((s) => String(s.value))] },
      { kind: "heading", text: "Details", level: 2 },
      {
        kind: "table",
        header: ["#", ...result.columns.map((c) => c.label)],
        rows: result.rows.map((r, i) => [String(i + 1), ...result.columns.map((c) => (r[c.key] instanceof Date ? (r[c.key] as Date).toLocaleDateString("en-ZA") : String(r[c.key] ?? "")))]),
      },
      { kind: "para", text: "Confidential — for Audit Committee and Internal Audit use only.", small: true },
    ];
    const buf = buildDocx(blocks);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileBase}.docx"`,
      },
    });
  }

  const buf = await buildPdf(result, meta);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileBase}.pdf"`,
    },
  });
}
