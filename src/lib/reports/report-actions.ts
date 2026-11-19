"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { requireUser, requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { deliverEmail } from "@/lib/mailer";
import { getReport } from "./catalogue";

const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) =>
  u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : "Unknown";

export async function sendReport(formData: FormData) {
  const user = await requireUser();
  const reportId = String(formData.get("report_id") ?? "");
  const report = getReport(reportId);
  const format = String(formData.get("format") ?? "link");
  const subject = String(formData.get("subject") ?? `Polaris report — ${report.title}`).slice(0, 200);
  const message = String(formData.get("message") ?? "");
  const recipients = String(formData.get("recipients") ?? "")
    .split(/[,;\n]/).map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
  if (!recipients.length) return { ok: false as const, error: "Add at least one valid email address." };

  const filters: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("f_") && typeof v === "string" && v) filters[k.slice(2)] = v;
  }
  const result = await report.run(filters);
  const linkNote = format === "link"
    ? `\n\nOpen it in Polaris: /reports?report=${report.id}${Object.entries(filters).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join("")}`
    : "";
  const body = `${report.title}\n\n${result.summary.map((s) => `${s.label}: ${s.value}`).join("\n")}\n\n${result.rows.length} records match the current filters.${message ? `\n\n${message}` : ""}${linkNote}`;

  const email = await prisma.sentEmail.create({
    data: {
      from_email: user.email,
      to_emails: recipients,
      cc_emails: [], bcc_emails: [], attachments: [],
      subject, body,
      entity_type: "report", entity_id: report.id,
      reason_label: `Report — ${report.title}`,
      organization_id: DEMO_ORGANIZATION_ID,
      created_by: user.id, created_at: new Date(),
    },
  });
  const sent = await deliverEmail(email.id);
  await logAudit(
    "Reports", email.id, "SEND",
    { message: `${person(user)} sent the ${report.title} to ${recipients.join(", ")}${sent.ok ? "" : " (sending failed)"}` },
    { recordLabel: report.title },
  );
  return sent.ok
    ? { ok: true as const, message: `${sent.message} Recorded in Sent Emails.` }
    : { ok: false as const, error: sent.message };
}

export async function saveReport(formData: FormData) {
  const user = await requireUser();
  const report = getReport(String(formData.get("report_id") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false as const, error: "Give the saved report a name." };
  const shared = formData.get("shared") === "on";
  const filters: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("f_") && typeof v === "string" && v) filters[k.slice(2)] = v;
  }
  const saved = await prisma.savedReport.create({
    data: {
      name, report_id: report.id, filters_json: filters, shared,
      user_id: user.id, organization_id: DEMO_ORGANIZATION_ID,
      created_by: user.id, created_at: new Date(),
    },
  });
  await logAudit("Reports", saved.id, "INSERT", { message: `saved the report "${name}" (${report.title})` }, { recordLabel: name });
  revalidatePath("/reports");
  return { ok: true as const, message: `Saved as "${name}"${shared ? " — shared with the team" : ""}.` };
}

const nextRun = (cadence: string, day: number, onceDate?: string) => {
  const now = new Date();
  if (cadence === "ONCE") return onceDate ? new Date(`${onceDate}T08:00:00`) : null;
  const d = new Date(now.getFullYear(), now.getMonth(), Math.min(Math.max(day, 1), 28), 8, 0, 0);
  if (d <= now) {
    d.setMonth(d.getMonth() + (cadence === "QUARTERLY" ? 3 : 1));
  }
  return d;
};

export async function scheduleReport(formData: FormData) {
  const user = await requireUser();
  const report = getReport(String(formData.get("report_id") ?? ""));
  const name = String(formData.get("name") ?? report.title).trim() || report.title;
  const cadence = String(formData.get("cadence") ?? "MONTHLY");
  const day = Number(formData.get("day_of_month") ?? 1);
  const onceDate = String(formData.get("once_date") ?? "");
  const format = String(formData.get("format") ?? "pdf");
  const recipients = String(formData.get("recipients") ?? "")
    .split(/[,;\n]/).map((s) => s.trim().toLowerCase()).filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
  if (!recipients.length) return { ok: false as const, error: "Add at least one valid email address." };
  const at = nextRun(cadence, day, onceDate);
  if (!at || isNaN(+at)) return { ok: false as const, error: "Choose a valid date for the first send." };
  const filters: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("f_") && typeof v === "string" && v) filters[k.slice(2)] = v;
  }
  const sched = await prisma.scheduledReport.create({
    data: {
      name, report_id: report.id, filters_json: filters, format,
      recipients_json: recipients, cadence, day_of_month: day,
      next_run_at: at, organization_id: DEMO_ORGANIZATION_ID,
      created_by: user.id, created_at: new Date(),
    },
  });
  await logAudit("Reports", sched.id, "INSERT", {
    message: `scheduled the ${report.title} to be sent ${cadence === "ONCE" ? `once on ${at.toLocaleDateString("en-ZA")}` : cadence === "QUARTERLY" ? `every quarter on day ${day}` : `every month on day ${day}`} to ${recipients.join(", ")}`,
  }, { recordLabel: name });
  revalidatePath("/reports");
  return { ok: true as const, message: `Scheduled — first send ${at.toLocaleString("en-ZA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" })}.` };
}

export async function pauseSchedule(id: string) {
  const user = await requireUser();
  const s = await prisma.scheduledReport.findUnique({ where: { id } });
  if (!s || s.organization_id !== DEMO_ORGANIZATION_ID) return;
  await prisma.scheduledReport.update({ where: { id }, data: { paused: !s.paused, updated_by: user.id, updated_at: new Date() } });
  await logAudit("Reports", id, "UPDATE", { message: `${s.paused ? "resumed" : "paused"} the scheduled report "${s.name}"` }, { recordLabel: s.name ?? id });
  revalidatePath("/reports");
}

export async function deleteSchedule(id: string) {
  const user = await requireUser();
  const s = await prisma.scheduledReport.findUnique({ where: { id } });
  if (!s || s.organization_id !== DEMO_ORGANIZATION_ID) return;
  await prisma.scheduledReport.update({ where: { id }, data: { deleted: true, deleted_by: user.id, deleted_at: new Date() } });
  await logAudit("Reports", id, "DELETE", { message: `deleted the scheduled report "${s.name}"` }, { recordLabel: s.name ?? id });
  revalidatePath("/reports");
}

export async function deleteSavedReport(id: string) {
  const user = await requireUser();
  const s = await prisma.savedReport.findUnique({ where: { id } });
  if (!s || s.organization_id !== DEMO_ORGANIZATION_ID) return;
  if (s.user_id !== user.id) await requireRole(["org:admin", "org:chief_audit_executive"]);
  await prisma.savedReport.update({ where: { id }, data: { deleted: true, deleted_by: user.id, deleted_at: new Date() } });
  await logAudit("Reports", id, "DELETE", { message: `deleted the saved report "${s.name}"` }, { recordLabel: s.name ?? id });
  revalidatePath("/reports");
}
