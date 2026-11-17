import { prisma } from "@/lib/db";
import { apiKeyAuth, apiErr, isoDateTime, isoDate } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiKeyAuth(req, "engagements:read");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const r = await prisma.engagement.findFirst({
    where: { id, deleted: false, organization_id: auth.org },
    include: {
      r_engagement_type: { select: { name: true } },
      r_annual_audit_plan: { select: { name: true } },
      r_planned_engagement: { select: { name: true, reference: true } },
      engagementAuditors_engagement: {
        where: { deleted: false },
        include: { r_user: { select: { first_name: true, last_name: true, email: true } } },
      },
    },
  });
  if (!r) return apiErr(auth.requestId, 404, "not_found", "Engagement not found.");
  return NextResponse.json(
    {
      data: {
        id: r.id,
        title: r.engagement_name,
        number: r.engagement_number,
        status: r.authorised_date ? "closed" : "open",
        engagement_type: r.r_engagement_type?.name ?? null,
        annual_audit_plan: r.r_annual_audit_plan?.name ?? null,
        planned_engagement: r.r_planned_engagement?.name ?? null,
        planned_start: isoDate(r.start_date),
        planned_end: isoDate(r.end_date),
        budget: r.engagement_budget != null ? Number(r.engagement_budget) : null,
        spend: r.engagement_spend != null ? Number(r.engagement_spend) : null,
        team: r.engagementAuditors_engagement.map((a) => ({
          name: a.r_user ? `${a.r_user.first_name} ${a.r_user.last_name}` : null,
          email: a.r_user?.email ?? null,
          position: a.position_on_audit,
        })),
        updated_at: isoDateTime(r.updated_at),
      },
    },
    { headers: { "x-request-id": auth.requestId } },
  );
}
