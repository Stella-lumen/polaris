"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Upload, X, Download } from "lucide-react";

type Row = Record<string, unknown>;

const TEMPLATE = [
  ["risk_ref", "auditable_entity", "risk_description", "risk_category", "inherent_likelihood", "inherent_impact", "existing_controls", "control_effectiveness", "residual_likelihood", "residual_impact"],
  ["RSK-001", "Grants administration", "Inaccurate grant disbursements", "Financial", 4, 5, "Payment review by manager", "Partially effective", 3, 4],
];

export function RiskImport({ action }: { action: (rows: Row[]) => Promise<{ created: number; updated: number; skipped: number }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (file: File) => {
    setResult(null);
    const wb = XLSX.read(await file.arrayBuffer());
    const raw = XLSX.utils.sheet_to_json<Row>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const errs: string[] = [];
    raw.forEach((r, i) => {
      if (!String(r.auditable_entity ?? "").trim()) errs.push(`Row ${i + 2}: missing auditable_entity`);
      if (!String(r.risk_description ?? "").trim()) errs.push(`Row ${i + 2}: missing risk_description`);
      for (const f of ["inherent_likelihood", "inherent_impact", "residual_likelihood", "residual_impact"]) {
        const v = r[f];
        if (v !== "" && v != null && !(Number(v) >= 1 && Number(v) <= 5)) errs.push(`Row ${i + 2}: ${f} must be 1-5`);
      }
    });
    setRows(raw);
    setErrors(errs);
  };

  const template = () => {
    const ws = XLSX.utils.aoa_to_sheet(TEMPLATE);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "risks");
    XLSX.writeFile(wb, "risk-register-template.xlsx");
  };

  return (
    <>
      <button onClick={template} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent" title="Download import template">
        <Download className="h-4 w-4" /> Template
      </button>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
        <Upload className="h-4 w-4" /> Import
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="w-[640px] max-w-full rounded-lg bg-background p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold text-orange-600">Import Risk Register</div>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              CSV or Excel matching the template. Rows are matched on <code>risk_ref</code> — re-importing updates existing risks instead of duplicating them. Imported rows get source "Imported from risk register".
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && load(e.target.files[0])}
              className="mb-3 text-sm"
            />
            {rows.length > 0 && (
              <>
                <div className="max-h-52 overflow-auto rounded border text-xs">
                  <table className="w-full">
                    <thead><tr className="border-b bg-muted/50 text-left">{["risk_ref", "auditable_entity", "risk_description", "residual_likelihood", "residual_impact"].map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr></thead>
                    <tbody>
                      {rows.slice(0, 20).map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          {["risk_ref", "auditable_entity", "risk_description", "residual_likelihood", "residual_impact"].map((f) => <td key={f} className="max-w-40 truncate px-2 py-1">{String(r[f] ?? "")}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs">{rows.length} rows parsed{rows.length > 20 ? " (first 20 shown)" : ""}</div>
              </>
            )}
            {errors.length > 0 && (
              <div className="mt-2 max-h-24 overflow-auto rounded border border-red-300 bg-red-50 p-2 text-xs text-red-800">
                {errors.slice(0, 10).map((e, i) => <div key={i}>{e}</div>)}
                {errors.length > 10 && <div>…and {errors.length - 10} more</div>}
              </div>
            )}
            {result && <div className="mt-2 rounded border border-emerald-300 bg-emerald-50 p-2 text-xs text-emerald-800">{result}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Close</button>
              <button
                disabled={busy || !rows.length || errors.length > 0}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await action(rows);
                    setResult(`Done: ${r.created} created, ${r.updated} updated, ${r.skipped} skipped.`);
                    router.refresh();
                  } finally { setBusy(false); }
                }}
                className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
              >
                Commit import
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
