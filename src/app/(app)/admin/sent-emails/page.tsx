import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { updateEmailSettings, sendTestEmail, runEscalationNow } from "@/lib/actions";
import { requireUser, canAuthorise } from "@/lib/auth";

const fmt = (d: Date | null) => (d ? d.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "Not recorded");

export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  QUEUED: "Waiting to send",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  DEMO: "Not sent (demo mode)",
};

export default async function SentEmailsPage({ searchParams }: { searchParams: Promise<{ type?: string; status?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const admin = canAuthorise(user);
  const [rows, setting, users] = await Promise.all([
    prisma.sentEmail.findMany({
      where: {
        deleted: false, organization_id: DEMO_ORGANIZATION_ID,
        ...(sp.type ? { entity_type: sp.type } : {}),
        ...(sp.status ? { delivery_status: sp.status } : {}),
      },
      orderBy: { created_at: "desc" },
      take: 200,
    }),
    prisma.emailSetting.findFirst({ where: { organization_id: DEMO_ORGANIZATION_ID } }),
    prisma.user.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, select: { email: true, first_name: true, last_name: true, role: true } }),
  ]);
  const names = new Map(users.map((u) => [u.email ?? "", `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email]));
  const roleOf = new Map(users.map((u) => [u.email ?? "", u.role ?? ""]));
  const disp = (e: string) => `${names.get(e) ?? e}${roleOf.get(e) ? ` (${roleOf.get(e) === "org:admin" ? "administrator" : roleOf.get(e) === "org:chief_audit_executive" ? "chief audit executive" : "team member"})` : ""}`;
  const next = setting?.last_run_at ? new Date(setting.last_run_at.getTime() + 86400_000) : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Sent emails</h1>
        <p className="text-sm text-muted-foreground">
          Every reminder and escalation the system has queued, with its delivery status.
          In demo mode nothing leaves the app — emails stay here so you can review what would be sent.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={updateEmailSettings} className="rounded-md border p-4 flex flex-col gap-3">
          <h2 className="font-semibold">Email delivery</h2>
          <label className="text-sm flex items-center gap-2">
            Mode:
            <select name="mode" defaultValue={setting?.mode ?? "DEMO"} className="border rounded px-2 py-1" disabled={!admin}>
              <option value="DEMO">Demo mode — emails stay in this outbox</option>
              <option value="LIVE">Live mode — send through Brevo</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label>Sender name <input name="sender_name" defaultValue={setting?.sender_name ?? ""} className="border rounded px-2 py-1 w-full" disabled={!admin} /></label>
            <label>Sender address <input name="sender_email" defaultValue={setting?.sender_email ?? ""} className="border rounded px-2 py-1 w-full" disabled={!admin} /></label>
          </div>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" name="restrict_to_approved" defaultChecked={setting?.restrict_to_approved ?? true} disabled={!admin} />
            Send only to approved addresses
          </label>
          <label className="text-sm">Approved addresses (one per line)
            <textarea name="approved_addresses" defaultValue={((setting?.approved_addresses as string[] | null) ?? []).join("\n")} className="border rounded px-2 py-1 w-full h-16" disabled={!admin} />
          </label>
          <label className="text-sm">Redirect all emails to one test address (optional)
            <input name="redirect_all_to" defaultValue={setting?.redirect_all_to ?? ""} className="border rounded px-2 py-1 w-full" disabled={!admin} />
          </label>
          <p className="text-xs text-muted-foreground">
            The Brevo key is configured on the server (the BREVO_API_KEY environment variable) and is never stored or shown here.
            {setting?.mode === "LIVE" && !process.env.BREVO_API_KEY ? " Live mode is on but no key is configured — emails will fail." : ""}
          </p>
          {admin && <button className="self-start rounded bg-orange-600 text-white px-3 py-1.5 text-sm">Save delivery settings</button>}
          <p className="text-xs text-muted-foreground">
            Last run: {setting?.last_run_at ? fmt(setting.last_run_at) : "Not recorded"} · Next run: {next ? fmt(next) : "after the next engine run"}
          </p>
          {admin && <button formAction={runEscalationNow} className="self-start rounded border px-3 py-1.5 text-sm">Run escalation check now</button>}
        </form>

        <form action={sendTestEmail} className="rounded-md border p-4 flex flex-col gap-3 self-start">
          <h2 className="font-semibold">Send a test email</h2>
          <p className="text-sm text-muted-foreground">Sends a short test message using the current delivery mode. In demo mode it is recorded here without leaving the app.</p>
          <label className="text-sm">Send to <input name="to" defaultValue={user.email ?? ""} className="border rounded px-2 py-1 w-full" disabled={!admin} /></label>
          {admin && <button className="self-start rounded bg-orange-600 text-white px-3 py-1.5 text-sm">Send test email</button>}
        </form>
      </div>

      <form method="GET" className="flex gap-3 items-end text-sm">
        <label>Type
          <select name="type" defaultValue={sp.type ?? ""} className="border rounded px-2 py-1 ml-1">
            <option value="">All</option>
            <option value="task">Task</option>
            <option value="corrective_action">Corrective action</option>
            <option value="test">Test email</option>
          </select>
        </label>
        <label>Status
          <select name="status" defaultValue={sp.status ?? ""} className="border rounded px-2 py-1 ml-1">
            <option value="">All</option>
            <option value="QUEUED">Waiting to send</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="DEMO">Not sent (demo mode)</option>
          </select>
        </label>
        <button className="rounded border px-3 py-1.5">Filter</button>
      </form>

      <DataGrid
        hrefPattern="/admin/sent-emails/{id}"
        pageSize={50}
        rows={rows.map((e) => {
          const clean = (s: string | null) => (s ?? "").replace(/^\[(ESCALATION|REMINDER)( L\d+)?\]\s*/i, "");
          return {
          id: e.id,
          date: fmt(e.created_at),
          type: e.entity_type === "task" ? "Task" : e.entity_type === "corrective_action" ? "Corrective action" : e.entity_type === "test" ? "Test email" : "Notification",
          reason: e.reason_label ?? clean(e.subject),
          to: ((e.to_emails as string[] | null) ?? []).map(disp).join(", "),
          cc: ((e.cc_emails as string[] | null) ?? []).map(disp).join(", ") || "None",
          subject: clean(e.subject),
          status: `${STATUS_LABEL[e.delivery_status ?? "QUEUED"] ?? e.delivery_status}${(e.retry_count ?? 0) > 0 ? ` (retried ${e.retry_count}×)` : ""}${e.delivery_status === "FAILED" && e.delivery_error ? ` — ${e.delivery_error}` : ""}`,
          };
        }) as unknown as object[]}
        colDefs={[
          { field: "date", headerName: "Date", width: 180 },
          { field: "type", headerName: "Type", width: 130 },
          { field: "reason", headerName: "Reason", flex: 1.6, tooltipField: "reason" },
          { field: "to", headerName: "Sent to", flex: 1.4, tooltipField: "to" },
          { field: "cc", headerName: "Supervisors copied", flex: 1.4, tooltipField: "cc" },
          { field: "subject", headerName: "Subject", flex: 2, tooltipField: "subject" },
          { field: "status", headerName: "Delivery status", flex: 1.2, tooltipField: "status" },
        ]}
      />
    </div>
  );
}
