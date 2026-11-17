import { prisma } from "@/lib/db";
import { DataGrid } from "@/components/data-grid";
import { notFound } from "next/navigation";

export const instant = false;

export default async function AapDetailPage({
  params,
}: {
  params: Promise<{ aap_id: string }>;
}) {
  const { aap_id } = await params;
  const plan = await prisma.annualAuditPlan.findFirst({
    where: { id: aap_id, deleted: false },
    include: { r_period: true },
  });
  if (!plan) notFound();
  const planned = await prisma.plannedEngagement.findMany({
    where: { annual_audit_plan_id: plan.id, deleted: false },
    include: { r_engagement_type: true },
  });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{plan.name}</h1>
      <p className="text-muted-foreground">{plan.description} · {plan.r_period?.name}</p>
      <h2 className="text-lg font-medium">Planned Engagements</h2>
      <DataGrid
        rows={planned as unknown as object[]}
        colDefs={[
          { field: "reference", headerName: "Reference" },
          { field: "name", headerName: "Name", flex: 2 },
          { field: "r_engagement_type.name", headerName: "Engagement Type" },
          { field: "objectives", headerName: "Objectives", flex: 2 },
          { field: "scope", headerName: "Scope", flex: 2 },
          { field: "location", headerName: "Location" },
          { field: "planned_start_date", headerName: "Planned Start Date" },
          { field: "planned_end_date", headerName: "Planned End Date" },
          { field: "planned_budget", headerName: "Planned Budget" },
          { field: "authorised_date", headerName: "Authorised Date" },
        ]}
      />
    </div>
  );
}
