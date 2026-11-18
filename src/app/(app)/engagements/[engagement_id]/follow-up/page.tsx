import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DataGrid } from "@/components/data-grid";
import { fmtRand } from "@/lib/resource-logic";

const STATUS_LABEL: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In progress", IMPLEMENTED: "Implemented", VERIFIED: "Verified", NOT_EFFECTIVE: "Not effective" };

export default async function EngagementFollowUpPage({ params }: { params: Promise<{ engagement_id: string }> }) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findUnique({ where: { id: engagement_id } });
  if (!engagement) notFound();
  const actions = await prisma.correctiveAction.findMany({
    where: { deleted: false, r_finding: { engagement_id } },
    include: { r_finding: { select: { detailed_finding: true } }, r_owner: true },
    orderBy: { due_date: "asc" },
  });
  const now = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Follow-up</h2>
        <Link href="/follow-up" className="rounded-md border border-primary px-3 py-1.5 text-xs text-primary">Open follow-up register</Link>
      </div>
      {actions.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No corrective actions for this engagement yet. They are created from findings.</div>}
      <DataGrid
        rows={actions.map((a) => {
          const overdue = a.due_date && a.due_date.getTime() < now && a.status !== "VERIFIED" ? Math.floor((now - a.due_date.getTime()) / 864e5) : 0;
          return {
            id: a.id,
            action: a.action_description,
            finding: a.r_finding?.detailed_finding ?? "—",
            owner: a.r_owner ? `${a.r_owner.first_name} ${a.r_owner.last_name}` : "Not assigned",
            due: a.due_date?.toISOString().slice(0, 10) ?? "—",
            progress: `${a.progress ?? 0}%`,
            status: STATUS_LABEL[a.status ?? ""] ?? a.status,
            flag: overdue ? `Overdue by ${overdue} day${overdue === 1 ? "" : "s"}` : "",
          };
        }) as unknown as object[]}
        hrefPattern="/follow-up/{id}"
        colDefs={[
          { field: "action", headerName: "Action", flex: 2, tooltipField: "action" },
          { field: "finding", headerName: "Finding", flex: 2, tooltipField: "finding" },
          { field: "owner", headerName: "Owner", width: 160, tooltipField: "owner" },
          { field: "due", headerName: "Due", width: 110 },
          { field: "progress", headerName: "Done", width: 80 },
          { field: "status", headerName: "Status", width: 130 },
          { field: "flag", headerName: "", width: 140, tooltipField: "flag" },
        ]}
      />
    </div>
  );
}
