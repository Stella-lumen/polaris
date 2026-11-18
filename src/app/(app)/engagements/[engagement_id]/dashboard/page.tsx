import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SquarePen } from "lucide-react";
import { CreateDialog } from "@/components/create-dialog";
import { addTeamMember, removeTeamMember, setEngagementBudget } from "@/lib/actions";
import { isEffective } from "@/lib/declarations";

export const instant = false;

const stages = [
  { n: 1, slug: "auditor-declarations", name: "Independence Assessment" },
  { n: 2, slug: "planning", name: "Engagement Planning" },
  { n: 3, slug: "audit-program", name: "Engagement Audit Program" },
  { n: 4, slug: "fieldwork", name: "Engagement Fieldwork" },
  { n: 5, slug: "reporting", name: "Engagement Reporting" },
];

type StageItem = { prepared_date?: Date | null; authorised_date?: Date | null };

function stageStatus(items: StageItem[]) {
  if (items.length && items.every((i) => i.authorised_date)) return "AUTHORISED";
  if (items.some((i) => i.prepared_date)) return "PREPARED";
  return "PENDING";
}

const badgeClass: Record<string, string> = {
  PENDING: "bg-red-500",
  PREPARED: "bg-amber-500",
  AUTHORISED: "bg-emerald-600",
};

export default async function EngagementDashboardPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({
    where: { id: engagement_id, deleted: false },
    include: { r_annual_audit_plan: true, r_engagement_type: true },
  });
  if (!engagement) notFound();

  const where = { engagement_id, deleted: false };
  const [declarations, planningDocs, programItems, fieldworkDocs, reportDocs, team, users, timeUsed, expUsed, activeDeclCount, signedRows] = await Promise.all([
    prisma.engagementAuditorDeclaration.findMany({ where, select: { authorised_date: true } }),
    prisma.engagementPlanningDocument.findMany({ where, select: { prepared_date: true, authorised_date: true } }),
    prisma.engagementAuditProgramItem.findMany({ where, select: { prepared_date: true, authorised_date: true } }),
    prisma.engagementFieldworkDocument.findMany({ where, select: { prepared_date: true, authorised_date: true } }),
    prisma.engagementReportDocument.findMany({ where, select: { prepared_date: true, authorised_date: true } }),
    prisma.engagementTeamMember.findMany({ where, include: { r_user: true } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
    prisma.timeEntry.aggregate({ where, _sum: { hours: true } }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
    prisma.declaration.count({ where: { deleted: false, disabled: false } }),
    prisma.engagementAuditorDeclaration.findMany({ where, select: { engagement_auditor_id: true, declaration_id: true, status: true } }),
  ]);
  // Team members who have signed (or had approved conflicts on) every active declaration
  const signedByAuditor = new Map<string, Set<string>>();
  for (const r of signedRows.filter(isEffective)) {
    if (!r.engagement_auditor_id || !r.declaration_id) continue;
    if (!signedByAuditor.has(r.engagement_auditor_id)) signedByAuditor.set(r.engagement_auditor_id, new Set());
    signedByAuditor.get(r.engagement_auditor_id)!.add(r.declaration_id);
  }
  const auditors = await prisma.engagementAuditor.findMany({ where, select: { id: true } });
  const fullySigned = auditors.filter((a) => (signedByAuditor.get(a.id)?.size ?? 0) >= activeDeclCount && activeDeclCount > 0).length;
  const stageItems = [declarations, planningDocs, programItems, fieldworkDocs, reportDocs];
  const usedHours = Number(timeUsed._sum.hours ?? 0);
  const usedExp = Number(expUsed._sum.amount ?? 0);
  const plannedH = Number(engagement.planned_hours ?? 0);
  const pct = plannedH > 0 ? Math.round((usedHours / plannedH) * 100) : null;
  const ROLE_L: Record<string, string> = { LEAD: "Lead auditor", AUDITOR: "Auditor", REVIEWER: "Reviewer" };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-semibold text-primary">
        Engagement Dashboard - {engagement.engagement_name} ({engagement.engagement_number})
      </h2>
      <div>
        <Link
          href={`/engagements/${engagement_id}`}
          className="rounded-md bg-orange-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-500"
        >
          Master Data
        </Link>
      </div>
      <div className="flex w-full max-w-xl flex-col gap-4 pl-8">
        {stages.map((s, i) => {
          const items = stageItems[i] as StageItem[];
          const status = stageStatus(items);
          return (
            <Link
              key={s.slug}
              href={`/engagements/${engagement_id}/${s.slug}`}
              style={{ marginLeft: i * 24 }}
              className="flex items-center justify-between rounded-xl border bg-background px-5 py-4 shadow-sm transition-colors hover:border-orange-300"
            >
              <span className="text-sm">
                {s.n}. {s.name}
              </span>
              <span className="flex items-center gap-4">
                <SquarePen className="h-4 w-4 text-neutral-600" />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase text-white ${badgeClass[status]}`}
                >
                  {status} ({items.length})
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="max-w-xl pl-8 text-sm text-muted-foreground">
        {auditors.length === 0
          ? "No team members yet — add people below, then they sign under Independence assessment."
          : `${fullySigned} of ${auditors.length} team member${auditors.length === 1 ? " has" : "s have"} signed all declarations.`}{" "}
        <Link href={`/engagements/${engagement_id}/auditor-declarations`} className="text-orange-600 hover:underline">Open independence assessment</Link>
      </p>

      <div className="w-full max-w-3xl rounded-md border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">Team and budget</h3>
          <div className="flex gap-2">
            <CreateDialog title="Set budget" buttonLabel="Set budget" action={setEngagementBudget.bind(null, engagement_id)}
              fields={[
                { name: "planned_hours", label: `Planned hours${engagement.planned_hours ? ` (currently ${engagement.planned_hours})` : ""}`, type: "number" },
                { name: "planned_expense_budget", label: `Planned expenses in Rand${engagement.planned_expense_budget ? ` (currently R ${engagement.planned_expense_budget})` : ""}`, type: "number" },
              ]} />
            <CreateDialog title="Add team member" buttonLabel="Add team member" action={addTeamMember.bind(null, engagement_id)}
              fields={[
                { name: "user_id", label: "Auditor", type: "select", required: true, options: users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })) },
                { name: "role", label: "Role", type: "select", required: true, options: [{ value: "LEAD", label: "Lead auditor" }, { value: "AUDITOR", label: "Auditor" }, { value: "REVIEWER", label: "Reviewer" }] },
                { name: "planned_hours", label: "Planned hours", type: "number" },
                { name: "start_date", label: "Start", type: "date" },
                { name: "end_date", label: "End", type: "date" },
              ]} />
          </div>
        </div>
        <div className="mb-3 text-sm">
          Hours used: <strong>{usedHours}</strong>{plannedH ? ` of ${plannedH} planned (${pct}%)` : ""} · Expenses: <strong>R {usedExp.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</strong>
          {pct != null && pct >= 80 && <span className={`ml-2 rounded px-2 py-0.5 text-xs ${pct >= 100 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>This engagement has used {pct}% of its planned hours.</span>}
        </div>
        {team.length ? (
          <ul className="flex flex-col gap-1 text-sm">
            {team.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded border px-2 py-1.5">
                <span>{m.r_user ? `${m.r_user.first_name} ${m.r_user.last_name}` : ""} — {ROLE_L[m.role ?? ""] ?? m.role}{m.planned_hours ? ` · ${m.planned_hours}h planned` : ""}{m.start_date ? ` · ${m.start_date.toISOString().slice(0, 10)}${m.end_date ? ` to ${m.end_date.toISOString().slice(0, 10)}` : ""}` : ""}</span>
                <form action={removeTeamMember.bind(null, m.id, engagement_id)}><button className="text-xs text-red-600 hover:underline">Remove</button></form>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No team members allocated yet.</p>}
      </div>
    </div>
  );
}
