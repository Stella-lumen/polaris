import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createRiskAssessment } from "@/lib/actions";

export const instant = false;

const rating = Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const categories = ["Strategic", "Operational", "Financial", "Compliance", "Information Technology", "Fraud"].map((c) => ({ value: c, label: c }));

export default async function RiskAssessmentPage() {
  const [rows, planned] = await Promise.all([
    prisma.riskAssessment.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: { r_linked_planned_engagement: true, r_assessed_by: true },
      orderBy: { inherent_score: "desc" },
    }),
    prisma.plannedEngagement.findMany({ where: { deleted: false } }),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Risk Assessment</h1>
        <CreateDialog
          title="Add Risk Assessment"
          buttonLabel="Add Risk"
          action={createRiskAssessment}
          fields={[
            { name: "auditable_entity", label: "Auditable Entity / Process", required: true },
            { name: "risk_description", label: "Risk Description", type: "textarea", required: true },
            { name: "risk_category", label: "Risk Category", type: "select", options: categories },
            { name: "inherent_likelihood", label: "Inherent Likelihood (1-5)", type: "select", required: true, options: rating },
            { name: "inherent_impact", label: "Inherent Impact (1-5)", type: "select", required: true, options: rating },
            { name: "existing_controls", label: "Existing Controls", type: "textarea" },
            { name: "residual_likelihood", label: "Residual Likelihood (1-5)", type: "select", options: rating },
            { name: "residual_impact", label: "Residual Impact (1-5)", type: "select", options: rating },
            { name: "linked_planned_engagement_id", label: "Linked Planned Engagement", type: "select", options: planned.map((p) => ({ value: p.id, label: p.name ?? p.id })) },
          ]}
        />
      </div>
      <DataGrid
        rows={rows.map((r) => ({
          ...r,
          planned_engagement_name: r.r_linked_planned_engagement?.name ?? "",
          assessed_date: r.assessed_date?.toISOString().slice(0, 10),
        })) as unknown as object[]}
        colDefs={[
          { field: "auditable_entity", headerName: "Auditable Entity", flex: 1.4 },
          { field: "risk_description", headerName: "Risk", flex: 2 },
          { field: "risk_category", headerName: "Category" },
          { field: "inherent_score", headerName: "Inherent" },
          { field: "residual_score", headerName: "Residual" },
          { field: "existing_controls", headerName: "Existing Controls", flex: 2 },
          { field: "planned_engagement_name", headerName: "Planned Engagement", flex: 1.4 },
          { field: "assessed_date", headerName: "Assessed" },
        ]}
      />
    </div>
  );
}
