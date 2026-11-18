import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createStrategicObjective, toggleStrategicObjective, deleteStrategicObjective } from "@/lib/actions";
import { bandFor, bandBadgeClass, DEFAULT_BANDS, type RiskBand } from "@/lib/risk";

export const instant = false;

export default async function StrategicObjectivesPage() {
  const [rows, bands] = await Promise.all([
    prisma.strategicObjective.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { sort_order: "asc" },
      include: {
        riskAssessments_strategic_objective: {
          where: { deleted: false },
          select: { residual_score: true, linked_planned_engagement_id: true },
        },
      },
    }),
    prisma.riskRatingBand.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { min_score: "asc" } }),
  ]);
  const bandList: RiskBand[] = bands.length ? bands : DEFAULT_BANDS;

  const gridRows = rows.map((o) => {
    const risks = o.riskAssessments_strategic_objective;
    const linked = risks.length;
    const covered = risks.filter((r) => r.linked_planned_engagement_id).length;
    const top = risks.reduce<number | null>((m, r) => (r.residual_score != null && (m == null || r.residual_score > m) ? r.residual_score : m), null);
    const band = bandFor(top, bandList);
    return {
      id: o.id,
      ref: `SO${o.sort_order ?? "?"}`,
      name: o.name ?? "Not assigned",
      description: o.description ?? "Not assigned",
      linked: linked,
      highest: top == null ? "No risks" : band ? `${top} ${band.label}` : String(top),
      highest_class: top == null ? "" : bandBadgeClass(band),
      coverage: linked === 0 ? "No risks yet" : `${covered} of ${linked} risk${linked === 1 ? "" : "s"} in the audit plan`,
      status: o.disabled ? "Inactive" : "Active",
      sample: o.is_sample ? "Sample" : "",
      disabled: o.disabled,
      deletable: linked === 0,
      delete_reason: linked === 0 ? undefined : `${linked} risk${linked === 1 ? " is" : "s are"} linked — deactivate it instead`,
    };
  });

  // Per-value badge classes for the Highest rating column (band colours).
  const highestBadges: Record<string, string> = {};
  for (const r of gridRows) if (r.highest_class) highestBadges[r.highest] = r.highest_class;
  const anySample = gridRows.some((r) => r.sample);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Strategic objectives</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The goals of the organisation. Each risk is linked to one objective so audit work can be
            traced back to what matters most.
          </p>
        </div>
        <CreateDialog
          title="Add strategic objective"
          buttonLabel="Add objective"
          action={createStrategicObjective}
          fields={[
            { name: "name", label: "Objective", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "sort_order", label: "Sort order", type: "number" },
          ]}
        />
      </div>
      {anySample && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Sample objectives. Replace with the AgriSETA strategic plan.
        </p>
      )}
      <DataGrid
        rows={gridRows as unknown as object[]}
        hrefPattern="/admin/strategic-objectives/{id}"
        rowActions={["edit", "toggle", "delete"]}
        toggle={{ field: "disabled", labels: ["Inactive", "Active"], onToggle: toggleStrategicObjective }}
        deleteConfig={{ onDelete: deleteStrategicObjective }}
        badgeMap={{
          highest: highestBadges,
          status: {
            Active: "rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800",
            Inactive: "rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600",
          },
          sample: {
            Sample: "rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800",
          },
        }}
        colDefs={[
          { field: "ref", headerName: "Ref", width: 70 },
          { field: "name", headerName: "Objective", flex: 1.6, tooltipField: "name" },
          { field: "description", headerName: "Description", flex: 2, tooltipField: "description" },
          { field: "sample", headerName: "Flag", width: 90 },
          { field: "linked", headerName: "Linked risks", width: 110 },
          { field: "highest", headerName: "Highest rating", width: 130 },
          { field: "coverage", headerName: "Audit coverage", flex: 1.4, tooltipField: "coverage" },
          { field: "status", headerName: "Status", width: 100 },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Click a row to see its risks. Objectives with linked risks cannot be deleted — deactivate them instead.
      </p>
    </div>
  );
}
