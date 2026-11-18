export const instant = false;

import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DataGrid } from "@/components/data-grid";

export default async function EngagementFindingsPage({ params }: { params: Promise<{ engagement_id: string }> }) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findUnique({ where: { id: engagement_id } });
  if (!engagement) notFound();
  const [findings, actions] = await Promise.all([
    prisma.engagementFindingAndRecommendations.findMany({
      where: { engagement_id, deleted: false },
      include: { r_engagement_fieldwork_document: { select: { description: true, name: true } }, r_source_risk: { select: { auditable_entity: true } } },
      orderBy: { created_at: "desc" },
    }),
    prisma.correctiveAction.findMany({ where: { deleted: false, r_finding: { engagement_id } }, select: { finding_id: true, action_description: true, status: true } }),
  ]);
  const actionByFinding = new Map(actions.map((a) => [a.finding_id, a]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Findings</h2>
        <Link href={`/engagements/${engagement_id}/findings-and-recommendations`} className="rounded-md border border-primary px-3 py-1.5 text-xs text-primary">Manage findings</Link>
      </div>
      {findings.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No findings recorded for this engagement yet.</div>}
      <DataGrid
        rows={findings.map((f) => {
          const act = actionByFinding.get(f.id) ?? null;
          return {
            id: f.id,
            finding: f.detailed_finding ?? "Untitled finding",
            root_cause: f.root_cause ?? "Not recorded",
            recommendation: f.recommendations ?? "Not recorded",
            status: f.status === "CLOSED" ? "Closed" : "Open",
            working_paper: f.r_engagement_fieldwork_document ? `${f.r_engagement_fieldwork_document.name ?? ""} ${f.r_engagement_fieldwork_document.description ?? ""}`.trim() : "Not linked",
            source_risk: f.r_source_risk?.auditable_entity ?? "Not linked",
            corrective_action: act ? `${act.action_description} (${act.status === "VERIFIED" ? "Verified" : "Open"})` : "None",
          };
        }) as unknown as object[]}
        colDefs={[
          { field: "finding", headerName: "Finding", flex: 2, tooltipField: "finding" },
          { field: "root_cause", headerName: "Root cause", flex: 1.5, tooltipField: "root_cause" },
          { field: "recommendation", headerName: "Recommendation", flex: 1.5, tooltipField: "recommendation" },
          { field: "status", headerName: "Status", width: 100 },
          { field: "working_paper", headerName: "Working paper", width: 160, tooltipField: "working_paper" },
          { field: "source_risk", headerName: "Risk", flex: 1, tooltipField: "source_risk" },
          { field: "corrective_action", headerName: "Action", flex: 1.5, tooltipField: "corrective_action" },
        ]}
      />
      <p className="text-xs text-muted-foreground">Corrective actions are tracked under <Link href="/follow-up" className="text-primary underline">Follow-up</Link>.</p>
    </div>
  );
}
