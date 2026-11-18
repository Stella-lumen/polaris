import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { AiAnalysisButton, ExportButton, ImportButton } from "@/components/engagement-actions";

// DB-backed authenticated page — blocking dynamic render like the original SSR
export const instant = false;

export default async function EngagementsPage() {
  const engagements = await prisma.engagement.findMany({
    where: { deleted: false, disabled: false, organization_id: DEMO_ORGANIZATION_ID },
    include: { r_engagement_type: true },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Engagements</h1>
        <div className="flex gap-2">
          <AiAnalysisButton />
          <ExportButton
            rows={engagements.map((e) => ({
              Name: e.engagement_name,
              Number: e.engagement_number,
              Type: e.r_engagement_type?.name,
              "Start Date": e.start_date?.toISOString().slice(0, 10),
              "End Date": e.end_date?.toISOString().slice(0, 10),
              Budget: e.engagement_budget ? Number(e.engagement_budget) : null,
              Spend: e.engagement_spend ? Number(e.engagement_spend) : null,
            }))}
          />
          <ImportButton />
          <Link
            href="/engagements/add"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Create Engagement
          </Link>
        </div>
      </div>
      <DataGrid
        rows={engagements.map((e) => ({
          id: e.id,
          engagement_name: e.engagement_name,
          engagement_number: e.engagement_number,
          r_engagement_type: { name: e.r_engagement_type?.name },
          start_date: e.start_date?.toISOString().slice(0, 10),
          end_date: e.end_date?.toISOString().slice(0, 10),
          engagement_budget: e.engagement_budget != null ? Number(e.engagement_budget) : null,
          engagement_spend: e.engagement_spend != null ? Number(e.engagement_spend) : null,
        })) as unknown as object[]}
        hrefPattern="/engagements/{id}/dashboard"
        rowActions={["edit"]}
        colDefs={[
          { field: "engagement_name", headerName: "Name", flex: 2 },
          { field: "engagement_number", headerName: "Number" },
          { field: "r_engagement_type.name", headerName: "Type" },
          { field: "start_date", headerName: "Start Date" },
          { field: "end_date", headerName: "End Date" },
          { field: "engagement_budget", headerName: "Budget" },
          { field: "engagement_spend", headerName: "Spend" },
        ]}
      />
    </div>
  );
}
