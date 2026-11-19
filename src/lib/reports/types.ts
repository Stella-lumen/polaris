// Shared types for the report catalogue. One definition per report is
// consumed by the page, exports, API and tests so totals can't diverge.

export type FilterKey =
  | "period" | "from" | "to" | "engagement" | "status" | "engagement_type" | "lead_auditor"
  | "risk_rating" | "category" | "source" | "auditor" | "assignee" | "user"
  | "activity_type" | "owner" | "overdue" | "report_year" | "search" | "signins";

export type FilterValues = Record<string, string>;

export type FilterDef = {
  key: FilterKey;
  label: string;
  /** option list resolved at runtime (users, engagements, etc.) */
  options?: { value: string; label: string }[];
};

export type ReportColumn = { key: string; label: string; numeric?: boolean; money?: boolean };

export type ReportRow = {
  href?: string;
  [k: string]: string | number | Date | null | undefined;
};

export type SummaryStat = { label: string; value: string | number };

export type ChartRow = {
  label: string;
  value: number;
  color?: string;
  /** clicking this bar applies these filter values */
  setFilter?: FilterValues;
};

export type ChartSpec =
  | { kind: "bars"; title: string; rows: ChartRow[] }
  | { kind: "heat"; title: string; cells: { likelihood: number; impact: number; count: number }[] };

export type ReportResult = {
  columns: ReportColumn[];
  rows: ReportRow[];
  summary: SummaryStat[];
  charts: ChartSpec[];
  /** self-check: "Totals agree with <module page>" */
  totalsCheck: string;
};

export type ReportDef = {
  id: string;
  title: string;
  group: string;
  adminOnly?: boolean;
  description: string;
  filters: FilterKey[];
  run: (f: FilterValues) => Promise<ReportResult>;
};

export const GROUPS = ["Audit work", "Follow-up", "Resources", "Governance", "Administration"] as const;
