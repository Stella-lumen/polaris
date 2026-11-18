import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { RiskHeatmap } from "@/components/risk-heatmap";
import { createRiskAssessment, addRiskToPlan, importRiskRegister, logRiskExport } from "@/lib/actions";
import { RiskExport } from "@/components/risk-export";
import { bandFor, bandBadgeClass, bandBadgeText, isHighRisk, DEFAULT_BANDS } from "@/lib/risk";
import { RiskImport } from "@/components/risk-import";

export const instant = false;

const rating = Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const categories = ["Strategic", "Operational", "Financial", "Compliance", "Information Technology", "Fraud"].map((c) => ({ value: c, label: c }));
const effectiveness = ["Effective", "Partially effective", "Ineffective", "Not tested"].map((c) => ({ value: c, label: c }));
const statuses = ["OPEN", "MITIGATED", "ACCEPTED", "CLOSED"].map((c) => ({ value: c, label: c }));

export default async function RiskAssessmentPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const [rows, planned, bands, objectives, users, plans] = await Promise.all([
    prisma.riskAssessment.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: {
        r_linked_planned_engagement: { include: { engagements_planned_engagement: { select: { id: true, engagement_name: true } } } },
        r_assessed_by: true,
        r_risk_owner: true,
        r_strategic_objective: true,
      },
      orderBy: { residual_score: "desc" },
    }),
    prisma.plannedEngagement.findMany({ where: { deleted: false } }),
    prisma.riskRatingBand.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { min_score: "asc" } }),
    prisma.strategicObjective.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { sort_order: "asc" } }),
    prisma.user.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, select: { id: true, first_name: true, last_name: true } }),
    prisma.annualAuditPlan.findMany({ where: { deleted: false }, select: { id: true, name: true } }),
  ]);
  const bandList = bands.length ? bands : DEFAULT_BANDS;

  // Heat-map cell counts + filters
  const cellCounts = { i: {} as Record<string, number>, r: {} as Record<string, number> };
  for (const r of rows) {
    if (r.inherent_likelihood && r.inherent_impact) cellCounts.i[`${r.inherent_likelihood}x${r.inherent_impact}`] = (cellCounts.i[`${r.inherent_likelihood}x${r.inherent_impact}`] ?? 0) + 1;
    if (r.residual_likelihood && r.residual_impact) cellCounts.r[`${r.residual_likelihood}x${r.residual_impact}`] = (cellCounts.r[`${r.residual_likelihood}x${r.residual_impact}`] ?? 0) + 1;
  }
  let filtered = rows;
  if (sp.l && sp.i) {
    const field = (sp.view ?? "r") === "i" ? "inherent" : "residual";
    filtered = filtered.filter((r) => r[`${field}_likelihood` as const] === Number(sp.l) && r[`${field}_impact` as const] === Number(sp.i));
  }
  if (sp.covered === "false") filtered = filtered.filter((r) => !r.linked_planned_engagement_id);
  if (sp.band === "high") filtered = filtered.filter((r) => isHighRisk(r.residual_score, bandList));
  if (sp.status) filtered = filtered.filter((r) => r.status === sp.status);

  // Summary strip
  const bandCounts = bandList.map((b) => ({ band: b, n: filtered.filter((r) => bandFor(r.residual_score, bandList)?.label === b.label).length }));
  const scored = filtered.filter((r) => r.residual_score != null);
  const avg = scored.length ? (scored.reduce((s, r) => s + (r.residual_score ?? 0), 0) / scored.length).toFixed(1) : "—";
  const uncovered = rows.filter((r) => isHighRisk(r.residual_score, bandList) && !r.linked_planned_engagement_id);
  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Risk Assessment</h1>
        <div className="flex gap-2">
          <RiskImport action={importRiskRegister} />
          <RiskExport rows={filtered.map((r) => ({ ...r, inherent_band: "", residual_band: "", coverage: r.linked_planned_engagement_id ? "Covered" : "Uncovered", risk_owner_name: r.r_risk_owner ? `${r.r_risk_owner.first_name} ${r.r_risk_owner.last_name}` : "", objective_name: r.r_strategic_objective?.name ?? "", planned_engagement_name: r.r_linked_planned_engagement?.name ?? "", review_display: r.next_review_date?.toISOString().slice(0, 10) ?? "" })) as unknown as Record<string, unknown>[]} logExport={logRiskExport} />
          <CreateDialog
            title="Add Risk Assessment"
            buttonLabel="Add Risk"
            action={createRiskAssessment}
            fields={[
              { name: "risk_ref", label: "Risk Reference" },
              { name: "auditable_entity", label: "Auditable Entity / Process", required: true },
              { name: "risk_description", label: "Risk Description", type: "textarea", required: true },
              { name: "risk_category", label: "Risk Category", type: "select", options: categories },
              { name: "strategic_objective_id", label: "Strategic Objective", type: "select", options: objectives.map((o) => ({ value: o.id, label: o.name ?? o.id })) },
              { name: "inherent_likelihood", label: "Inherent Likelihood (1-5) — score = L × I", type: "select", required: true, options: rating },
              { name: "inherent_impact", label: "Inherent Impact (1-5)", type: "select", required: true, options: rating },
              { name: "existing_controls", label: "Existing Controls", type: "textarea" },
              { name: "control_effectiveness", label: "Control Effectiveness", type: "select", options: effectiveness },
              { name: "residual_likelihood", label: "Residual Likelihood (1-5) — score = L × I", type: "select", options: rating },
              { name: "residual_impact", label: "Residual Impact (1-5)", type: "select", options: rating },
              { name: "risk_owner_id", label: "Risk Owner", type: "select", options: users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}`.trim() || u.id })) },
              { name: "status", label: "Status", type: "select", options: statuses },
              { name: "next_review_date", label: "Next Review Date", type: "date" },
              { name: "linked_planned_engagement_id", label: "Linked Planned Engagement", type: "select", options: planned.map((p) => ({ value: p.id, label: p.name ?? p.id })) },
            ]}
          />
        </div>
      </div>

      {uncovered.length > 0 && (
        <a href="/risk-assessment?covered=false&band=high" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          ⚠ {uncovered.length} high-risk item{uncovered.length === 1 ? "" : "s"} not covered by the audit plan — click to filter
        </a>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <RiskHeatmap counts={cellCounts} />
        <div className="flex flex-col gap-2 pt-6">
          <div className="flex gap-2">
            {bandCounts.map(({ band, n }) => (
              <span key={band.label} className={bandBadgeClass(band)}>{band.label}: {n}</span>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Avg residual score: <b>{avg}</b> · {filtered.length} of {rows.length} risks shown
          </div>
        </div>
      </div>

      <DataGrid
        rows={filtered.map((r) => {
          const iBand = bandFor(r.inherent_score, bandList);
          const rBand = bandFor(r.residual_score, bandList);
          const eng = r.r_linked_planned_engagement?.engagements_planned_engagement?.[0];
          const overdue = r.next_review_date && r.next_review_date < now && r.status !== "CLOSED";
          return {
            ...r,
            inherent_display: bandBadgeText(r.inherent_score, iBand),
            residual_display: bandBadgeText(r.residual_score, rBand),
            inherent_band: iBand ? `${r.inherent_score} ${iBand.label}` : (r.inherent_score != null ? String(r.inherent_score) : "Not captured"),
            residual_band: rBand ? `${r.residual_score} ${rBand.label}` : (r.residual_score != null ? String(r.residual_score) : "Not captured"),
            planned_engagement_name: eng?.engagement_name ?? r.r_linked_planned_engagement?.name ?? "",
            planned_engagement_id: r.linked_planned_engagement_id,
            coverage: r.linked_planned_engagement_id ? "Covered" : isHighRisk(r.residual_score, bandList) ? "NOT COVERED" : "Uncovered",
            risk_owner_name: r.r_risk_owner ? `${r.r_risk_owner.first_name} ${r.r_risk_owner.last_name}` : "",
            objective_name: r.r_strategic_objective?.name ?? "",
            review_display: `${r.next_review_date?.toISOString().slice(0, 10) ?? ""}${overdue ? " ⚠" : ""}`,
            assessed_date: r.assessed_date?.toISOString().slice(0, 10),
          };
        }) as unknown as object[]}
        hrefPattern="/risk-assessment/{id}"
        rowActions={["toplan"]}
        toPlan={{ plans: plans.map((p) => ({ id: p.id, label: p.name ?? p.id })), onAdd: addRiskToPlan }}
        badgeMap={{
          coverage: { "NOT COVERED": "rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800", "Covered": "rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800", "Uncovered": "rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600" },
          status: { OPEN: "rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800", MITIGATED: "rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800", ACCEPTED: "rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800", CLOSED: "rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600" },
        }}
        rowStyleRules={[{ field: "coverage", when: "NOT COVERED", style: { backgroundColor: "#fef2f2" } }]}
        colDefs={[
          { field: "auditable_entity", headerName: "Auditable Entity", flex: 1.3 },
          { field: "risk_description", headerName: "Risk", flex: 1.8 },
          { field: "risk_category", headerName: "Category" },
          { field: "inherent_band", headerName: "Inherent" },
          { field: "control_effectiveness", headerName: "Controls" },
          { field: "residual_band", headerName: "Residual" },
          { field: "coverage", headerName: "Coverage" },
          { field: "planned_engagement_name", headerName: "Planned Engagement", flex: 1.3 },
          { field: "status", headerName: "Status" },
          { field: "risk_owner_name", headerName: "Owner" },
          { field: "review_display", headerName: "Next Review" },
          { field: "assessed_date", headerName: "Assessed" },
        ]}
      />
    </div>
  );
}
