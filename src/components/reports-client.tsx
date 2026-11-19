"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FileText, FileSpreadsheet, FileDown, Send, RefreshCw, ListFilter,
  X, CalendarClock, Bookmark, CheckCircle2,
} from "lucide-react";
import type { ReportResult, FilterValues, ChartSpec } from "@/lib/reports/types";
import { SendReportDialog, ScheduleReportDialog, SaveReportDialog } from "./report-dialogs";

export type FilterOptionSet = Record<string, { value: string; label: string }[]>;

export type ReportMeta = {
  id: string; title: string; group: string; description: string; filters: string[];
};

const FILTER_LABELS: Record<string, string> = {
  period: "Period", from: "From", to: "To", engagement: "Engagement",
  status: "Status", engagement_type: "Engagement type", lead_auditor: "Lead auditor",
  risk_rating: "Risk rating", category: "Category", source: "Source",
  auditor: "Auditor", assignee: "Assignee", user: "User",
  activity_type: "Activity type", owner: "Owner", overdue: "Due",
  report_year: "Report year", search: "Search", signins: "Sign-ins",
};

const PAGE_SIZE = 25;

export function ReportsClient({
  reports, reportId, filters, options, result, orgName, isAdmin,
}: {
  reports: ReportMeta[];
  reportId: string;
  filters: FilterValues;
  options: FilterOptionSet;
  result: ReportResult;
  orgName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<"send" | "schedule" | "save" | null>(null);

  const report = reports.find((r) => r.id === reportId) ?? reports[0];

  const navigate = (patch: FilterValues) => {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams({ report: reportId });
    for (const [k, v] of Object.entries(next)) {
      if (v && v !== "all") params.set(k, v);
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    setPage(1);
  };

  const groups = useMemo(() => {
    const m = new Map<string, ReportMeta[]>();
    for (const r of reports) {
      m.set(r.group, [...(m.get(r.group) ?? []), r]);
    }
    return [...m.entries()];
  }, [reports]);

  const chips = Object.entries(filters).filter(([k, v]) => v && v !== "all" && k !== "search");
  const chipLabel = (k: string, v: string) => {
    const opts = options[k] ?? [];
    const label = opts.find((o) => o.value === v)?.label ?? v.replaceAll("_", " ");
    return `${FILTER_LABELS[k] ?? k}: ${label}`;
  };

  const totalPages = Math.max(1, Math.ceil(result.rows.length / PAGE_SIZE));
  const cur = Math.min(page, totalPages);
  const pageRows = result.rows.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const exportParams = () => {
    const p = new URLSearchParams({ report: reportId });
    for (const [k, v] of Object.entries(filters)) if (v && v !== "all") p.set(k, v);
    return p.toString();
  };

  const sel = "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900";

  const filterControl = (key: string) => {
    const opts = options[key] ?? [];
    if (key === "search")
      return (
        <input
          key="search" className={sel} placeholder="Search report data…"
          defaultValue={filters.search ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            clearTimeout((window as unknown as { _rt?: number })._rt);
            (window as unknown as { _rt?: number })._rt = window.setTimeout(() => navigate({ search: v }), 400);
          }}
        />
      );
    if (key === "overdue" || key === "signins")
      return (
        <label className="flex h-9 items-center gap-2 text-sm">
          <input
            type="checkbox" className="h-4 w-4 accent-orange-600"
            checked={filters[key] === "yes"}
            onChange={(e) => navigate({ [key]: e.target.checked ? "yes" : "" })}
          />
          {key === "signins" ? "Show sign-ins" : (opts[0]?.label ?? "Overdue only")}
        </label>
      );
    return (
      <select
        key={key} className={sel} value={filters[key] ?? "all"}
        onChange={(e) => navigate({ [key]: e.target.value })}
        aria-label={FILTER_LABELS[key] ?? key}
      >
        <option value="all">All</option>
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  };

  const showFilters = report.filters.filter((k) => k !== "search");
  const needsCustomDates = filters.period === "custom";

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {/* -------- report + filters -------- */}
      <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-neutral-900">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <ListFilter className="h-4 w-4" /> Report &amp; filters
        </div>
        <div className="grid items-end gap-4 md:grid-cols-[1.5fr_1fr] lg:grid-cols-[1.5fr_repeat(3,1fr)_auto]">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Report</span>
            <select
              className={sel} value={reportId}
              onChange={(e) => router.replace(`${pathname}?report=${e.target.value}`)}
              aria-label="Report"
            >
              {groups.map(([g, rs]) => (
                <optgroup key={g} label={g}>
                  {rs.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </optgroup>
              ))}
            </select>
            <span className="text-xs text-neutral-500">{report.description}</span>
          </div>
          {showFilters.slice(0, 2).map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{FILTER_LABELS[k] ?? k}</span>
              {filterControl(k)}
            </div>
          ))}
          <button
            onClick={() => router.refresh()}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-500"
          >
            <RefreshCw className="h-4 w-4" /> Re-run
          </button>
        </div>
        {showFilters.length > 2 && (
          <div className="mt-4 grid items-end gap-4 md:grid-cols-4 lg:grid-cols-6">
            {showFilters.slice(2).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{FILTER_LABELS[k] ?? k}</span>
                {filterControl(k)}
              </div>
            ))}
            {report.filters.includes("search") && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Search</span>
                {filterControl("search")}
              </div>
            )}
          </div>
        )}
        {showFilters.length <= 2 && report.filters.includes("search") && (
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Search</span>
              {filterControl("search")}
            </div>
          </div>
        )}
        {needsCustomDates && (
          <div className="mt-4 flex gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">From</span>
              <input type="date" className={sel} value={filters.from ?? ""} onChange={(e) => navigate({ from: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">To</span>
              <input type="date" className={sel} value={filters.to ?? ""} onChange={(e) => navigate({ to: e.target.value })} />
            </label>
          </div>
        )}
        {/* -------- filter chips -------- */}
        {(chips.length > 0 || filters.search) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map(([k, v]) => (
              <button
                key={k} onClick={() => navigate({ [k]: "" })}
                className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-800 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200"
                title="Remove this filter"
              >
                {chipLabel(k, v)} <X className="h-3 w-3" />
              </button>
            ))}
            {filters.search && (
              <button
                onClick={() => navigate({ search: "" })}
                className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-800 hover:bg-orange-100"
              >
                Search: “{filters.search}” <X className="h-3 w-3" />
              </button>
            )}
            <button onClick={() => router.replace(`${pathname}?report=${reportId}`)} className="text-xs text-neutral-500 underline">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* -------- summary strip -------- */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {result.summary.map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900">
            <div className="text-2xl font-semibold text-primary">{s.value}</div>
            <div className="text-xs text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* -------- charts -------- */}
      {result.charts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {result.charts.map((c, i) => <Chart key={i} chart={c} onPick={(f) => navigate(f)} />)}
        </div>
      )}

      {/* -------- results -------- */}
      <div className="rounded-xl border bg-white shadow-sm dark:bg-neutral-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">{report.title}</h2>
            <div className="text-xs text-neutral-500">
              {result.rows.length.toLocaleString()} {result.rows.length === 1 ? "record" : "records"} · page {cur} of {totalPages}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> {result.totalsCheck}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/reports/export?format=pdf&${exportParams()}`} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <FileDown className="h-4 w-4 text-red-600" /> PDF
            </a>
            <a href={`/reports/export?format=word&${exportParams()}`} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <FileText className="h-4 w-4 text-blue-600" /> Word
            </a>
            <a href={`/reports/export?format=excel&${exportParams()}`} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel
            </a>
            <button onClick={() => setDialog("send")} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <Send className="h-4 w-4 text-orange-600" /> Send
            </button>
            <button onClick={() => setDialog("schedule")} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Send this report automatically">
              <CalendarClock className="h-4 w-4 text-orange-600" /> Schedule
            </button>
            <button onClick={() => setDialog("save")} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800" title="Save this report with its filters">
              <Bookmark className="h-4 w-4 text-orange-600" /> Save
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-orange-600 text-left text-white">
                <th className="px-4 py-2.5 font-medium">#</th>
                {result.columns.map((c) => <th key={c.key} className="px-4 py-2.5 font-medium">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr
                  key={i}
                  className={`border-t hover:bg-orange-50/40 dark:hover:bg-orange-950/30 ${r.href ? "cursor-pointer" : ""}`}
                  onClick={() => r.href && router.push(String(r.href))}
                  title={r.href ? "Open the underlying record" : undefined}
                >
                  <td className="px-4 py-2.5 text-neutral-500">{(cur - 1) * PAGE_SIZE + i + 1}</td>
                  {result.columns.map((c) => (
                    <td key={c.key} className="max-w-72 px-4 py-2.5" title={String(r[c.key] ?? "")}>
                      <span className="line-clamp-3 whitespace-pre-wrap break-words">{String(r[c.key] ?? "")}</span>
                    </td>
                  ))}
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={result.columns.length + 1} className="px-4 py-8 text-center text-neutral-400">
                    No {report.title.toLowerCase().replace(" report", "")} records match these filters.{" "}
                    <button onClick={() => router.replace(`${pathname}?report=${reportId}`)} className="underline">Clear filters</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
            <button disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Previous</button>
            <span className="text-neutral-500">Page {cur} of {totalPages}</span>
            <button disabled={cur >= totalPages} onClick={() => setPage(cur + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {dialog === "send" && <SendReportDialog reportId={reportId} reportTitle={report.title} filters={filters} onClose={() => setDialog(null)} />}
      {dialog === "schedule" && <ScheduleReportDialog reportId={reportId} reportTitle={report.title} filters={filters} onClose={() => setDialog(null)} />}
      {dialog === "save" && <SaveReportDialog reportId={reportId} reportTitle={report.title} filters={filters} onClose={() => setDialog(null)} />}
    </div>
  );
}

/* ---------------- charts ---------------- */

function Chart({ chart, onPick }: { chart: ChartSpec; onPick: (f: FilterValues) => void }) {
  if (chart.kind === "heat") return <HeatChart chart={chart} />;
  const max = Math.max(1, ...chart.rows.map((r) => r.value));
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="mb-3 text-sm font-medium">{chart.title}</div>
      <div className="flex flex-col gap-1.5" role="img" aria-label={`${chart.title}: ${chart.rows.map((r) => `${r.label} ${r.value}`).join(", ")}`}>
        {chart.rows.map((r) => (
          <button
            key={r.label}
            onClick={() => r.setFilter && onPick(r.setFilter)}
            disabled={!r.setFilter}
            className="group flex items-center gap-2 text-left disabled:cursor-default"
            title={r.setFilter ? `Show only ${r.label}` : r.label}
          >
            <span className="w-40 shrink-0 truncate text-xs text-neutral-600 dark:text-neutral-300">{r.label}</span>
            <span className="relative h-4 flex-1 rounded bg-neutral-100 dark:bg-neutral-800">
              <span
                className="absolute inset-y-0 left-0 rounded transition-all group-hover:opacity-80"
                style={{ width: `${(r.value / max) * 100}%`, backgroundColor: r.color ?? "#f97316" }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">{r.value}</span>
          </button>
        ))}
        {chart.rows.length === 0 && <div className="text-xs text-neutral-400">Nothing to show.</div>}
      </div>
      <details className="mt-3 text-xs text-neutral-500">
        <summary className="cursor-pointer">Show as a table</summary>
        <table className="mt-2 w-full border text-left">
          <thead><tr className="bg-neutral-50 dark:bg-neutral-800"><th className="px-2 py-1">Label</th><th className="px-2 py-1">Count</th></tr></thead>
          <tbody>
            {chart.rows.map((r) => <tr key={r.label} className="border-t"><td className="px-2 py-1">{r.label}</td><td className="px-2 py-1">{r.value}</td></tr>)}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function HeatChart({ chart }: { chart: Extract<ChartSpec, { kind: "heat" }> }) {
  const grid = new Map<string, number>();
  chart.cells.forEach((c) => grid.set(`${c.likelihood}:${c.impact}`, (grid.get(`${c.likelihood}:${c.impact}`) ?? 0) + c.count));
  const cellColor = (l: number, i: number) => {
    const s = l * i;
    if (s >= 15) return "bg-red-500 text-white";
    if (s >= 10) return "bg-orange-500 text-white";
    if (s >= 5) return "bg-amber-400 text-white";
    return "bg-emerald-500 text-white";
  };
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="mb-3 text-sm font-medium">{chart.title} <span className="text-xs font-normal text-neutral-500">(likelihood × impact)</span></div>
      <div className="flex gap-2 text-[10px]">
        <div className="flex w-14 flex-col justify-between py-1 text-right text-neutral-500">
          {[5, 4, 3, 2, 1].map((l) => <span key={l} className="flex h-8 items-center justify-end">Likely {l}</span>)}
        </div>
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((l) => (
            <div key={l} className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => {
                const n = grid.get(`${l}:${i}`) ?? 0;
                return (
                  <div
                    key={i}
                    className={`flex h-8 flex-1 items-center justify-center rounded text-xs font-medium ${cellColor(l, i)} ${n === 0 ? "opacity-40" : ""}`}
                    title={`Likelihood ${l}, impact ${i}: ${n} risk${n === 1 ? "" : "s"}`}
                  >
                    {n > 0 ? n : ""}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="mt-1 flex gap-1 text-center text-neutral-500">
            {[1, 2, 3, 4, 5].map((i) => <span key={i} className="flex-1">Impact {i}</span>)}
          </div>
        </div>
      </div>
      <details className="mt-3 text-xs text-neutral-500">
        <summary className="cursor-pointer">Show as a table</summary>
        <table className="mt-2 w-full border text-left">
          <thead><tr className="bg-neutral-50 dark:bg-neutral-800"><th className="px-2 py-1">Likelihood</th>{[1,2,3,4,5].map((i) => <th key={i} className="px-2 py-1">Impact {i}</th>)}</tr></thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((l) => (
              <tr key={l} className="border-t"><td className="px-2 py-1">{l}</td>{[1,2,3,4,5].map((i) => <td key={i} className="px-2 py-1">{grid.get(`${l}:${i}`) ?? 0}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
