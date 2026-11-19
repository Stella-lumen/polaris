import { NextResponse } from "next/server";
import { apiKeyAuth } from "@/lib/api-auth";
import { REPORTS } from "@/lib/reports/catalogue";
import { GROUPS } from "@/lib/reports/types";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "reports:read");
  if ("error" in auth) return auth.error;
  return NextResponse.json(
    {
      data: REPORTS.filter((r) => r.id !== "system-activity").map((r) => ({
        id: r.id,
        title: r.title,
        group: r.group,
        description: r.description,
        filters: r.filters,
        admin_only: !!r.adminOnly,
      })),
      meta: {
        groups: [...GROUPS],
        note: "GET /api/v1/reports/{id} returns the rows. The System Activity Log needs the separate audit-logs:read scope.",
      },
    },
    { headers: { "x-request-id": auth.requestId } },
  );
}
