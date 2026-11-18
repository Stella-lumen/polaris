"use client";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule, ModuleRegistry,
  type ColDef, type ICellRendererParams, type RowClassParams,
} from "ag-grid-community";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signDeclaration, discloseDeclarationConflict, reviewDeclarationConflict } from "@/lib/actions";
import { gridTheme } from "@/components/data-grid";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

ModuleRegistry.registerModules([AllCommunityModule]);

type Signing = {
  key: string;
  rowId: string;
  status: string;
  signedText: string | null;
  conflictReason: string | null;
  reviewComment: string | null;
  signedAt: Date | string | null;
  reviewer: string | null;
  discloserUserId: string | null;
};

type Row = Record<string, unknown> & {
  id: string;
  __section?: boolean;
  declaration: string;
  declId?: string;
};

const STATUS_LABEL: Record<string, string> = {
  SIGNED: "Signed",
  CONFLICT: "Conflict disclosed",
  APPROVED: "Approved with conditions",
  REASSIGNED: "Reassigned",
};

function statusChip(status: string | null) {
  if (status === "SIGNED") return <span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{STATUS_LABEL.SIGNED}</span>;
  if (status === "CONFLICT") return <span className="flex items-center gap-1 text-xs font-medium text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />Conflict</span>;
  if (status === "APPROVED") return <span className="flex items-center gap-1 text-xs font-medium text-sky-700"><ShieldCheck className="h-3.5 w-3.5" />{STATUS_LABEL.APPROVED}</span>;
  if (status === "REASSIGNED") return <span className="text-xs text-neutral-500">{STATUS_LABEL.REASSIGNED}</span>;
  return null;
}

export function DeclarationMatrix({
  engagementId,
  myAuditorId,
  canReview,
  auditors,
  sections,
  signings,
  openConflicts,
}: {
  engagementId: string;
  myAuditorId: string | null;
  canReview: boolean;
  auditors: { id: string; name: string; position: string }[];
  sections: { name: string; decls: { id: string; text: string }[] }[];
  signings: Signing[];
  openConflicts: { rowId: string; auditor: string; discloserUserId: string; declaration: string; reason: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [conflictFor, setConflictFor] = useState<string | null>(null); // declId
  const [reviewFor, setReviewFor] = useState<string | null>(null); // rowId
  const [error, setError] = useState<string | null>(null);
  const byKey = useMemo(() => new Map(signings.map((s) => [s.key, s])), [signings]);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^Error:\s*/, "") : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const s of sections) {
      out.push({ id: `sec-${s.name}`, __section: true, declaration: s.name });
      for (const d of s.decls) {
        const row: Row = { id: d.id, declaration: d.text, declId: d.id };
        for (const a of auditors) {
          const sig = byKey.get(`${a.id}|${d.id}`);
          row[`${a.id}|status`] = sig?.status ?? null;
        }
        out.push(row);
      }
    }
    return out;
  }, [sections, auditors, byKey]);

  const cell = (a: { id: string }) => ({ data }: ICellRendererParams<Row>) => {
    if (data?.__section || !data?.declId) return null;
    const sig = byKey.get(`${a.id}|${data.declId}`);
    const mine = a.id === myAuditorId;
    const status = (data[`${a.id}|status`] as string | null) ?? null;
    const title = sig?.signedText ? `Signed against: “${sig.signedText}”` : undefined;
    return (
      <div className="flex h-full items-center justify-center gap-1.5" title={title}>
        {statusChip(status)}
        {!status && !mine && <span className="text-xs text-muted-foreground">Not signed</span>}
        {!status && mine && (
          <>
            <button
              disabled={busy === `${a.id}|${data.declId}`}
              onClick={(e) => { e.stopPropagation(); run(`${a.id}|${data.declId}`, () => signDeclaration(engagementId, data.declId!)); }}
              className="rounded bg-orange-600 px-2 py-1 text-xs font-medium text-white hover:bg-orange-500 disabled:opacity-50"
              title="Sign this declaration — the wording is kept exactly as shown"
            >
              {busy === `${a.id}|${data.declId}` ? "…" : "Sign"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConflictFor(data.declId!); }}
              className="text-xs text-amber-700 underline"
              title="I cannot confirm this — disclose a conflict"
            >
              Cannot confirm
            </button>
          </>
        )}
        {status && mine && status !== "CONFLICT" && (
          <button
            onClick={(e) => { e.stopPropagation(); setConflictFor(data.declId!); }}
            className="text-xs text-amber-700 underline"
            title="I can no longer confirm this — disclose a conflict"
          >
            Cannot confirm
          </button>
        )}
      </div>
    );
  };

  const colDefs = useMemo<ColDef<Row>[]>(() => [
    {
      field: "declaration",
      headerName: "Declaration",
      flex: 3,
      minWidth: 320,
      wrapText: true,
      autoHeight: true,
      cellClass: (p) => ((p.data as Row).__section ? "font-semibold bg-neutral-100" : ""),
    },
    ...auditors.map<ColDef<Row>>((a) => ({
      headerName: a.name + (a.position ? ` (${a.position.toLowerCase().replaceAll("_", " ")})` : "") + (a.id === myAuditorId ? " — you" : ""),
      field: `${a.id}|status` as keyof Row & string,
      width: 190,
      cellRenderer: cell(a),
      cellClass: "text-center",
    })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [auditors, byKey, myAuditorId, busy, conflictFor]);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="ag-theme-alpine rounded-md border" style={{ height: 480 }}>
        <AgGridReact<Row>
          theme={gridTheme}
          rowData={rows}
          columnDefs={colDefs}
          defaultColDef={{ sortable: false, resizable: true }}
          getRowClass={(p: RowClassParams<Row>) => (p.data?.__section ? "bg-neutral-100 font-semibold" : "")}
        />
      </div>

      {openConflicts.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">Open conflicts — waiting for a supervisor</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {openConflicts.map((c) => (
              <li key={c.rowId} className="rounded-md bg-white px-3 py-2 text-sm">
                <div className="font-medium">{c.auditor}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Declaration: {c.declaration}…</div>
                <div className="mt-1 text-amber-800">Reason: {c.reason}</div>
                {canReview && (
                  <button
                    onClick={() => setReviewFor(c.rowId)}
                    className="mt-2 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-500"
                  >
                    Review this conflict
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {conflictFor && (
        <ConflictDialog
          onClose={() => setConflictFor(null)}
          onSubmit={async (reason) => {
            const fd = new FormData();
            fd.set("reason", reason);
            await run(`conflict-${conflictFor}`, () => discloseDeclarationConflict(engagementId, conflictFor, fd));
            setConflictFor(null);
          }}
        />
      )}
      {reviewFor && (
        <ReviewDialog
          onClose={() => setReviewFor(null)}
          onSubmit={async (decision, comment) => {
            const fd = new FormData();
            fd.set("comment", comment);
            await run(`review-${reviewFor}`, () => reviewDeclarationConflict(reviewFor, decision, fd));
            setReviewFor(null);
          }}
        />
      )}
    </div>
  );
}

function ConflictDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-orange-600">I cannot confirm this</h3>
        <p className="mt-1 text-xs text-muted-foreground">Say why — it goes to your supervisor for review. Nothing is hidden.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="For example: my spouse works in the department being audited"
          className="mt-3 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-neutral-300 px-4 py-2 text-sm">Cancel</button>
          <button
            disabled={busy || !reason.trim()}
            onClick={async () => { setBusy(true); await onSubmit(reason); }}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Disclose conflict"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (decision: "APPROVED" | "REASSIGNED", comment: string) => Promise<void> }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-orange-600">Review this conflict</h3>
        <p className="mt-1 text-xs text-muted-foreground">Approve with conditions, or reassign the work. Your name and comment are recorded.</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Conditions (required to approve), for example: excluded from reviewing that department"
          className="mt-3 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-neutral-300 px-4 py-2 text-sm">Cancel</button>
          <button
            disabled={busy}
            onClick={async () => { setBusy(true); await onSubmit("REASSIGNED", comment); }}
            className="rounded-md border border-neutral-400 px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            Reassign the work
          </button>
          <button
            disabled={busy || !comment.trim()}
            title={comment.trim() ? "" : "Conditions are required"}
            onClick={async () => { setBusy(true); await onSubmit("APPROVED", comment); }}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
          >
            Approve with conditions
          </button>
        </div>
      </div>
    </div>
  );
}
