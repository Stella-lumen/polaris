import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import {
  createTimeEntry, createExpense, submitTimesheet, approveTimesheet, reopenTimesheet,
  returnTimesheet, rejectExpense, approveTimesheetForm, requestLeave, approveLeave, approveExpense, markExpensePaid, approveExpenseForm, approveLeaveForm, rejectLeaveForm,
} from "@/lib/actions";
import { fmtRand, budgetPercent, budgetWarning, utilisationLabel, ACTIVITY_TYPES, EXPENSE_CATEGORIES, LEAVE_TYPES } from "@/lib/resource-logic";

export const instant = false;

const dstr = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => (u ? `${u.first_name} ${u.last_name}` : "");
const ACT: Record<string, string> = { PLANNING: "Planning", FIELDWORK: "Fieldwork", REPORTING: "Reporting", FOLLOW_UP: "Follow-up", TRAINING: "Training", ADMIN: "Admin", LEAVE: "Leave" };
const TS: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Waiting for approval", APPROVED: "Approved", RETURNED: "Sent back" };
const EX: Record<string, string> = { CLAIMED: "Claimed", APPROVED: "Approved", REJECTED: "Rejected", PAID: "Paid" };
const LV: Record<string, string> = { ANNUAL: "Annual leave", SICK: "Sick leave", TRAINING: "Training", PUBLIC_HOLIDAY: "Public holiday", OTHER: "Other" };

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const me = await getSessionUser();
  const canApprove = me ? canAuthorise(me) : false;
  const [engagements, users, holidays] = await Promise.all([
    prisma.engagement.findMany({ where: { deleted: false }, include: { teamMembers_engagement: { where: { deleted: false }, include: { r_user: true } }, timeEntries_engagement: { where: { deleted: false } }, expenses_engagement: { where: { deleted: false } } } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
    prisma.publicHoliday.findMany({ where: { deleted: false } }),
  ]);
  const holidaySet = new Set(holidays.map((h) => dstr(h.holiday_date)));

  // Filters
  const fEng = sp.engagement ?? "";
  const fUser = sp.auditor ?? "";
  const fAct = sp.activity ?? "";
  const fStatus = sp.status ?? "";
  const fFrom = sp.from ?? "";
  const fTo = sp.to ?? "";

  const timeWhere = {
    deleted: false as const, organization_id: DEMO_ORGANIZATION_ID,
    ...(fEng ? { engagement_id: fEng } : {}),
    ...(fUser ? { user_id: fUser } : {}),
    ...(fAct ? { activity_type: fAct } : {}),
    ...(fStatus ? { status: fStatus } : {}),
    ...(fFrom || fTo ? { work_date: { ...(fFrom ? { gte: new Date(fFrom) } : {}), ...(fTo ? { lte: new Date(fTo + "T23:59:59") } : {}) } } : {}),
  };
  const expWhere = {
    deleted: false as const, organization_id: DEMO_ORGANIZATION_ID,
    ...(fEng ? { engagement_id: fEng } : {}),
    ...(fUser ? { user_id: fUser } : {}),
    ...(fStatus ? { status: fStatus } : {}),
  };
  const [timeEntries, expenses, timesheets, leave] = await Promise.all([
    prisma.timeEntry.findMany({ where: timeWhere, include: { r_user: true, r_engagement: true }, orderBy: { work_date: "desc" } }),
    prisma.expense.findMany({ where: expWhere, include: { r_user: true, r_engagement: true }, orderBy: { expense_date: "desc" } }),
    prisma.timesheet.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, include: { r_user: true, time_entries: { where: { deleted: false } } }, orderBy: { week_start: "desc" } }),
    prisma.leaveRequest.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, include: { r_user: true }, orderBy: { start_date: "desc" } }),
  ]);

  const totalHours = timeEntries.reduce((s, t) => s + Number(t.hours ?? 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const pendingTs = timesheets.filter((t) => t.status === "SUBMITTED");
  const pendingExp = expenses.filter((e) => e.status === "CLAIMED");

  // Capacity per auditor (current month)
  const now = new Date();
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const hoursPerDay = 8;
  const capacity = users.map((u) => {
    const planned = engagements.flatMap((e) => e.teamMembers_engagement.filter((m) => m.user_id === u.id)).reduce((s, m) => s + Number(m.planned_hours ?? 0), 0);
    const logged = timeEntries.filter((t) => t.user_id === u.id && t.work_date && t.work_date >= mStart && t.work_date <= mEnd).reduce((s, t) => s + Number(t.hours ?? 0), 0);
    const leaveDays = leave.filter((l) => l.user_id === u.id && l.status === "APPROVED" && l.start_date && l.end_date && l.start_date <= mEnd && l.end_date >= mStart).length;
    const workDays = Math.max(0, Math.round((mEnd.getTime() - mStart.getTime()) / 86400000) * (5 / 7)) - leaveDays;
    const available = Math.max(0, workDays * hoursPerDay);
    const util = available > 0 ? Math.round((planned / available) * 100) : null;
    return { u, available, planned, logged, util };
  }).filter((c) => c.available > 0 || c.planned > 0 || c.logged > 0);

  const engagementOpts = engagements.map((e) => ({ value: e.id, label: e.engagement_name ?? e.id }));
  const userOpts = users.map((u) => ({ value: u.id, label: person(u) }));
  const actOpts = ACTIVITY_TYPES.map((a) => ({ value: a, label: ACT[a] }));
  const catOpts = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c[0] + c.slice(1).toLowerCase() }));
  const leaveOpts = LEAVE_TYPES.map((l) => ({ value: l, label: LV[l] }));

  // This week Monday for the submit button
  const monday = new Date(now); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekIso = monday.toISOString().slice(0, 10);

  const base = "/resources?";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Resource Allocation</h1>
        <div className="flex gap-6 text-sm">
          <span>Hours shown: <strong>{totalHours.toLocaleString()}</strong></span>
          <span>Expenses shown: <strong>{fmtRand(totalExpenses)}</strong></span>
          {pendingTs.length > 0 && <span className="text-amber-700"><strong>{pendingTs.length}</strong> timesheet{pendingTs.length === 1 ? "" : "s"} waiting</span>}
          {pendingExp.length > 0 && <span className="text-amber-700"><strong>{pendingExp.length}</strong> expense claim{pendingExp.length === 1 ? "" : "s"} waiting</span>}
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-2 text-sm" action="/resources" method="get">
        <select name="engagement" defaultValue={fEng} className="rounded border px-2 py-1"><option value="">All engagements</option>{engagementOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="auditor" defaultValue={fUser} className="rounded border px-2 py-1"><option value="">All auditors</option>{userOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="activity" defaultValue={fAct} className="rounded border px-2 py-1"><option value="">All activities</option>{actOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="status" defaultValue={fStatus} className="rounded border px-2 py-1"><option value="">All statuses</option>{["DRAFT", "SUBMITTED", "APPROVED", "RETURNED", "CLAIMED", "REJECTED", "PAID"].map((s) => <option key={s} value={s}>{TS[s] ?? EX[s]}</option>)}</select>
        <input type="date" name="from" defaultValue={fFrom} className="rounded border px-2 py-1" />
        <input type="date" name="to" defaultValue={fTo} className="rounded border px-2 py-1" />
        <button className="rounded bg-orange-600 px-3 py-1 text-white">Apply</button>
        <a href="/resources" className="px-2 py-1 text-muted-foreground hover:underline">Clear</a>
      </form>

      {/* Budget vs actual per engagement */}
      <section>
        <h2 className="mb-2 text-lg font-medium">Engagement budgets</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {engagements.map((e) => {
            const usedH = e.timeEntries_engagement.reduce((s, t) => s + Number(t.hours ?? 0), 0);
            const usedE = e.expenses_engagement.reduce((s, x) => s + Number(x.amount ?? 0), 0);
            const pH = Number(e.planned_hours ?? 0);
            const pE = Number(e.planned_expense_budget ?? 0);
            const pct = budgetPercent(usedH, pH || null);
            const warn = budgetWarning(pct);
            const ePct = budgetPercent(usedE, pE || null);
            return (
              <div key={e.id} className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{e.engagement_name}</span>
                  <span className="text-xs text-muted-foreground">{e.teamMembers_engagement.length} team member{e.teamMembers_engagement.length === 1 ? "" : "s"}</span>
                </div>
                <div className="h-2 w-full rounded bg-zinc-100"><div className={`h-2 rounded ${pct != null && pct >= 100 ? "bg-red-500" : pct != null && pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct ?? 0)}%` }} /></div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>Hours: {usedH} used{pH ? ` of ${pH} planned (${pct}%)` : " — no plan set"}</span>
                  <span>Expenses: {fmtRand(usedE)}{pE ? ` of ${fmtRand(pE)} (${ePct}%)` : ""}</span>
                </div>
                {warn && <div className={`mt-1 rounded px-2 py-1 text-xs ${pct != null && pct >= 100 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>{warn}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Team capacity */}
      <section>
        <h2 className="mb-2 text-lg font-medium">Team capacity — this month</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs text-muted-foreground"><th className="p-2">Auditor</th><th className="p-2">Available hours</th><th className="p-2">Planned hours</th><th className="p-2">Logged hours</th><th className="p-2">Use</th><th className="p-2"></th></tr></thead>
            <tbody>
              {capacity.map((c) => (
                <tr key={c.u.id} className="border-b last:border-0">
                  <td className="p-2">{person(c.u)}</td><td className="p-2">{c.available}</td><td className="p-2">{c.planned}</td><td className="p-2">{c.logged}</td>
                  <td className="p-2">{c.util != null ? `${c.util}%` : "—"}</td>
                  <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs ${utilisationLabel(c.util) === "Over-allocated" ? "bg-red-50 text-red-800" : utilisationLabel(c.util) === "Balanced" ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>{utilisationLabel(c.util)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Time entries */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Time entries</h2>
          <div className="flex gap-2">
            <form action={submitTimesheet.bind(null, weekIso)}><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Submit this week for approval</button></form>
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
        <DataGrid
          heightClass="h-[280px]"
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
      </section>

      {/* Timesheets */}
      <section>
        <h2 className="mb-2 text-lg font-medium">Timesheets</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs text-muted-foreground"><th className="p-2">Week starting</th><th className="p-2">Auditor</th><th className="p-2">Entries</th><th className="p-2">Status</th><th className="p-2">Comment</th><th className="p-2"></th></tr></thead>
            <tbody>
              {timesheets.length === 0 && <tr><td colSpan={6} className="p-3 text-sm text-muted-foreground">No timesheets submitted yet.</td></tr>}
              {timesheets.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="p-2">{dstr(t.week_start)}</td><td className="p-2">{person(t.r_user)}</td><td className="p-2">{t.time_entries.length}</td>
                  <td className="p-2">{TS[t.status ?? "DRAFT"] ?? t.status}{t.comment ? ` — ${t.comment}` : ""}</td>
                  <td className="p-2 text-xs text-muted-foreground">{t.approved_by ? `by ${users.find((u) => u.id === t.approved_by) ? person(users.find((u) => u.id === t.approved_by)) : "supervisor"}` : ""}</td>
                  <td className="p-2 text-right">
                    {t.status === "SUBMITTED" && canApprove && (
                      <span className="flex justify-end gap-1">
                        <form action={approveTimesheetForm.bind(null, t.id)}><button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve</button></form>
                        <CreateDialog title="Send back" buttonLabel="Send back" action={returnTimesheet.bind(null, t.id)} fields={[{ name: "comment", label: "What needs fixing?", type: "textarea", required: true }]} />
                      </span>
                    )}
                    {t.status === "APPROVED" && canApprove && (
                      <CreateDialog title="Reopen timesheet" buttonLabel="Reopen" action={reopenTimesheet.bind(null, t.id)} fields={[{ name: "reason", label: "Reason", type: "textarea", required: true }]} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Expenses */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Expenses</h2>
          <CreateDialog title="Claim Expense" buttonLabel="Claim Expense" action={createExpense}
            fields={[
              { name: "engagement_id", label: "Engagement", type: "select", required: true, options: engagementOpts },
              { name: "category", label: "Category", type: "select", options: catOpts },
              { name: "description", label: "Description", type: "text", required: true },
              { name: "amount", label: "Amount (Rand)", type: "number", required: true },
              { name: "expense_date", label: "Date", type: "date", required: true },
              { name: "files", label: "Receipt (required over R 500)", type: "file" },
            ]} />
        </div>
        <DataGrid
          heightClass="h-[220px]"
          rows={expenses.map((e) => ({
            id: e.id,
            expense_date: dstr(e.expense_date),
            engagement: e.r_engagement?.engagement_name ?? "",
            claimed_by: person(e.r_user),
            category: e.category ? e.category[0] + e.category.slice(1).toLowerCase() : "—",
            description: e.description,
            amount: e.amount != null ? fmtRand(Number(e.amount)) : "—",
            status: EX[e.status ?? "CLAIMED"] ?? e.status,
            receipt: e.receipt_file_id ? "Yes" : "No",
            can_approve: canApprove && e.status === "CLAIMED" && e.user_id !== me?.id,
            can_pay: canApprove && e.status === "APPROVED",
          }))}
          colDefs={[
            { field: "expense_date", headerName: "Date", width: 105 },
            { field: "engagement", headerName: "Engagement", flex: 1 },
            { field: "claimed_by", headerName: "Claimed by", width: 150 },
            { field: "category", headerName: "Category", width: 110 },
            { field: "description", headerName: "Description", flex: 1, tooltipField: "description" },
            { field: "amount", headerName: "Amount", width: 120 },
            { field: "receipt", headerName: "Receipt", width: 80 },
            { field: "status", headerName: "Status", width: 100 },
          ]}
        />
        {canApprove && pendingExp.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {pendingExp.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <span>{person(e.r_user)} — {e.description} — <strong>{fmtRand(Number(e.amount ?? 0))}</strong></span>
                <span className="flex gap-1">
                  <form action={approveExpenseForm.bind(null, e.id)}><button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve</button></form>
                  <CreateDialog title="Reject claim" buttonLabel="Reject" action={rejectExpense.bind(null, e.id)} fields={[{ name: "reason", label: "Reason for rejecting", type: "textarea", required: true }]} />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Leave */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Leave and time off</h2>
          <CreateDialog title="Request leave" buttonLabel="Request leave" action={requestLeave}
            fields={[
              { name: "leave_type", label: "Type", type: "select", required: true, options: leaveOpts },
              { name: "start_date", label: "From", type: "date", required: true },
              { name: "end_date", label: "To", type: "date", required: true },
              { name: "reason", label: "Reason", type: "textarea" },
            ]} />
        </div>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs text-muted-foreground"><th className="p-2">Who</th><th className="p-2">Type</th><th className="p-2">From</th><th className="p-2">To</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead>
            <tbody>
              {leave.length === 0 && <tr><td colSpan={6} className="p-3 text-sm text-muted-foreground">No leave requests.</td></tr>}
              {leave.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-2">{person(l.r_user)}</td><td className="p-2">{LV[l.leave_type ?? ""] ?? l.leave_type}</td>
                  <td className="p-2">{dstr(l.start_date)}</td><td className="p-2">{dstr(l.end_date)}</td>
                  <td className="p-2">{l.status === "REQUESTED" ? "Waiting for approval" : l.status === "APPROVED" ? "Approved" : "Rejected"}{l.reason ? ` — ${l.reason}` : ""}</td>
                  <td className="p-2 text-right">
                    {l.status === "REQUESTED" && canApprove && l.user_id !== me?.id && (
                      <span className="flex justify-end gap-1">
                        <form action={approveLeaveForm.bind(null, l.id)}><button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve</button></form>
                        <form action={rejectLeaveForm.bind(null, l.id)}><button className="rounded border px-2 py-1 text-xs">Reject</button></form>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Public holidays are loaded for South Africa — {holidays.length} on record.</p>
      </section>
    </div>
  );
}
