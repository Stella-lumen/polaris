import { prisma } from "@/lib/db";
import { DataGrid } from "@/components/data-grid";
import { updateFindingStatus } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";

export const instant = false;

export default async function FindingsPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({ where: { id: engagement_id, deleted: false } });
  if (!engagement) notFound();
  const rows = await prisma.engagementFindingAndRecommendations.findMany({
    where: { engagement_id, deleted: false },
    include: {
      r_engagement_fieldwork_document: true,
      r_prepared_by_engagement_auditor: { include: { r_user: true } },
    },
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">Findings and Recommendations</h2>
        <div className="flex gap-3 text-sm">
          <Link href={`/engagements/${engagement_id}/dashboard`} className="text-orange-600 hover:underline">Back to Dashboard</Link>
          <Link href={`/engagements/${engagement_id}/reporting`} className="text-orange-600 hover:underline">Back to Reporting</Link>
        </div>
      </div>
      <DataGrid
        rows={rows.map((f) => ({
          ...f,
          fieldwork_ref: f.r_engagement_fieldwork_document?.document_reference ?? "",
          prepared_by_name: f.r_prepared_by_engagement_auditor?.r_user
            ? `${f.r_prepared_by_engagement_auditor.r_user.first_name} ${f.r_prepared_by_engagement_auditor.r_user.last_name}`
            : "",
          status: f.status ?? "OPEN",
          status_label: (f.status ?? "OPEN").replaceAll("_", " "),
        })) as unknown as object[]}
        rowActions={["workflow"]}
        workflow={{ steps: ["OPEN", "MANAGEMENT_RESPONSE", "UNDER_REVIEW", "CLEARED", "CLOSED"], onAdvance: updateFindingStatus }}
        colDefs={[
          { field: "detailed_finding", headerName: "Detailed Finding", flex: 2 },
          { field: "root_cause", headerName: "Root Cause" },
          { field: "recommendations", headerName: "Recommendations", flex: 1.5 },
          { field: "management_comment", headerName: "Management Comment" },
          { field: "status_label", headerName: "Status" },
          { field: "fieldwork_ref", headerName: "Fieldwork Doc Ref" },
          { field: "prepared_by_name", headerName: "Prepared By" },
          { field: "prepared_date", headerName: "Prepared Date" },
        ]}
      />
    </div>
  );
}
