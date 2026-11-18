import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { retryEmail } from "@/lib/actions";
import { requireUser, canAuthorise } from "@/lib/auth";
import Link from "next/link";

export const instant = false;

const fmt = (d: Date | null) => (d ? d.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "Not recorded");
const STATUS_LABEL: Record<string, string> = { QUEUED: "Waiting to send", DELIVERED: "Delivered", FAILED: "Failed", DEMO: "Not sent (demo mode)" };

export default async function SentEmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const admin = canAuthorise(user);
  const e = await prisma.sentEmail.findUnique({ where: { id } });
  if (!e || e.organization_id !== DEMO_ORGANIZATION_ID) return <p>Email not found.</p>;

  const users = await prisma.user.findMany({ where: { deleted: false }, select: { email: true, first_name: true, last_name: true } });
  const names = new Map(users.map((u) => [u.email ?? "", `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email]));

  let itemLink: { href: string; label: string } | null = null;
  if (e.entity_type === "task" && e.entity_id) {
    const t = await prisma.task.findUnique({ where: { id: e.entity_id }, select: { title: true } });
    itemLink = { href: "/tasks", label: t?.title ?? "Task" };
  } else if (e.entity_type === "corrective_action" && e.entity_id) {
    const a = await prisma.correctiveAction.findUnique({ where: { id: e.entity_id }, select: { action_description: true } });
    itemLink = { href: `/follow-up/${e.entity_id}`, label: a?.action_description?.slice(0, 80) ?? "Corrective action" };
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Link href="/admin/sent-emails" className="text-sm text-orange-600 hover:underline">← Back to sent emails</Link>
      <div>
        <h1 className="text-2xl font-semibold">{e.reason_label ?? "Notification"}</h1>
        <p className="text-sm text-muted-foreground">{e.subject}</p>
      </div>

      <dl className="grid grid-cols-[160px_1fr] gap-y-2 text-sm rounded-md border p-4">
        <dt className="text-muted-foreground">Date</dt><dd>{fmt(e.created_at)}</dd>
        <dt className="text-muted-foreground">Type</dt><dd>{e.entity_type === "task" ? "Task" : e.entity_type === "corrective_action" ? "Corrective action" : e.entity_type === "test" ? "Test email" : "Notification"}</dd>
        <dt className="text-muted-foreground">Sent to</dt><dd>{((e.to_emails as string[] | null) ?? []).map((a) => names.get(a) ?? a).join(", ") || "None"}</dd>
        <dt className="text-muted-foreground">Copied</dt><dd>{((e.cc_emails as string[] | null) ?? []).map((a) => names.get(a) ?? a).join(", ") || "None"}</dd>
        <dt className="text-muted-foreground">Delivery status</dt><dd>{STATUS_LABEL[e.delivery_status ?? "QUEUED"] ?? e.delivery_status}{e.delivery_error ? ` — ${e.delivery_error}` : ""}{(e.retry_count ?? 0) > 0 ? ` (retried ${e.retry_count} time${e.retry_count === 1 ? "" : "s"})` : ""}</dd>
        {itemLink && (<><dt className="text-muted-foreground">Related item</dt><dd><Link href={itemLink.href} className="text-orange-600 hover:underline">{itemLink.label}</Link></dd></>)}
        <dt className="text-muted-foreground">Message</dt><dd className="whitespace-pre-wrap">{e.body}</dd>
      </dl>

      {admin && e.delivery_status === "FAILED" && (e.retry_count ?? 0) < 3 && (
        <form action={retryEmail.bind(null, e.id)}>
          <button className="rounded bg-orange-600 text-white px-3 py-1.5 text-sm">Retry sending</button>
        </form>
      )}
      {e.delivery_status === "FAILED" && (e.retry_count ?? 0) >= 3 && (
        <p className="text-sm text-muted-foreground">This email has been retried 3 times and will not be retried again automatically.</p>
      )}
    </div>
  );
}
