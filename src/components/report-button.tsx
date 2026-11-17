"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";

export function ReportButton({
  rows,
  sheet,
  fileName,
}: {
  rows: Record<string, unknown>[];
  sheet: string;
  fileName: string;
}) {
  return (
    <button
      onClick={() => {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
        XLSX.writeFile(wb, fileName);
      }}
      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
    >
      <Download className="h-4 w-4" />
      Export .xlsx
    </button>
  );
}
