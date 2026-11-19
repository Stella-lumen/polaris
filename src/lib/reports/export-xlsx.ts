// Excel export: Summary sheet, Data sheet (frozen header), Filters sheet.
import * as XLSX from "xlsx";
import type { ReportResult, FilterValues } from "./types";

export type XlsxMeta = {
  org: string;
  title: string;
  period: string;
  filters: FilterValues;
  filterLabels: Record<string, string>;
  preparedBy: string;
  dataAt: Date;
};

export function buildXlsx(result: ReportResult, meta: XlsxMeta): Buffer {
  const wb = XLSX.utils.book_new();

  // Summary sheet — title block + key numbers
  const summaryRows: (string | number)[][] = [
    [meta.org, "Internal Audit"],
    [meta.title],
    [`Period: ${meta.period}`],
    [`Prepared by: ${meta.preparedBy}`],
    [`Data as at: ${meta.dataAt.toLocaleString("en-ZA")}`],
    [],
    ...result.summary.map((s) => [s.label, String(s.value)]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 32 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Data sheet — frozen header, numbers stay numeric
  const aoa: (string | number)[][] = [result.columns.map((c) => c.label)];
  for (const r of result.rows) {
    aoa.push(
      result.columns.map((c) => {
        const v = r[c.key];
        if (v instanceof Date) return v.toLocaleDateString("en-ZA");
        if (typeof v === "number") return v;
        if (c.money && v) return String(v);
        return v == null ? "" : String(v);
      }),
    );
  }
  const wsData = XLSX.utils.aoa_to_sheet(aoa);
  wsData["!cols"] = result.columns.map((c) => ({ wch: Math.min(Math.max(c.label.length + 4, 14), 45) }));
  // freeze the header row
  (wsData as Record<string, unknown>)["!freeze"] = { xSplit: 0, ySplit: 1 };
  (wsData as Record<string, unknown>).views = [{ state: "frozen", ySplit: 1 }];
  wsData["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: result.columns.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, wsData, "Data");

  // Filters sheet
  const active = Object.entries(meta.filters).filter(([, v]) => v && v !== "all");
  const filterRows: string[][] = [
    ["Filter", "Value"],
    ...(active.length ? active.map(([k, v]) => [meta.filterLabels[k] ?? k, String(v)]) : [["(none)", "All records included"]]),
  ];
  const wsFilters = XLSX.utils.aoa_to_sheet(filterRows);
  wsFilters["!cols"] = [{ wch: 24 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsFilters, "Filters");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
