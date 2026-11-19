import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { logAudit } from "@/lib/audit";
import { deliverEmail } from "@/lib/mailer";
import { getReport } from "@/lib/reports/catalogue";
import type { FilterValues } from "@/lib/reports/types";

// Runs due scheduled reports. Call daily (or hourly) via Task Scheduler /
// cron with the x-cron-secret header — same pattern as /api/escalation/run.
const nextAfter = (cadence: string | null, day: number | null, from: Date) => {
  const months = cadence === "QUARTERLY" ? 3 : 1;
  const d = new Date(from.getFullYear(), from.getMonth(), Math.min(Math.max(day ?? 1, 1), 28), 8, 0, 0);
  while (d <= from) d.setMonth(d.getMonth() + months);
  return d;
};

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const now = new Date();
  const due = await prisma.scheduledReport.findMany({
    where: { deleted: false, paused: false, organization_id: DEMO_ORGANIZATION_ID, next_run_at: { lte: now } },
  });
  const out: { id: string; name: string | null; ok: boolean; message: string }[] = [];
  for (const s of due) {
    const report = getReport(s.report_id ?? "");
    const recipients = (s.recipients_json as string[]) ?? [];
    const filters = (s.filters_json as FilterValues) ?? {};
    const result = await report.run(filters);
    const email = await prisma.sentEmail.create({
      data: {
        from_email: "scheduler@polaris",
        to_emails: recipients, cc_emails: [], bcc_emails: [], attachments: [],
        subject: `${s.name} — scheduled report`,
        body: `${report.title}\n\n${result.summary.map((x) => `${x.label}: ${x.value}`).join("\n")}\n\n${result.rows.length} records match the saved filters.\n\nThis report was sent automatically by the schedule "${s.name}".`,
        entity_type: "scheduled-report", entity_id: s.id,
        reason_label: `Scheduled — ${report.title}`,
        organization_id: DEMO_ORGANIZATION_ID, created_at: new Date(),
      },
    });
    const sent = await deliverEmail(email.id);
    const next = s.cadence === "ONCE" ? null : nextAfter(s.cadence, s.day_of_month, now);
    await prisma.scheduledReport.update({
      where: { id: s.id },
      data: { last_run_at: now, next_run_at: next, ...(next ? {} : { paused: true }) },
    });
    await logAudit("Reports", s.id, "SEND", {
      message: `the scheduled report "${s.name}" ran and emailed ${recipients.join(", ")}${sent.ok ? "" : ` (delivery failed: ${sent.message})`}${next ? "" : " — the schedule is now finished"}`,
    }, { system: true, recordLabel: s.name ?? s.id });
    out.push({ id: s.id, name: s.name, ok: sent.ok, message: sent.message });
  }
  return NextResponse.json({ ran: out.length, results: out });
}
