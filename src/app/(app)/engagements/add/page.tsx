import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { EngagementForm } from "@/components/engagement-form";
import Link from "next/link";

export const instant = false;

export default async function AddEngagementPage() {
  const scope = { deleted: false, organization_id: DEMO_ORGANIZATION_ID };
  const [plans, planned, types, users] = await Promise.all([
    prisma.annualAuditPlan.findMany({ where: scope }),
    prisma.plannedEngagement.findMany({ where: scope }),
    prisma.engagementType.findMany({ where: scope }),
    prisma.user.findMany({ where: scope }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-orange-600">Engagement</h2>
        <div>
          <Link
            href="/engagements"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
          >
            Back to Engagements
          </Link>
        </div>
      </div>
      <EngagementForm
        plans={plans.map((p) => ({ value: p.id, label: p.name ?? p.id }))}
        plannedEngagements={planned.map((p) => ({
          value: p.id,
          label: `${p.reference ?? ""} ${p.name ?? ""}`.trim() || p.id,
          planId: p.annual_audit_plan_id ?? "",
        }))}
        types={types.map((t) => ({ value: t.id, label: t.name ?? t.id }))}
        users={users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }))}
      />
    </div>
  );
}
