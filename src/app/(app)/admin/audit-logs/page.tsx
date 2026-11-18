import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { VerifyAuditButton } from "@/components/verify-audit-button";
import { sentence, moduleOf, recordHref, readableChanges, actorName, type AuditRow } from "@/lib/audit-display";
import Link from "next/link";

export const instant = false;

const fmt = (d: Date | null) => (d ? d.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "Not recorded");
const input = "rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

const ACTION_TYPES: [string, string[], string][] = [
  ["", [], "All actions"],
  ["created", ["INSERT"], "Created"],
  ["updated", ["UPDATE"], "Updated"],
  ["approved", ["APPROVE", "AUTHORISE", "SIGN", "SUBMIT", "ACKNOWLEDGE"], "Approvals, submissions and sign-offs"],
  ["files", ["DOWNLOAD", "VIEW", "UPLOAD", "EVIDENCE", "DENIED"], "File views and downloads"],
  ["notifications", ["NOTIFICATION", "REMINDER", "ESCALATION"], "Notifications and escalations"],
  ["security", ["LOGIN", "LOGOUT", "LOGIN_FAIL", "AUTH_FAIL"], "Sign-ins and security"],
  ["exports", ["EXPORT"], "Exports"],
];
const AUTO_OPS = ["NOTIFICATION", "REMINDER", "ESCALATION"];

const VIEWS: [string, string][] = [
  ["", "Everything"],
  ["approvals", "Approvals and reviews"],
  ["security", "Logins and security"],
  ["documents", "Document activity"],
  ["settings", "Changes to settings"],
];

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; view?: string; person?: string; type?: string; module?: string; from?: string; to?: string; auto?: string }>;
}) {
  const sp = await searchParams;
  const [rows, users] = await Promise.all([
    prisma.auditLog.findMany({ where: { organization_id: DEMO_ORGANIZATION_ID }, orderBy: { timestamp: "desc" }, take: 1000 }),
    prisma.user.findMany({ select: { id: true, email: true, first_name: true, last_name: true } }),
  ]);
  const nameById = new Map(users.map((u) => [u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email || "Unknown"]));
  const emailById = new Map(users.map((u) => [u.id, u.email ?? ""]));

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart.getTime() - 6 * 86400_000);
  const approvals = (r: AuditRow) => /APPROVE|AUTHORISE|SUBMIT|SIGN|ACKNOWLEDGE/i.test(r.operation_type ?? "");
  const strip = {
    today: rows.filter((r) => r.timestamp && r.timestamp >= dayStart).length,
    week: rows.filter((r) => r.timestamp && r.timestamp >= weekStart).length,
    approvalsWeek: rows.filter((r) => r.timestamp && r.timestamp >= weekStart && approvals(r)).length,
    failedLogins: rows.filter((r) => r.timestamp && r.timestamp >= weekStart && /LOGIN_FAIL|AUTH_FAIL/i.test(r.operation_type ?? "")).length,
  };

  const hideAuto = sp.auto !== "off" && !sp.view;
  const typeOps = ACTION_TYPES.find(([k]) => k === sp.type)?.[1];
  const filtered = rows.filter((r) => {
    const row = r as AuditRow;
    if (hideAuto && AUTO_OPS.includes(r.operation_type ?? "")) return false;
    if (sp.view === "approvals" && !approvals(row)) return false;
    if (sp.view === "security" && moduleOf(r.table_name) !== "Security" && !/LOGIN|AUTH_FAIL/i.test(r.operation_type ?? "")) return false;
    if (sp.view === "documents" && !["Guiding documents", "Document templates"].includes(moduleOf(r.table_name)) && !/DOWNLOAD|VIEW|UPLOAD|EVIDENCE|DENIED|ACKNOWLEDGE/i.test(r.operation_type ?? "")) return false;
    if (sp.view === "settings" && !["Settings", "Email and notifications", "API keys", "Organizations", "Users"].includes(moduleOf(r.table_name))) return false;
    if (sp.person === "system" ? r.user_id != null : sp.person ? r.user_id !== sp.person : false) return false;
    if (typeOps && !typeOps.some((t) => (r.operation_type ?? "").includes(t))) return false;
    if (sp.module && moduleOf(r.table_name) !== sp.module) return false;
    if (sp.from && r.timestamp && r.timestamp < new Date(sp.from)) return false;
    if (sp.to && r.timestamp && r.timestamp > new Date(new Date(sp.to).getTime() + 86400_000)) return false;
    return true;
  });
  const modules = [...new Set(rows.map((r) => moduleOf(r.table_name)))].sort();

  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "id") as [string, string][]);
  const expanded = sp.id ? filtered.find((r) => String(r.id) === sp.id) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Audit logs</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            A read-only record of who did what, when. Audit logs cannot be edited or deleted — by anyone,
            including administrators — and are kept for at least the 3-year contract period and included in backups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VerifyAuditButton />
          <Link href={`/admin/audit-logs/export?format=xlsx&${qs}`} className="rounded-md border border-orange-300 bg-white px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100">Export to Excel</Link>
          <Link href={`/admin/audit-logs/export?format=pdf&${qs}`} className="rounded-md border border-orange-300 bg-white px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100">Export to PDF</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Entries today", strip.today], ["Entries this week", strip.week], ["Approvals this week", strip.approvalsWeek], ["Failed sign-ins this week", strip.failedLogins]].map(([l, v]) => (
          <div key={l} className="rounded-lg border bg-card px-4 py-3">
            <div className="text-2xl font-semibold text-orange-700">{v}</div>
            <div className="text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {VIEWS.map(([k, l]) => (
          <Link key={k} href={`/admin/audit-logs${k ? `?view=${k}` : ""}`}
            className={`rounded-full border px-3 py-1 ${(sp.view ?? "") === k ? "border-orange-600 bg-orange-600 text-white" : "border-border bg-card hover:bg-orange-50"}`}>
            {l}
          </Link>
        ))}
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3 text-sm">
        {sp.view ? <input type="hidden" name="view" value={sp.view} /> : null}
        <label className="flex flex-col gap-1 font-medium">Person
          <select name="person" defaultValue={sp.person ?? ""} className={input}>
            <option value="">Everyone</option>
            <option value="system">System (automatic)</option>
            {users.map((u) => <option key={u.id} value={u.id}>{nameById.get(u.id)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-medium">Action
          <select name="type" defaultValue={sp.type ?? ""} className={input}>
            {ACTION_TYPES.map(([k, , l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-medium">Module
          <select name="module" defaultValue={sp.module ?? ""} className={input}>
            <option value="">All modules</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 font-medium">From <input type="date" name="from" defaultValue={sp.from ?? ""} className={input} /></label>
        <label className="flex flex-col gap-1 font-medium">To <input type="date" name="to" defaultValue={sp.to ?? ""} className={input} /></label>
        <label className="flex items-center gap-2 pb-2 font-medium">
          <input type="checkbox" name="auto" value="off" defaultChecked={sp.auto === "off"} className="h-4 w-4 accent-orange-600" />
          Show automatic notifications
        </label>
        <button className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Filter</button>
      </form>

      <DataGrid
        hrefPattern={`/admin/audit-logs?${qs ? qs + "&" : ""}id={id}`}
        pageSize={50}
        rows={filtered.map((r) => {
          const row = r as AuditRow;
          const href = recordHref(r.table_name, r.record_id);
          return {
            id: r.id,
            date: fmt(r.timestamp),
            person: actorName(row, emailById),
            sentence: sentence(row, emailById),
            module: moduleOf(r.table_name),
            record: r.record_label ?? (r.record_id ? "A record" : "—"),
            record_href: href,
          };
        }) as unknown as object[]}
        colDefs={[
          { field: "date", headerName: "Date", width: 185 },
          { field: "person", headerName: "Person", width: 190, tooltipField: "person" },
          { field: "sentence", headerName: "What happened", flex: 2.4, tooltipField: "sentence" },
          { field: "module", headerName: "Module", width: 165 },
          { field: "record", headerName: "Record", flex: 1.3, tooltipField: "record" },
        ]}
      />

      {expanded && (
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <div className="text-sm font-semibold text-orange-700">{sentence(expanded as AuditRow, emailById)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {fmt(expanded.timestamp)} · {moduleOf(expanded.table_name)}
              {expanded.ip_address ? ` · from ${expanded.ip_address}` : ""}
              {recordHref(expanded.table_name, expanded.record_id) && (
                <> · <Link href={recordHref(expanded.table_name, expanded.record_id)!} className="text-orange-600 hover:underline">Open the record</Link></>
              )}
            </div>
          </div>
          {(() => {
            const changes = readableChanges(expanded.original_values, expanded.new_values);
            return changes.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-2 font-medium">What changed</th>
                    <th className="px-4 py-2 font-medium">Before</th>
                    <th className="px-4 py-2 font-medium">After</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((c) => (
                    <tr key={c.field} className="border-b last:border-0">
                      <td className="px-4 py-1.5 font-medium">{c.field}</td>
                      <td className="px-4 py-1.5 text-muted-foreground">{c.before}</td>
                      <td className="px-4 py-1.5">{c.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground">No field-level changes recorded for this entry.</div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
