"use client";

import { useRouter } from "next/navigation";
import { Bookmark, CalendarClock, Pause, Play, Trash2 } from "lucide-react";
import { pauseSchedule, deleteSchedule, deleteSavedReport } from "@/lib/reports/report-actions";

type Saved = {
  id: string; name: string; reportId: string; reportTitle: string;
  filters: Record<string, string>; shared: boolean; mine: boolean;
};
type Sched = {
  id: string; name: string; reportTitle: string; cadence: string;
  day: number; format: string; recipients: string[]; next: string; paused: boolean;
};

const CADENCE_LABEL: Record<string, string> = {
  MONTHLY: "every month",
  QUARTERLY: "every quarter",
  ONCE: "once",
};

export function ReportLists({ saved, schedules }: { saved: Saved[]; schedules: Sched[] }) {
  const router = useRouter();
  if (!saved.length && !schedules.length) return null;

  const open = (s: Saved) => {
    const p = new URLSearchParams({ report: s.reportId });
    for (const [k, v] of Object.entries(s.filters)) if (v) p.set(k, v);
    router.push(`/reports?${p.toString()}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {saved.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Bookmark className="h-4 w-4 text-orange-600" /> Saved reports
          </div>
          <div className="flex flex-col gap-1.5">
            {saved.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <button onClick={() => open(s)} className="min-w-0 flex-1 text-left hover:underline" title="Open with its saved filters">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="text-xs text-neutral-500">
                    {s.reportTitle}{s.shared ? " · shared" : " · only you"}
                  </span>
                </button>
                {(s.mine) && (
                  <button
                    onClick={() => confirm(`Delete the saved report "${s.name}"?`) && deleteSavedReport(s.id)}
                    className="rounded p-1 text-neutral-400 hover:text-red-600" title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {schedules.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4 text-orange-600" /> Scheduled reports
          </div>
          <div className="flex flex-col gap-1.5">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="text-xs text-neutral-500">
                    {s.reportTitle} · {CADENCE_LABEL[s.cadence] ?? s.cadence}
                    {s.cadence !== "ONCE" ? ` on day ${s.day}` : ""} · {s.format.toUpperCase()} · {s.recipients.join(", ")}
                    {" · "}{s.paused ? "paused" : `next ${s.next}`}
                  </span>
                </div>
                <button
                  onClick={() => pauseSchedule(s.id)}
                  className="rounded p-1 text-neutral-400 hover:text-orange-600"
                  title={s.paused ? "Resume" : "Pause"}
                >
                  {s.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => confirm(`Delete the schedule "${s.name}"?`) && deleteSchedule(s.id)}
                  className="rounded p-1 text-neutral-400 hover:text-red-600" title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
