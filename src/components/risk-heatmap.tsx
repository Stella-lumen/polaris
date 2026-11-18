"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const CELL_CLASSES = [
  (s: number) => s <= 4 && "bg-emerald-100 hover:bg-emerald-200 text-emerald-900",
  (s: number) => s >= 5 && s <= 9 && "bg-amber-100 hover:bg-amber-200 text-amber-900",
  (s: number) => s >= 10 && s <= 14 && "bg-orange-200 hover:bg-orange-300 text-orange-950",
  (s: number) => s >= 15 && "bg-red-200 hover:bg-red-300 text-red-950",
];
const cellClass = (s: number) => CELL_CLASSES.find((f) => f(s))?.(s) ?? "bg-zinc-100";

/** 5×5 likelihood×impact grid; clicking a cell filters the register via ?l=&i=&view=. */
export function RiskHeatmap({ counts }: { counts: { i: Record<string, number>; r: Record<string, number> } }) {
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState<"i" | "r">((params.get("view") as "i" | "r") ?? "r");
  const active = { l: params.get("l"), i: params.get("i"), v: params.get("view") ?? "r" };
  const go = (l: number, im: number, v: string, clear = false) => {
    const q = new URLSearchParams(params.toString());
    if (clear) { q.delete("l"); q.delete("i"); } else { q.set("l", String(l)); q.set("i", String(im)); }
    q.set("view", v);
    router.push(`/risk-assessment?${q.toString()}`);
  };
  const switchView = (v: "i" | "r") => { setView(v); const q = new URLSearchParams(params.toString()); q.set("view", v); q.delete("l"); q.delete("i"); router.push(`/risk-assessment?${q.toString()}`); };
  const data = counts[view];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Risk heat map — {view === "i" ? "Inherent" : "Residual"}</span>
        <div className="flex gap-1 text-xs">
          {(["i", "r"] as const).map((v) => (
            <button key={v} onClick={() => switchView(v)} className={`rounded px-2 py-1 ${view === v ? "bg-orange-600 text-white" : "border"}`}>
              {v === "i" ? "Inherent" : "Residual"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid w-fit grid-cols-[auto_repeat(5,3rem)] gap-0.5 text-center text-xs">
        <div className="flex items-end pb-1 pr-1 text-[10px] text-muted-foreground">L\I</div>
        {[1, 2, 3, 4, 5].map((im) => <div key={im} className="pb-1 text-muted-foreground">{im}</div>)}
        {[5, 4, 3, 2, 1].map((l) => (
          <div key={l} className="contents">
            <div className="flex items-center pr-1 text-muted-foreground">{l}</div>
            {[1, 2, 3, 4, 5].map((im) => {
              const n = data[`${l}x${im}`] ?? 0;
              const sel = active.l === String(l) && active.i === String(im) && active.v === view;
              return (
                <button
                  key={im}
                  onClick={() => go(l, im, view, sel)}
                  title={`Likelihood ${l} × Impact ${im} — ${n} risk${n === 1 ? "" : "s"}`}
                  className={`flex h-10 items-center justify-center rounded font-medium ${cellClass(l * im)} ${sel ? "ring-2 ring-orange-600" : ""}`}
                >
                  {n || ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {(active.l || active.i) && (
        <button onClick={() => go(0, 0, view, true)} className="w-fit text-xs text-orange-600 hover:underline">
          Clear cell filter
        </button>
      )}
    </div>
  );
}
