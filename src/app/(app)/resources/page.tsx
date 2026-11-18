import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createTimeEntry, createExpense } from "@/lib/actions";

export const instant = false;

export default async function ResourcesPage() {
  const [timeEntries, expenses, engagements, users] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: { r_user: true, r_engagement: true },
      orderBy: { work_date: "desc" },
    }),
    prisma.expense.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: { r_user: true, r_engagement: true },
      orderBy: { expense_date: "desc" },
    }),
    prisma.engagement.findMany({ where: { deleted: false } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
  ]);
  const totalHours = timeEntries.reduce((s, t) => s + Number(t.hours ?? 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  const engagementOpts = engagements.map((e) => ({ value: e.id, label: e.engagement_name ?? e.id }));
  const userOpts = users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Resource Allocation</h1>
        <div className="flex gap-6 text-sm">
          <span>Total hours: <strong>{totalHours.toLocaleString()}</strong></span>
          <span>Total expenses: <strong>R {totalExpenses.toLocaleString()}</strong></span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Time Entries</h2>
        <CreateDialog
          title="Log Time"
          buttonLabel="Log Time"
          action={createTimeEntry}
          fields={[
            { name: "user_id", label: "Auditor", type: "select", required: true, options: userOpts },
            { name: "engagement_id", label: "Engagement", type: "select", required: true, options: engagementOpts },
            { name: "work_date", label: "Date", type: "date", required: true },
            { name: "hours", label: "Hours", type: "number", required: true },
            { name: "description", label: "Work done", type: "textarea" },
          ]}
        />
      </div>
      <DataGrid
        heightClass="h-[280px]"
        rows={timeEntries.map((t) => ({
          id: t.id,
          work_date: t.work_date?.toISOString().slice(0, 10),
          auditor: t.r_user ? `${t.r_user.first_name} ${t.r_user.last_name}` : "",
          r_engagement: { engagement_name: t.r_engagement?.engagement_name },
          hours: t.hours != null ? Number(t.hours) : null,
          description: t.description,
        })) as unknown as object[]}
        colDefs={[
          { field: "work_date", headerName: "Date" },
          { field: "auditor", headerName: "Auditor" },
          { field: "r_engagement.engagement_name", headerName: "Engagement", flex: 2 },
          { field: "hours", headerName: "Hours" },
          { field: "description", headerName: "Work done", flex: 2 },
        ]}
      />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Expenses</h2>
        <CreateDialog
          title="Add Expense"
          buttonLabel="Add Expense"
          action={createExpense}
          fields={[
            { name: "engagement_id", label: "Engagement", type: "select", required: true, options: engagementOpts },
            { name: "user_id", label: "Claimed by", type: "select", options: userOpts },
            { name: "description", label: "Description", required: true },
            { name: "amount", label: "Amount (R)", type: "number", required: true },
            { name: "expense_date", label: "Date", type: "date", required: true },
          ]}
        />
      </div>
      <DataGrid
        heightClass="h-[280px]"
        rows={expenses.map((e) => ({
          id: e.id,
          expense_date: e.expense_date?.toISOString().slice(0, 10),
          claimed_by: e.r_user ? `${e.r_user.first_name} ${e.r_user.last_name}` : "",
          r_engagement: { engagement_name: e.r_engagement?.engagement_name },
          description: e.description,
          amount: e.amount != null ? Number(e.amount) : null,
        })) as unknown as object[]}
        colDefs={[
          { field: "expense_date", headerName: "Date" },
          { field: "r_engagement.engagement_name", headerName: "Engagement", flex: 2 },
          { field: "claimed_by", headerName: "Claimed by" },
          { field: "description", headerName: "Description", flex: 2 },
          { field: "amount", headerName: "Amount (R)" },
        ]}
      />
    </div>
  );
}
