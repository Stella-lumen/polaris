import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { TemplateEditor, type TemplateField } from "@/components/template-editor";
import { updateTemplate, copyTemplate, approveTemplate, retireTemplate, setTemplateLogo } from "@/lib/actions";

export const instant = false;

export default async function TemplateEditPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const model = kind === "report" ? prisma.reportDocumentTemplate : kind === "planning" || kind === "fieldwork" ? prisma.planningDocumentTemplate : null;
  if (!model) notFound();
  const [t, user, engagementTypes, versions] = await Promise.all([
    (model as any).findUnique({ where: { id } }),
    getSessionUser(),
    prisma.engagementType.findMany({ where: { deleted: false }, orderBy: { name: "asc" } }),
    prisma.templateVersion.findMany({ where: { template_id: id }, orderBy: { version: "desc" } }),
  ]);
  if (!t) notFound();
  const userIds = [...new Set(versions.map((v) => v.changed_by).filter(Boolean))] as string[];
  const users = new Map((await prisma.user.findMany({ where: { id: { in: userIds } } })).map((u) => [u.id, `${u.first_name} ${u.last_name}`]));
  const canApprove = user ? canAuthorise(user) : false;
  const linked = Array.isArray(t.engagement_types) ? (t.engagement_types as string[]) : [];
  const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", APPROVED: "Approved", RETIRED: "Retired" };

  return (
    <div className="flex flex-col gap-4">
      <Link href={kind === "report" ? "/templates/reporting" : kind === "fieldwork" ? "/templates/fieldwork" : "/templates/planning"} className="text-sm text-orange-600 hover:underline">← Back to templates</Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.name}</h1>
          <p className="text-sm text-muted-foreground">Reference {t.reference} · Version {t.version} · {STATUS_LABEL[t.status ?? ""] ?? "Draft"}</p>
        </div>
        <div className="flex items-center gap-2">
          <form action={copyTemplate.bind(null, kind, id)} className="flex items-center gap-1">
            <input name="name" placeholder="Copy name" className="w-36 rounded-md border px-2 py-1 text-xs" />
            <button className="rounded-md border px-3 py-1.5 text-xs">Copy</button>
          </form>
          {canApprove && t.status !== "APPROVED" && (
            <form action={approveTemplate.bind(null, kind, id)}><button className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Approve</button></form>
          )}
          {canApprove && t.status === "APPROVED" && (
            <form action={retireTemplate.bind(null, kind, id)}><button className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600">Retire</button></form>
          )}
        </div>
      </div>

      {t.logo_file_id && <img src={`/api/files/${t.logo_file_id}`} alt="Template logo" className="h-14 object-contain" />}

      <form action={updateTemplate.bind(null, kind, id)} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Name<input name="name" defaultValue={t.name ?? ""} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" required /></label>
          <label className="text-sm">Description<input name="description" defaultValue={t.description ?? ""} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" /></label>
        </div>
        <label className="flex w-fit items-center gap-2 text-sm" title="Every engagement of the linked types must include this document">
          <input type="checkbox" name="required" defaultChecked={!!t.required} /> Required — every engagement of the linked types must include this document
        </label>
        <div>
          <p className="mb-1 text-sm font-medium">Used by engagement types</p>
          <div className="flex flex-wrap gap-3">
            {engagementTypes.map((et) => (
              <label key={et.id} className="flex items-center gap-1 text-xs">
                <input type="checkbox" name="et" value={et.id} defaultChecked={linked.includes(et.id)} /> {et.name}
              </label>
            ))}
          </div>
                  </div>
        <div>
          <p className="mb-1 text-sm font-medium">Fields (in order)</p>
          <TemplateEditor initial={(t.fields_json as TemplateField[] | null) ?? []} />
        </div>
        <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Save as new version</button>
        <p className="text-xs text-muted-foreground">Saving creates version {(t.version ?? 1) + 1} and returns the template to Draft until a supervisor approves it.</p>
      </form>

      <form action={setTemplateLogo.bind(null, kind, id)} className="flex items-center gap-2">
        <input type="file" name="files" accept="image/*" className="text-sm" />
        <button className="rounded-md border px-3 py-1.5 text-xs">Set logo</button>
      </form>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Preview</h2>
        <div className="rounded-md border bg-white p-6">
          {t.logo_file_id && <img src={`/api/files/${t.logo_file_id}`} alt="" className="mb-3 h-10" />}
          <h3 className="mb-3 text-lg font-semibold">{t.name}</h3>
          {((t.fields_json as TemplateField[] | null) ?? []).sort((a, b) => a.sort - b.sort).map((f, i) => (
            <div key={i} className="mb-3">
              <p className="text-sm font-medium">{f.label}{f.required ? " *" : ""}</p>
              <p className="text-xs text-muted-foreground">
                {f.type === "YES_NO" ? "Yes / No" : f.type === "CHOICE" ? `Choice: ${f.options.join(", ")}` : f.type === "FILE" ? "File attachment" : f.type === "SIGNATURE" ? "Signature" : f.type === "DATE" ? "Date" : "Text"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Version history</h2>
        {versions.length === 0 && <p className="text-sm text-muted-foreground">No versions recorded yet.</p>}
        <ol className="flex flex-col gap-2">
          {versions.map((v) => (
            <li key={v.id} className="text-sm">
              <span className="font-medium">Version {v.version}</span> — {v.name}
              <span className="text-xs text-muted-foreground"> · saved by {users.get(v.changed_by ?? "") ?? "Not recorded"}{v.created_at ? ` on ${v.created_at.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" })}` : ""}{v.approved_by ? ` · approved by ${users.get(v.approved_by) ?? "Not recorded"}` : ""}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
