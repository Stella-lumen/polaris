import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DataGrid } from "@/components/data-grid";
import { fmtRand, budgetPercent } from "@/lib/resource-logic";

const ROLE_LABEL: Record<string, string> = { LEAD: "Engagement lead", AUDITOR: "Auditor", REVIEWER: "Reviewer" };

export default async function EngagementTeamPage({ params }: { params: Promise<{ engagement_id: string }> }) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findUnique({ where: { id: engagement_id } });
  if (!engagement) notFound();
  const [team, entries, expenses] = await Promise.all([
    prisma.engagementTeamMember.findMany({ where: { engagement_id, deleted: false }, include: { r_user: true } }),
    prisma.timeEntry.findMany({ where: { engagement_id, deleted: false }, include: { r_user: true }, orderBy: { work_date: "desc" } }),
    prisma.expense.findMany({ where: { engagement_id, deleted: false }, orderBy: { expense_date: "desc" } }),
  ]);
  const hoursByUser = new Map<string, number>();
  for (const e of entries) hoursByUser.set(e.user_id ?? "", (hoursByUser.get(e.user_id ?? "") ?? 0) + Number(e.hours));
  const totHours = entries.reduce((s, e) => s + Number(e.hours), 0);
  const totExp = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const plannedH = Number(engagement.planned_hours ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Team and hours</h2>
        <Link href="/resources" className="rounded-md border border-primary px-3 py-1.5 text-xs text-primary">Open Resource Allocation</Link>
      </div>
      <div className="flex gap-2 text-xs">
        <span className="rounded bg-zinc-100 px-2 py-1">Team: {team.length}</span>
        <span className="rounded bg-zinc-100 px-2 py-1">Hours: {totHours}{plannedH ? ` of ${plannedH} planned (${budgetPercent(totHours, plannedH)}%)` : " logged"}</span>
        <span className="rounded bg-zinc-100 px-2 py-1">Expenses: {fmtRand(totExp)}</span>
      </div>
      <h3 className="text-sm font-semibold">Team</h3>
      <DataGrid
        rows={team.map((m) => ({
          id: m.id,
          name: `${m.r_user?.first_name} ${m.r_user?.last_name}`,
          role: ROLE_LABEL[m.role ?? ""] ?? "Auditor",
          planned: m.planned_hours ? `${m.planned_hours} h` : "—",
          logged: `${(hoursByUser.get(m.user_id ?? "") ?? 0).toFixed(1)} h`,
          period: m.start_date && m.end_date ? `${m.start_date.toISOString().slice(0, 10)} → ${m.end_date.toISOString().slice(0, 10)}` : "—",
        })) as unknown as object[]}
        colDefs={[
          { field: "name", headerName: "Member", flex: 1.5, tooltipField: "name" },
          { field: "role", headerName: "Role", width: 140 },
          { field: "planned", headerName: "Planned", width: 100 },
          { field: "logged", headerName: "Logged", width: 100 },
          { field: "period", headerName: "Period", flex: 1 },
        ]}
      />
      <h3 className="text-sm font-semibold">Time entries</h3>
      <DataGrid
        rows={entries.map((e) => ({
          id: e.id,
          person: e.r_user ? `${e.r_user.first_name} ${e.r_user.last_name}` : "—",
          date: e.work_date?.toISOString().slice(0, 10) ?? "—",
          hours: Number(e.hours),
          description: e.description ?? "—",
        })) as unknown as object[]}
        colDefs={[
          { field: "person", headerName: "Person", width: 180, tooltipField: "person" },
          { field: "date", headerName: "Date", width: 110 },
          { field: "hours", headerName: "Hours", width: 80, type: "rightAligned" },
          { field: "description", headerName: "Description", flex: 2, tooltipField: "description" },
        ]}
      />
    </div>
  );
}
