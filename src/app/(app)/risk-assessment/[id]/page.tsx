import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { EditDialog } from "@/components/edit-dialog";
import { updateRiskAssessment } from "@/lib/actions";
import { bandFor, bandBadgeClass, bandBadgeText, isHighRisk, DEFAULT_BANDS } from "@/lib/risk";

export const instant = false;

const rating = Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const categories = ["Strategic", "Operational", "Financial", "Compliance", "Information Technology", "Fraud"].map((c) => ({ value: c, label: c }));
const effectiveness = ["Effective", "Partially effective", "Ineffective", "Not tested"].map((c) => ({ value: c, label: c }));
const statuses = ["OPEN", "MITIGATED", "ACCEPTED", "CLOSED"].map((c) => ({ value: c, label: c }));

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default async function RiskDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [r, bands, objectives, users, planned] = await Promise.all([
    prisma.riskAssessment.findUnique({
      where: { id },
      include: {
        r_linked_planned_engagement: {
          include: {
            r_annual_audit_plan: true,
            engagements_planned_engagement: {
              include: { engagementFindingAndRecommendationss_engagement: { select: { id: true, detailed_finding: true, status: true } } },
            },
          },
        },
        r_risk_owner: true,
        r_assessed_by: true,
        r_strategic_objective: true,
        findings_source_risk: { select: { id: true, detailed_finding: true, status: true } },
      },
    }),
    prisma.riskRatingBand.findMany({ where: { deleted: false }, orderBy: { min_score: "asc" } }),
    prisma.strategicObjective.findMany({ where: { deleted: false }, orderBy: { sort_order: "asc" } }),
    prisma.user.findMany({ where: { deleted: false }, select: { id: true, first_name: true, last_name: true } }),
    prisma.plannedEngagement.findMany({ where: { deleted: false } }),
  ]);
  if (!r) notFound();
  const bandList = bands.length ? bands : DEFAULT_BANDS;
  const history = await prisma.auditLog.findMany({
    where: { table_name: "Risk Assessments", record_id: id },
    orderBy: { timestamp: "desc" },
    take: 50,
  });
  const pe = r.r_linked_planned_engagement;
  const engagements = pe?.engagements_planned_engagement ?? [];
  const findings = [...r.findings_source_risk, ...engagements.flatMap((e) => e.engagementFindingAndRecommendationss_engagement)];
  const overdue = r.next_review_date && r.next_review_date < new Date() && r.status !== "CLOSED";

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/risk-assessment" className="text-xs text-orange-600 hover:underline">← Risk Assessment</Link>
          <h1 className="text-2xl font-semibold text-primary">{r.auditable_entity}</h1>
          <p className="text-sm text-muted-foreground">{r.risk_description}</p>
        </div>
        <Link
          href={`/risk-assessment/${r.id}?edit=1`}
          className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500"
        >
          Re-assess
        </Link>
      </div>
      {sp.edit === "1" && (
        <EditDialog
          title="Re-assess Risk"
          action={updateRiskAssessment.bind(null, r.id)}
          returnPath={`/risk-assessment/${r.id}`}
          values={{
            auditable_entity: r.auditable_entity, risk_description: r.risk_description, risk_category: r.risk_category,
            inherent_likelihood: r.inherent_likelihood != null ? String(r.inherent_likelihood) : "", inherent_impact: r.inherent_impact != null ? String(r.inherent_impact) : "",
            existing_controls: r.existing_controls, control_effectiveness: r.control_effectiveness,
            residual_likelihood: r.residual_likelihood != null ? String(r.residual_likelihood) : "", residual_impact: r.residual_impact != null ? String(r.residual_impact) : "",
            risk_owner_id: r.risk_owner_id, strategic_objective_id: r.strategic_objective_id,
            status: r.status, next_review_date: r.next_review_date?.toISOString().slice(0, 10) ?? "",
            linked_planned_engagement_id: r.linked_planned_engagement_id,
          }}
          fields={[
            { name: "auditable_entity", label: "Auditable Entity / Process", required: true },
            { name: "risk_description", label: "Risk Description", type: "textarea", required: true },
            { name: "risk_category", label: "Risk Category", type: "select", options: categories },
            { name: "strategic_objective_id", label: "Strategic Objective", type: "select", options: objectives.map((o) => ({ value: o.id, label: o.name ?? o.id })) },
            { name: "inherent_likelihood", label: "Inherent Likelihood (1-5)", type: "select", required: true, options: rating },
            { name: "inherent_impact", label: "Inherent Impact (1-5)", type: "select", required: true, options: rating },
            { name: "existing_controls", label: "Existing Controls", type: "textarea" },
            { name: "control_effectiveness", label: "Control Effectiveness", type: "select", options: effectiveness },
            { name: "residual_likelihood", label: "Residual Likelihood (1-5)", type: "select", options: rating },
            { name: "residual_impact", label: "Residual Impact (1-5)", type: "select", options: rating },
            { name: "risk_owner_id", label: "Risk Owner", type: "select", options: users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}`.trim() || u.id })) },
            { name: "status", label: "Status", type: "select", options: statuses },
            { name: "next_review_date", label: "Next Review Date", type: "date" },
            { name: "linked_planned_engagement_id", label: "Linked Planned Engagement", type: "select", options: planned.map((p) => ({ value: p.id, label: p.name ?? p.id })) },
          ]}
        />
      )}

      <div className="grid grid-cols-2 gap-4 rounded-md border p-4 md:grid-cols-4">
        <Item label="Reference">{r.risk_ref ?? "—"}</Item>
        <Item label="Category">{r.risk_category ?? "—"}</Item>
        <Item label="Source">{r.source === "IMPORTED" ? "Imported from risk register" : "Internal Audit assessment"}</Item>
        <Item label="Status">{r.status}</Item>
        <Item label="Inherent rating">
          <span className={bandBadgeClass(bandFor(r.inherent_score, bandList))}>
            {bandBadgeText(r.inherent_score, bandFor(r.inherent_score, bandList))}
          </span>
          {r.inherent_likelihood != null ? <span className="ml-1 text-xs text-muted-foreground">({r.inherent_likelihood}×{r.inherent_impact})</span> : <span className="ml-1 text-xs text-muted-foreground">L/I not captured</span>}
        </Item>
        <Item label="Residual rating">
          <span className={bandBadgeClass(bandFor(r.residual_score, bandList))}>
            {bandBadgeText(r.residual_score, bandFor(r.residual_score, bandList))}
          </span>
          {r.residual_likelihood != null ? <span className="ml-1 text-xs text-muted-foreground">({r.residual_likelihood}×{r.residual_impact})</span> : <span className="ml-1 text-xs text-muted-foreground">L/I not captured</span>}
        </Item>
        <Item label="Control effectiveness">{r.control_effectiveness ?? "—"}</Item>
        <Item label="Risk owner">{r.r_risk_owner ? `${r.r_risk_owner.first_name} ${r.r_risk_owner.last_name}` : "—"}</Item>
        <Item label="Strategic objective">{r.r_strategic_objective?.name ?? "—"}</Item>
        <Item label="Next review">
          {r.next_review_date?.toISOString().slice(0, 10) ?? "—"}
          {overdue && <span className="ml-1 rounded bg-red-100 px-1 text-xs text-red-800">overdue</span>}
        </Item>
        <Item label="Assessed">{r.assessed_date?.toISOString().slice(0, 10) ?? "—"}{r.r_assessed_by ? ` by ${r.r_assessed_by.first_name} ${r.r_assessed_by.last_name}` : ""}</Item>
        <Item label="Coverage">
          {pe ? (
            <Link href={`/annual-audit-plan/${pe.annual_audit_plan_id}`} className="text-orange-600 hover:underline">
              {pe.r_annual_audit_plan?.name ?? pe.name}
            </Link>
          ) : isHighRisk(r.residual_score, bandList) ? (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">NOT COVERED</span>
          ) : "Uncovered"}
        </Item>
      </div>

      <div className="rounded-md border p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">Existing controls</div>
        <p className="text-sm">{r.existing_controls ?? "—"}</p>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-medium">Engagements from this risk</h2>
        {engagements.length ? (
          <ul className="list-inside list-disc text-sm">
            {engagements.map((e) => (
              <li key={e.id}><Link href={`/engagements/${e.id}/dashboard`} className="text-orange-600 hover:underline">{e.engagement_name ?? e.id}</Link></li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {pe ? `Planned: ${pe.name} — not yet converted to an engagement.` : "No planned engagement covers this risk yet."}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Findings traced to this risk</h2>
        {findings.length ? (
          <ul className="list-inside list-disc text-sm">
            {findings.map((f) => <li key={f.id}>{f.detailed_finding?.slice(0, 120)} <span className="text-xs text-muted-foreground">[{f.status}]</span></li>)}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No findings traced to this risk.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Reassessment history</h2>
        {history.length ? (
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="px-3 py-1.5">When</th><th className="px-3 py-1.5">Change</th><th className="px-3 py-1.5">Detail</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-3 py-1.5">{h.timestamp?.toISOString().replace("T", " ").slice(0, 16)}</td>
                    <td className="px-3 py-1.5">{h.operation_type}</td>
                    <td className="max-w-xl truncate px-3 py-1.5 text-muted-foreground">{JSON.stringify(h.new_values).slice(0, 200)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No changes recorded yet — every re-assessment is versioned here.</p>
        )}
      </section>
    </div>
  );
}
