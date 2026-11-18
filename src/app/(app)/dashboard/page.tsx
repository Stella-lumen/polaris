import { connection } from "next/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { escalateOverdueWork } from "@/lib/escalation";
import { Briefcase, CheckCircle2, FileWarning, TriangleAlert, BellRing } from "lucide-react";
import { isHighRisk, bandFor, bandBadgeClass, bandBadgeText, DEFAULT_BANDS } from "@/lib/risk";
import {
  EngagementStatusDonut, FindingsStatusDonut, EngagementsByTypeBar,
} from "@/components/dashboard-charts";

export const instant = false;

function relTime(d: Date | null): string {
  if (!d) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function DashboardPage() {
  await connection();
  const now = new Date();
  const scope = { deleted: false, organization_id: DEMO_ORGANIZATION_ID };

  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [engagements, findings, tasks, actions, allActions, risks, bands] = await Promise.all([
    prisma.engagement.findMany({
      where: scope,
      include: { r_engagement_type: true },
      orderBy: { updated_at: "desc" },
    }),
    prisma.engagementFindingAndRecommendations.findMany({
      where: scope,
      include: { r_engagement: true },
    }),
    prisma.task.findMany({
      where: { ...scope, status: { not: "DONE" }, due_date: { not: null, lte: in7days } },
      include: { r_assignee: true, r_engagement: true },
      orderBy: { due_date: "asc" },
      take: 8,
    }),
    prisma.correctiveAction.findMany({
      where: { ...scope, status: { not: "VERIFIED" }, due_date: { not: null, lte: in7days } },
      include: { r_owner: true },
      orderBy: { due_date: "asc" },
      take: 8,
    }),
    prisma.correctiveAction.findMany({ where: scope, select: { status: true, due_date: true, source: true } }),
    prisma.riskAssessment.findMany({
      where: scope,
      select: { id: true, auditable_entity: true, residual_score: true, residual_likelihood: true, residual_impact: true, linked_planned_engagement_id: true },
      orderBy: { residual_score: "desc" },
    }),
    prisma.riskRatingBand.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { min_score: "asc" } }),
  ]);

  const completed = engagements.filter((e) => e.authorised_date != null);
  const inProgress = engagements.filter(
    (e) => e.authorised_date == null && e.start_date != null && e.start_date <= now,
  );
  const notStarted = engagements.length - completed.length - inProgress.length;
  const cleared = findings.filter((f) => f.authorised_date != null);
  const overdue = findings.filter(
    (f) => f.authorised_date == null && f.r_engagement?.end_date != null && f.r_engagement.end_date < now,
  );

  const byType = new Map<string, { total: number; completed: number }>();
  for (const e of engagements) {
    const t = e.r_engagement_type?.name ?? "Other";
    const row = byType.get(t) ?? { total: 0, completed: 0 };
    row.total += 1;
    if (e.authorised_date != null) row.completed += 1;
    byType.set(t, row);
  }

  const rate = engagements.length ? Math.round((completed.length / engagements.length) * 100) : 0;

  const bandList = bands.length ? bands : DEFAULT_BANDS;
  const uncoveredHigh = risks.filter((r) => isHighRisk(r.residual_score, bandList) && !r.linked_planned_engagement_id).length;
  const heat = {} as Record<string, number>;
  for (const r of risks) {
    if (r.residual_likelihood && r.residual_impact) heat[`${r.residual_likelihood}x${r.residual_impact}`] = (heat[`${r.residual_likelihood}x${r.residual_impact}`] ?? 0) + 1;
  }
  const heatCell = (s: number) => s <= 4 ? "bg-emerald-100 text-emerald-900" : s <= 9 ? "bg-amber-100 text-amber-900" : s <= 14 ? "bg-orange-200 text-orange-950" : "bg-red-200 text-red-950";

  // Queue supervisor notifications for overdue/near-due work (idempotent per item per day)
  const escalation = await escalateOverdueWork();

  const overdueActions = allActions.filter((a) => a.due_date && a.due_date < now && a.status !== "VERIFIED").length;
  const openAG = allActions.filter((a) => a.source === "AG" && a.status !== "VERIFIED").length;
  const awaitingVerification = allActions.filter((a) => a.status === "IMPLEMENTED").length;
  const closureRate = allActions.length ? Math.round((allActions.filter((a) => a.status === "VERIFIED").length / allActions.length) * 100) : 0;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [engagementsRaw, timesheetsPending, expensesThisMonth, timeThisMonth] = await Promise.all([
    prisma.engagement.findMany({ where: scope, include: { timeEntries_engagement: { where: { deleted: false }, select: { hours: true } } } }),
    prisma.timesheet.findMany({ where: { deleted: false, status: "SUBMITTED" } }),
    prisma.expense.findMany({ where: { deleted: false, expense_date: { gte: monthStart } } }),
    prisma.timeEntry.aggregate({ where: { deleted: false, work_date: { gte: monthStart } }, _sum: { hours: true } }),
  ]);
  const hoursThisMonth = Number(timeThisMonth._sum.hours ?? 0);

  const cards = [
    { label: "Total Engagements", value: engagements.length, sub: `${rate}% completion rate`, icon: Briefcase, warn: false },
    { label: "Completed", value: completed.length, sub: `${inProgress.length} in progress`, icon: CheckCircle2, warn: false },
    { label: "Total Findings", value: findings.length, sub: `${cleared.length} cleared`, icon: FileWarning, warn: false },
    { label: "Overdue Findings", value: overdue.length, sub: "Require attention", icon: TriangleAlert, warn: true },
    { label: "Overdue Actions", value: overdueActions, sub: `${awaitingVerification} awaiting verification`, icon: TriangleAlert, warn: overdueActions > 0 },
    { label: "Corrective Actions", value: allActions.length, sub: `${closureRate}% closed · ${openAG} open AG`, icon: FileWarning, warn: openAG > 0 },
  ];

  const badge = (e: (typeof engagements)[number]) =>
    e.authorised_date != null
      ? { text: "Completed", cls: "bg-green-100 text-green-700" }
      : e.start_date != null && e.start_date <= now
        ? { text: "In Progress", cls: "bg-yellow-100 text-yellow-700" }
        : { text: "Not Started", cls: "bg-zinc-100 text-zinc-600" };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your audit management activities</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.warn ? "text-red-500" : "text-muted-foreground"}`} />
            </div>
            <div className="mt-1 text-3xl font-bold">{c.value}</div>
            <div className={`text-xs ${c.warn ? "text-red-500" : "text-muted-foreground"}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <EngagementStatusDonut data={[
          { name: "Completed", value: completed.length, color: "#16a34a" },
          { name: "In Progress", value: inProgress.length, color: "#eab308" },
          { name: "Not Started", value: notStarted, color: "#a1a1aa" },
        ]} />
        <FindingsStatusDonut data={[
          { name: "Cleared", value: cleared.length, color: "#16a34a" },
          { name: "Open", value: findings.length - cleared.length - overdue.length, color: "#eab308" },
          { name: "Overdue", value: overdue.length, color: "#dc2626" },
        ]} />
        <EngagementsByTypeBar data={[...byType.entries()].map(([type, v]) => ({ type, ...v }))} />
      </div>

      {risks.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="font-medium">Residual risk heat map</div>
            <div className="mb-3 text-xs text-muted-foreground">
              Likelihood × Impact — click a cell to view those risks
              {uncoveredHigh > 0 && <span className="ml-1 font-medium text-red-600">· {uncoveredHigh} high-risk items not covered by the plan</span>}
            </div>
            <div className="grid w-fit grid-cols-[auto_repeat(5,2.5rem)] gap-0.5 text-center text-xs">
              <div className="pr-1 text-[10px] text-muted-foreground">L\I</div>
              {[1, 2, 3, 4, 5].map((im) => <div key={im} className="text-muted-foreground">{im}</div>)}
              {[5, 4, 3, 2, 1].map((l) => (
                <div key={l} className="contents">
                  <div className="flex items-center pr-1 text-muted-foreground">{l}</div>
                  {[1, 2, 3, 4, 5].map((im) => (
                    <Link
                      key={im}
                      href={`/risk-assessment?l=${l}&i=${im}&view=r`}
                      className={`flex h-8 items-center justify-center rounded font-medium hover:ring-2 hover:ring-orange-400 ${heatCell(l * im)}`}
                    >
                      {heat[`${l}x${im}`] || ""}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-medium">Top residual risks</div>
            <div className="mb-3 text-xs text-muted-foreground">Highest-rated risks driving the audit plan</div>
            <div className="flex flex-col gap-1.5">
              {risks.slice(0, 10).map((r) => {
                const b = bandFor(r.residual_score, bandList);
                return (
                  <Link key={r.id} href={`/risk-assessment/${r.id}`} className="flex items-center gap-2 rounded border px-2 py-1.5 hover:bg-accent">
                    <span className={bandBadgeClass(b)}>{bandBadgeText(r.residual_score, b)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{r.auditable_entity}</span>
                    {!r.linked_planned_engagement_id && isHighRisk(r.residual_score, bandList) && (
                      <span className="rounded bg-red-100 px-1.5 text-xs font-medium text-red-800">not covered</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-2 font-medium">
          <BellRing className="h-4 w-4 text-orange-600" />
          Escalations — incomplete &amp; near-expiry work
        </div>
        <div className="mb-3 text-xs text-muted-foreground">
          Automated alerts for overdue tasks and corrective actions nearing their deadline
          {escalation.total > 0 && (
            <span className="ml-1 text-orange-600">
              — {escalation.queued > 0 ? `${escalation.queued} new notification${escalation.queued === 1 ? "" : "s"} queued to supervisors today` : "supervisors already notified today"}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {tasks.map((t) => {
            const isOverdue = t.due_date != null && t.due_date < now;
            return (
              <Link key={t.id} href="/tasks" className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                  {isOverdue ? "Overdue" : "Due soon"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Task · {t.r_assignee?.first_name} {t.r_assignee?.last_name}
                    {t.r_engagement?.engagement_name ? ` · ${t.r_engagement.engagement_name}` : ""}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">due {t.due_date?.toISOString().slice(0, 10)}</span>
              </Link>
            );
          })}
          {actions.map((a) => {
            const isOverdue = a.due_date != null && a.due_date < now;
            return (
              <Link key={a.id} href="/follow-up" className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                  {isOverdue ? "Overdue" : "Due soon"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.action_description}</div>
                  <div className="text-xs text-muted-foreground">
                    Corrective action · {a.r_owner?.first_name} {a.r_owner?.last_name}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">due {a.due_date?.toISOString().slice(0, 10)}</span>
              </Link>
            );
          })}
          {tasks.length === 0 && actions.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">Nothing overdue or due within 7 days</div>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="font-medium">Recent Activity</div>
        <div className="mb-3 text-xs text-muted-foreground">Latest engagement updates</div>
        <div className="flex flex-col gap-2">
          {engagements.slice(0, 6).map((e) => {
            const b = badge(e);
            return (
              <a
                key={e.id}
                href={`/engagements/${e.id}/dashboard`}
                className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent"
              >
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.cls}`}>{b.text}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{e.engagement_name}</div>
                  <div className="text-xs text-muted-foreground">{e.r_engagement_type?.name}</div>
                </div>
                <span className="text-xs text-muted-foreground">{relTime(e.updated_at)}</span>
              </a>
            );
          })}
          {engagements.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">No engagements yet</div>
          )}
        </div>
      </div>

      {/* Resource allocation widgets */}
      {(() => {
        const overBudget = engagementsRaw.filter((e) => {
          const p = Number(e.planned_hours ?? 0);
          const u = e.timeEntries_engagement.reduce((s, t) => s + Number(t.hours ?? 0), 0);
          return p > 0 && u >= p;
        }).length;
        const pendingTs = timesheetsPending.length;
        const monthExp = expensesThisMonth.reduce((s, e) => s + Number(e.amount ?? 0), 0);
        return (
          <div className="grid gap-4 md:grid-cols-4">
            <a href="/resources" className="rounded-md border p-4 hover:bg-accent">
              <div className="text-xs text-muted-foreground">Engagements over budget</div>
              <div className={`text-2xl font-semibold ${overBudget ? "text-red-600" : ""}`}>{overBudget}</div>
              <div className="text-xs text-muted-foreground">planned hours used up</div>
            </a>
            <a href="/resources" className="rounded-md border p-4 hover:bg-accent">
              <div className="text-xs text-muted-foreground">Timesheets waiting</div>
              <div className={`text-2xl font-semibold ${pendingTs ? "text-amber-600" : ""}`}>{pendingTs}</div>
              <div className="text-xs text-muted-foreground">for approval</div>
            </a>
            <a href="/resources" className="rounded-md border p-4 hover:bg-accent">
              <div className="text-xs text-muted-foreground">Expenses this month</div>
              <div className="text-2xl font-semibold">R {monthExp.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-muted-foreground">{expensesThisMonth.length} claims</div>
            </a>
            <a href="/resources" className="rounded-md border p-4 hover:bg-accent">
              <div className="text-xs text-muted-foreground">Hours logged this month</div>
              <div className="text-2xl font-semibold">{hoursThisMonth}</div>
              <div className="text-xs text-muted-foreground">across all engagements</div>
            </a>
          </div>
        );
      })()}
    </div>
  );
}
