"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { BrainCircuit, Download, Upload, X, Loader2 } from "lucide-react";
import { importEngagements } from "@/lib/actions";

export function AiAnalysisButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ analysis?: string; model?: string; error?: string } | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/analyze", { method: "POST" });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); if (!result) run(); }}
        className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-accent"
      >
        <BrainCircuit className="h-4 w-4" />
        AI Analysis
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-lg border bg-white p-5 text-neutral-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-orange-600">
                <BrainCircuit className="h-5 w-5" />
                AI Engagement Analysis
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-10 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing engagement portfolio…
              </div>
            ) : result?.error ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">
                <div className="font-medium">AI analysis unavailable</div>
                <p className="mt-1 text-neutral-600">{result.error}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  Set <code>AI_API_KEY</code>, <code>AI_BASE_URL</code> and <code>AI_MODEL</code> in <code>.env</code> to enable.
                </p>
              </div>
            ) : result?.analysis ? (
              <>
                <div className="prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">{result.analysis}</div>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-neutral-500">
                  <span>Model: {result.model} · Data residency: South Africa</span>
                  <button onClick={run} className="rounded-md border px-3 py-1 hover:bg-neutral-50">Re-run</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

export function ExportButton({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <button
      onClick={() => {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Engagements");
        XLSX.writeFile(wb, "engagements.xlsx");
      }}
      className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-accent"
    >
      <Download className="h-4 w-4" />
      Export
    </button>
  );
}

export function ImportButton() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            const wb = XLSX.read(await file.arrayBuffer());
            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
              wb.Sheets[wb.SheetNames[0]],
            );
            const { created } = await importEngagements(rows);
            alert(`Imported ${created} engagement(s)`);
            router.refresh();
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
      >
        <Upload className="h-4 w-4" />
        {busy ? "Importing…" : "Import"}
      </button>
    </>
  );
}
