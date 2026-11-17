import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EngagementForm } from "@/components/engagement-form";

export const instant = false;

const fmtStamp = (d: Date | null) =>
  d
    ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} at ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
    : null;

export default async function EngagementMasterDataPage({
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

  const [auditors, plans, planned, types, users, updater] = await Promise.all([
    prisma.engagementAuditor.findMany({ where: { engagement_id, deleted: false }, include: { r_user: true } }),
    prisma.annualAuditPlan.findMany({ where: { deleted: false } }),
    prisma.plannedEngagement.findMany({ where: { deleted: false } }),
    prisma.engagementType.findMany({ where: { deleted: false } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
    engagement.updated_by
      ? prisma.user.findUnique({ where: { id: engagement.updated_by }, select: { email: true } })
      : null,
  ]);

  const outsourced = auditors.find((a) => a.position_on_audit === "OUTSOURCED_PARTY");
  const team = auditors
    .filter((a) => a.position_on_audit !== "OUTSOURCED_PARTY")
    .map((a) => ({
      user_id: a.user_id ?? "",
      position: a.position_on_audit ?? "AUDITOR",
      qualifications: a.qualifications ?? "",
      experience: a.experience ?? "",
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-orange-600">Engagement</h2>
        <div>
          <Link
            href={`/engagements/${engagement_id}/dashboard`}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
          >
            Back to Dashboard
          </Link>
        </div>
        {(engagement.updated_at || updater) && (
          <div className="text-sm text-muted-foreground">
            Last updated by {updater?.email ?? "system"} on {fmtStamp(engagement.updated_at)}
          </div>
        )}
      </div>
      <EngagementForm
        engagement={{
          id: engagement.id,
          engagement_name: engagement.engagement_name,
          engagement_number: engagement.engagement_number,
          annual_audit_plan_id: engagement.annual_audit_plan_id,
          planned_engagement_id: engagement.planned_engagement_id,
          engagement_type_id: engagement.engagement_type_id,
          start_date: engagement.start_date?.toISOString().slice(0, 10) ?? null,
          end_date: engagement.end_date?.toISOString().slice(0, 10) ?? null,
          engagement_budget: engagement.engagement_budget != null ? String(engagement.engagement_budget) : null,
          engagement_spend: engagement.engagement_spend != null ? String(engagement.engagement_spend) : null,
          authorised_date: engagement.authorised_date?.toISOString() ?? null,
        }}
        plans={plans.map((p) => ({ value: p.id, label: p.name ?? p.id }))}
        plannedEngagements={planned.map((p) => ({ value: p.id, label: p.name ?? p.id, planId: p.annual_audit_plan_id ?? "" }))}
        types={types.map((t) => ({ value: t.id, label: t.name ?? t.id }))}
        users={users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }))}
        initialOutsourcedId={outsourced?.user_id ?? ""}
        initialTeam={team}
      />
    </div>
  );
}
