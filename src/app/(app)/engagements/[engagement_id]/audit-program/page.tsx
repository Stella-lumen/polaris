import { prisma } from "@/lib/db";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createAuditProgramItem } from "@/lib/actions";
import { notFound } from "next/navigation";

export const instant = false;

export default async function AuditProgramPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({ where: { id: engagement_id, deleted: false } });
  if (!engagement) notFound();
  const [rows, team] = await Promise.all([
    prisma.engagementAuditProgramItem.findMany({
      where: { engagement_id, deleted: false },
      orderBy: { risk_reference: "asc" },
    }),
    prisma.engagementAuditor.findMany({ where: { engagement_id, deleted: false }, include: { r_user: true } }),
  ]);
  const auditors = team.map((a) => ({
    id: a.id,
    label: a.r_user ? `${a.r_user.first_name} ${a.r_user.last_name} — ${a.position_on_audit}` : a.id,
  }));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Engagement Audit Program</h2>
        <CreateDialog
          title="Add Program Item"
          buttonLabel="Add Item"
          action={createAuditProgramItem.bind(null, engagement_id)}
          fields={[
            { name: "risk_reference", label: "Risk Reference" },
            { name: "risk", label: "Risk", type: "textarea", required: true },
            { name: "audit_objective", label: "Audit Objective", type: "textarea" },
            { name: "audit_procedure", label: "Audit Procedure", type: "textarea" },
            { name: "wp_ref", label: "Working Paper Ref (e.g. B1)" },
          ]}
        />
      </div>
      <DataGrid
        rows={rows as unknown as object[]}
        rowActions={["signoff"]}
        signoff={{ stage: "program", engagementId: engagement_id, auditors }}
        colDefs={[
          { field: "risk_reference", headerName: "Risk Reference" },
          { field: "risk", headerName: "Risk", flex: 2 },
          { field: "audit_objective", headerName: "Audit Objective", flex: 2 },
          { field: "audit_procedure", headerName: "Audit Procedure", flex: 2 },
          { field: "wp_ref", headerName: "WP Ref" },
          { field: "prepared_date", headerName: "Prepared Date" },
          { field: "authorised_date", headerName: "Authorised Date" },
        ]}
      />
    </div>
  );
}
