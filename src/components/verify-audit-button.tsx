"use client";

import { useState, useTransition } from "react";
import { verifyAuditTrail } from "@/lib/actions";

export function VerifyAuditButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        disabled={pending}
        onClick={() => start(async () => { const r = await verifyAuditTrail(); setOk(r.ok); setMsg(r.message); })}
        className="rounded-md border border-orange-300 bg-white px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100 disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify audit trail"}
      </button>
      {msg && <span className={`text-xs ${ok ? "text-emerald-700" : "text-red-700"}`}>{msg}</span>}
    </span>
  );
}
