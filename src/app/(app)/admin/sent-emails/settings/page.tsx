import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { updateEmailSettings, sendTestEmail, runEscalationNow } from "@/lib/actions";
import { requireUser, canAuthorise } from "@/lib/auth";
import Link from "next/link";

const fmt = (d: Date | null) => (d ? d.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "Not recorded");

export const instant = false;

const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-60";

export default async function EmailSettingsPage() {
  const user = await requireUser();
  const admin = canAuthorise(user);
  const setting = await prisma.emailSetting.findFirst({ where: { organization_id: DEMO_ORGANIZATION_ID } });
  const next = setting?.last_run_at ? new Date(setting.last_run_at.getTime() + 86400_000) : null;
  const live = setting?.mode === "LIVE";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/admin/sent-emails" className="text-sm text-orange-600 hover:underline">← Back to sent emails</Link>
        <h1 className="mt-1 text-2xl font-semibold">Email delivery settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose whether emails leave the app, and which safety checks apply in live mode.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-orange-50/60 px-4 py-3 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <span className={`h-2.5 w-2.5 rounded-full ${live ? "bg-emerald-500" : "bg-amber-500"}`} />
          {live ? "Live mode — emails are sent through Brevo" : "Demo mode — emails stay in the outbox"}
        </span>
        <span className="text-muted-foreground">
          Last run: {setting?.last_run_at ? fmt(setting.last_run_at) : "Not recorded"} · Next run: {next ? fmt(next) : "after the next engine run"}
        </span>
        {admin && (
          <form action={runEscalationNow} className="ml-auto">
            <button className="rounded-md border border-orange-300 bg-white px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100">
              Run escalation check now
            </button>
          </form>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form action={updateEmailSettings} className="flex flex-col gap-5 rounded-lg border p-5 lg:col-span-2">
          <h2 className="font-semibold">Delivery</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Mode
              <select name="mode" defaultValue={setting?.mode ?? "DEMO"} className={input} disabled={!admin}>
                <option value="DEMO">Demo — outbox only</option>
                <option value="LIVE">Live — send via Brevo</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Sender name
              <input name="sender_name" defaultValue={setting?.sender_name ?? ""} placeholder="Polaris Notifications" className={input} disabled={!admin} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Sender address
              <input name="sender_email" defaultValue={setting?.sender_email ?? ""} placeholder="no-reply@yourdomain.co.za" className={input} disabled={!admin} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Approved addresses <span className="font-normal text-muted-foreground">(one per line)</span>
              <textarea name="approved_addresses" rows={3} defaultValue={((setting?.approved_addresses as string[] | null) ?? []).join("\n")} className={input} disabled={!admin} />
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="restrict_to_approved" defaultChecked={setting?.restrict_to_approved ?? true} className="h-4 w-4 accent-orange-600" disabled={!admin} />
                Send only to approved addresses
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Redirect all emails to one test address <span className="font-normal text-muted-foreground">(optional)</span>
                <input name="redirect_all_to" defaultValue={setting?.redirect_all_to ?? ""} placeholder="you@yourdomain.co.za" className={input} disabled={!admin} />
              </label>
            </div>
          </div>

          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            The Brevo key is configured on the server (the BREVO_API_KEY environment variable) and is never stored or shown here.
            {live && !process.env.BREVO_API_KEY ? <span className="font-medium text-red-600"> Live mode is on but no key is configured — emails will fail.</span> : null}
          </p>

          {admin && (
            <button className="self-start rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              Save delivery settings
            </button>
          )}
        </form>

        <form action={sendTestEmail} className="flex flex-col gap-4 self-start rounded-lg border p-5">
          <div>
            <h2 className="font-semibold">Send a test email</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Checks the current delivery mode. In demo mode the result is recorded in the outbox without leaving the app.
            </p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Send to
            <input name="to" defaultValue={user.email ?? ""} className={input} disabled={!admin} />
          </label>
          {admin && (
            <button className="self-start rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              Send test email
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
