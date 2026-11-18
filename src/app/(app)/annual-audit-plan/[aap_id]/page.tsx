import Link from "next/link";
import { prisma } from "@/lib/db";
import { DataGrid } from "@/components/data-grid";
import { notFound } from "next/navigation";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { isHighRisk, DEFAULT_BANDS } from "@/lib/risk";
import { fmtRand } from "@/lib/resource-logic";
import { submitPlan, authorisePlan, committeeSignOff, revisePlan, addRiskToPlanDetail } from "@/lib/actions";

export const instant = false;

const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Submitted", AUTHORISED: "Authorised", CLOSED: "Closed" };

export default async function AapDetailPage({ params }: { params: Promise<{ aap_id: string }> }) {
  const { aap_id } = await params;
  const [plan, user, bands, versions] = await Promise.all([
    prisma.annualAuditPlan.findFirst({ where: { id: aap_id, deleted: false }, include: { r_period: true, r_prepared_by: true, r_authorised_by: true } }),
    getSessionUser(),
    prisma.riskRatingBand.findMany({ where: { deleted: false }, orderBy: { min_score: "asc" } }),
    prisma.planVersion.findMany({ where: { plan_id: aap_id }, orderBy: { version_no: "desc" } }),
  ]);
  if (!plan) notFound();
  const bandList = bands.length ? bands : DEFAULT_BANDS;
  const [planned, risks, staff, engagements] = await Promise.all([
    prisma.plannedEngagement.findMany({ where: { annual_audit_plan_id: plan.id, deleted: false }, include: { r_engagement_type: true, engagements_planned_engagement: { select: { id: true, engagement_name: true } } } }),
    prisma.riskAssessment.findMany({ where: { deleted: false }, select: { id: true, auditable_entity: true, residual_score: true, linked_planned_engagement_id: true } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false }, select: { id: true, first_name: true, last_name: true } }),
    prisma.engagement.findMany({ where: { deleted: false }, select: { id: true, engagement_name: true, annual_audit_plan_id: true } }),
  ]);
  const names = new Map(staff.map((u) => [u.id, `${u.first_name} ${u.last_name}`]));
  const planRiskIds = new Set(planned.map((p) => p.risk_id).filter(Boolean));
  const linkedRiskIds = new Set(risks.filter((r) => r.linked_planned_engagement_id && planned.some((p) => p.id === r.linked_planned_engagement_id)).map((r) => r.id));
  const coveredRisks = new Set([...planRiskIds, ...linkedRiskIds]);
  const highRisks = risks.filter((r) => isHighRisk(r.residual_score, bandList));
  const highCovered = highRisks.filter((r) => r.linked_planned_engagement_id != null).length;
  const uncovered = highRisks.filter((r) => r.linked_planned_engagement_id == null);
  const samePerson = plan.prepared_by_id && plan.prepared_by_id === plan.authorised_by_id;
  const committeeSigner = plan.committee_signed_by ? names.get(plan.committee_signed_by) : null;
  const canAuth = user ? canAuthorise(user) : false;
  const totBudget = planned.reduce((s, p) => s + Number(p.planned_budget ?? 0), 0);
  const totHours = planned.reduce((s, p) => s + Number(p.planned_hours ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/annual-audit-plan" className="text-sm text-orange-600 hover:underline">← All plans</Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          <p className="text-sm text-muted-foreground">
            {plan.description} · {plan.r_period?.name} · Version {plan.version_no} · <span className="font-medium">{STATUS_LABEL[plan.status ?? ""] ?? "Draft"}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prepared by {plan.r_prepared_by ? `${plan.r_prepared_by.first_name} ${plan.r_prepared_by.last_name}` : "Not recorded"}{plan.prepared_date ? ` on ${plan.prepared_date.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" })}` : ""}
            {plan.r_authorised_by ? ` · Authorised by ${plan.r_authorised_by.first_name} ${plan.r_authorised_by.last_name} on ${plan.authorised_date?.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" })}` : ""}
            {committeeSigner ? ` · Committee sign-off by ${committeeSigner} on ${plan.committee_signed_date?.toLocaleString("en-ZA", { dateStyle: "long" })}` : ""}
          </p>
          {samePerson && <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">Prepared and authorised by the same person</p>}
        </div>
        <div className="flex items-center gap-2">
          <a href={`/annual-audit-plan/${plan.id}/export`} className="rounded-md border px-3 py-1.5 text-xs" title="Download this plan as a Word file">Export</a>
          {plan.status === "DRAFT" && <form action={submitPlan.bind(null, plan.id)}><button className="rounded-md border border-primary px-3 py-1.5 text-xs text-primary">Submit for approval</button></form>}
          {(plan.status === "SUBMITTED" || plan.status === "DRAFT") && canAuth && plan.prepared_by_id !== user?.id && (
            <form action={authorisePlan.bind(null, plan.id)} className="flex items-center gap-1">
              <input name="comment" placeholder="Comment (optional)" className="w-32 rounded-md border px-2 py-1 text-xs" />
              <button className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Authorise</button>
            </form>
          )}
          {plan.status === "SUBMITTED" && plan.prepared_by_id === user?.id && (
            <span className="text-xs text-muted-foreground">Awaiting authorisation — you prepared this plan</span>
          )}
          {plan.status === "AUTHORISED" && canAuth && !plan.committee_signed_date && (
            <form action={committeeSignOff.bind(null, plan.id)} className="flex items-center gap-1">
              <input name="comment" placeholder="Minute ref / comment" className="w-36 rounded-md border px-2 py-1 text-xs" />
              <button className="rounded-md border px-3 py-1.5 text-xs">Record committee sign-off</button>
            </form>
          )}
          {plan.status === "AUTHORISED" && (
            <form action={revisePlan.bind(null, plan.id)} className="flex items-center gap-1">
              <input name="reason" placeholder="Reason for revision" className="w-36 rounded-md border px-2 py-1 text-xs" required />
              <button className="rounded-md border px-3 py-1.5 text-xs">Revise</button>
            </form>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-zinc-100 px-2 py-1">Planned engagements: {planned.length}</span>
        <span className="rounded bg-zinc-100 px-2 py-1">Planned hours: {totHours || "—"}</span>
        <span className="rounded bg-zinc-100 px-2 py-1">Budget: {fmtRand(totBudget)}</span>
        <a href="/risk-assessment?covered=false&band=high" className={`rounded px-2 py-1 ${uncovered.length ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
          High/Extreme risks covered: {highCovered} of {highRisks.length}
        </a>
      </div>

      {uncovered.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="mb-2 text-sm font-medium text-amber-900">Uncovered high/extreme risks</p>
          {uncovered.map((r) => (
            <form key={r.id} action={addRiskToPlanDetail.bind(null, plan.id, r.id)} className="mb-1 flex items-center gap-2 text-xs">
              <span className="w-64">{r.auditable_entity} (score {r.residual_score})</span>
              <select name="quarter" className="rounded-md border px-1.5 py-1"><option value="">Quarter…</option>{["Q1", "Q2", "Q3", "Q4"].map((q) => <option key={q}>{q}</option>)}</select>
              <input name="planned_hours" type="number" placeholder="Hours" className="w-20 rounded-md border px-1.5 py-1" />
              <select name="lead_user_id" className="rounded-md border px-1.5 py-1"><option value="">Lead…</option>{staff.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}</select>
              <button className="rounded-md bg-primary px-2 py-1 text-primary-foreground">Add to plan</button>
            </form>
          ))}
        </div>
      )}

      <h2 className="text-lg font-medium">Planned engagements</h2>
      <DataGrid
        rows={planned.map((p) => {
          const risk = risks.find((r) => r.linked_planned_engagement_id === p.id || r.id === p.risk_id);
          const eng = p.engagements_planned_engagement?.[0];
          return {
            id: p.id,
            reference: p.reference ?? "—",
            name: p.name,
            type: p.r_engagement_type?.name ?? "—",
            risk: risk?.auditable_entity ?? "Not linked",
            quarter: p.quarter ?? "—",
            lead: names.get(p.lead_user_id ?? "") ?? "Not assigned",
            hours: p.planned_hours ? `${p.planned_hours}` : "—",
            budget: p.planned_budget ? fmtRand(Number(p.planned_budget)) : "—",
            engagement: eng?.engagement_name ?? "Not started",
            status: { PLANNED: "Planned", IN_PROGRESS: "In progress", DONE: "Done" }[p.status ?? ""] ?? "Planned",
          };
        }) as unknown as object[]}
        colDefs={[
          { field: "reference", headerName: "Ref", width: 80 },
          { field: "name", headerName: "Engagement", flex: 2, tooltipField: "name" },
          { field: "type", headerName: "Type", width: 150, tooltipField: "type" },
          { field: "risk", headerName: "Linked risk", flex: 1.5, tooltipField: "risk" },
          { field: "quarter", headerName: "Quarter", width: 80 },
          { field: "lead", headerName: "Lead", width: 150, tooltipField: "lead" },
          { field: "hours", headerName: "Hours", width: 75, type: "rightAligned" },
          { field: "budget", headerName: "Budget", width: 120 },
          { field: "engagement", headerName: "Engagement", flex: 1.5, tooltipField: "engagement" },
          { field: "status", headerName: "Status", width: 110 },
        ]}
      />

      {versions.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Version history</h2>
          <ol className="flex flex-col gap-1 text-xs">
            {versions.map((v) => (
              <li>Version {v.version_no} — revised by {names.get(v.revised_by ?? "") ?? "Not recorded"}{v.created_at ? ` on ${v.created_at.toLocaleString("en-ZA", { dateStyle: "long" })}` : ""}{v.revision_reason ? ` — “${v.revision_reason}”` : ""}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
