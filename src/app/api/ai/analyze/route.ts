import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { aiEnabled, aiConfig, chatCompletion } from "@/lib/ai";
import { getSessionUser } from "@/lib/auth";

export const instant = false;

export async function POST() {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!aiEnabled()) {
    return NextResponse.json(
      { error: "AI not configured — set AI_API_KEY/AI_BASE_URL/AI_MODEL in .env" },
      { status: 503 },
    );
  }

  const scope = { deleted: false, organization_id: DEMO_ORGANIZATION_ID };
  const [engagements, findings] = await Promise.all([
    prisma.engagement.findMany({
      where: scope,
      include: { r_engagement_type: true, engagementAuditors_engagement: true },
    }),
    prisma.engagementFindingAndRecommendations.findMany({
      where: scope,
      include: { r_engagement: true },
    }),
  ]);

  const now = new Date();
  const summary = {
    totalEngagements: engagements.length,
    engagements: engagements.map((e) => ({
      name: e.engagement_name,
      type: e.r_engagement_type?.name,
      status: e.authorised_date ? "authorised" : e.start_date && e.start_date <= now ? "in progress" : "not started",
      budget: e.engagement_budget ? Number(e.engagement_budget) : null,
      spend: e.engagement_spend ? Number(e.engagement_spend) : null,
      daysOverdue:
        !e.authorised_date && e.end_date && e.end_date < now
          ? Math.ceil((now.getTime() - e.end_date.getTime()) / 86400000)
          : 0,
      teamSize: e.engagementAuditors_engagement.length,
    })),
    findings: {
      total: findings.length,
      cleared: findings.filter((f) => f.authorised_date).length,
      open: findings.filter((f) => !f.authorised_date).length,
      openOnEndedEngagements: findings.filter(
        (f) => !f.authorised_date && f.r_engagement?.end_date && f.r_engagement.end_date < now,
      ).length,
    },
  };

  try {
    const analysis = await chatCompletion(
      "You are an internal audit analytics assistant embedded in Polaris, an audit management system. " +
        "Analyse the engagement portfolio data and respond in concise markdown: " +
        "**Portfolio Health** (2-3 bullets), **Risks & Attention Needed** (bullets), " +
        "**Recommendations** (numbered, max 4). Be specific — cite engagement names and numbers.",
      JSON.stringify(summary, null, 2),
    );
    return NextResponse.json({ analysis, model: aiConfig().model });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 502 },
    );
  }
}
