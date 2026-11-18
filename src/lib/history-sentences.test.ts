import { expect, test } from "vitest";
import { toTimeline } from "./history-sentences";

const users = new Map([["u1", "Sinethemba Zwane"]]);
const d = new Date("2026-11-05T09:00:00Z");

test("status change sentence", () => {
  const [e] = toTimeline([{ operation_type: "UPDATE", timestamp: d, user_id: "u1", new_values: { status: { old: "IN_PROGRESS", new: "IMPLEMENTED" } } }], users);
  expect(e.sentence).toBe("Sinethemba Zwane changed the status from In progress to Implemented.");
  expect(e.category).toBe("Status changes");
});

test("due date change sentence", () => {
  const [e] = toTimeline([{ operation_type: "UPDATE", timestamp: d, user_id: "u1", new_values: { due_date: { old: "2026-10-23", new: "2026-11-07" }, reason: "waiting for system access" } }], users);
  expect(e.sentence).toContain("changed the due date from 2026-10-23 to 2026-11-07");
  expect(e.sentence).toContain("Reason: waiting for system access");
  expect(e.category).toBe("Due dates");
});

test("escalation sentence is plain language", () => {
  const [e] = toTimeline([{ operation_type: "ESCALATION", timestamp: d, new_values: { subject: "[ESCALATION L5] Not verified 30 days: Fix access", to: ["cae@test"] } }], users);
  expect(e.sentence).toContain("Escalated to the Chief Audit Officer");
  expect(e.sentence).not.toMatch(/L5|ESCALATION|\{/);
  expect(e.who).toBe("System");
});

test("no raw JSON or codes leak into any sentence", () => {
  const rows = [
    { operation_type: "INSERT", timestamp: d, user_id: "u1", new_values: { id: "ca-1" } },
    { operation_type: "UPDATE", timestamp: d, user_id: "u1", new_values: { verification: { outcome: "NOT_EFFECTIVE", comments: "still broken" } } },
  ];
  for (const e of toTimeline(rows, users)) {
    expect(e.sentence).not.toMatch(/[{}]|_id|L\d\b/);
  }
});
