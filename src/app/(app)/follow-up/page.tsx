import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createCorrectiveAction, updateCorrectiveAction } from "@/lib/actions";

export const instant = false;

async function advanceAction(id: string, status: string) {
  "use server";
  const fd = new FormData();
  fd.set("status", status);
  fd.set("progress", status === "IMPLEMENTED" ? "100" : status === "IN_PROGRESS" ? "50" : "0");
  await updateCorrectiveAction(id, fd);
}

const DAY = 86400_000;
const SOURCES = [["INTERNAL_AUDIT", "Internal Audit"], ["AG", "Auditor General"], ["OTHER", "Other"]];
const ageing = (daysOverdue: number | null) =>
  daysOverdue == null || daysOverdue <= 0 ? "—" : daysOverdue <= 30 ? "0–30" : daysOverdue <= 60 ? "31–60" : daysOverdue <= 90 ? "61–90" : "90+";

export default async function FollowUpPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const [rows, findings, users] = await Promise.all([
    prisma.correctiveAction.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: {
        r_finding: {
          include: {
            r_engagement: { include: { r_planned_engagement: { include: { riskAssessments_linked_planned_engagement: { select: { id: true, auditable_entity: true } } } } } },
          },
        },
        r_owner: true,
        r_supervisor: true,
      },
      orderBy: { due_date: "asc" },
    }),
    prisma.engagementFindingAndRecommendations.findMany({ where: { deleted: false }, include: { r_engagement: true } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
  ]);
  const now = Date.now();

  let filtered = rows;
  if (sp.source) filtered = filtered.filter((a) => (a.source ?? "INTERNAL_AUDIT") === sp.source);
  if (sp.status) filtered = filtered.filter((a) => a.status === sp.status);
  if (sp.owner) filtered = filtered.filter((a) => a.owner_user_id === sp.owner);
  if (sp.overdue === "true") filtered = filtered.filter((a) => a.due_date && a.due_date.getTime() < now && a.status !== "VERIFIED");
  if (sp.duesoon === "true") filtered = filtered.filter((a) => { const d = a.due_date ? (a.due_date.getTime() - now) / DAY : 99; return d >= 0 && d <= 14 && a.status !== "VERIFIED"; });
  if (sp.ag_year) filtered = filtered.filter((a) => String(a.ag_report_year ?? "") === sp.ag_year);

  const open = rows.filter((a) => a.status === "OPEN").length;
  const inProg = rows.filter((a) => a.status === "IN_PROGRESS").length;
  const impl = rows.filter((a) => a.status === "IMPLEMENTED").length;
  const verified = rows.filter((a) => a.status === "VERIFIED").length;
  const overdueN = rows.filter((a) => a.due_date && a.due_date.getTime() < now && a.status !== "VERIFIED").length;
  const dueSoonN = rows.filter((a) => { const d = a.due_date ? (a.due_date.getTime() - now) / DAY : 99; return d >= 0 && d <= 14 && a.status !== "VERIFIED"; }).length;
  const closure = rows.length ? Math.round((verified / rows.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Follow-up — Management Corrective Actions</h1>
        <div className="flex items-center gap-2">
          <a href="/follow-up?source=AG" className={`rounded-md border px-3 py-1.5 text-sm ${sp.source === "AG" ? "border-orange-600 text-orange-600" : ""}`}>Auditor General view</a>
          <CreateDialog
            title="Add Corrective Action"
            buttonLabel="Add Action"
            action={createCorrectiveAction}
            fields={[
              { name: "finding_id", label: "Finding", type: "select", options: findings.map((f) => ({ value: f.id, label: `${(f.detailed_finding ?? "").slice(0, 60)} (${f.r_engagement?.engagement_name ?? ""})` })) },
              { name: "source", label: "Source", type: "select", options: SOURCES.map(([value, label]) => ({ value, label })) },
              { name: "ag_reference", label: "AG Reference (if Auditor General)" },
              { name: "ag_report_year", label: "AG Report Year", type: "number" },
              { name: "action_description", label: "Corrective Action", type: "textarea", required: true },
              { name: "management_response", label: "Management Response", type: "textarea" },
              { name: "owner_user_id", label: "Owner", type: "select", required: true, options: users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })) },
              { name: "supervisor_user_id", label: "Supervisor (escalation contact)", type: "select", options: users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })) },
              { name: "due_date", label: "Due Date", type: "date", required: true },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-zinc-100 px-2 py-1">Total: {rows.length}</span>
        <span className="rounded bg-blue-100 px-2 py-1 text-blue-800">Open: {open}</span>
        <span className="rounded bg-amber-100 px-2 py-1 text-amber-800">In progress: {inProg}</span>
        <span className="rounded bg-purple-100 px-2 py-1 text-purple-800">Awaiting verification: {impl}</span>
        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">Verified: {verified}</span>
        <a href="/follow-up?overdue=true" className="rounded bg-red-100 px-2 py-1 text-red-800 hover:ring-1 hover:ring-red-400">Overdue: {overdueN}</a>
        <a href="/follow-up?duesoon=true" className="rounded bg-orange-100 px-2 py-1 text-orange-800 hover:ring-1 hover:ring-orange-400">Due ≤14d: {dueSoonN}</a>
        <span className="rounded bg-zinc-100 px-2 py-1">Closure rate: {closure}%</span>
        {(sp.source || sp.status || sp.owner || sp.overdue || sp.duesoon || sp.ag_year) && (
          <a href="/follow-up" className="text-orange-600 hover:underline">clear filters</a>
        )}
      </div>

      <DataGrid
        rows={filtered.map((a) => {
          const daysOverdue = a.due_date ? Math.floor((now - a.due_date.getTime()) / DAY) : null;
          const isOverdue = daysOverdue != null && daysOverdue > 0 && a.status !== "VERIFIED";
          const daysLeft = a.due_date ? Math.ceil((a.due_date.getTime() - now) / DAY) : null;
          const risk = a.r_finding?.r_engagement?.r_planned_engagement?.riskAssessments_linked_planned_engagement?.[0];
          return {
            ...a,
            finding_text: (a.r_finding?.detailed_finding ?? "—").slice(0, 90),
            engagement_name: a.r_finding?.r_engagement?.engagement_name ?? "—",
            source_label: SOURCES.find(([v]) => v === (a.source ?? "INTERNAL_AUDIT"))?.[1] ?? a.source,
            owner_name: a.r_owner ? `${a.r_owner.first_name} ${a.r_owner.last_name}` : "—",
            due_display: a.due_date?.toISOString().slice(0, 10) ?? "—",
            status_label: (a.status ?? "").replaceAll("_", " "),
            flag: isOverdue ? `OVERDUE ${daysOverdue}d` : daysLeft != null && daysLeft <= 14 && a.status !== "VERIFIED" ? `due in ${daysLeft}d` : "",
            ageing_bucket: ageing(daysOverdue),
            risk_rating: risk ? "Linked" : "—",
            risk_id: risk?.id ?? null,
            revisions: a.revision_count > 0 ? `${a.revision_count} rev` : "",
            verified_date: a.verified_date?.toISOString().slice(0, 10),
          };
        }) as unknown as object[]}
        hrefPattern="/follow-up/{id}"
        rowActions={["files", "workflow"]}
        filesEntity="corrective-action"
        workflow={{ steps: ["OPEN", "IN_PROGRESS", "IMPLEMENTED", "VERIFIED"], onAdvance: advanceAction }}
        badgeMap={{
          flag: { "": "" },
          ageing_bucket: { "90+": "rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800", "61–90": "rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800", "31–60": "rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800" },
        }}
        rowStyleRules={[{ field: "ageing_bucket", when: "90+", style: { backgroundColor: "#fef2f2" } }]}
        colDefs={[
          { field: "flag", headerName: "Flag", width: 110 },
          { field: "finding_text", headerName: "Finding", flex: 1.8, tooltipField: "finding_text" },
          { field: "action_description", headerName: "Corrective Action", flex: 1.8, tooltipField: "action_description" },
          { field: "source_label", headerName: "Source" },
          { field: "owner_name", headerName: "Owner", flex: 1.1, tooltipField: "owner_name" },
          { field: "due_display", headerName: "Due" },
          { field: "status_label", headerName: "Status" },
          { field: "progress", headerName: "% Done", width: 90 },
          { field: "ageing_bucket", headerName: "Ageing", width: 90 },
          { field: "escalation_level", headerName: "Esc. Lvl", width: 80 },
          { field: "revisions", headerName: "Revised", width: 80 },
          { field: "verified_date", headerName: "Verified" },
        ]}
      />
    </div>
  );
}
