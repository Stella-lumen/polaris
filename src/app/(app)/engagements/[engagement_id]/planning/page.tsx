import { prisma } from "@/lib/db";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createStageDocument, ensureStageDocs } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";

export const instant = false;

async function auditorsFor(engagement_id: string) {
  const team = await prisma.engagementAuditor.findMany({
    where: { engagement_id, deleted: false },
    include: { r_user: true },
  });
  return team.map((a) => ({
    id: a.id,
    label: a.r_user ? `${a.r_user.first_name} ${a.r_user.last_name} — ${a.position_on_audit}` : a.id,
  }));
}

export default async function PlanningPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({ where: { id: engagement_id, deleted: false } });
  if (!engagement) notFound();
  await ensureStageDocs(engagement_id);
  const [rows, auditors] = await Promise.all([
    prisma.engagementPlanningDocument.findMany({
      where: { engagement_id, deleted: false },
      include: { r_prepared_by_engagement_auditor: { include: { r_user: true } } },
      orderBy: { document_reference: "asc" },
    }),
    auditorsFor(engagement_id),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">Planning Documents</h2>
          <div className="flex gap-3 text-sm">
            <Link href={`/engagements/${engagement_id}/dashboard`} className="text-orange-600 hover:underline">Back to Dashboard</Link>
            <Link href={`/engagements/${engagement_id}/planning/review`} className="text-orange-600 hover:underline">Review Notes</Link>
          </div>
        </div>
        <CreateDialog
          title="Add Planning Document"
          buttonLabel="Add Document"
          action={createStageDocument.bind(null, "planning", engagement_id)}
          fields={[
            { name: "reference", label: "Document Reference" },
            { name: "name", label: "Name", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "link", label: "Link" },
            { name: "files", label: "Files", type: "file" },
          ]}
        />
      </div>
      <DataGrid
        rows={rows.map((d) => ({
          ...d,
          prepared_by_name: d.r_prepared_by_engagement_auditor?.r_user
            ? `${d.r_prepared_by_engagement_auditor.r_user.first_name} ${d.r_prepared_by_engagement_auditor.r_user.last_name}`
            : "",
        })) as unknown as object[]}
        rowActions={["files", "signoff"]}
        filesEntity="planning_document"
        signoff={{ stage: "planning", engagementId: engagement_id, auditors }}
        colDefs={[
          { field: "document_reference", headerName: "Document Reference" },
          { field: "name", headerName: "Name", flex: 2 },
          { field: "description", headerName: "Description", flex: 2 },
          { field: "prepared_by_name", headerName: "Prepared By" },
          { field: "prepared_date", headerName: "Prepared Date" },
          { field: "authorised_date", headerName: "Authorised Date" },
        ]}
      />
    </div>
  );
}
