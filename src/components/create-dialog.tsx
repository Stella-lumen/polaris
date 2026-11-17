"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, X } from "lucide-react";

export type DialogField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "number" | "select" | "checkbox" | "file";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

export function CreateDialog({
  title,
  buttonLabel,
  action,
  fields,
}: {
  title: string;
  buttonLabel: string;
  action: (formData: FormData) => Promise<void>;
  fields: DialogField[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        <Plus className="h-4 w-4" />
        {buttonLabel}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-auto rounded-lg border bg-white p-0 text-neutral-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              className="flex flex-col gap-3 p-5"
              action={async (fd) => {
                setBusy(true);
                try {
                  await action(fd);
                  setOpen(false);
                  router.refresh();
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-orange-600">{title}</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {fields.map((f) => (
                <label key={f.name} className="flex flex-col gap-1 text-sm">
                  {f.type === "checkbox" ? (
                    <span className="flex items-center gap-2">
                      <input type="checkbox" name={f.name} /> {f.label}
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
                        <textarea name={f.name} required={f.required} placeholder={f.placeholder} className="rounded border border-neutral-300 px-3 py-2" />
                      ) : f.type === "select" ? (
                        <select name={f.name} required={f.required} className="rounded border border-neutral-300 bg-white px-3 py-2">
                          <option value="">{f.placeholder ?? "Select…"}</option>
                          {f.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name={f.name}
                          type={f.type ?? "text"}
                          step={f.type === "number" ? "0.01" : undefined}
                          required={f.required}
                          placeholder={f.placeholder}
                          className="rounded border border-neutral-300 px-3 py-2"
                        />
                      )}
                    </>
                  )}
                </label>
              ))}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
                >
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
