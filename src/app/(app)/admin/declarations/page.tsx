import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { EditDialog } from "@/components/edit-dialog";
import {
  createDeclaration, createDeclarationSection,
  updateDeclaration, updateDeclarationSection, setDeclRowDisabled,
} from "@/lib/actions";

export const instant = false;

export default async function DeclarationsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: editId } = await searchParams;
  const [rows, sections, signCounts, conflictCounts] = await Promise.all([
    prisma.declaration.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { created_at: "asc" },
    }),
    prisma.declarationSection.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { created_at: "asc" },
    }),
    prisma.engagementAuditorDeclaration.groupBy({
      by: ["declaration_id"],
      where: { deleted: false, OR: [{ status: "SIGNED" }, { status: "APPROVED" }] },
      _count: true,
    }),
    prisma.engagementAuditorDeclaration.groupBy({
      by: ["declaration_id"],
      where: { deleted: false, status: "CONFLICT" },
      _count: true,
    }),
  ]);
  const signedByDecl = new Map(signCounts.map((c) => [c.declaration_id, c._count]));
  const conflictsByDecl = new Map(conflictCounts.map((c) => [c.declaration_id, c._count]));

  // Interleave: each section row (bold/shaded) followed by its declarations, like the live grid
  const gridRows: Record<string, unknown>[] = [];
  const bySection = new Map<string | null, typeof rows>();
  for (const d of rows) {
    const k = d.declaration_section_id;
    if (!bySection.has(k)) bySection.set(k, []);
    bySection.get(k)!.push(d);
  }
  for (const s of sections) {
    gridRows.push({
      id: `sec:${s.id}`, kind: "section",
      section_decl: s.custom_name ?? s.name,
      prescribed: s.prescribed, disabled: s.disabled,
    });
    for (const d of bySection.get(s.id) ?? []) {
      gridRows.push({
        id: `dec:${d.id}`, kind: "decl",
        section_decl: d.custom_text ?? d.declaration_text,
        prescribed: d.prescribed, disabled: d.disabled,
        times_signed: signedByDecl.get(d.id) ?? 0,
        open_conflicts: conflictsByDecl.get(d.id) ?? 0,
      });
    }
    bySection.delete(s.id);
  }
  for (const orphans of bySection.values()) {
    for (const d of orphans) {
      gridRows.push({
        id: `dec:${d.id}`, kind: "decl",
        section_decl: d.custom_text ?? d.declaration_text,
        prescribed: d.prescribed, disabled: d.disabled,
        times_signed: signedByDecl.get(d.id) ?? 0,
        open_conflicts: conflictsByDecl.get(d.id) ?? 0,
      });
    }
  }

  // Edit dialog target from ?id=sec:{id} / ?id=dec:{id}
  const [editKind, editKey] = editId?.includes(":") ? editId.split(":", 2) : [null, null];
  const editDecl = editKind === "dec" ? rows.find((d) => d.id === editKey) : null;
  const editSec = editKind === "sec" ? sections.find((s) => s.id === editKey) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Declarations</h1>
        <div className="flex gap-2">
          <CreateDialog
            title="Add Declaration Section"
            buttonLabel="Add Declaration Section"
            action={createDeclarationSection}
            fields={[
              { name: "name", label: "Name", required: true, placeholder: "Enter a name" },
              { name: "custom_name", label: "Custom Name", placeholder: "Enter a custom name" },
              { name: "description", label: "Description", placeholder: "Enter a description" },
              { name: "prescribed", label: "Prescribed", type: "checkbox" },
            ]}
          />
          <CreateDialog
            title="Create Declaration"
            buttonLabel="Add Declaration"
            action={createDeclaration}
            fields={[
              {
                name: "declaration_section_id", label: "Section", type: "select", required: true,
                options: sections.map((s) => ({ value: s.id, label: s.custom_name ?? s.name ?? s.id })),
              },
              { name: "declaration_text", label: "Declaration Text", type: "textarea", required: true },
              { name: "custom_text", label: "Custom Text", type: "textarea" },
              { name: "prescribed", label: "Prescribed", type: "checkbox" },
            ]}
          />
        </div>
      </div>
      <DataGrid
        rows={gridRows as object[]}
        hrefPattern="/admin/declarations?id={id}"
        rowActions={["edit", "toggle"]}
        toggle={{ field: "disabled", onToggle: setDeclRowDisabled, labels: ["Enable", "Disable"] }}
        rowStyleRules={[
          { field: "kind", when: "section", style: { background: "#f4f4f5", fontWeight: "600" } },
          { field: "disabled", when: true, style: { background: "#fecaca" } },
        ]}
        colDefs={[
          {
            field: "section_decl", headerName: "Section / declaration", flex: 3, wrapText: true, autoHeight: true,
            tooltipField: "section_decl",
            cellClassRules: { "pl-7": 'data.kind === "decl"' },
          },
          {
            field: "prescribed", headerName: "Prescribed", width: 120,
            headerTooltip: "A required declaration from the audit methodology — every team member must sign these before being allocated work. Administrators can change this flag.",
          },
          { field: "times_signed", headerName: "Times signed", width: 115 },
          { field: "open_conflicts", headerName: "Open conflicts", width: 125 },
        ]}
      />
      {editDecl && (
        <EditDialog
          title="Edit Declaration"
          returnPath="/admin/declarations"
          action={updateDeclaration.bind(null, editDecl.id)}
          values={{
            declaration_section_id: editDecl.declaration_section_id,
            declaration_text: editDecl.declaration_text,
            custom_text: editDecl.custom_text,
            prescribed: editDecl.prescribed,
          }}
          fields={[
            {
              name: "declaration_section_id", label: "Section", type: "select", required: true,
              options: sections.map((s) => ({ value: s.id, label: s.custom_name ?? s.name ?? s.id })),
            },
            { name: "declaration_text", label: "Declaration Text", type: "textarea", required: true },
            { name: "custom_text", label: "Custom Text", type: "textarea" },
            { name: "prescribed", label: "Prescribed", type: "checkbox" },
          ]}
        />
      )}
      {editSec && (
        <EditDialog
          title="Edit Declaration Section"
          returnPath="/admin/declarations"
          action={updateDeclarationSection.bind(null, editSec.id)}
          values={{
            name: editSec.name,
            custom_name: editSec.custom_name,
            description: editSec.description,
            prescribed: editSec.prescribed,
          }}
          fields={[
            { name: "name", label: "Name", required: true, placeholder: "Enter a name" },
            { name: "custom_name", label: "Custom Name", placeholder: "Enter a custom name" },
            { name: "description", label: "Description", placeholder: "Enter a description" },
            { name: "prescribed", label: "Prescribed", type: "checkbox" },
          ]}
        />
      )}
    </div>
  );
}
