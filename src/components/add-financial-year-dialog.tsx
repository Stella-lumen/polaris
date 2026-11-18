"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createFinancialYear } from "@/lib/actions";

/** "Add financial year" — type 2026/27, dates fill automatically,
 *  optionally creates the four quarters (only when the box is ticked). */
export function AddFinancialYearDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const applyLabel = (v: string) => {
    setLabel(v);
    const m = v.match(/^(\d{4})\/(\d{2,4})$/);
    if (!m) return;
    const y = Number(m[1]);
    setStart(`${y}-04-01`);
    setEnd(`${y + 1}-03-31`);
  };

  const input = "rounded border border-neutral-300 px-3 py-2";

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md border border-orange-600 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50">
        <Plus className="h-4 w-4" /> Add financial year
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg border bg-white p-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <form
              className="flex flex-col gap-3 p-5"
              action={async (fd) => {
                setBusy(true);
                setError(null);
                try {
                  await createFinancialYear(fd);
                  setOpen(false);
                  router.refresh();
                } catch (err) {
                  const msg = err instanceof Error ? err.message : "Something went wrong.";
                  if (!msg.includes("NEXT_REDIRECT")) setError(msg.replace(/^Error:\s*/, ""));
                  else setOpen(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-orange-600">Add financial year</div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Financial year
                <input name="fy_label" required value={label} onChange={(e) => applyLabel(e.target.value)} placeholder="2026/27" className={input} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  Starts
                  <input name="fy_start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={input} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Ends
                  <input name="fy_end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={input} />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                Description
                <input name="description" placeholder="Optional" className={input} />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="create_quarters" className="h-4 w-4 accent-orange-600" />
                Also create the four quarters ({label ? `${label} Quarter 1–4` : "named with the year"})
              </label>
              {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-neutral-300 px-4 py-2 text-sm">Close</button>
                <button type="submit" disabled={busy} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50">
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
