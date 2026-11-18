/**
 * Turns raw audit_log rows into plain sentences for the page.
 * Display-only — stored rows are never rewritten.
 */

const MODULE: [RegExp, string][] = [
  [/^tasks$/i, "Tasks"],
  [/^corrective actions$/i, "Follow-up"],
  [/^audit plans$|^annual audit plan periods$|^planned engagements$/i, "Annual audit plan"],
  [/^risk assessments$|^risk rating bands$/i, "Risk assessment"],
  [/^guiding documents$/i, "Guiding documents"],
  [/template/i, "Document templates"],
  [/^engagements$|^engagement/i, "Engagements"],
  [/^timesheets$|^time entries$|^expenses$|^leave$/i, "Resources"],
  [/^users$/i, "Users"],
  [/^organizations$/i, "Organizations"],
  [/^api keys$/i, "API keys"],
  [/^security$/i, "Security"],
  [/^escalation rules$|^email settings$|^sent emails$/i, "Email and notifications"],
  [/declaration/i, "Declarations"],
  [/strategic|engagement types/i, "Settings"],
  [/finding|review notes|working papers|engagement team|engagement documents|engagement audit program/i, "Engagements"],
];
export const moduleOf = (table: string | null) => {
  for (const [re, m] of MODULE) if (table && re.test(table)) return m;
  return table ?? "Other";
};

const OP_WORDS: [RegExp, string][] = [
  [/^INSERT$|^CREATE/i, "created"],
  [/^LOGIN_FAIL$|^AUTH_FAIL$/i, "failed to sign in"],
  [/^LOGIN$/i, "signed in"],
  [/^LOGOUT$/i, "signed out"],
  [/APPROVE|AUTHORISE|AUTHORIZE/i, "approved"],
  [/SUBMIT/i, "submitted"],
  [/DOWNLOAD/i, "downloaded"],
  [/^VIEW$/i, "viewed"],
  [/DENIED/i, "was denied access to"],
  [/NOTIFICATION/i, "sent a notification about"],
  [/ESCALATION/i, "sent an escalation about"],
  [/REMINDER/i, "sent a reminder about"],
  [/ACKNOWLEDGE/i, "confirmed they had read"],
  [/EXPORT/i, "exported"],
  [/UPLOAD|EVIDENCE/i, "uploaded a file to"],
  [/SIGN/i, "signed off"],
  [/RETRY/i, "retried"],
  [/DELETE|DISABLE/i, "disabled"],
];
const opWord = (op: string | null) => {
  for (const [re, w] of OP_WORDS) if (op && re.test(op)) return w;
  return op === "UPDATE" ? "updated" : "changed";
};

export type AuditRow = {
  id: string;
  timestamp: Date | null;
  operation_type: string | null;
  table_name: string | null;
  record_id: string | null;
  record_label: string | null;
  actor_label: string | null;
  user_id: string | null;
  new_values: unknown;
};

const embeddedMessage = (row: AuditRow): string | null => {
  const v = row.new_values as Record<string, unknown> | null;
  const m = v?.message;
  return typeof m === "string" ? m : null;
};

export function actorName(row: AuditRow, emailById: Map<string, string>): string {
  if (row.actor_label) return row.actor_label;
  if (row.user_id && emailById.get(row.user_id)) return emailById.get(row.user_id)!;
  return "System (automatic)";
}

export function sentence(row: AuditRow, emailById: Map<string, string>): string {
  const msg = embeddedMessage(row);
  const who = actorName(row, emailById);
  const what = row.record_label ?? "a record";
  const op = row.operation_type ?? "";
  if (msg && /notification|reminder|escalation/i.test(op)) return `${who} sent an automatic ${/reminder/i.test(op) ? "reminder" : "notification"} — ${msg.replace(/: notification sent to.*$/, "")}.`;
  if (msg && /^(LOGIN|LOGOUT|LOGIN_FAIL|AUTH_FAIL)$/i.test(op)) return `${who} ${opWord(op)}${/^LOGIN_FAIL|AUTH_FAIL$/i.test(op) ? ` — ${msg.replace(/^Failed sign-in attempt for /, "")}` : ""}.`;
  const detail = msg ? ` — ${msg}` : "";
  return `${who} ${opWord(op)} ${what}${/notification|reminder|escalation/i.test(op) ? "" : ` in ${moduleOf(row.table_name)}`}${detail}.`;
}

const RECORD_HREF: [RegExp, (id: string) => string][] = [
  [/^tasks$/i, (id) => "/tasks"],
  [/^corrective actions$/i, (id) => `/follow-up/${id}`],
  [/^audit plans$/i, (id) => `/annual-audit-plan/${id}`],
  [/^planned engagements$/i, (id) => "/annual-audit-plan"],
  [/^guiding documents$/i, (id) => `/guiding-documents/${id}`],
  [/^engagements$/i, (id) => `/engagements/${id}`],
  [/^risk assessments$/i, () => "/risk-assessment"],
  [/^users$/i, () => "/admin/users"],
  [/^api keys$/i, () => "/admin/api-keys"],
  [/^sent emails$/i, (id) => `/admin/sent-emails/${id}`],
  [/^escalation rules$/i, () => "/admin/escalation-rules"],
  [/^email settings$/i, () => "/admin/sent-emails/settings"],
];
export const recordHref = (table: string | null, recordId: string | null) => {
  if (!table || !recordId) return null;
  for (const [re, f] of RECORD_HREF) if (re.test(table)) return f(recordId);
  return null;
};

/** Friendly names for the field keys we actually write into new_values. */
const FIELD_LABEL: Record<string, string> = {
  status: "Status", mode: "Delivery mode", days: "Days", disabled: "Disabled",
  name: "Name", email: "Email", role: "Role", title: "Title", subject: "Subject",
  reason: "Reason", comments: "Comments", approved_by: "Approved by",
  authorised_by: "Authorised by", notify_owner: "Notify the person responsible",
  notify_supervisor: "Notify the supervisor", notify_cae: "Notify the chief audit executive",
  notify_hod: "Notify administrators", sender_name: "Sender name", sender_email: "Sender address",
  redirect_all_to: "Redirect address", restrict_to_approved: "Approved-addresses only",
  version: "Version", quarter: "Quarter", planned_hours: "Planned hours",
  budget: "Budget", due_date: "Due date", message: "", category: "Category",
  source: "Source", request_id: "", ad_group: "Directory group", added_planned_engagement: "Planned engagement added",
  from_risk: "From risk", by: "", description: "Description", required: "Required",
};
const label = (k: string) => FIELD_LABEL[k] ?? k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const val = (v: unknown): string => {
  if (v == null) return "blank";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return "recorded details";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return new Date(s).toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" });
  return s;
};

/** Readable "what changed" rows — no JSON, no codes. */
export function readableChanges(orig: unknown, next: unknown): { field: string; before: string; after: string }[] {
  const o = (orig ?? {}) as Record<string, unknown>;
  const n = (next ?? {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(o), ...Object.keys(n)])].filter((k) => !["message", "request_id", "by", "query", "ip_address", "session_id", "fingerprint"].includes(k));
  return keys.map((k) => ({ field: label(k), before: val(o[k]), after: val(n[k]) }));
}
