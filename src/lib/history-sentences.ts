/** Maps audit-log rows to plain-language timeline sentences. Pure — testable. */

export type HistoryRow = {
  operation_type: string | null;
  timestamp: Date | null;
  user_id?: string | null;
  query?: string | null;
  new_values: unknown;
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  IMPLEMENTED: "Implemented",
  VERIFIED: "Verified",
  NOT_EFFECTIVE: "Not effective",
};

export type TimelineEvent = { when: Date | null; who: string; sentence: string; category: string };

const esc = (v: unknown) => String(v ?? "");

export function toTimeline(rows: HistoryRow[], users: Map<string, string>): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  for (const r of rows) {
    const nv = (r.new_values ?? {}) as Record<string, unknown>;
    const system = r.query === "escalation-engine" || r.user_id == null;
    const who = system ? "System" : users.get(r.user_id ?? "") ?? "A user";
    const op = r.operation_type ?? "";
    let s = "";
    let cat = "Status changes";

    if (op === "INSERT") {
      s = `${who} created this action.`;
      cat = "Status changes";
    } else if (op === "ESCALATION" || op === "REMINDER") {
      const to = Array.isArray(nv.to) ? (nv.to as string[]).join(", ") : esc(nv.to);
      const subj = esc(nv.subject);
      const m = subj.match(/\[ESCALATION L(\d)\]/);
      const level = m ? Number(m[1]) : 0;
      const levelText =
        level >= 5 ? "to the Chief Audit Officer" :
        level >= 4 ? "to the Head of Department" :
        level >= 2 ? "to the supervisor" : "to the owner";
      s = op === "REMINDER"
        ? `Reminder sent to ${to || "the owner"}.`
        : `Escalated ${levelText}: ${subj.replace(/\[.*?\]\s*/, "").toLowerCase()}.`;
      cat = "Reminders and escalations";
    } else if (nv.status && typeof nv.status === "object") {
      const st = nv.status as { old?: unknown; new?: unknown };
      const label = STATUS_LABEL[esc(st.new)] ?? esc(st.new);
      s = st.old
        ? `${who} changed the status from ${STATUS_LABEL[esc(st.old)] ?? esc(st.old)} to ${label}.`
        : `${who} marked the action as ${label}.`;
      cat = "Status changes";
    } else if (nv.verification) {
      const v = nv.verification as { outcome?: unknown; comments?: unknown };
      s = v.outcome === "EFFECTIVE"
        ? `${who} verified the action — outcome: effective.${v.comments ? ` Comments: ${esc(v.comments)}` : ""}`
        : `${who} verified the action — outcome: not effective; the action was reopened.${v.comments ? ` Reason: ${esc(v.comments)}` : ""}`;
      cat = "Status changes";
    } else if (nv.due_date) {
      const d = nv.due_date as { old?: unknown; new?: unknown };
      const fmt = (x: unknown) => x ? new Date(esc(x)).toISOString().slice(0, 10) : "—";
      s = `${who} changed the due date from ${fmt(d.old)} to ${fmt(d.new)}.${nv.reason ? ` Reason: ${esc(nv.reason)}.` : ""}`;
      cat = "Due dates";
    } else if (nv.owner_user_id) {
      const o = nv.owner_user_id as { old?: unknown; new?: unknown };
      s = `${who} reassigned the action to ${users.get(esc(o.new)) ?? "another user"}.`;
      cat = "Status changes";
    } else if (op === "IMPORT" || op === "EXPORT") {
      s = `${who} ${op === "IMPORT" ? "imported" : "exported"} the register (${esc(nv.rows ?? nv.created ?? "")} rows).`;
      cat = "Evidence";
    } else {
      // Fallback: summarise without exposing raw JSON — pick readable keys only
      const keys = Object.keys(nv).filter((k) => !k.endsWith("_id") && !k.endsWith("_at"));
      s = `${who} updated ${keys.length ? keys.join(", ").replaceAll("_", " ") : "the record"}.`;
    }
    out.push({ when: r.timestamp, who: system ? "System" : who, sentence: s, category: cat });
  }
  return out.sort((a, b) => (b.when?.getTime() ?? 0) - (a.when?.getTime() ?? 0));
}
