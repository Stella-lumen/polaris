import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createEngagementType, setEngagementTypeDisabled } from "@/lib/actions";
import { requireUser, canAuthorise } from "@/lib/auth";

export const instant = false;

const fmt = (d: Date | null) => (d ? d.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "Not recorded");
const SAMPLE_DOMAINS = ["tzulu.co.za", "stella-lumen.com"];

export default async function EngagementTypesPage() {
  const user = await requireUser();
  const admin = canAuthorise(user);
  const [rows, users, engCounts, taskCounts] = await Promise.all([
    prisma.engagementType.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID } }),
    prisma.user.findMany({ where: { deleted: false }, select: { id: true, email: true, first_name: true, last_name: true } }),
    prisma.engagement.groupBy({ by: ["engagement_type_id"], where: { deleted: false }, _count: true }),
    prisma.taskTemplate.groupBy({ by: ["engagement_type_id"], where: { deleted: false }, _count: true }),
  ]);
  const nameById = new Map(users.map((u) => [u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email]));
  const sampleUpdaters = new Set(
    users.filter((u) => u.email && SAMPLE_DOMAINS.some((d) => u.email!.endsWith(`@${d}`))).map((u) => u.id),
  );
  const engByType = new Map(engCounts.map((c) => [c.engagement_type_id, c._count]));
  const tasksByType = new Map(taskCounts.map((c) => [c.engagement_type_id, c._count]));
  const anySample = rows.some((r) => r.updated_by && sampleUpdaters.has(r.updated_by));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Engagement types</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Each type carries its own default templates, stage checklist and budget guide, offered when a
            new engagement is created. Open a type to set its defaults.
          </p>
        </div>
        {admin && (
          <CreateDialog
            title="Create engagement type"
            buttonLabel="Add engagement type"
            action={createEngagementType}
            fields={[
              { name: "name", label: "Name", required: true, placeholder: "Enter a name" },
              { name: "description", label: "Description", placeholder: "Enter a description" },
            ]}
          />
        )}
      </div>
      {anySample && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Some types were last updated by sample staff accounts (for example Thabani Zulu or Amanda Zondo) — these are seeded demo users, shown for information only.
        </p>
      )}
      <DataGrid
        hrefPattern="/admin/engagement-types/{id}"
        rowActions={admin ? ["edit", "toggle"] : []}
        toggle={{ field: "disabled", onToggle: setEngagementTypeDisabled, labels: ["Disable", "Enable"] }}
        pageSize={50}
        rows={rows.map((r) => {
          const dt = (r.default_templates as { planning?: string; fieldwork?: string; reporting?: string } | null) ?? {};
          const tpls = [dt.planning, dt.fieldwork, dt.reporting].filter(Boolean).length;
          const tasks = tasksByType.get(r.id) ?? 0;
          return {
            id: r.id,
            name: r.name === "Adhoc Engagements" ? "Ad hoc Engagements" : r.name,
            description: r.description ?? "Not assigned",
            engagements: engByType.get(r.id) ?? 0,
            templates: tpls ? `${tpls} template${tpls === 1 ? "" : "s"}` : "Not assigned",
            tasks: tasks ? `${tasks} task${tasks === 1 ? "" : "s"}` : "Not assigned",
            disabled: r.disabled,
            updated_at: fmt(r.updated_at),
            updated_by: r.updated_by ? nameById.get(r.updated_by) ?? "Not assigned" : "Not assigned",
          };
        }) as unknown as object[]}
        colDefs={[
          { field: "name", headerName: "Name", flex: 1.6, tooltipField: "name" },
          { field: "description", headerName: "Description", flex: 2.4, tooltipField: "description" },
          { field: "engagements", headerName: "Engagements", width: 115 },
          { field: "templates", headerName: "Default templates", width: 150, tooltipField: "templates" },
          { field: "tasks", headerName: "Default tasks", width: 120 },
          { field: "disabled", headerName: "Disabled", width: 95 },
          { field: "updated_at", headerName: "Last updated", width: 190 },
          { field: "updated_by", headerName: "Updated by", width: 160, tooltipField: "updated_by" },
        ]}
      />
    </div>
  );
}
