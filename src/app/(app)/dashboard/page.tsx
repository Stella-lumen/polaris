import { connection } from "next/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { Briefcase, CheckCircle2, FileWarning, TriangleAlert, BellRing } from "lucide-react";
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
  const [engagements, findings, tasks, actions] = await Promise.all([
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

  const cards = [
    { label: "Total Engagements", value: engagements.length, sub: `${rate}% completion rate`, icon: Briefcase, warn: false },
    { label: "Completed", value: completed.length, sub: `${inProgress.length} in progress`, icon: CheckCircle2, warn: false },
    { label: "Total Findings", value: findings.length, sub: `${cleared.length} cleared`, icon: FileWarning, warn: false },
    { label: "Overdue Findings", value: overdue.length, sub: "Require attention", icon: TriangleAlert, warn: true },
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

      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-2 font-medium">
          <BellRing className="h-4 w-4 text-orange-600" />
          Escalations — incomplete &amp; near-expiry work
        </div>
        <div className="mb-3 text-xs text-muted-foreground">
          Automated alerts for overdue tasks and corrective actions nearing their deadline
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
    </div>
  );
}
