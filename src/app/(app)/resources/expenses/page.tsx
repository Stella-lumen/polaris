import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { createExpense, approveExpenseForm, rejectExpense } from "@/lib/actions";
import { fmtRand, EXPENSE_CATEGORIES } from "@/lib/resource-logic";

export const instant = false;

const dstr = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => (u ? `${u.first_name} ${u.last_name}` : "");
const EX: Record<string, string> = { CLAIMED: "Claimed", APPROVED: "Approved", REJECTED: "Rejected", PAID: "Paid" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const me = await getSessionUser();
  const canApprove = me ? canAuthorise(me) : false;
  const [engagements, users] = await Promise.all([
    prisma.engagement.findMany({ where: { deleted: false } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
  ]);
  const where = {
    deleted: false as const, organization_id: DEMO_ORGANIZATION_ID,
    ...(sp.engagement ? { engagement_id: sp.engagement } : {}),
    ...(sp.auditor ? { user_id: sp.auditor } : {}),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.category ? { category: sp.category } : {}),
  };
  const expenses = await prisma.expense.findMany({ where, include: { r_user: true, r_engagement: true }, orderBy: { expense_date: "desc" } });
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const pending = expenses.filter((e) => e.status === "CLAIMED");

  const engagementOpts = engagements.map((e) => ({ value: e.id, label: e.engagement_name ?? e.id }));
  const userOpts = users.map((u) => ({ value: u.id, label: person(u) }));
  const catOpts = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c[0] + c.slice(1).toLowerCase() }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm">Expenses shown: <strong>{fmtRand(totalExp)}</strong>{pending.length > 0 && <span className="ml-4 text-amber-700"><strong>{pending.length}</strong> waiting for approval</span>}</span>
        <CreateDialog title="Claim Expense" buttonLabel="Claim Expense" action={createExpense}
          fields={[
            { name: "engagement_id", label: "Engagement", type: "select", required: true, options: engagementOpts },
            { name: "category", label: "Category", type: "select", options: catOpts },
            { name: "description", label: "Description", type: "text", required: true },
            { name: "amount", label: "Amount (Rand)", type: "number", required: true },
            { name: "expense_date", label: "Date", type: "date", required: true },
            { name: "files", label: "Receipt (required over R 500)", type: "file" },
          ]} />
      </div>
      <form className="flex flex-wrap items-end gap-2 text-sm" action="/resources/expenses" method="get">
        <select name="engagement" defaultValue={sp.engagement ?? ""} className="rounded border px-2 py-1"><option value="">All engagements</option>{engagementOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="auditor" defaultValue={sp.auditor ?? ""} className="rounded border px-2 py-1"><option value="">All claimants</option>{userOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="category" defaultValue={sp.category ?? ""} className="rounded border px-2 py-1"><option value="">All categories</option>{catOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border px-2 py-1"><option value="">All statuses</option>{Object.entries(EX).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="rounded bg-orange-600 px-3 py-1 text-white">Apply</button>
        <a href="/resources/expenses" className="px-2 py-1 text-muted-foreground hover:underline">Clear</a>
      </form>

      {canApprove && pending.length > 0 && (
        <div className="flex flex-col gap-1">
          {pending.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm">
              <span>{person(e.r_user)} — {e.description} — <strong>{fmtRand(Number(e.amount ?? 0))}</strong>{e.receipt_file_id ? " · receipt attached" : ""}</span>
              <span className="flex gap-1">
                <form action={approveExpenseForm.bind(null, e.id)}><button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve</button></form>
                <CreateDialog title="Reject claim" buttonLabel="Reject" action={rejectExpense.bind(null, e.id)} fields={[{ name: "reason", label: "Reason for rejecting", type: "textarea", required: true }]} />
              </span>
            </div>
          ))}
        </div>
      )}

      <DataGrid
        heightClass="h-[360px]"
        rows={expenses.map((e) => ({
          id: e.id,
          expense_date: dstr(e.expense_date),
          engagement: e.r_engagement?.engagement_name ?? "",
          claimed_by: person(e.r_user),
          category: e.category ? e.category[0] + e.category.slice(1).toLowerCase() : "—",
          description: e.description,
          amount: e.amount != null ? fmtRand(Number(e.amount)) : "—",
          receipt: e.receipt_file_id ? "Yes" : "No",
          status: EX[e.status ?? "CLAIMED"] ?? e.status,
        }))}
        colDefs={[
          { field: "expense_date", headerName: "Date", width: 105 },
          { field: "engagement", headerName: "Engagement", flex: 1 },
          { field: "claimed_by", headerName: "Claimed by", width: 150 },
          { field: "category", headerName: "Category", width: 110 },
          { field: "description", headerName: "Description", flex: 1, tooltipField: "description" },
          { field: "amount", headerName: "Amount", width: 120 },
          { field: "receipt", headerName: "Receipt", width: 80 },
          { field: "status", headerName: "Status", width: 100 },
        ]}
      />
    </div>
  );
}
