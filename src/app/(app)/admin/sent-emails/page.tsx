import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";

export const instant = false;

export default async function SentEmailsPage() {
  const rows = await prisma.sentEmail.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    orderBy: { created_at: "desc" },
    take: 200,
  });
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Sent Emails</h1>
        <p className="text-sm text-muted-foreground">
          Notification outbox — escalation alerts queued to assignees and supervisors.
          In production these are delivered via the configured SMTP/Resend transport.
        </p>
      </div>
      <DataGrid
        pageSize={50}
        rows={rows.map((e) => ({
          id: e.id,
          created_at: e.created_at?.toISOString(),
          to: Array.isArray(e.to_emails) ? (e.to_emails as string[]).join(", ") : "",
          cc: Array.isArray(e.cc_emails) ? (e.cc_emails as string[]).join(", ") : "",
          subject: e.subject,
          body: e.body,
          delivered: e.resend_id?.startsWith("esc:") ? "queued" : "sent",
        })) as unknown as object[]}
        colDefs={[
          { field: "created_at", headerName: "Queued", width: 180 },
          { field: "to", headerName: "To", flex: 1.4 },
          { field: "cc", headerName: "CC (supervisors)", flex: 1.6 },
          { field: "subject", headerName: "Subject", flex: 2.2 },
          { field: "delivered", headerName: "Status", width: 100 },
        ]}
      />
    </div>
  );
}
