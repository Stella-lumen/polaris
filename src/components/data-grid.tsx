"use client";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule, ModuleRegistry, themeQuartz,
  type ColDef, type ICellRendererParams,
} from "ag-grid-community";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pencil, FileText, Download, CheckCircle2, Trash2 } from "lucide-react";
import { signoffDoc } from "@/lib/actions";

ModuleRegistry.registerModules([AllCommunityModule]);

// Matches the original app's grid look: orange accents, striped rows, subtle borders
export const gridTheme = themeQuartz.withParams({
  accentColor: "#ea580c",
  oddRowBackgroundColor: "#fafafa",
  headerBackgroundColor: "#f4f4f5",
  headerFontWeight: 500,
  borderColor: "#e4e4e7",
  rowBorder: true,
  headerRowBorder: true,
  columnBorder: true,
  spacing: 6,
});

/** "2025-11-29T16:43:36.000Z" -> "29/11/2025 at 16:43:36" (original's timestamp style) */
function fmtCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} at ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }
  return s;
}

export type RowAction = "edit" | "files" | "signoff" | "workflow" | "toggle" | "delete" | "toplan" | "expire";

export type ToPlanConfig = {
  /** plan periods offered in the row dropdown */
  plans: { id: string; label: string }[];
  /** bound server action — receives (rowId, planId) */
  onAdd: (id: string, planId: string) => Promise<unknown>;
};

export type DeleteConfig = {
  /** bound server action — receives row id */
  onDelete: (id: string) => Promise<unknown>;
};

export type ToggleConfig = {
  /** boolean row field to flip, e.g. "disabled" */
  field: string;
  /** bound server action — receives (id, newValue) */
  onToggle: (id: string, value: boolean) => Promise<unknown>;
  /** aria-label / title when checked vs unchecked */
  labels?: [string, string];
};

export type WorkflowConfig = {
  doneValues?: string[];
  steps: string[];
  onAdvance: (id: string, status: string) => Promise<unknown>;
};

export type SignoffConfig = {
  stage: "planning" | "fieldwork" | "report" | "declaration" | "finding" | "program";
  engagementId: string;
  auditors: { id: string; label: string }[];
};

type StoredFileMeta = { id: string; name: string | null; size: number | null };

function FilesButton({ row, entityType }: { row: { id?: string; files?: { name?: string }[] }; entityType?: string }) {
  const [open, setOpen] = useState(false);
  const [stored, setStored] = useState<StoredFileMeta[] | null>(null);
  useEffect(() => {
    if (open && entityType && row.id && stored === null) {
      fetch(`/api/files?entity_type=${entityType}&entity_id=${row.id}`)
        .then((r) => r.json())
        .then(setStored)
        .catch(() => setStored([]));
    }
  }, [open, entityType, row.id, stored]);
  const metaFiles = row.files ?? [];
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="text-orange-600 hover:text-orange-500"
        title="Files"
      >
        <FileText className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-10 w-64 rounded-md border bg-background p-2 text-xs shadow-md">
          {stored && stored.length > 0 ? (
            stored.map((f) => (
              <a key={f.id} href={`/api/files/${f.id}`} className="flex items-center gap-1.5 truncate px-1 py-0.5 text-orange-600 hover:underline">
                <Download className="h-3 w-3 shrink-0" /> {f.name ?? "file"}
              </a>
            ))
          ) : metaFiles.length ? (
            metaFiles.map((f, i) => <div key={i} className="truncate px-1 py-0.5">{f.name ?? "file"}</div>)
          ) : (
            <div className="px-1 py-0.5 text-muted-foreground">No files</div>
          )}
        </div>
      )}
    </div>
  );
}

function SignoffCell({ data, config }: { data: Record<string, unknown>; config: SignoffConfig }) {
  const router = useRouter();
  const [pickReviewer, setPickReviewer] = useState(false);
  const [busy, setBusy] = useState(false);
  const prepared = !!(data.prepared_date || data.confirmation_date);
  const reviewed = !!data.nominated_reviewer_id;
  const authorised = !!data.authorised_date;
  // declarations & findings have no reviewer step: prepare → authorise
  const hasReviewStep = config.stage !== "declaration" && config.stage !== "finding";

  async function run(step: "prepare" | "review" | "authorise", reviewerId?: string) {
    setBusy(true);
    try {
      await signoffDoc(config.stage, String(data.id), config.engagementId, step, reviewerId);
      setPickReviewer(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (authorised) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> Authorised
      </span>
    );
  }
  if (!prepared) {
    return (
      <button disabled={busy} onClick={(e) => { e.stopPropagation(); run("prepare"); }} className="rounded bg-orange-600 px-2 py-1 text-xs font-medium text-white hover:bg-orange-500 disabled:opacity-50">
        Prepare
      </button>
    );
  }
  if (hasReviewStep && !reviewed) {
    return (
      <div className="relative">
        <button disabled={busy} onClick={(e) => { e.stopPropagation(); setPickReviewer((o) => !o); }} className="rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-400 disabled:opacity-50">
          Review…
        </button>
        {pickReviewer && (
          <div className="absolute left-0 top-6 z-10 w-48 rounded-md border bg-background p-1 text-xs shadow-md">
            <div className="px-1.5 py-1 text-muted-foreground">Nominate reviewer</div>
            {config.auditors.map((a) => (
              <button key={a.id} onClick={(e) => { e.stopPropagation(); run("review", a.id); }} className="block w-full truncate rounded px-1.5 py-1 text-left hover:bg-accent">
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <button disabled={busy} onClick={(e) => { e.stopPropagation(); run("authorise"); }} className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50" title="Authorise (Admin/CAE)">
      Authorise
    </button>
  );
}

function WorkflowCell({ data, config }: { data: Record<string, unknown>; config: WorkflowConfig }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const status = String(data.status ?? config.steps[0]);
  const idx = config.steps.indexOf(status);
  const done = idx === config.steps.length - 1 || (config.doneValues?.includes(status) ?? false);
  const next = config.steps[idx + 1];
  return done ? (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
      <CheckCircle2 className="h-3.5 w-3.5" /> {status.replaceAll("_", " ")}
    </span>
  ) : (
    <button
      disabled={busy}
      onClick={async (e) => {
        e.stopPropagation();
        setBusy(true);
        try {
          await config.onAdvance(String(data.id), next);
          router.refresh();
        } catch (err) {
          alert(err instanceof Error ? err.message : "Could not advance status");
        } finally {
          setBusy(false);
        }
      }}
      title={`Move to ${next.replaceAll("_", " ").toLowerCase()}`}
      className="rounded bg-orange-600 px-2 py-1 text-xs font-medium whitespace-nowrap text-white hover:bg-orange-500 disabled:opacity-50"
    >
      Mark {next.replaceAll("_", " ")}
    </button>
  );
}

function ToggleCell({ data, config }: { data: Record<string, unknown>; config: ToggleConfig }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const checked = !!data[config.field];
  const [onLabel, offLabel] = config.labels ?? ["Enabled", "Disabled"];
  return (
    <label className="flex items-center gap-1.5 text-xs" title={checked ? onLabel : offLabel}>
      <input
        type="checkbox"
        checked={checked}
        disabled={busy}
        className="h-3.5 w-3.5 accent-orange-600 disabled:opacity-50"
        onChange={async (e) => {
          e.stopPropagation();
          setBusy(true);
          try {
            await config.onToggle(String(data.id), e.target.checked);
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
      />
      <span className={checked ? "text-red-600" : "text-muted-foreground"}>{checked ? onLabel : offLabel}</span>
    </label>
  );
}

export type ExpireConfig = { onExpire: (id: string) => Promise<unknown>; label?: string; confirm?: string };

function ExpireCell({ data, config }: { data: Record<string, unknown>; config: ExpireConfig }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!data.expirable) return null;
  return (
    <button
      disabled={busy}
      title={config.label ?? "Expire key"}
      onClick={async (e) => {
        e.stopPropagation();
        if (!confirm(config.confirm ?? "Expire this item?")) return;
        setBusy(true);
        try {
          await config.onExpire(String(data.id));
          router.refresh();
        } catch (err) {
          alert(err instanceof Error ? err.message : "Could not expire this item");
        } finally {
          setBusy(false);
        }
      }}
      className="text-xs text-neutral-500 underline decoration-dotted underline-offset-2 hover:text-neutral-700 disabled:opacity-50"
    >
      {config.label ?? "Expire"}
    </button>
  );
}

function DeleteCell({ data, config }: { data: Record<string, unknown>; config: DeleteConfig }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!data.deletable) {
    return data.delete_reason ? (
      <button type="button" disabled title={String(data.delete_reason)} className="cursor-not-allowed text-neutral-300">
        <Trash2 className="h-4 w-4" />
      </button>
    ) : null;
  }
  return (
    <button
      disabled={busy}
      title="Delete"
      onClick={async (e) => {
        e.stopPropagation();
        if (!confirm("Delete this record? This cannot be undone.")) return;
        setBusy(true);
        try {
          await config.onDelete(String(data.id));
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="text-red-600 hover:text-red-500 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function ToPlanCell({ data, config }: { data: Record<string, unknown>; config: ToPlanConfig }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  if (data.planned_engagement_id) return null;
  return (
    <div className="relative">
      <button
        disabled={busy}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="rounded bg-orange-600 px-2 py-1 text-xs font-medium whitespace-nowrap text-white hover:bg-orange-500 disabled:opacity-50"
      >
        Add to Plan…
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-10 w-56 rounded-md border bg-background p-1 text-xs shadow-md">
          <div className="px-1.5 py-1 text-muted-foreground">Add to audit plan</div>
          {config.plans.map((p) => (
            <button
              key={p.id}
              disabled={busy}
              onClick={async (e) => {
                e.stopPropagation();
                setBusy(true);
                try { await config.onAdd(String(data.id), p.id); router.refresh(); } finally { setBusy(false); setOpen(false); }
              }}
              className="block w-full truncate rounded px-1.5 py-1 text-left hover:bg-accent"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionsCell({
  data,
  actions,
  filesEntity,
  signoff,
  workflow,
  toggle,
  deleteConfig,
  toPlan,
  expireConfig,
  onNavigate,
}: {
  data: unknown;
  actions: RowAction[];
  filesEntity?: string;
  signoff?: SignoffConfig;
  workflow?: WorkflowConfig;
  toggle?: ToggleConfig;
  deleteConfig?: DeleteConfig;
  toPlan?: ToPlanConfig;
  expireConfig?: ExpireConfig;
  onNavigate: (id: string) => void;
}) {
  const row = data as Record<string, unknown> & { id?: string; files?: { name?: string }[] };
  return (
    <div className="relative flex h-full items-center gap-3">
      {actions.includes("edit") && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (row.id) onNavigate(row.id);
          }}
          className="text-orange-600 hover:text-orange-500"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {actions.includes("files") && <FilesButton row={row} entityType={filesEntity} />}
      {actions.includes("signoff") && signoff && <SignoffCell data={row} config={signoff} />}
      {actions.includes("workflow") && workflow && <WorkflowCell data={row} config={workflow} />}
      {actions.includes("toggle") && toggle && <ToggleCell data={row} config={toggle} />}
      {actions.includes("delete") && deleteConfig && <DeleteCell data={row} config={deleteConfig} />}
      {actions.includes("toplan") && toPlan && <ToPlanCell data={row} config={toPlan} />}
      {actions.includes("expire") && expireConfig && <ExpireCell data={row} config={expireConfig} />}
    </div>
  );
}

export function DataGrid({
  rows,
  colDefs,
  hrefPattern,
  rowActions,
  filesEntity,
  signoff,
  workflow,
  toggle,
  deleteConfig,
  toPlan,
  expireConfig,
  badgeMap,
  rowStyleRules,
  pageSize,
  heightClass = "h-[600px]",
}: {
  rows: object[];
  colDefs: ColDef[];
  /** e.g. "/engagements/{id}/dashboard" — {id} is replaced with row.id on click */
  hrefPattern?: string;
  /** renders a leading icon column: edit → hrefPattern, files → file list popover, signoff → workflow buttons */
  rowActions?: RowAction[];
  /** entity_type used to look up stored files for the files popover */
  filesEntity?: string;
  /** config for the signoff row action (stage + engagement + team auditors) */
  signoff?: SignoffConfig;
  /** status-step buttons per row (bound server action, serializable) */
  workflow?: WorkflowConfig;
  /** checkbox toggle bound to a boolean row field (e.g. user disabled) */
  toggle?: ToggleConfig;
  /** trash button on rows flagged deletable (bound server action, serializable) */
  deleteConfig?: DeleteConfig;
  /** "Add to plan" dropdown on rows lacking planned_engagement_id */
  toPlan?: ToPlanConfig;
  expireConfig?: ExpireConfig;
  /** render a field's value as a coloured badge: { field: { "VALUE": "tailwind classes" } } */
  badgeMap?: Record<string, Record<string, string>>;
  /** serializable row style rules: when row[field] === when, apply style (e.g. pink disabled rows) */
  rowStyleRules?: { field: string; when: unknown; style: Record<string, string> }[];
  /** rows per pagination page (default 20) */
  pageSize?: number;
  /** tailwind height class for the grid container */
  heightClass?: string;
}) {
  const router = useRouter();
  const go = (id: string) => hrefPattern && router.push(hrefPattern.replace("{id}", id));
  const actionCount = (rowActions?.includes("edit") ? 1 : 0) + (rowActions?.includes("files") ? 1 : 0) + (rowActions?.includes("signoff") ? 1 : 0) + (rowActions?.includes("workflow") ? 1 : 0) + (rowActions?.includes("toggle") ? 1 : 0) + (rowActions?.includes("delete") ? 1 : 0) + (rowActions?.includes("toplan") ? 1 : 0) + (rowActions?.includes("expire") ? 1 : 0);
  // Single-action columns keep their tuned widths; combos add per-action
  // footprints so edit + toggle + delete can't overflow into the next column.
  const SINGLE: Record<string, number> = {
    expire: 150, toplan: 130, workflow: 200, signoff: 140, toggle: 110,
  };
  const actionWidth = rowActions?.length === 1 && SINGLE[rowActions[0]]
    ? SINGLE[rowActions[0]]
    : Math.max(56, (rowActions ?? []).reduce((w, a) => {
        const per: Record<string, number> = {
          edit: 32, files: 32, delete: 32,
          toggle: 88, expire: 96, toplan: 110, signoff: 130, workflow: 180,
        };
        return w + (per[a] ?? 32) + 8;
      }, 8));
  const cols: ColDef[] = [
    ...(rowActions?.length
      ? [{
          colId: "__actions",
          headerName: "",
          width: actionWidth,
          minWidth: actionWidth,
          maxWidth: actionWidth,
          flex: 0,
          sortable: false,
          filter: false,
          resizable: false,
          suppressMovable: true,
          cellRenderer: (p: ICellRendererParams) => (
            <ActionsCell data={p.data} actions={rowActions} filesEntity={filesEntity} signoff={signoff} workflow={workflow} toggle={toggle} deleteConfig={deleteConfig} toPlan={toPlan} expireConfig={expireConfig} onNavigate={go} />
          ),
        }]
      : []),
    ...colDefs.map((c) =>
      badgeMap?.[c.field ?? ""] ? {
        ...c,
        cellRenderer: (p: ICellRendererParams) => {
          const v = String(p.value ?? "");
          const cls = badgeMap[c.field ?? ""]?.[v];
          return cls ? <span className={cls}>{v}</span> : <span>{v}</span>;
        },
      } : c
    ),
  ];
  return (
    <div className={`${heightClass} w-full`}>
      <AgGridReact
        theme={gridTheme}
        rowData={rows}
        columnDefs={cols}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
          flex: 1,
          minWidth: 110,
          cellRenderer: (p: ICellRendererParams) =>
            typeof p.value === "boolean" ? (
              <input type="checkbox" checked={p.value} readOnly className="h-3.5 w-3.5 accent-orange-600" />
            ) : (
              fmtCell(p.value)
            ),
        }}
        rowHeight={34}
        headerHeight={42}
        getRowStyle={
          rowStyleRules?.length
            ? (p) => {
                let out: Record<string, string> | undefined;
                for (const rule of rowStyleRules) {
                  if (p.data?.[rule.field] === rule.when) out = { ...out, ...rule.style };
                }
                return out;
              }
            : undefined
        }
        pagination
        paginationPageSize={pageSize ?? 20}
        onRowClicked={(e) => {
          const id = (e.data as Record<string, unknown>)?.id;
          if (id != null) go(String(id));
        }}
      />
    </div>
  );
}
