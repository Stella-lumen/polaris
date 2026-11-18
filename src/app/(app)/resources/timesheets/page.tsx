import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { CreateDialog } from "@/components/create-dialog";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { submitTimesheet, approveTimesheetForm, returnTimesheet, reopenTimesheet } from "@/lib/actions";

export const instant = false;

const dstr = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => (u ? `${u.first_name} ${u.last_name}` : "");
const TS: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Waiting for approval", APPROVED: "Approved", RETURNED: "Sent back" };

export default async function TimesheetsPage() {
  const me = await getSessionUser();
  const canApprove = me ? canAuthorise(me) : false;
  const timesheets = await prisma.timesheet.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    include: { r_user: true, time_entries: { where: { deleted: false } } },
    orderBy: { week_start: "desc" },
  });
  const pending = timesheets.filter((t) => t.status === "SUBMITTED").length;
  const now = new Date();
  const monday = new Date(now); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm">{pending > 0 ? <span className="text-amber-700"><strong>{pending}</strong> timesheet{pending === 1 ? "" : "s"} waiting for approval</span> : "Nothing waiting for approval"}</span>
        <form action={submitTimesheet.bind(null, monday.toISOString().slice(0, 10))}><button className="rounded-md bg-orange-600 px-3 py-1.5 text-sm text-white hover:bg-orange-500">Submit this week for approval</button></form>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-zinc-50 text-left text-xs text-muted-foreground"><th className="p-2">Week starting</th><th className="p-2">Auditor</th><th className="p-2">Entries</th><th className="p-2">Status</th><th className="p-2">Decided</th><th className="p-2"></th></tr></thead>
          <tbody>
            {timesheets.length === 0 && <tr><td colSpan={6} className="p-3 text-sm text-muted-foreground">No timesheets submitted yet.</td></tr>}
            {timesheets.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="p-2">{dstr(t.week_start)}</td><td className="p-2">{person(t.r_user)}</td><td className="p-2">{t.time_entries.length}</td>
                <td className="p-2">{TS[t.status ?? "DRAFT"] ?? t.status}{t.comment ? ` — ${t.comment}` : ""}</td>
                <td className="p-2 text-xs text-muted-foreground">{t.approved_date ? dstr(t.approved_date) : ""}</td>
                <td className="p-2 text-right">
                  {t.status === "SUBMITTED" && canApprove && t.user_id !== me?.id && (
                    <span className="flex justify-end gap-1">
                      <form action={approveTimesheetForm.bind(null, t.id)}><button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve</button></form>
                      <CreateDialog title="Send back" buttonLabel="Send back" action={returnTimesheet.bind(null, t.id)} fields={[{ name: "comment", label: "What needs fixing?", type: "textarea", required: true }]} />
                    </span>
                  )}
                  {t.status === "APPROVED" && canApprove && (
                    <CreateDialog title="Reopen timesheet" buttonLabel="Reopen" action={reopenTimesheet.bind(null, t.id)} fields={[{ name: "reason", label: "Reason", type: "textarea", required: true }]} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Approved timesheets are locked. Changes after approval need a supervisor to reopen the week.</p>
    </div>
  );
}
