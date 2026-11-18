export const instant = false;

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DataGrid } from "@/components/data-grid";

const SECTION: Record<string, string> = {
  planning_document: "Planning",
  program_document: "Audit program",
  fieldwork_document: "Fieldwork",
  report_document: "Report",
  working_paper: "Working paper",
};

export default async function EngagementDocumentsPage({ params }: { params: Promise<{ engagement_id: string }> }) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findUnique({ where: { id: engagement_id } });
  if (!engagement) notFound();
  const [planning, program, fieldwork, reporting, papers] = await Promise.all([
    prisma.engagementPlanningDocument.findMany({ where: { engagement_id, deleted: false }, select: { id: true } }),
    prisma.engagementAuditProgramItem.findMany({ where: { engagement_id, deleted: false }, select: { id: true } }),
    prisma.engagementFieldworkDocument.findMany({ where: { engagement_id, deleted: false }, select: { id: true } }),
    prisma.engagementReportDocument.findMany({ where: { engagement_id, deleted: false }, select: { id: true } }),
    prisma.workingPaper.findMany({ where: { engagement_id, deleted: false }, select: { id: true } }),
  ]);
  const ids = [
    ...planning.map((d) => ({ t: "planning_document", id: d.id })),
    ...program.map((d) => ({ t: "program_document", id: d.id })),
    ...fieldwork.map((d) => ({ t: "fieldwork_document", id: d.id })),
    ...reporting.map((d) => ({ t: "report_document", id: d.id })),
    ...papers.map((d) => ({ t: "working_paper", id: d.id })),
  ];
  const files = await prisma.storedFile.findMany({
    where: { deleted: false, OR: ids.map((x) => ({ entity_type: x.t, entity_id: x.id })) },
    orderBy: { created_at: "desc" },
  });
  const uploaderIds = [...new Set(files.map((f) => f.created_by).filter(Boolean))] as string[];
  const uploaders = new Map((await prisma.user.findMany({ where: { id: { in: uploaderIds } } })).map((u) => [u.id, `${u.first_name} ${u.last_name}`]));

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary">Documents</h2>
      {files.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No documents uploaded yet. Attach files from the Planning, Audit Program, Fieldwork, Working Papers or Report tabs.</div>}
      <DataGrid
        rows={files.map((f) => ({
          id: f.id,
          name: f.name,
          section: SECTION[f.entity_type ?? ""] ?? f.entity_type,
          uploaded_by: uploaders.get(f.created_by ?? "") ?? "Unknown",
          uploaded: f.created_at?.toISOString().slice(0, 10) ?? "—",
          size: `${Math.round((f.size ?? 0) / 1024)} KB`,
        })) as unknown as object[]}
        colDefs={[
          { field: "name", headerName: "File", flex: 2, tooltipField: "name" },
          { field: "section", headerName: "Section", width: 140 },
          { field: "uploaded_by", headerName: "Uploaded by", width: 170, tooltipField: "uploaded_by" },
          { field: "uploaded", headerName: "Uploaded", width: 110 },
          { field: "size", headerName: "Size", width: 90, type: "rightAligned" },
        ]}
      />
      <div className="flex flex-col gap-1">
        {files.map((f) => (
          <a key={f.id} href={`/api/files/${f.id}`} className="text-xs text-orange-600 hover:underline">{f.name} — {SECTION[f.entity_type ?? ""] ?? "Document"}</a>
        ))}
      </div>
    </div>
  );
}
