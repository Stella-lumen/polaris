import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";

/**
 * Email delivery. Two modes, stored in email_setting:
 *  - DEMO  (default): nothing leaves the app; the outbox row is marked
 *    "Not sent (demo mode)".
 *  - LIVE: sent through Brevo's transactional email API. The key comes from
 *    the BREVO_API_KEY environment variable only — it is never stored in the
 *    database, shown on screen, logged, or returned by the API.
 * Safety switches (both on by default):
 *  - restrict_to_approved: only send to addresses on the approved list.
 *  - redirect_all_to: send every email to one test address instead.
 * Nothing is ever marked Delivered unless Brevo actually accepted it.
 */
export async function deliverEmail(emailId: string): Promise<{ ok: boolean; message: string }> {
  const [email, setting] = await Promise.all([
    prisma.sentEmail.findUnique({ where: { id: emailId } }),
    prisma.emailSetting.findFirst({ where: { organization_id: DEMO_ORGANIZATION_ID } }),
  ]);
  if (!email) return { ok: false, message: "Email not found." };
  const mode = setting?.mode ?? "DEMO";

  if (mode !== "LIVE") {
    await prisma.sentEmail.update({ where: { id: emailId }, data: { delivery_status: "DEMO" } });
    return { ok: true, message: "Not sent — demo mode is on, so the email stayed in the outbox." };
  }

  const key = process.env.BREVO_API_KEY;
  if (!key) {
    await prisma.sentEmail.update({ where: { id: emailId }, data: { delivery_status: "FAILED", delivery_error: "Live mode is on but no Brevo key is configured on the server." } });
    return { ok: false, message: "Failed — live mode is on but no Brevo key is configured on the server." };
  }

  let to = (email.to_emails as string[] | null) ?? [];
  let cc = (email.cc_emails as string[] | null) ?? [];
  let note = "";
  if (setting?.redirect_all_to) {
    to = [setting.redirect_all_to];
    cc = [];
    note = ` (redirected to the test address)`;
  } else if (setting?.restrict_to_approved) {
    const approved = new Set((setting.approved_addresses as string[] | null) ?? []);
    const kept = to.filter((a) => approved.has(a));
    cc = cc.filter((a) => approved.has(a));
    if (kept.length !== to.length) note = ` (${to.length - kept.length} address${to.length - kept.length === 1 ? "" : "es"} skipped — not on the approved list)`;
    to = kept;
  }
  if (!to.length) {
    await prisma.sentEmail.update({ where: { id: emailId }, data: { delivery_status: "FAILED", delivery_error: "No recipients left after the safety filters — add an approved address or set a redirect." } });
    return { ok: false, message: "Failed — no recipients left after the safety filters." };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: setting?.sender_name ?? "Polaris", email: setting?.sender_email ?? to[0] },
        to: to.map((email) => ({ email })),
        cc: cc.map((email) => ({ email })),
        subject: email.subject ?? "",
        textContent: email.body ?? "",
      }),
    });
    if (!res.ok) {
      const text = (await res.text()).slice(0, 300);
      const reason = res.status === 401 ? "The Brevo key was rejected — check it on the server."
        : res.status === 400 ? "Brevo refused the request — check the sender address is verified."
        : `Brevo returned an error (${res.status}).`;
      await prisma.sentEmail.update({ where: { id: emailId }, data: { delivery_status: "FAILED", delivery_error: reason } });
      return { ok: false, message: `Failed — ${reason}` };
    }
    const data = (await res.json().catch(() => ({}))) as { messageId?: string };
    await prisma.sentEmail.update({
      where: { id: emailId },
      data: { delivery_status: "DELIVERED", delivery_error: null, resend_id: data.messageId ?? email.resend_id },
    });
    return { ok: true, message: `Delivered${note}.` };
  } catch {
    const reason = "Could not reach Brevo — check the server's internet connection.";
    await prisma.sentEmail.update({ where: { id: emailId }, data: { delivery_status: "FAILED", delivery_error: reason } });
    return { ok: false, message: `Failed — ${reason}` };
  }
}
