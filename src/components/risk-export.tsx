"use client";

import * as XLSX from "xlsx";
import { FileDown } from "lucide-react";

/** Exports the filtered register rows to Excel (client-side, no server round-trip). */
export function RiskExport({ rows, logExport }: { rows: Record<string, unknown>[]; logExport: (count: number) => Promise<unknown> }) {
  const go = async () => {
    const flat = rows.map((r) => ({
      risk_ref: r.risk_ref, auditable_entity: r.auditable_entity, risk: r.risk_description,
      category: r.risk_category, inherent: r.inherent_band, controls: r.control_effectiveness,
      residual: r.residual_band, coverage: r.coverage, status: r.status,
      owner: r.risk_owner_name, objective: r.objective_name, next_review: r.review_display,
      planned_engagement: r.planned_engagement_name, source: r.source,
    }));
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "risk-register");
    XLSX.writeFile(wb, `risk-register-${new Date().toISOString().slice(0, 10)}.xlsx`);
    await logExport(rows.length);
  };
  return (
    <button onClick={go} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent" title="Export register to Excel (also printable to PDF via the browser)">
      <FileDown className="h-4 w-4" /> Export
    </button>
  );
}
