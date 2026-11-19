import { NextResponse } from "next/server";
import { apiKeyAuth } from "@/lib/api-auth";
import { REPORTS } from "@/lib/reports/catalogue";
import type { FilterValues } from "@/lib/reports/types";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = REPORTS.find((r) => r.id === id);
  if (!report) {
    return NextResponse.json({ error: "Unknown report.", available: REPORTS.filter((r) => r.id !== "system-activity").map((r) => r.id) }, { status: 404 });
  }
  // the System Activity Log needs the separate, admin-only scope
  const scope = report.id === "system-activity" ? "audit-logs:read" : "reports:read";
  const auth = await apiKeyAuth(req, scope);
  if ("error" in auth) return auth.error;
  if (report.adminOnly && report.id !== "system-activity") {
    return NextResponse.json({ error: "This report is not available through the API." }, { status: 403 });
  }

  const url = new URL(req.url);
  const filters: FilterValues = {};
  url.searchParams.forEach((v, k) => {
    if (!["page", "page_size", "sort", "updated_since"].includes(k) && v && v !== "all") filters[k] = v;
  });

  const result = await report.run(filters);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("page_size") ?? 50)));
  const rows = result.rows.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json(
    {
      data: rows.map((r) => {
        const { href, ...rest } = r;
        return rest;
      }),
      meta: {
        report: report.id,
        title: report.title,
        page, page_size: pageSize, total: result.rows.length,
        summary: result.summary,
        filters_applied: filters,
        data_as_at: new Date().toISOString(),
      },
    },
    { headers: { "x-request-id": auth.requestId } },
  );
}
