import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { fmtRand, budgetPercent, budgetWarning, utilisationLabel } from "@/lib/resource-logic";

export const instant = false;

const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => (u ? `${u.first_name} ${u.last_name}` : "");

export default async function ResourcesOverviewPage() {
  const [engagements, users, timesheets, expenses, timeThisMonth, leavePending] = await Promise.all([
    prisma.engagement.findMany({
      where: { deleted: false },
      include: {
        teamMembers_engagement: { where: { deleted: false }, include: { r_user: true } },
        timeEntries_engagement: { where: { deleted: false } },
        expenses_engagement: { where: { deleted: false } },
      },
    }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
    prisma.timesheet.findMany({ where: { deleted: false, status: "SUBMITTED", organization_id: DEMO_ORGANIZATION_ID }, include: { r_user: true } }),
    prisma.expense.findMany({ where: { deleted: false, status: "CLAIMED", organization_id: DEMO_ORGANIZATION_ID } }),
    prisma.timeEntry.aggregate({ where: { deleted: false }, _sum: { hours: true } }),
    prisma.leaveRequest.count({ where: { deleted: false, status: "REQUESTED", organization_id: DEMO_ORGANIZATION_ID } }),
  ]);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const capacity = users.map((u) => {
    const planned = engagements.flatMap((e) => e.teamMembers_engagement.filter((m) => m.user_id === u.id)).reduce((s, m) => s + Number(m.planned_hours ?? 0), 0);
    const logged = engagements.flatMap((e) => e.timeEntries_engagement.filter((t) => t.user_id === u.id && t.work_date && t.work_date >= monthStart)).reduce((s, t) => s + Number(t.hours ?? 0), 0);
    const available = Math.max(0, Math.round(((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)).getDate()) * (5 / 7)) * 8);
    const util = available > 0 ? Math.round((planned / available) * 100) : null;
    return { u, available, planned, logged, util };
  }).filter((c) => c.planned > 0 || c.logged > 0);

  const totalExp = engagements.flatMap((e) => e.expenses_engagement).reduce((s, x) => s + Number(x.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <a href="/resources/time-entries" className="rounded-md border p-4 hover:bg-accent">
          <div className="text-xs text-muted-foreground">Total hours logged</div>
          <div className="text-2xl font-semibold">{Number(timeThisMonth._sum.hours ?? 0)}</div>
        </a>
        <a href="/resources/expenses" className="rounded-md border p-4 hover:bg-accent">
          <div className="text-xs text-muted-foreground">Total expenses</div>
          <div className="text-2xl font-semibold">{fmtRand(totalExp)}</div>
        </a>
        <a href="/resources/timesheets" className="rounded-md border p-4 hover:bg-accent">
          <div className="text-xs text-muted-foreground">Timesheets waiting</div>
          <div className={`text-2xl font-semibold ${timesheets.length ? "text-amber-600" : ""}`}>{timesheets.length}</div>
        </a>
        <a href="/resources/expenses" className="rounded-md border p-4 hover:bg-accent">
          <div className="text-xs text-muted-foreground">Claims + leave waiting</div>
          <div className={`text-2xl font-semibold ${expenses.length + leavePending ? "text-amber-600" : ""}`}>{expenses.length + leavePending}</div>
        </a>
      </div>

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
                  <a href={`/engagements/${e.id}/dashboard`} className="font-medium text-orange-600 hover:underline">{e.engagement_name}</a>
                  <span className="text-xs text-muted-foreground">{e.teamMembers_engagement.length} team member{e.teamMembers_engagement.length === 1 ? "" : "s"}</span>
                </div>
                <div className="h-2 w-full rounded bg-zinc-100"><div className={`h-2 rounded ${pct != null && pct >= 100 ? "bg-red-500" : pct != null && pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct ?? 0)}%` }} /></div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>Hours: {usedH} used{pH ? ` of ${pH} planned (${pct}%)` : " — no plan set"}</span>
                  <span>Expenses: {fmtRand(usedE)}{pE ? ` of ${fmtRand(pE)} (${ePct}%)` : ""}</span>
                </div>
                {warn && <div className={`mt-1 rounded px-2 py-1 text-xs ${pct != null && pct >= 100 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>{warn}</div>}
                {e.teamMembers_engagement.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {e.teamMembers_engagement.map((m) => (
                      <span key={m.id} className="rounded bg-zinc-100 px-2 py-0.5 text-xs">{person(m.r_user)}{m.planned_hours ? ` · ${m.planned_hours}h` : ""}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Team capacity — this month</h2>
        {capacity.length ? (
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
        ) : <p className="text-sm text-muted-foreground">No team allocations yet — add team members on an engagement dashboard.</p>}
      </section>
    </div>
  );
}
