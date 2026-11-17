import { prisma } from "@/lib/db";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createStageDocument, createFinding } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";

export const instant = false;

export default async function FieldworkPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({ where: { id: engagement_id, deleted: false } });
  if (!engagement) notFound();
  const [docs, findings, team] = await Promise.all([
    prisma.engagementFieldworkDocument.findMany({
      where: { engagement_id, deleted: false },
      include: { r_prepared_by_engagement_auditor: { include: { r_user: true } } },
      orderBy: { document_reference: "asc" },
    }),
    prisma.engagementFindingAndRecommendations.findMany({ where: { engagement_id, deleted: false } }),
    prisma.engagementAuditor.findMany({ where: { engagement_id, deleted: false }, include: { r_user: true } }),
  ]);
  const auditors = team.map((a) => ({
    id: a.id,
    label: a.r_user ? `${a.r_user.first_name} ${a.r_user.last_name} — ${a.position_on_audit}` : a.id,
  }));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">Fieldwork Documents</h2>
          <div className="flex gap-3 text-sm">
            <Link href={`/engagements/${engagement_id}/dashboard`} className="text-orange-600 hover:underline">Back to Dashboard</Link>
            <Link href={`/engagements/${engagement_id}/fieldwork/review`} className="text-orange-600 hover:underline">Review Notes</Link>
          </div>
        </div>
        <CreateDialog
          title="Add Fieldwork Document"
          buttonLabel="Add Document"
          action={createStageDocument.bind(null, "fieldwork", engagement_id)}
          fields={[
            { name: "reference", label: "Document Reference" },
            { name: "name", label: "Name", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "files", label: "Files (PDF, Office, images…)", type: "file" },
          ]}
        />
      </div>
      <DataGrid
        rows={docs.map((d) => ({
          ...d,
          prepared_by_name: d.r_prepared_by_engagement_auditor?.r_user
            ? `${d.r_prepared_by_engagement_auditor.r_user.first_name} ${d.r_prepared_by_engagement_auditor.r_user.last_name}`
            : "",
        })) as unknown as object[]}
        rowActions={["files", "signoff"]}
        filesEntity="fieldwork_document"
        signoff={{ stage: "fieldwork", engagementId: engagement_id, auditors }}
        colDefs={[
          { field: "document_reference", headerName: "Document Reference" },
          { field: "name", headerName: "Name", flex: 2 },
          { field: "description", headerName: "Description", flex: 2 },
          { field: "prepared_by_name", headerName: "Prepared By" },
          { field: "prepared_date", headerName: "Prepared Date" },
          { field: "authorised_date", headerName: "Authorised Date" },
        ]}
      />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Findings &amp; Recommendations</h2>
        <CreateDialog
          title="Add Finding"
          buttonLabel="Add Finding"
          action={createFinding.bind(null, engagement_id)}
          fields={[
            { name: "detailed_finding", label: "Detailed Finding", type: "textarea", required: true },
            { name: "root_cause", label: "Root Cause", type: "textarea" },
            { name: "recommendations", label: "Recommendations", type: "textarea" },
            { name: "management_comment", label: "Management Comment", type: "textarea" },
            { name: "fieldwork_document_id", label: "Fieldwork Document", type: "select", options: docs.map((d) => ({ value: d.id, label: `${d.document_reference} — ${d.name}` })) },
          ]}
        />
      </div>
      <DataGrid
        rows={findings as unknown as object[]}
        rowActions={["signoff"]}
        signoff={{ stage: "finding", engagementId: engagement_id, auditors }}
        colDefs={[
          { field: "detailed_finding", headerName: "Finding", flex: 2 },
          { field: "root_cause", headerName: "Root Cause", flex: 2 },
          { field: "recommendations", headerName: "Recommendations", flex: 2 },
          { field: "management_comment", headerName: "Management Comment", flex: 2 },
          { field: "authorised_date", headerName: "Authorised" },
        ]}
      />
    </div>
  );
}
