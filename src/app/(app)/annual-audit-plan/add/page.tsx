import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { actorId, canAuthorise, requireUser } from "@/lib/auth";
import { delegationFor, logAudit } from "@/lib/actions";

export const instant = false;

async function createPlan(formData: FormData) {
  "use server";
  const uid = await actorId();
  const user = await requireUser();
  if (formData.get("intent") === "authorise" && user.role === "org:delegated_preparer")
    throw new Error("A delegated preparer can prepare work but can never approve it — a supervisor must approve.");
  const onBehalfOf = await delegationFor(uid, "AUDIT_PLANS");
  const authorise = formData.get("intent") === "authorise" && canAuthorise(user) && !onBehalfOf;
  const plan = await prisma.annualAuditPlan.create({
    data: {
      organization_id: DEMO_ORGANIZATION_ID,
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      period_id: String(formData.get("period_id") || "") || null,
      prepared_by_id: uid,
      prepared_date: new Date(),
      prepared_on_behalf_of_user_id: onBehalfOf,
      authorised_by_id: authorise ? uid : null,
      authorised_date: authorise ? new Date() : null,
      created_by: uid,
      updated_by: uid,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  if (onBehalfOf) {
    const principal = await prisma.user.findUnique({ where: { id: onBehalfOf } });
    const preparer = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email;
    const principalName = principal ? `${principal.first_name ?? ""} ${principal.last_name ?? ""}`.trim() || principal.email : "a colleague";
    await logAudit("Audit plans", plan.id, "INSERT", {
      message: `${preparer} prepared the plan "${plan.name}" on behalf of ${principalName}`,
    });
  }
  redirect(`/annual-audit-plan/${plan.id}`);
}

export default async function AddPlanPage() {
  const periods = await prisma.annualAuditPlanPeriod.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    orderBy: { name: "asc" },
  });

  const inputCls = "w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-orange-600">Annual Audit Plan</h2>
        <div>
          <Link
            href="/annual-audit-plan"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
          >
            Back to Annual Audit Plans
          </Link>
        </div>
      </div>
      <form action={createPlan} className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-orange-600">Basic Information</div>
          <label className="flex flex-col gap-1 text-sm">
            <span>Name</span>
            <input name="name" required placeholder="Enter a name" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Period</span>
            <select name="period_id" className={inputCls}>
              <option value="">Select a period</option>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Description</span>
            <input name="description" placeholder="Enter a description" className={inputCls} />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            name="intent"
            value="save"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
          >
            Save
          </button>
          <button
            type="submit"
            name="intent"
            value="authorise"
            className="rounded-md bg-orange-300 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400"
          >
            Authorise
          </button>
        </div>
      </form>
    </div>
  );
}
