import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { EditDialog } from "@/components/edit-dialog";
import {
  addDelegation, revokeDelegation, syncDelegationExpiries, updateDelegation,
} from "@/lib/actions";
import { delegationWarning, SCOPE_LABELS } from "@/lib/delegations";
import { fmtDate } from "@/lib/dates";
import { getSessionUser } from "@/lib/auth";

export const instant = false;

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const name = (u: { first_name: string | null; last_name: string | null; email: string | null } | null | undefined) =>
  u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email : null;

export default async function DelegatedPreparersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: editId } = await searchParams;
  const user = await getSessionUser();
  const admin = user?.role === "org:admin";
  await syncDelegationExpiries();

  const [delegations, candidates, principals, engagements] = await Promise.all([
    prisma.delegation.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: { r_delegate: true, r_principal: true, r_engagement: { select: { engagement_name: true } } },
      orderBy: { created_at: "desc" },
    }),
    prisma.user.findMany({
      where: { deleted: false, disabled: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { first_name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        deleted: false, disabled: false, organization_id: DEMO_ORGANIZATION_ID,
        role: { in: ["org:admin", "org:chief_audit_executive", "org:member"] },
      },
      orderBy: { first_name: "asc" },
    }),
    prisma.engagement.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { engagement_name: "asc" },
      select: { id: true, engagement_name: true },
    }),
  ]);

  const editRow = editId ? delegations.find((d) => d.id === editId) : null;

  const scopeLabel = (d: (typeof delegations)[number]) =>
    d.scope_kind === "ENGAGEMENT"
      ? d.r_engagement?.engagement_name ?? "One engagement (not assigned)"
      : SCOPE_LABELS[d.scope_kind ?? ""] ?? "Not assigned";

  const delegationFields = [
    {
      name: "delegate_user_id", label: "Who prepares the work", type: "select" as const, required: true,
      options: candidates.map((u) => ({ value: u.id, label: name(u) ?? u.id })),
    },
    {
      name: "principal_user_id", label: "Prepares for", type: "select" as const, required: true,
      options: principals.map((u) => ({ value: u.id, label: name(u) ?? u.id })),
    },
    {
      name: "scope_kind", label: "What they may prepare", type: "select" as const, required: true,
      options: Object.entries(SCOPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: "engagement_id", label: "Engagement (only when scope is “One engagement”)", type: "select" as const,
      options: engagements.map((e) => ({ value: e.id, label: e.engagement_name ?? e.id })),
    },
    { name: "start_date", label: "Start date", type: "date" as const },
    { name: "end_date", label: "End date", type: "date" as const },
    { name: "reason", label: "Reason for the delegation", type: "textarea" as const, placeholder: "e.g. Acting while Thandi is on maternity leave" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Delegated preparers</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            People who prepare work on behalf of someone else. They cannot approve it.
          </p>
        </div>
        {admin && (
          <CreateDialog
            title="Add delegation"
            buttonLabel="Add delegation"
            action={addDelegation}
            fields={delegationFields}
          />
        )}
      </div>
      <DataGrid
        rows={delegations.map((d) => ({
          id: d.id,
          status: d.status ?? "ACTIVE",
          delegate: name(d.r_delegate) ?? "Not assigned",
          principal: name(d.r_principal) ?? "Not assigned",
          scope: scopeLabel(d),
          start_date: fmtDate(d.start_date),
          end_date: fmtDate(d.end_date),
          reason: d.reason ?? "Not assigned",
          warning: delegationWarning(d) ?? "",
        })) as object[]}
        hrefPattern="/admin/delegated-preparers?id={id}"
        rowActions={admin ? ["edit", "workflow"] : []}
        workflow={{ steps: ["ACTIVE", "REVOKED"], doneValues: ["EXPIRED"], onAdvance: async (id) => { "use server"; await revokeDelegation(id); } }}
        rowStyleRules={[
          { field: "status", when: "REVOKED", style: { background: "#fecaca" } },
          { field: "status", when: "EXPIRED", style: { background: "#fed7aa" } },
        ]}
        colDefs={[
          { field: "delegate", headerName: "Delegate", flex: 1.2, tooltipField: "delegate" },
          { field: "principal", headerName: "Prepares for", flex: 1.2, tooltipField: "principal" },
          { field: "scope", headerName: "May prepare", flex: 1.2, tooltipField: "scope" },
          { field: "start_date", headerName: "Start", width: 120 },
          { field: "end_date", headerName: "End", width: 120 },
          { field: "status", headerName: "Status", width: 110 },
          { field: "reason", headerName: "Reason", flex: 1.5, tooltipField: "reason" },
          { field: "warning", headerName: "Warning", flex: 1.4, tooltipField: "warning" },
        ]}
      />
      {editRow && (
        <EditDialog
          title="Fix delegation"
          returnPath="/admin/delegated-preparers"
          action={updateDelegation.bind(null, editRow.id)}
          values={{
            delegate_user_id: editRow.delegate_user_id,
            principal_user_id: editRow.principal_user_id,
            scope_kind: editRow.scope_kind,
            engagement_id: editRow.engagement_id,
            start_date: iso(editRow.start_date),
            end_date: iso(editRow.end_date),
            reason: editRow.reason,
          }}
          fields={delegationFields}
        />
      )}
    </div>
  );
}
