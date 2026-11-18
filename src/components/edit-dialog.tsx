"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import type { DialogField } from "@/components/create-dialog";

export function EditDialog({
  title,
  action,
  fields,
  values,
  returnPath,
}: {
  title: string;
  /** bound server action: (formData) => void */
  action: (formData: FormData) => Promise<void>;
  fields: DialogField[];
  values: Record<string, string | boolean | null>;
  returnPath: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = () => router.push(returnPath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-auto rounded-lg border bg-white p-0 text-neutral-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          className="flex flex-col gap-3 p-5"
          action={async (fd) => {
            setBusy(true);
            setError(null);
            try {
              await action(fd);
              router.push(returnPath);
              router.refresh();
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Something went wrong.";
              if (msg.includes("NEXT_REDIRECT") || msg.includes("digest")) router.push(returnPath);
              else setError(msg.replace(/^Error:\s*/, ""));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-orange-600">{title}</div>
            <button type="button" onClick={close} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          {fields.map((f) => {
            const v = values[f.name];
            return (
              <label key={f.name} className="flex flex-col gap-1 text-sm">
                {f.type === "checkbox" ? (
                  <span className="flex items-center gap-2">
                    <input type="checkbox" name={f.name} defaultChecked={!!v} /> {f.label}
                  </span>
                ) : f.type === "file" ? (
                  <>
                    {f.label}
                    <span className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 px-3 py-4 text-neutral-500">
                      <input type="file" name={f.name} multiple className="text-xs" />
                    </span>
                  </>
                ) : (
                  <>
                    {f.label}
                    {f.type === "textarea" ? (
                      <textarea name={f.name} required={f.required} defaultValue={String(v ?? "")} placeholder={f.placeholder} className="rounded border border-neutral-300 px-3 py-2" />
                    ) : f.type === "select" ? (
                      <select name={f.name} required={f.required} defaultValue={String(v ?? "")} className="rounded border border-neutral-300 bg-white px-3 py-2">
                        <option value="">Select…</option>
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={f.name}
                        type={f.type ?? "text"}
                        step={f.type === "number" ? "0.01" : undefined}
                        required={f.required}
                        defaultValue={String(v ?? "")}
                        placeholder={f.placeholder}
                        className="rounded border border-neutral-300 px-3 py-2"
                      />
                    )}
                  </>
                )}
              </label>
            );
          })}
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-md border border-neutral-300 px-4 py-2 text-sm">
              Close
            </button>
            <button type="submit" disabled={busy} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50">
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
