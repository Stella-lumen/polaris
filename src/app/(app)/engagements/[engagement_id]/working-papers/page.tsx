export const instant = false;

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { addWorkingPaper, approveWorkingPaperForm, sendBackWorkingPaperForm, markWorkingPaperReviewed, uploadWorkingPaperFiles, startWorkingPaperFromTemplate } from "@/lib/actions";

const STATUS_LABEL: Record<string, string> = { PREPARED: "Prepared", REVIEWED: "Reviewed", APPROVED: "Approved", SENT_BACK: "Sent back" };

export default async function WorkingPapersPage({ params }: { params: Promise<{ engagement_id: string }> }) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findUnique({ where: { id: engagement_id } });
  if (!engagement) notFound();
  const [papers, user] = await Promise.all([
    prisma.workingPaper.findMany({ where: { engagement_id, deleted: false }, orderBy: { created_at: "desc" } }),
    getSessionUser(),
  ]);
  const userIds = [...new Set(papers.flatMap((p) => [p.preparer_id, p.reviewer_id]).filter(Boolean))] as string[];
  const users = new Map((await prisma.user.findMany({ where: { id: { in: userIds } } })).map((u) => [u.id, `${u.first_name} ${u.last_name}`]));
  const files = await prisma.storedFile.findMany({ where: { entity_type: "working_paper", entity_id: { in: papers.map((p) => p.id) }, deleted: false }, orderBy: { created_at: "desc" } });
  const canApprove = user ? canAuthorise(user) : false;
  const templates = await prisma.planningDocumentTemplate.findMany({
    where: { deleted: false, disabled: false, section: "fieldwork", status: "APPROVED" },
    select: { id: true, reference: true, name: true },
    orderBy: { reference: "asc" },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Working papers</h2>
        <CreateDialog
          title="Add working paper"
          buttonLabel="Add working paper"
          action={addWorkingPaper.bind(null, engagement_id)}
          fields={[
            { name: "reference", label: "Reference", placeholder: "e.g. WP-01" },
            { name: "title", label: "Title", required: true },
            { name: "files", label: "Attach file (PDF, Office, email)", type: "file" },
          ]}
        />
      </div>
      {templates.length > 0 && (
        <form action={startWorkingPaperFromTemplate.bind(null, engagement_id)} className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <span className="text-sm text-muted-foreground">Start from template:</span>
          <select name="template_id" className="rounded-md border px-2 py-1 text-sm" required>
            <option value="">Choose a fieldwork template…</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.reference} — {t.name}</option>)}
          </select>
          <button className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Create</button>
        </form>
      )}
      <p className="text-sm text-muted-foreground">Status flow: Prepared → Reviewed → Approved. The person who prepared a paper cannot review or approve it.</p>
      {papers.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No working papers yet. Add one to record fieldwork evidence.</div>}
      <div className="flex flex-col gap-2">
        {papers.map((p) => {
          const f = files.filter((x) => x.entity_id === p.id);
          return (
            <div key={p.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{p.reference ? `${p.reference} — ` : ""}{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Prepared by {users.get(p.preparer_id ?? "") ?? "Not recorded"}
                    {p.reviewer_id ? ` · Reviewed by ${users.get(p.reviewer_id) ?? "Not recorded"}` : ""}
                    {" · "}{STATUS_LABEL[p.status ?? ""] ?? "Prepared"}
                    {p.review_comment ? ` — “${p.review_comment}”` : ""}
                  </div>
                </div>
                {canApprove && p.preparer_id !== user?.id && (
                  <div className="flex items-center gap-2">
                    {p.status === "PREPARED" && (
                      <form action={markWorkingPaperReviewed.bind(null, p.id, engagement_id)}><button className="rounded-md border border-primary px-2 py-1 text-xs text-primary">Mark reviewed</button></form>
                    )}
                    {(p.status === "REVIEWED" || p.status === "SENT_BACK") && (
                      <>
                        <form action={approveWorkingPaperForm.bind(null, p.id, engagement_id)}><button className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">Approve</button></form>
                        <form action={sendBackWorkingPaperForm.bind(null, p.id, engagement_id)} className="flex items-center gap-1">
                          <input name="comment" placeholder="Reason" className="w-28 rounded-md border px-2 py-1 text-xs" required />
                          <button className="rounded-md border px-2 py-1 text-xs">Send back</button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {f.map((x) => <a key={x.id} href={`/api/files/${x.id}`} className="text-xs text-orange-600 hover:underline">{x.name}</a>)}
                <form action={uploadWorkingPaperFiles.bind(null, p.id, engagement_id)} className="flex items-center gap-1">
                  <input type="file" name="files" multiple className="text-xs" />
                  <button className="text-xs text-primary underline">Attach</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
