// Turns raw audit rows into plain sentences and groups for the
// System activity log. Raw codes, JSON and "message:" prefixes never
// reach the screen — the stored data stays untouched.

export type ActivityGroup = "changes" | "signins" | "reminders" | "api" | "reports";

export type ActivityLogInput = {
  id: string;
  timestamp?: Date | null;
  operation_type?: string | null;
  table_name?: string | null;
  record_id?: string | null;
  record_label?: string | null;
  actor_label?: string | null;
  user_id?: string | null;
  new_values?: unknown;
  original_values?: unknown;
  query?: string | null;
};

export type ActivityRow = {
  id: string;
  when: Date | null;
  actor: string;
  sentence: string;
  group: ActivityGroup;
  recordLabel: string;
  recordHref?: string;
  /** count when identical entries within one minute are collapsed */
  repeatCount?: number;
};

const nv = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

const VERBS: Record<string, string> = {
  INSERT: "created",
  UPDATE: "changed",
  DELETE: "deleted",
  DEACTIVATE: "deactivated",
  REACTIVATE: "reactivated",
  CONFIRM: "confirmed",
  SIGN_OFF: "signed off",
  AUTHORISE: "authorised",
  APPROVE: "approved",
  REJECT: "rejected",
  EXPORT: "exported",
  IMPORT: "imported",
  UPLOAD: "uploaded",
  DOWNLOAD: "downloaded",
  SEND: "sent",
  USE: "used",
  NOTIFY: "sent a notification about",
  ESCALATE: "escalated",
  ASSIGN: "assigned",
  SUBMIT: "submitted",
  VERIFY: "verified",
  REOPEN: "reopened",
};

const TABLE_HREFS: [RegExp, string][] = [
  [/rating band/i, "/admin/risk-bands"],
  [/strategic objective/i, "/admin/strategic-objectives"],
  [/api key/i, "/admin/api-keys"],
  [/declaration/i, "/admin/declarations"],
  [/delegat/i, "/admin/delegated-preparers"],
  [/organisation|organization/i, "/admin/organizations"],
  [/period/i, "/admin/periods"],
  [/template/i, "/templates/reporting"],
  [/finding|recommendation|corrective action|follow/i, "/follow-up"],
  [/audit plan|planned engagement/i, "/annual-audit-plan"],
  [/engagement/i, "/engagements"],
  [/risk/i, "/risk-assessment"],
  [/task/i, "/tasks"],
];

export function recordHref(table: string | null | undefined, recordId: string | null | undefined): string | undefined {
  if (!table || !recordId) return undefined;
  const base = TABLE_HREFS.find(([re]) => re.test(table))?.[1];
  return base ? `${base}/${recordId}` : undefined;
}

export function activityGroup(log: ActivityLogInput): ActivityGroup {
  const op = (log.operation_type ?? "").toUpperCase();
  const table = (log.table_name ?? "").toLowerCase();
  if (/LOGIN|LOGOUT|AUTH_FAIL|PASSWORD/.test(op) || table === "security") return "signins";
  if (/USE|AUTH/.test(op) || table.includes("api")) return "api";
  if (/NOTIF|ESCALAT|REMIND|EMAIL|ALERT/.test(op) || table.includes("notification") || table.includes("sent email") || table.includes("escalation")) return "reminders";
  if (/EXPORT|REPORT|PRINT/.test(op) || table.includes("report")) return "reports";
  return "changes";
}

/** a plain sentence for one audit row — never a raw code */
const finish = (s: string) => (s.trim().endsWith(".") ? s.trim() : `${s.trim()}.`);

export function activitySentence(log: ActivityLogInput): string {
  const op = (log.operation_type ?? "").toUpperCase();
  const actor = log.actor_label ?? "Someone";
  const who = actor === "System (automatic)" ? "The system" : actor;
  const table = log.table_name ?? "";
  const record = log.record_label ?? "a record";
  const vals = nv(log.new_values);
  const orig = nv(log.original_values);
  const msg = typeof vals.message === "string" ? vals.message : "";

  if (op === "LOGIN") return `${who} signed in.`;
  if (op === "LOGOUT") return `${who} signed out.`;
  if (op === "LOGIN_FAIL") return `A sign-in failed for ${(log.record_id ?? "").includes("@") ? log.record_id : record}.`;
  if (op === "AUTH_FAIL") {
    if (table.toLowerCase().includes("api")) return `An API request was refused — ${msg || "the key was missing, expired or revoked"}.`;
    return `An unauthenticated request was refused.`;
  }
  if (op === "USE") return `The API key '${record}' was used${msg ? ` — ${msg.toLowerCase()}` : " to read data"}.`;
  if (op === "NOTIFY" || op === "ESCALATE" || op === "REMINDER")
    return msg ? finish(`The system ${msg.charAt(0).toLowerCase()}${msg.slice(1)}`) : `The system sent a reminder about ${record}.`;

  // risk band updates get a specific plain sentence
  if (/risk rating band/i.test(table) && op === "UPDATE") {
    const label = (vals.label ?? orig.label ?? record) as string;
    const from = orig.min_score != null ? `${orig.min_score}-${orig.max_score}` : null;
    const to = vals.min_score != null ? `${vals.min_score}-${vals.max_score}` : null;
    if (from && to && from !== to) return `${who} changed the ${label} band from ${from} to ${to}.`;
    if (vals.disabled === true) return `${who} deactivated the ${label} band.`;
    if (vals.disabled === false) return `${who} reactivated the ${label} band.`;
    if (vals.is_sample === false) return `${who} confirmed the ${label} band wording.`;
    if (vals.is_alert_floor === true) return `${who} set ${label} as the alert level for high-risk reporting.`;
    return `${who} changed the ${label} band.`;
  }

  if (op === "SEND") return msg ? finish(`${who} ${msg.charAt(0).toLowerCase()}${msg.slice(1)}`) : `${who} sent ${record}.`;

  const verb = VERBS[op] ?? "updated";
  if (msg) return finish(`${who} ${msg.charAt(0).toLowerCase()}${msg.slice(1)}`);
  const a = /^[aeiou]/i.test(record) ? "an" : "a";
  return `${who} ${verb} ${record === "a record" ? `${a} ${table.toLowerCase().replace(/s$/, "")} record` : `${record}`}.`;
}

/** collapse identical consecutive entries within 60 seconds into "… (6 times)" */
export function collapseRepeats(rows: ActivityRow[]): ActivityRow[] {
  const out: ActivityRow[] = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (
      last &&
      last.sentence === r.sentence &&
      last.actor === r.actor &&
      last.when && r.when &&
      Math.abs(last.when.getTime() - r.when.getTime()) <= 60_000
    ) {
      last.repeatCount = (last.repeatCount ?? 1) + 1;
      if (r.when > last.when) last.when = r.when;
    } else {
      out.push({ ...r });
    }
  }
  return out.map((r) =>
    r.repeatCount && r.repeatCount > 1
      ? { ...r, sentence: r.sentence.replace(/\.$/, ` ${r.repeatCount} times in the last minute.`) }
      : r,
  );
}
