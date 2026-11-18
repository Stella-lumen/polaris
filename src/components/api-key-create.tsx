"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, X, Copy } from "lucide-react";
import { createApiKey } from "@/lib/actions";
import { API_SCOPES } from "@/lib/api-scopes";

export function ApiKeyCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={() => { setKey(null); setOpen(true); }}
        className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        <Plus className="h-4 w-4" />
        Generate API Key
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-lg border bg-white p-5 text-neutral-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {key ? (
              <div className="flex flex-col gap-3">
                <div className="text-lg font-semibold text-orange-600">API Key Created</div>
                <p className="text-sm text-neutral-600">
                  Copy this key now — it will never be shown again.
                </p>
                <div className="flex items-center gap-2 rounded-md border bg-neutral-50 px-3 py-2 font-mono text-xs">
                  <span className="min-w-0 flex-1 truncate">{key}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(key)}
                    className="rounded p-1 hover:bg-neutral-200"
                    aria-label="Copy key"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setOpen(false); setKey(null); }}
                  className="self-end rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-3"
                action={async (fd) => {
                  setBusy(true);
                  try {
                    const res = await createApiKey(fd);
                    setKey(res.key);
                    router.refresh();
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-orange-600">Generate API Key</div>
                  <button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  Name
                  <input name="name" required placeholder="e.g. AD connector" className="rounded border border-neutral-300 px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Purpose
                  <input name="purpose" placeholder="e.g. Power BI dashboard refresh" className="rounded border border-neutral-300 px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Expires (optional — defaults to 90 days from today)
                  <input name="expires_at" type="date" className="rounded border border-neutral-300 px-3 py-2" />
                </label>
                <fieldset className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Scopes</span>
                  <span className="text-xs text-neutral-500">Leave all unchecked to grant every scope.</span>
                  <div className="grid grid-cols-2 gap-1 rounded-md border border-neutral-200 p-2">
                    {API_SCOPES.map((s) => (
                      <label key={s} className="flex items-center gap-2 text-xs">
                        <input type="checkbox" name="scopes" value={s} className="accent-orange-600" />
                        {s}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-neutral-300 px-4 py-2 text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={busy} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50">
                    {busy ? "Generating…" : "Generate"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
