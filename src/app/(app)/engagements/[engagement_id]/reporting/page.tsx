import { prisma } from "@/lib/db";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createStageDocument, ensureStageDocs, approveEngagementReport } from "@/lib/actions";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";

export const instant = false;

export default async function ReportingPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({ where: { id: engagement_id, deleted: false } });
  if (!engagement) notFound();
  await ensureStageDocs(engagement_id);
  const [rows, team, findings, user] = await Promise.all([
    prisma.engagementReportDocument.findMany({
      where: { engagement_id, deleted: false },
      include: { r_prepared_by_engagement_auditor: { include: { r_user: true } } },
      orderBy: { document_reference: "asc" },
    }),
    prisma.engagementAuditor.findMany({ where: { engagement_id, deleted: false }, include: { r_user: true } }),
    prisma.engagementFindingAndRecommendations.findMany({ where: { engagement_id, deleted: false }, select: { id: true, detailed_finding: true, recommendations: true } }),
    getSessionUser(),
  ]);
  const reportApprover = engagement.report_approved_by
    ? await prisma.user.findUnique({ where: { id: engagement.report_approved_by }, select: { first_name: true, last_name: true } })
    : null;
  const auditors = team.map((a) => ({
    id: a.id,
    label: a.r_user ? `${a.r_user.first_name} ${a.r_user.last_name} — ${a.position_on_audit}` : a.id,
  }));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">Report Documents</h2>
          <div className="flex gap-3 text-sm">
            <Link href={`/engagements/${engagement_id}/dashboard`} className="text-orange-600 hover:underline">Back to Dashboard</Link>
            <Link href={`/engagements/${engagement_id}/reporting/review`} className="text-orange-600 hover:underline">Review Notes</Link>
            <Link href={`/engagements/${engagement_id}/findings-and-recommendations`} className="text-orange-600 hover:underline">
              Findings &amp; Recommendations
            </Link>
            <a href={`/engagements/${engagement_id}/reporting/export`} className="text-orange-600 hover:underline">Export to Word</a>
          </div>
        </div>
        <CreateDialog
          title="Add Report Document"
          buttonLabel="Add Document"
          action={createStageDocument.bind(null, "report", engagement_id)}
          fields={[
            { name: "reference", label: "Document Reference" },
            { name: "name", label: "Name", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "link", label: "Link" },
            { name: "files", label: "Files", type: "file" },
          ]}
        />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Report status</h3>
            <p className="text-xs text-muted-foreground">{findings.length} finding{findings.length === 1 ? "" : "s"} will be included in the report (see the Findings tab).</p>
          </div>
          {engagement.report_approved_date ? (
            <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
              Report approved by {reportApprover ? `${reportApprover.first_name} ${reportApprover.last_name}` : "a supervisor"} on {engagement.report_approved_date.toISOString().slice(0, 10)}
            </span>
          ) : user && canAuthorise(user) ? (
            <form action={approveEngagementReport.bind(null, engagement_id)}>
              <button className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Approve report</button>
            </form>
          ) : (
            <span className="text-xs text-muted-foreground">Awaiting supervisor approval</span>
          )}
        </div>
      </div>
      <DataGrid
        rows={rows.map((d) => ({
          ...d,
          prepared_by_name: d.r_prepared_by_engagement_auditor?.r_user
            ? `${d.r_prepared_by_engagement_auditor.r_user.first_name} ${d.r_prepared_by_engagement_auditor.r_user.last_name}`
            : "",
        })) as unknown as object[]}
        rowActions={["files", "signoff"]}
        filesEntity="report_document"
        signoff={{ stage: "report", engagementId: engagement_id, auditors }}
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
