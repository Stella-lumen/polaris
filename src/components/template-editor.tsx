"use client";
import { useState } from "react";

export type TemplateField = { key: string; label: string; type: string; required: boolean; options: string[]; sort: number };
const TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "DATE", label: "Date" },
  { value: "CHOICE", label: "Choice" },
  { value: "YES_NO", label: "Yes / No" },
  { value: "FILE", label: "File" },
  { value: "SIGNATURE", label: "Signature" },
];

export function TemplateEditor({ initial }: { initial: TemplateField[] }) {
  const [fields, setFields] = useState<TemplateField[]>(initial.length ? initial : []);
  const move = (i: number, d: number) => {
    const next = [...fields];
    const [f] = next.splice(i, 1);
    next.splice(i + d, 0, f);
    setFields(next.map((x, j) => ({ ...x, sort: j })));
  };
  const set = (i: number, patch: Partial<TemplateField>) => setFields(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="fields_json" value={JSON.stringify(fields)} />
      {fields.map((f, i) => (
        <div key={i} className="flex items-center gap-2 rounded-md border bg-card p-2">
          <div className="flex flex-col">
            <button type="button" onClick={() => i > 0 && move(i, -1)} disabled={i === 0} className="text-xs text-muted-foreground disabled:opacity-30">▲</button>
            <button type="button" onClick={() => i < fields.length - 1 && move(i, 1)} disabled={i === fields.length - 1} className="text-xs text-muted-foreground disabled:opacity-30">▼</button>
          </div>
          <input value={f.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="Field label" className="w-56 rounded-md border px-2 py-1 text-sm" />
          <select value={f.type} onChange={(e) => set(i, { type: e.target.value })} className="rounded-md border px-2 py-1 text-sm">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {f.type === "CHOICE" && (
            <input value={f.options.join(", ")} onChange={(e) => set(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Options, comma separated" className="w-48 rounded-md border px-2 py-1 text-sm" />
          )}
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input type="checkbox" checked={f.required} onChange={(e) => set(i, { required: e.target.checked })} /> Required
          </label>
          <button type="button" onClick={() => setFields(fields.filter((_, j) => j !== i).map((x, j) => ({ ...x, sort: j })))} className="ml-auto text-xs text-red-600">Remove</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setFields([...fields, { key: `f${fields.length + 1}`, label: "", type: "TEXT", required: false, options: [], sort: fields.length }])}
        className="w-fit rounded-md border border-dashed px-3 py-1.5 text-xs text-muted-foreground"
      >
        + Add field
      </button>
    </div>
  );
}
