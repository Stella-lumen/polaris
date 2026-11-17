"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { FileText, FileSpreadsheet, FileDown, Send, RefreshCw, ListFilter } from "lucide-react";

export type ReportColumn = { key: string; label: string };
export type ReportDef = {
  id: string;
  title: string;
  description: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  /** row key used by the "user" filter; omit = no user filter */
  userKey?: string;
};

const PAGE_SIZE = 20;

export function ReportsClient({ reports }: { reports: ReportDef[] }) {
  const [reportId, setReportId] = useState(reports[0]?.id ?? "");
  const [user, setUser] = useState("all");
  const [search, setSearch] = useState("");
  // applied filters (only change on Re-run, like the reference UI)
  const [applied, setApplied] = useState({ reportId, user: "all", search: "" });
  const [page, setPage] = useState(1);

  const report = reports.find((r) => r.id === applied.reportId) ?? reports[0];
  const pending = reports.find((r) => r.id === reportId);

  const users = useMemo(() => {
    if (!pending?.userKey) return [];
    return [...new Set(pending.rows.map((r) => String(r[pending.userKey!] ?? "")).filter(Boolean))].sort();
  }, [pending]);

  const filtered = useMemo(() => {
    const q = applied.search.trim().toLowerCase();
    return report.rows.filter((r) => {
      if (applied.user !== "all" && report.userKey && String(r[report.userKey]) !== applied.user) return false;
      if (q && !Object.values(r).some((v) => String(v).toLowerCase().includes(q))) return false;
      return true;
    });
  }, [report, applied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, totalPages);
  const pageRows = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  const rerun = () => {
    setApplied({ reportId, user, search });
    setPage(1);
  };

  const exportName = `${report.id}.xlsx`;

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map((r) => Object.fromEntries(report.columns.map((c) => [c.label, r[c.key]]))));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, report.title.slice(0, 31));
    XLSX.writeFile(wb, exportName);
  };

  const tableHtml = () => {
    const th = report.columns.map((c) => `<th style="border:1px solid #ccc;padding:6px;background:#ea580c;color:#fff;text-align:left">${c.label}</th>`).join("");
    const trs = filtered.map((r, i) =>
      `<tr><td style="border:1px solid #ccc;padding:6px">${i + 1}</td>` +
      report.columns.map((c) => `<td style="border:1px solid #ccc;padding:6px">${String(r[c.key] ?? "").replace(/</g, "&lt;")}</td>`).join("") +
      "</tr>",
    ).join("");
    return `<h2>${report.title}</h2><p>${filtered.length} records — generated ${new Date().toLocaleString()}</p><table style="border-collapse:collapse;font-family:Arial;font-size:11px"><thead><tr><th style="border:1px solid #ccc;padding:6px;background:#ea580c;color:#fff">#</th>${th}</tr></thead><tbody>${trs}</tbody></table>`;
  };

  const exportWord = () => {
    const blob = new Blob([`<html><body>${tableHtml()}</body></html>`], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${report.id}.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${report.title}</title></head><body>${tableHtml()}<script>window.print()<\/script></body></html>`);
    w.document.close();
  };

  const send = () => {
    const lines = filtered.slice(0, 25).map((r) => report.columns.map((c) => String(r[c.key] ?? "")).join("\t")).join("\n");
    location.href = `mailto:?subject=${encodeURIComponent(`Polaris report — ${report.title}`)}&body=${encodeURIComponent(`${report.title}\n${filtered.length} records\n\n${report.columns.map((c) => c.label).join("\t")}\n${lines}`)}`;
  };

  const sel = "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-5">
      {/* -------- REPORT & FILTERS -------- */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <ListFilter className="h-4 w-4" /> Report &amp; Filters
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full border px-3 py-1 text-neutral-500">Latest snapshot</span>
            <span className="rounded-full border px-3 py-1 text-neutral-500">{applied.user === "all" ? "All users" : applied.user}</span>
          </div>
        </div>
        <div className="grid items-end gap-4 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Report</span>
            <select className={sel} value={reportId} onChange={(e) => { setReportId(e.target.value); setUser("all"); setSearch(""); }}>
              {reports.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
            <span className="text-xs text-neutral-500">{pending?.description}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Snapshot</span>
            <select className={sel}><option>Latest snapshot</option></select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">User</span>
            <select className={sel} value={user} onChange={(e) => setUser(e.target.value)} disabled={!pending?.userKey}>
              <option value="all">All users</option>
              {users.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Search</span>
            <input className={sel} placeholder="Search report data…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={rerun} className="flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-500">
            <RefreshCw className="h-4 w-4" /> Re-run
          </button>
        </div>
      </div>

      {/* -------- RESULTS -------- */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">{report.title}</h2>
            <div className="text-xs text-neutral-500">
              {filtered.length.toLocaleString()} {filtered.length === 1 ? "record" : "records"} · page {cur} of {totalPages}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportPdf} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" title="Opens print dialog — save as PDF">
              <FileDown className="h-4 w-4 text-red-600" /> PDF
            </button>
            <button onClick={exportWord} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50">
              <FileText className="h-4 w-4 text-blue-600" /> Word
            </button>
            <button onClick={exportExcel} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50">
              <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel
            </button>
            <button onClick={send} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" title="Open in your mail app">
              <Send className="h-4 w-4 text-orange-600" /> Send
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-orange-600 text-left text-white">
                <th className="px-4 py-2.5 font-medium">#</th>
                {report.columns.map((c) => <th key={c.key} className="px-4 py-2.5 font-medium">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-orange-50/40">
                  <td className="px-4 py-2.5 text-neutral-500">{(cur - 1) * PAGE_SIZE + i + 1}</td>
                  {report.columns.map((c) => (
                    <td key={c.key} className="max-w-72 truncate px-4 py-2.5" title={String(r[c.key] ?? "")}>{r[c.key]}</td>
                  ))}
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={report.columns.length + 1} className="px-4 py-8 text-center text-neutral-400">No records match the filters.</td></tr>
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
    </div>
  );
}
