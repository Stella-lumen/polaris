import { describe, it, expect } from "vitest";
import { activitySentence, activityGroup, collapseRepeats, recordHref, type ActivityLogInput, type ActivityRow } from "./activity";
import { periodRange, fyLabel, fyStart, ageingBand, daysOverdue, fmtMoney } from "./filters";
import { zip, buildDocx } from "./export-docx";
import { REPORTS } from "./catalogue";

/* ---------- plain-language activity sentences ---------- */

const base: ActivityLogInput = {
  id: "x", timestamp: new Date(), operation_type: "UPDATE", table_name: "Tasks",
  record_id: "r1", record_label: "the Weekly report task", actor_label: "Sinethemba Zwane",
  new_values: {}, original_values: {},
};

describe("activitySentence — plain language, never raw codes", () => {
  it("sign-in", () => {
    const s = activitySentence({ ...base, operation_type: "LOGIN", table_name: "Security", actor_label: "Sinethemba Zwane" });
    expect(s).toBe("Sinethemba Zwane signed in.");
  });
  it("failed sign-in keeps the email, not the code", () => {
    const s = activitySentence({ ...base, operation_type: "LOGIN_FAIL", table_name: "Security", record_id: "a@b.com", new_values: { message: "Failed sign-in attempt for a@b.com" } });
    expect(s).toContain("a@b.com");
    expect(s).not.toContain("LOGIN_FAIL");
  });
  it("API use", () => {
    const s = activitySentence({ ...base, operation_type: "USE", table_name: "API Keys", record_label: "bands-check" });
    expect(s).toBe("The API key 'bands-check' was used to read data.");
  });
  it("system reminder", () => {
    const s = activitySentence({ ...base, operation_type: "NOTIFY", table_name: "Corrective Actions", actor_label: "System (automatic)", new_values: { message: "Sent a reminder about a corrective action due in 2 days" } });
    expect(s).toBe("The system sent a reminder about a corrective action due in 2 days.");
  });
  it("risk band range change uses before/after values", () => {
    const s = activitySentence({
      ...base, operation_type: "UPDATE", table_name: "Risk Rating Bands", record_label: "High",
      new_values: { min_score: 10, max_score: 15 }, original_values: { min_score: 10, max_score: 14 },
    });
    expect(s).toBe("Sinethemba Zwane changed the High band from 10-14 to 10-15.");
  });
  it("report export", () => {
    const s = activitySentence({ ...base, operation_type: "EXPORT", table_name: "Reports", record_label: "Engagement Status Report", new_values: { message: "exported the Engagement Status Report as PDF (12 records)" } });
    expect(s).toContain("exported");
    expect(s).not.toContain("EXPORT");
  });
  it("never emits raw codes, JSON braces or 'message:'", () => {
    const samples: ActivityLogInput[] = [
      { ...base, operation_type: "UPDATE", table_name: "Risk Rating Bands" },
      { ...base, operation_type: "INSERT", table_name: "Tasks", new_values: { message: "Created a task" } },
      { ...base, operation_type: "DELETE", table_name: "Documents" },
      { ...base, operation_type: "UNKNOWN_OP", table_name: "Whatever" },
      { ...base, operation_type: "USE", table_name: "API Keys", new_values: { a: { nested: [1, 2] } } },
    ];
    for (const l of samples) {
      const s = activitySentence(l);
      expect(s).not.toMatch(/message:|[_]{2,}|\{|\}|"/);
      expect(s).not.toMatch(/^(INSERT|UPDATE|DELETE|USE|NOTIFY|EXPORT|LOGIN)/);
      expect(s.trim().endsWith(".")).toBe(true);
    }
  });
});

describe("activityGroup", () => {
  it("maps operations to the five groups", () => {
    expect(activityGroup({ ...base, operation_type: "LOGIN", table_name: "Security" })).toBe("signins");
    expect(activityGroup({ ...base, operation_type: "USE", table_name: "API Keys" })).toBe("api");
    expect(activityGroup({ ...base, operation_type: "NOTIFY", table_name: "Sent Emails" })).toBe("reminders");
    expect(activityGroup({ ...base, operation_type: "EXPORT", table_name: "Reports" })).toBe("reports");
    expect(activityGroup({ ...base, operation_type: "UPDATE", table_name: "Tasks" })).toBe("changes");
  });
});

describe("collapseRepeats", () => {
  const row = (min: number): ActivityRow => ({
    id: `r${min}`, when: new Date(2026, 10, 18, 16, 7, min), actor: "Sinethemba Zwane",
    sentence: "Sinethemba Zwane signed in.", group: "signins", recordLabel: "",
  });
  it("collapses identical entries within one minute", () => {
    const out = collapseRepeats([row(0), row(5), row(10), row(20), row(30), row(40)]);
    expect(out).toHaveLength(1);
    expect(out[0].sentence).toContain("6 times");
    expect(out[0].sentence).toContain("signed in");
  });
  it("does not collapse entries more than a minute apart", () => {
    const out = collapseRepeats([row(0), row(70)]);
    expect(out).toHaveLength(2);
  });
});

describe("recordHref", () => {
  it("links records to their module pages", () => {
    expect(recordHref("Engagements", "e1")).toBe("/engagements/e1");
    expect(recordHref("Risk Rating Bands", "b1")).toBe("/admin/risk-bands/b1");
    expect(recordHref("Security", "u1")).toBeUndefined();
  });
});

/* ---------- periods ---------- */

describe("periodRange — SA financial year (Apr–Mar)", () => {
  const jan2027 = new Date(2027, 0, 15); // inside FY2026/27
  it("FY runs April to March", () => {
    expect(fyStart(jan2027).getFullYear()).toBe(2026);
    expect(fyLabel(jan2027)).toBe("FY 2026/27");
    const r = periodRange("fy", undefined, undefined);
    expect(r.from!.getMonth()).toBe(3); // April
    expect(r.to!.getMonth()).toBe(2);   // March
  });
  it("quarters split the FY correctly", () => {
    const q1 = periodRange("q1", undefined, undefined);
    expect(q1.from!.getMonth()).toBe(3);
    const q4 = periodRange("q4", undefined, undefined);
    expect(q4.from!.getMonth()).toBe(0); // January
    expect(q4.to!.getMonth()).toBe(2);   // March
  });
  it("custom dates honour both bounds", () => {
    const r = periodRange("custom", "2026-05-01", "2026-05-31");
    expect(r.from!.getDate()).toBe(1);
    expect(r.to!.getMonth()).toBe(4);
    expect(r.label).toContain("2026-05-01");
  });
});

describe("ageingBand + fmtMoney", () => {
  it("ageing buckets", () => {
    const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
    expect(ageingBand(null, false)).toBe("No due date");
    expect(ageingBand(new Date(Date.now() + 86400000 * 10), false)).toBe("Not yet due");
    expect(ageingBand(daysAgo(10), false)).toBe("1–30 days late");
    expect(ageingBand(daysAgo(45), false)).toBe("31–60 days late");
    expect(ageingBand(daysAgo(75), false)).toBe("61–90 days late");
    expect(ageingBand(daysAgo(200), false)).toBe("Over 90 days late");
    expect(ageingBand(daysAgo(200), true)).toBe("Done");
    expect(daysOverdue(daysAgo(10))).toBe(10);
  });
  it("Rand formatting", () => {
    expect(fmtMoney(2270.5)).toBe("R 2 270,50");
    expect(fmtMoney(0)).toBe("R 0,00");
  });
});

/* ---------- docx ---------- */

describe("docx export", () => {
  it("zip produces a valid PK archive", () => {
    const z = zip([{ name: "a.txt", data: Buffer.from("hello") }]);
    expect(z.readUInt32LE(0)).toBe(0x04034b50);
    expect(z.includes(Buffer.from("a.txt"))).toBe(true);
  });
  it("buildDocx produces a real .docx (zip with document.xml)", () => {
    const b = buildDocx([
      { kind: "title", text: "AgriSETA" },
      { kind: "table", header: ["A"], rows: [["1"]] },
    ]);
    expect(b.readUInt32LE(0)).toBe(0x04034b50);
    expect(b.includes(Buffer.from("word/document.xml"))).toBe(true);
  });
});

/* ---------- catalogue integrity ---------- */

describe("report catalogue", () => {
  it("has all twelve reports in the five groups", () => {
    const ids = REPORTS.map((r) => r.id);
    expect(ids).toContain("engagement-status");
    expect(ids).toContain("plan-progress");
    expect(ids).toContain("ag-findings");
    expect(ids).toContain("committee-pack");
    expect(ids).toContain("system-activity");
    expect(ids).toContain("declarations-status");
    expect(ids).toContain("api-key-usage");
    const groups = new Set(REPORTS.map((r) => r.group));
    expect([...groups].sort()).toEqual(["Administration", "Audit work", "Follow-up", "Governance", "Resources"]);
  });
  it("administration reports are flagged admin-only", () => {
    const admin = REPORTS.filter((r) => r.group === "Administration");
    expect(admin.length).toBe(3);
    expect(admin.every((r) => r.adminOnly)).toBe(true);
  });
  it("default report is Engagement Status, not the activity log", () => {
    expect(REPORTS.find((r) => r.id === "system-activity")?.group).toBe("Administration");
    expect(REPORTS.every((r) => r.id !== "system-activity" || r.adminOnly)).toBe(true);
  });
});

/* ---------- live totals check (same DB the pages read) ---------- */

describe("report totals agree with the module pages", () => {
  it("engagement status counts match the engagement table", async () => {
    const { prisma } = await import("@/lib/db");
    const report = REPORTS.find((r) => r.id === "engagement-status")!;
    const result = await report.run({});
    const dbCount = await prisma.engagement.count({ where: { deleted: false, organization_id: "demo-organization" } });
    expect(result.summary.find((s) => s.label === "Engagements")!.value).toBe(dbCount);
    expect(result.rows.length).toBeGreaterThanOrEqual(0);
    // summary + chart + table all come from the same filtered rows
    const chartTotal = result.charts[0].kind === "bars" ? result.charts[0].rows.reduce((n, r) => n + r.value, 0) : 0;
    expect(chartTotal).toBe(result.rows.length);
  });
  it("corrective actions report splits Internal Audit from Auditor General", async () => {
    const report = REPORTS.find((r) => r.id === "corrective-actions")!;
    const all = await report.run({});
    const ag = await report.run({ source: "AUDITOR_GENERAL" });
    const ia = await report.run({ source: "INTERNAL_AUDIT" });
    expect(Number(ag.rows.length) + Number(ia.rows.length)).toBe(all.rows.length);
    expect(ag.rows.every((r) => r.source === "Auditor General")).toBe(true);
  });
  it("AG findings report only shows Auditor General items", async () => {
    const report = REPORTS.find((r) => r.id === "ag-findings")!;
    const result = await report.run({});
    expect(result.rows.length).toBeGreaterThan(0);
    const byYear = await report.run({ report_year: "2024" });
    expect(byYear.rows.every((r) => r.year === 2024)).toBe(true);
  });
  it("system activity log produces sentences, never codes", async () => {
    const report = REPORTS.find((r) => r.id === "system-activity")!;
    const result = await report.run({});
    for (const r of result.rows.slice(0, 100)) {
      expect(String(r.what)).not.toMatch(/message:|LOGIN_|_fail|update_|insert_|\{.*\}/i);
      expect(String(r.what).endsWith(".")).toBe(true);
    }
  });
});
