import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { updateGuidingDocument, uploadDocumentVersion, approveGuidingDocument, acknowledgeDocument } from "@/lib/actions";

export const instant = false;

const CATEGORIES = [["STANDARDS", "Standards"], ["CHARTER", "Charter"], ["POLICY", "Policy"], ["LEGISLATION", "Legislation"], ["PROCEDURE", "Procedure"], ["OTHER", "Other"]];
const ROLES = [["org:admin", "Administrator"], ["org:chief_audit_executive", "Chief Audit Executive"], ["org:member", "Team member"]];
const OP_LABEL: Record<string, string> = { INSERT: "created", UPDATE: "updated", APPROVE: "approved", ACKNOWLEDGE: "confirmed they had read", VIEW: "previewed", DOWNLOAD: "downloaded", DENIED: "was denied access to" };

export default async function GuidingDocumentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc, user] = await Promise.all([
    prisma.guidingDocument.findUnique({ where: { id } }),
    getSessionUser(),
  ]);
  if (!doc || doc.deleted) notFound();
  const [files, versions, acks, engagements, users, logs] = await Promise.all([
    prisma.storedFile.findMany({ where: { entity_type: "guiding_document", entity_id: id, deleted: false }, orderBy: { created_at: "desc" } }),
    prisma.documentVersion.findMany({ where: { document_id: id }, orderBy: { version_no: "desc" } }),
    prisma.documentAcknowledgement.findMany({ where: { document_id: id } }),
    prisma.engagement.findMany({ where: { deleted: false }, select: { id: true, engagement_name: true } }),
    prisma.user.findMany({ select: { id: true, first_name: true, last_name: true } }),
    prisma.auditLog.findMany({ where: { table_name: "Guiding Documents", record_id: id }, orderBy: { timestamp: "desc" }, take: 30 }),
  ]);
  const names = new Map(users.map((u) => [u.id, `${u.first_name} ${u.last_name}`]));
  const linked = Array.isArray(doc.engagement_ids) ? (doc.engagement_ids as string[]) : [];
  const viewRoles = Array.isArray(doc.view_roles) && (doc.view_roles as string[]).length ? (doc.view_roles as string[]) : ROLES.map(([v]) => v);
  const editRoles = Array.isArray(doc.edit_roles) ? (doc.edit_roles as string[]) : [];
  const canEdit = (user && (editRoles.length ? editRoles.includes(user.role ?? "") : true)) || user?.role === "org:admin";
  const acked = user ? acks.some((a) => a.user_id === user.id) : false;
  const latestFile = files[0];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/guiding-documents" className="text-sm text-orange-600 hover:underline">← All documents</Link>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{doc.name}</h1>
          <p className="text-sm text-muted-foreground">{CATEGORIES.find(([v]) => v === doc.category)?.[1] ?? "Other"} · Version {doc.version ?? doc.version_no}{doc.approved_date ? ` · Approved by ${names.get(doc.approved_by ?? "") ?? "a supervisor"} on ${doc.approved_date.toLocaleString("en-ZA", { dateStyle: "long" })}` : " · Not approved yet"}</p>
        </div>
        <div className="flex items-center gap-2">
          {latestFile && <a href={`/api/files/${latestFile.id}?inline=1`} target="_blank" className="rounded-md border px-3 py-1.5 text-xs" title="Open a preview in a new tab">Preview</a>}
          {latestFile && <a href={`/api/files/${latestFile.id}`} className="rounded-md border px-3 py-1.5 text-xs" title="Download the latest version">Download</a>}
          {!acked && <form action={acknowledgeDocument.bind(null, id)}><button className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground" title="Confirm you have read this document">I have read this</button></form>}
          {acked && <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800">You have read this</span>}
          {user && canAuthorise(user) && !doc.approved_date && doc.updated_by !== user.id && (
            <form action={approveGuidingDocument.bind(null, id)}><button className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Approve</button></form>
          )}
        </div>
      </div>

      {doc.description && <p className="text-sm">{doc.description}</p>}

      {latestFile && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Current file</h2>
          <div className="flex items-center gap-3 text-sm">
            <span>{latestFile.name}</span>
            <span className="text-xs text-muted-foreground">{latestFile.mime_type ?? "Unknown type"} · {Math.round((latestFile.size ?? 0) / 1024)} KB</span>
          </div>
        </div>
      )}

      {canEdit && (
        <div className="grid gap-4 md:grid-cols-2">
          <form action={updateGuidingDocument.bind(null, id)} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Details and access</h2>
            <label className="text-xs">Name<input name="name" defaultValue={doc.name ?? ""} className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" required /></label>
            <label className="text-xs">Description<textarea name="description" defaultValue={doc.description ?? ""} rows={2} className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" /></label>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs">Category<select name="category" defaultValue={doc.category ?? "OTHER"} className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm">{CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="text-xs">Version<input name="version" defaultValue={doc.version ?? ""} className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" /></label>
              <label className="text-xs">Effective date<input name="effective_date" type="date" defaultValue={doc.effective_date?.toISOString().slice(0, 10) ?? ""} className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm" /></label>
            </div>
            <label className="text-xs">Review date<input name="review_date" type="date" defaultValue={doc.review_date?.toISOString().slice(0, 10) ?? ""} className="mt-1 w-fit rounded-md border px-2 py-1.5 text-sm" /></label>
            <div>
              <p className="mb-1 text-xs font-medium">Who can view (leave all ticked for everyone)</p>
              <div className="flex gap-3">{ROLES.map(([v, l]) => <label key={v} className="flex items-center gap-1 text-xs"><input type="checkbox" name="view_roles" value={v} defaultChecked={viewRoles.includes(v)} /> {l}</label>)}</div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium">Who can edit (leave all unticked for everyone)</p>
              <div className="flex gap-3">{ROLES.map(([v, l]) => <label key={v} className="flex items-center gap-1 text-xs"><input type="checkbox" name="edit_roles" value={v} defaultChecked={editRoles.includes(v)} /> {l}</label>)}</div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium">Linked engagements</p>
              <div className="flex max-h-24 flex-col gap-1 overflow-auto">{engagements.map((e) => <label key={e.id} className="flex items-center gap-1 text-xs"><input type="checkbox" name="engagements" value={e.id} defaultChecked={linked.includes(e.id)} /> {e.engagement_name}</label>)}</div>
            </div>
            <button className="w-fit rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Save</button>
          </form>
          <div className="flex flex-col gap-4">
            <form action={uploadDocumentVersion.bind(null, id)} className="rounded-lg border bg-card p-4">
              <h2 className="mb-2 text-sm font-semibold">Upload a new version</h2>
              <input type="file" name="files" className="text-sm" required />
              <input name="version" placeholder={`Version label (e.g. ${(doc.version_no ?? 1) + 1}.0)`} className="ml-2 rounded-md border px-2 py-1 text-xs" />
              <button className="ml-2 rounded-md border px-3 py-1.5 text-xs">Upload</button>
              <p className="mt-2 text-xs text-muted-foreground">Uploading clears the current approval until a supervisor approves the new version.</p>
            </form>
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-2 text-sm font-semibold">Version history</h2>
              {versions.length === 0 && <p className="text-xs text-muted-foreground">Only the original file exists so far.</p>}
              <ol className="flex flex-col gap-1 text-xs">
                {versions.map((v) => <li key={v.id}>Version {v.version_no} — uploaded by {names.get(v.uploaded_by ?? "") ?? "Not recorded"}{v.created_at ? ` on ${v.created_at.toLocaleString("en-ZA", { dateStyle: "long" })}` : ""}{v.approved_by ? ` · approved by ${names.get(v.approved_by) ?? "a supervisor"}` : ""}</li>)}
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Read by ({acks.length})</h2>
        {acks.length === 0 ? <p className="text-xs text-muted-foreground">Nobody has confirmed yet.</p>
          : <p className="text-xs">{acks.map((a) => `${names.get(a.user_id ?? "") ?? "Someone"} (${a.acked_at?.toISOString().slice(0, 10)})`).join(" · ")}</p>}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Activity</h2>
        {logs.length === 0 ? <p className="text-xs text-muted-foreground">No activity recorded.</p> : (
          <ol className="flex flex-col gap-1 text-xs">
            {logs.map((l) => {
              const nv = (l.new_values ?? {}) as Record<string, unknown>;
              return <li key={l.id}>{names.get(l.user_id ?? "") ?? "Someone"} {OP_LABEL[l.operation_type ?? ""] ?? l.operation_type} this document{nv.file ? ` — “${String(nv.file)}”` : ""}{l.timestamp ? ` · ${l.timestamp.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" })}` : ""}</li>;
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
