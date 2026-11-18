import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { updatePeriod, setPeriodStatus } from "@/lib/actions";
import { EditDialog } from "@/components/edit-dialog";
import { requireUser, canAuthorise } from "@/lib/auth";
import { fmtDate, fmtDateTime, inputDate } from "@/lib/dates";
import { PERIOD_TYPES, typeLabel, statusLabel, periodWarnings } from "@/lib/period-validation";
import Link from "next/link";
import { Pencil } from "lucide-react";

export const instant = false;

export default async function PeriodDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params;
  const { edit } = await searchParams;
  const user = await requireUser();
  const admin = canAuthorise(user);

  const [p, plans, updater] = await Promise.all([
    prisma.annualAuditPlanPeriod.findUnique({ where: { id } }),
    prisma.annualAuditPlan.findMany({ where: { period_id: id, deleted: false }, select: { id: true, name: true, status: true } }),
    prisma.annualAuditPlanPeriod.findUnique({ where: { id }, select: { updated_by: true } }).then((r) => (r?.updated_by ? prisma.user.findUnique({ where: { id: r.updated_by }, select: { first_name: true, last_name: true, email: true } }) : null)),
  ]);
  if (!p) return <p>Period not found.</p>;

  const warnings = periodWarnings(p);
  const updaterName = updater ? `${updater.first_name ?? ""} ${updater.last_name ?? ""}`.trim() || updater.email : null;
  const status = p.status ?? "OPEN";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/admin/periods" className="text-sm text-orange-600 hover:underline">← Back to periods</Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{typeLabel(p.period_type)}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs ${status === "OPEN" ? "bg-emerald-100 text-emerald-800" : status === "CLOSED" ? "bg-muted text-muted-foreground" : "bg-neutral-200 text-neutral-500"}`}>{statusLabel(status)}</span>
          {admin && (
            <Link href={`/admin/periods/${id}?edit=1`} title="Edit this period" className="text-orange-600 hover:text-orange-500">
              <Pencil className="h-4 w-4" />
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{p.description ?? "No description."}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {fmtDate(p.start_date)} → {fmtDate(p.end_date)} · Last updated {fmtDateTime(p.updated_at)}{updaterName ? ` by ${updaterName}` : ""}
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-sm font-medium text-amber-900">Needs attention</div>
          <ul className="mt-1 list-disc pl-5 text-sm text-amber-800">
            {warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
          {admin && (
            <Link href={`/admin/periods/${id}?edit=1`} className="mt-2 inline-block rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-500">
              Fix this period
            </Link>
          )}
        </div>
      )}

      {edit === "1" && (
        <EditDialog
          title={`Edit ${p.name}`}
          action={updatePeriod.bind(null, id)}
          values={{
            name: p.name,
            description: p.description,
            period_type: p.period_type,
            start_date: inputDate(p.start_date),
            end_date: inputDate(p.end_date),
          }}
          returnPath={`/admin/periods/${id}`}
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "period_type", label: "Type", type: "select", required: true, options: PERIOD_TYPES.map((t) => ({ value: t.value, label: t.label })) },
            { name: "start_date", label: "Start date", type: "date" },
            { name: "end_date", label: "End date", type: "date" },
          ]}
        />
      )}

      <section className="flex flex-col gap-3 rounded-lg border p-5">
        <h2 className="font-semibold">Status</h2>
        <p className="text-xs text-muted-foreground">Closing or archiving never breaks audit plans already using this period.</p>
        {admin ? (
          <div className="flex gap-2">
            {status === "OPEN" && (
              <form action={setPeriodStatus.bind(null, id, "CLOSED")}>
                <button className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50" title="Close this period — plans keep working">Close period</button>
              </form>
            )}
            {status !== "ARCHIVED" && (
              <form action={setPeriodStatus.bind(null, id, "ARCHIVED")}>
                <button className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-50" title="Archive — hide from new plans">Archive</button>
              </form>
            )}
            {status !== "OPEN" && (
              <form action={setPeriodStatus.bind(null, id, "OPEN")}>
                <button className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500" title="Reopen this period">Reopen</button>
              </form>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Only administrators can change the status.</p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border p-5">
        <h2 className="font-semibold">Audit plans using this period ({plans.length})</h2>
        {plans.length ? (
          <ul className="flex flex-col gap-1.5">
            {plans.map((pl) => (
              <li key={pl.id}>
                <Link href={`/annual-audit-plan/${pl.id}`} className="text-sm text-orange-600 hover:underline">{pl.name}</Link>
                <span className="ml-2 text-xs text-muted-foreground">{(pl.status ?? "draft").toLowerCase()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No audit plans use this period yet.</p>
        )}
      </section>
    </div>
  );
}
