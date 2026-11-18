import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createGuidingDocument, bulkCreateGuidingDocuments } from "@/lib/actions";

export const instant = false;

const CATEGORY_LABEL: Record<string, string> = { STANDARDS: "Standards", CHARTER: "Charter", POLICY: "Policy", LEGISLATION: "Legislation", PROCEDURE: "Procedure", OTHER: "Other" };

export default async function GuidingDocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q, category } = await searchParams;
  const where: Record<string, unknown> = { deleted: false, organization_id: DEMO_ORGANIZATION_ID };
  if (category) where.category = category;
  const all = await prisma.guidingDocument.findMany({ where, orderBy: { updated_at: "desc" } });
  const needle = (q ?? "").toLowerCase();
  const rows = needle
    ? all.filter((d) => [d.name, d.description, d.text_extract].some((x) => x?.toLowerCase().includes(needle)))
    : all;
  const [users, files, acks] = await Promise.all([
    prisma.user.findMany({ where: { organization_id: DEMO_ORGANIZATION_ID } }),
    prisma.storedFile.findMany({ where: { entity_type: "guiding_document", entity_id: { in: rows.map((r) => r.id) }, deleted: false }, orderBy: { created_at: "desc" } }),
    prisma.documentAcknowledgement.findMany({ where: { document_id: { in: rows.map((r) => r.id) } }, select: { document_id: true } }),
  ]);
  const names = new Map(users.map((u) => [u.id, `${u.first_name} ${u.last_name}`]));
  const fileByDoc = new Map<string, typeof files>();
  for (const f of files) fileByDoc.set(f.entity_id ?? "", [...(fileByDoc.get(f.entity_id ?? "") ?? []), f]);
  const ackCount = new Map<string, number>();
  for (const a of acks) ackCount.set(a.document_id ?? "", (ackCount.get(a.document_id ?? "") ?? 0) + 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Guiding documents</h1>
        <div className="flex gap-2">
          <CreateDialog title="Bulk upload" buttonLabel="Bulk upload" action={bulkCreateGuidingDocuments} fields={[
            { name: "category", label: "Category", type: "select", options: Object.entries(CATEGORY_LABEL).map(([v, l]) => ({ value: v, label: l })) },
            { name: "files", label: "Files (select several)", type: "file" },
          ]} />
          <CreateDialog title="Create document" buttonLabel="Create document" action={createGuidingDocument} fields={[
            { name: "name", label: "Name", required: true },
            { name: "description", label: "Description" },
            { name: "files", label: "Files", type: "file" },
          ]} />
        </div>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search name, description or contents…" className="w-96 rounded-md border px-3 py-1.5 text-sm" />
        <select name="category" defaultValue={category ?? ""} className="rounded-md border px-2 py-1.5 text-sm">
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">Search</button>
      </form>
      {rows.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{all.length === 0 ? "No documents yet. Create or bulk-upload one." : "No documents match your search."}</div>}
      <DataGrid
        rows={rows.map((r) => {
          const f = fileByDoc.get(r.id)?.[0];
          return {
            id: r.id,
            name: r.name,
            category: CATEGORY_LABEL[r.category ?? ""] ?? "Other",
            description: r.description ?? "—",
            version: r.version ?? "—",
            file: f ? f.name : "No file",
            size: f ? `${Math.round((f.size ?? 0) / 1024)} KB` : "—",
            approved: r.approved_date ? `Approved by ${names.get(r.approved_by ?? "") ?? "a supervisor"}` : "Not approved",
            ack: ackCount.get(r.id) ?? 0,
            updated_at: r.updated_at ? r.updated_at.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "Not recorded",
            updated_by: names.get(r.updated_by ?? "") ?? "Not recorded",
          };
        }) as unknown as object[]}
        hrefPattern="/guiding-documents/{id}"
        colDefs={[
          { field: "name", headerName: "Name", flex: 2, tooltipField: "name" },
          { field: "category", headerName: "Category", width: 120 },
          { field: "description", headerName: "Description", flex: 2, tooltipField: "description" },
          { field: "version", headerName: "Version", width: 85 },
          { field: "file", headerName: "File", flex: 1.2, tooltipField: "file" },
          { field: "size", headerName: "Size", width: 80, type: "rightAligned" },
          { field: "approved", headerName: "Approval", flex: 1.4, tooltipField: "approved" },
          { field: "ack", headerName: "Read by", width: 85, type: "rightAligned" },
          { field: "updated_at", headerName: "Last updated", width: 190 },
          { field: "updated_by", headerName: "Updated by", width: 150, tooltipField: "updated_by" },
        ]}
      />
    </div>
  );
}
