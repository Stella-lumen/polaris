"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { FilterValues } from "@/lib/reports/types";
import { sendReport, saveReport, scheduleReport } from "@/lib/reports/report-actions";

function HiddenFilters({ filters }: { filters: FilterValues }) {
  return (
    <>
      {Object.entries(filters).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={`f_${k}`} value={v} /> : null,
      )}
    </>
  );
}

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SendReportDialog({ reportId, reportTitle, filters, onClose }: { reportId: string; reportTitle: string; filters: FilterValues; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <Shell title={`Send — ${reportTitle}`} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        action={async (fd) => {
          setBusy(true);
          const r = await sendReport(fd);
          setResult({ ok: r.ok, text: "error" in r ? r.error! : r.message! });
          setBusy(false);
        }}
      >
        <input type="hidden" name="report_id" value={reportId} />
        <HiddenFilters filters={filters} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-neutral-500">Recipients (comma separated — users or any email address)</span>
          <input name="recipients" required placeholder="name@agriseta.co.za, other@agriseta.co.za" className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-neutral-500">Format</span>
          <select name="format" className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950">
            <option value="link">Summary + link to the live report</option>
            <option value="pdf">Summary (attach the PDF separately if needed)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-neutral-500">Subject</span>
          <input name="subject" defaultValue={`Polaris report — ${reportTitle}`} className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-neutral-500">Message (optional)</span>
          <textarea name="message" rows={3} className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950" />
        </label>
        {result && (
          <div className={`rounded-md border px-3 py-2 text-xs ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {result.text}
          </div>
        )}
        <button disabled={busy} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-60">
          {busy ? "Sending…" : "Send"}
        </button>
        <p className="text-[11px] text-neutral-400">Sent through the app's email engine — recorded in Sent Emails and the System Activity Log. Demo mode keeps it in the outbox.</p>
      </form>
    </Shell>
  );
}

export function ScheduleReportDialog({ reportId, reportTitle, filters, onClose }: { reportId: string; reportTitle: string; filters: FilterValues; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [cadence, setCadence] = useState("MONTHLY");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <Shell title={`Schedule — ${reportTitle}`} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        action={async (fd) => {
          setBusy(true);
          const r = await scheduleReport(fd);
          setResult({ ok: r.ok, text: "error" in r ? r.error! : r.message! });
          setBusy(false);
        }}
      >
        <input type="hidden" name="report_id" value={reportId} />
        <HiddenFilters filters={filters} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-neutral-500">Name</span>
          <input name="name" defaultValue={`${reportTitle} — scheduled`} className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-neutral-500">Send this report</span>
          <select name="cadence" value={cadence} onChange={(e) => setCadence(e.target.value)} className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950">
            <option value="MONTHLY">Every month</option>
            <option value="QUARTERLY">Every quarter</option>
            <option value="ONCE">On a date</option>
          </select>
        </label>
        {cadence === "ONCE" ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-neutral-500">Date</span>
            <input type="date" name="once_date" required className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950" />
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-neutral-500">On day of month</span>
            <input type="number" name="day_of_month" min={1} max={28} defaultValue={1} className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950" />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-neutral-500">Format</span>
          <select name="format" className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950">
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="word">Word</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-neutral-500">Recipients</span>
          <input name="recipients" required placeholder="name@agriseta.co.za" className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950" />
        </label>
        {result && (
          <div className={`rounded-md border px-3 py-2 text-xs ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {result.text}
          </div>
        )}
        <button disabled={busy} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-60">
          {busy ? "Scheduling…" : "Schedule"}
        </button>
        <p className="text-[11px] text-neutral-400">Runs at 08:00 Africa/Johannesburg. Current filters are saved with the schedule.</p>
      </form>
    </Shell>
  );
}

export function SaveReportDialog({ reportId, reportTitle, filters, onClose }: { reportId: string; reportTitle: string; filters: FilterValues; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <Shell title={`Save — ${reportTitle}`} onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        action={async (fd) => {
          setBusy(true);
          const r = await saveReport(fd);
          setResult({ ok: r.ok, text: "error" in r ? r.error! : r.message! });
          setBusy(false);
        }}
      >
        <input type="hidden" name="report_id" value={reportId} />
        <HiddenFilters filters={filters} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-neutral-500">Name</span>
          <input name="name" required placeholder={`${reportTitle} — my view`} className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-950" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="shared" className="h-4 w-4 accent-orange-600" />
          Share with the team (otherwise only you see it)
        </label>
        {result && (
          <div className={`rounded-md border px-3 py-2 text-xs ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {result.text}
          </div>
        )}
        <button disabled={busy} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-60">
          {busy ? "Saving…" : "Save report"}
        </button>
        <p className="text-[11px] text-neutral-400">Saves the report with its current filters — open it later from the saved list.</p>
      </form>
    </Shell>
  );
}
