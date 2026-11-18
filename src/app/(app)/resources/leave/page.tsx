import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { CreateDialog } from "@/components/create-dialog";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { requestLeave, approveLeaveForm, rejectLeaveForm } from "@/lib/actions";
import { LEAVE_TYPES } from "@/lib/resource-logic";

export const instant = false;

const dstr = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => (u ? `${u.first_name} ${u.last_name}` : "");
const LV: Record<string, string> = { ANNUAL: "Annual leave", SICK: "Sick leave", TRAINING: "Training", PUBLIC_HOLIDAY: "Public holiday", OTHER: "Other" };

export default async function LeavePage() {
  const me = await getSessionUser();
  const canApprove = me ? canAuthorise(me) : false;
  const [leave, holidays] = await Promise.all([
    prisma.leaveRequest.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, include: { r_user: true }, orderBy: { start_date: "desc" } }),
    prisma.publicHoliday.findMany({ where: { deleted: false }, orderBy: { holiday_date: "asc" } }),
  ]);
  const upcoming = holidays.filter((h) => h.holiday_date && h.holiday_date >= new Date()).slice(0, 8);
  const leaveOpts = LEAVE_TYPES.map((l) => ({ value: l, label: LV[l] }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Leave requests</h2>
          <CreateDialog title="Request leave" buttonLabel="Request leave" action={requestLeave}
            fields={[
              { name: "leave_type", label: "Type", type: "select", required: true, options: leaveOpts },
              { name: "start_date", label: "From", type: "date", required: true },
              { name: "end_date", label: "To", type: "date", required: true },
              { name: "reason", label: "Reason", type: "textarea" },
            ]} />
        </div>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs text-muted-foreground"><th className="p-2">Who</th><th className="p-2">Type</th><th className="p-2">From</th><th className="p-2">To</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead>
            <tbody>
              {leave.length === 0 && <tr><td colSpan={6} className="p-3 text-sm text-muted-foreground">No leave requests.</td></tr>}
              {leave.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-2">{person(l.r_user)}</td><td className="p-2">{LV[l.leave_type ?? ""] ?? l.leave_type}</td>
                  <td className="p-2">{dstr(l.start_date)}</td><td className="p-2">{dstr(l.end_date)}</td>
                  <td className="p-2">{l.status === "REQUESTED" ? "Waiting for approval" : l.status === "APPROVED" ? "Approved" : "Rejected"}{l.reason ? ` — ${l.reason}` : ""}</td>
                  <td className="p-2 text-right">
                    {l.status === "REQUESTED" && canApprove && l.user_id !== me?.id && (
                      <span className="flex justify-end gap-1">
                        <form action={approveLeaveForm.bind(null, l.id)}><button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve</button></form>
                        <form action={rejectLeaveForm.bind(null, l.id)}><button className="rounded border px-2 py-1 text-xs">Reject</button></form>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside>
        <h2 className="mb-2 text-lg font-medium">Upcoming public holidays</h2>
        <ul className="flex flex-col gap-1 rounded-md border p-3 text-sm">
          {upcoming.map((h) => (
            <li key={h.id} className="flex justify-between gap-2"><span>{h.name}</span><span className="whitespace-nowrap text-xs text-muted-foreground">{dstr(h.holiday_date)}</span></li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
