import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createTimeEntry, submitTimesheet } from "@/lib/actions";
import { ACTIVITY_TYPES } from "@/lib/resource-logic";

export const instant = false;

const dstr = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => (u ? `${u.first_name} ${u.last_name}` : "");
const ACT: Record<string, string> = { PLANNING: "Planning", FIELDWORK: "Fieldwork", REPORTING: "Reporting", FOLLOW_UP: "Follow-up", TRAINING: "Training", ADMIN: "Admin", LEAVE: "Leave" };
const TS: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Waiting for approval", APPROVED: "Approved", RETURNED: "Sent back" };

export default async function TimeEntriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [engagements, users] = await Promise.all([
    prisma.engagement.findMany({ where: { deleted: false } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
  ]);
  const where = {
    deleted: false as const, organization_id: DEMO_ORGANIZATION_ID,
    ...(sp.engagement ? { engagement_id: sp.engagement } : {}),
    ...(sp.auditor ? { user_id: sp.auditor } : {}),
    ...(sp.activity ? { activity_type: sp.activity } : {}),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.from || sp.to ? { work_date: { ...(sp.from ? { gte: new Date(sp.from) } : {}), ...(sp.to ? { lte: new Date(sp.to + "T23:59:59") } : {}) } } : {}),
  };
  const timeEntries = await prisma.timeEntry.findMany({ where, include: { r_user: true, r_engagement: true }, orderBy: { work_date: "desc" } });
  const totalHours = timeEntries.reduce((s, t) => s + Number(t.hours ?? 0), 0);
  const now = new Date();
  const monday = new Date(now); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const engagementOpts = engagements.map((e) => ({ value: e.id, label: e.engagement_name ?? e.id }));
  const userOpts = users.map((u) => ({ value: u.id, label: person(u) }));
  const actOpts = ACTIVITY_TYPES.map((a) => ({ value: a, label: ACT[a] }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm">Hours shown: <strong>{totalHours.toLocaleString()}</strong></span>
        <div className="flex gap-2">
          <form action={submitTimesheet.bind(null, monday.toISOString().slice(0, 10))}><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Submit this week for approval</button></form>
          <CreateDialog title="Log Time" buttonLabel="Log Time" action={createTimeEntry}
            fields={[
              { name: "engagement_id", label: "Engagement", type: "select", required: true, options: engagementOpts },
              { name: "work_date", label: "Date", type: "date", required: true },
              { name: "hours", label: "Hours", type: "number", required: true },
              { name: "activity_type", label: "Activity", type: "select", options: actOpts },
              { name: "description", label: "Work done", type: "textarea" },
            ]} />
        </div>
      </div>
      <form className="flex flex-wrap items-end gap-2 text-sm" action="/resources/time-entries" method="get">
        <select name="engagement" defaultValue={sp.engagement ?? ""} className="rounded border px-2 py-1"><option value="">All engagements</option>{engagementOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="auditor" defaultValue={sp.auditor ?? ""} className="rounded border px-2 py-1"><option value="">All auditors</option>{userOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="activity" defaultValue={sp.activity ?? ""} className="rounded border px-2 py-1"><option value="">All activities</option>{actOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border px-2 py-1"><option value="">All statuses</option>{Object.entries(TS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input type="date" name="from" defaultValue={sp.from ?? ""} className="rounded border px-2 py-1" />
        <input type="date" name="to" defaultValue={sp.to ?? ""} className="rounded border px-2 py-1" />
        <button className="rounded bg-orange-600 px-3 py-1 text-white">Apply</button>
        <a href="/resources/time-entries" className="px-2 py-1 text-muted-foreground hover:underline">Clear</a>
      </form>
      <DataGrid
        heightClass="h-[420px]"
        rows={timeEntries.map((t) => ({
          id: t.id,
          work_date: dstr(t.work_date),
          auditor: person(t.r_user),
          engagement: t.r_engagement?.engagement_name ?? "",
          hours: t.hours != null ? Number(t.hours) : null,
          activity: ACT[t.activity_type ?? ""] ?? "—",
          status: TS[t.status ?? "DRAFT"] ?? t.status,
          description: t.description,
        }))}
        colDefs={[
          { field: "work_date", headerName: "Date", width: 105 },
          { field: "auditor", headerName: "Auditor", width: 170 },
          { field: "engagement", headerName: "Engagement", flex: 1 },
          { field: "hours", headerName: "Hours", width: 80, type: "rightAligned" },
          { field: "activity", headerName: "Activity", width: 110 },
          { field: "status", headerName: "Status", width: 150 },
          { field: "description", headerName: "Work done", flex: 1, tooltipField: "description" },
        ]}
      />
    </div>
  );
}
