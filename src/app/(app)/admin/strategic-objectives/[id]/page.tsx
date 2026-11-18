import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DataGrid } from "@/components/data-grid";
import { EditDialog } from "@/components/edit-dialog";
import { updateStrategicObjective, confirmStrategicObjective } from "@/lib/actions";
import { bandFor, bandBadgeText, bandBadgeClass, DEFAULT_BANDS, type RiskBand } from "@/lib/risk";
import { fmtDate } from "@/lib/dates";

export const instant = false;

export default async function StrategicObjectiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [o, bands] = await Promise.all([
    prisma.strategicObjective.findFirst({
      where: { id, deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: {
        riskAssessments_strategic_objective: {
          where: { deleted: false },
          orderBy: { residual_score: "desc" },
          include: {
            r_risk_owner: { select: { first_name: true, last_name: true, email: true } },
            r_linked_planned_engagement: { select: { name: true, engagements_planned_engagement: { select: { engagement_name: true } } } },
          },
        },
      },
    }),
    prisma.riskRatingBand.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { min_score: "asc" } }),
  ]);
  if (!o) notFound();
  const bandList: RiskBand[] = bands.length ? bands : DEFAULT_BANDS;
  const risks = o.riskAssessments_strategic_objective;
  const covered = risks.filter((r) => r.linked_planned_engagement_id).length;
  const ratingBadges: Record<string, string> = {};
  for (const r of risks) {
    const band = bandFor(r.residual_score, bandList);
    if (band) ratingBadges[bandBadgeText(r.residual_score, band)] = bandBadgeClass(band);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/strategic-objectives" className="text-sm text-orange-600 hover:underline">← Back to strategic objectives</Link>
        <div className="mt-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              SO{o.sort_order ?? "?"} — {o.name ?? "Not assigned"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{o.description ?? "Not assigned"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${o.disabled ? "bg-zinc-200 text-zinc-600" : "bg-emerald-100 text-emerald-800"}`}>
              {o.disabled ? "Inactive" : "Active"}
            </span>
            {o.is_sample && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">Sample</span>
            )}
          </div>
        </div>
      </div>

      {o.is_sample && (
        <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-sm text-amber-800">Sample objective. Replace with the AgriSETA strategic plan.</p>
          <form action={confirmStrategicObjective.bind(null, o.id)}>
            <button className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100">
              Set as confirmed
            </button>
          </form>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          Linked risks — {covered} of {risks.length} in the audit plan
        </h2>
        <EditDialog
          title="Edit strategic objective"
          returnPath={`/admin/strategic-objectives/${o.id}`}
          action={updateStrategicObjective.bind(null, o.id)}
          values={{ name: o.name, description: o.description, sort_order: o.sort_order == null ? "" : String(o.sort_order) }}
          fields={[
            { name: "name", label: "Objective", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "sort_order", label: "Sort order", type: "number" },
          ]}
        />
      </div>

      <DataGrid
        rows={risks.map((r) => {
          const eng = r.r_linked_planned_engagement?.engagements_planned_engagement?.[0];
          return {
            id: r.id,
            auditable_entity: r.auditable_entity ?? "Not assigned",
            risk_description: r.risk_description ?? "Not assigned",
            rating: bandBadgeText(r.residual_score, bandFor(r.residual_score, bandList)),
            risk_owner_name: r.r_risk_owner ? `${r.r_risk_owner.first_name ?? ""} ${r.r_risk_owner.last_name ?? ""}`.trim() || r.r_risk_owner.email : "Not assigned",
            in_plan: r.linked_planned_engagement_id ? "Yes" : "No",
            plan_name: eng?.engagement_name ?? r.r_linked_planned_engagement?.name ?? "",
            status: r.status ?? "Not assigned",
            next_review: fmtDate(r.next_review_date),
          };
        }) as unknown as object[]}
        hrefPattern="/risk-assessment/{id}"
        badgeMap={{
          rating: ratingBadges,
          in_plan: {
            Yes: "rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800",
            No: "rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600",
          },
        }}
        colDefs={[
          { field: "auditable_entity", headerName: "Auditable entity", flex: 1.3, tooltipField: "auditable_entity" },
          { field: "risk_description", headerName: "Risk", flex: 1.8, tooltipField: "risk_description" },
          { field: "rating", headerName: "Rating", width: 110 },
          { field: "risk_owner_name", headerName: "Owner", flex: 1, tooltipField: "risk_owner_name" },
          { field: "in_plan", headerName: "In audit plan", width: 110 },
          { field: "plan_name", headerName: "Planned engagement", flex: 1.2, tooltipField: "plan_name" },
          { field: "status", headerName: "Status", width: 100 },
          { field: "next_review", headerName: "Next review", width: 120 },
        ]}
      />
    </div>
  );
}
