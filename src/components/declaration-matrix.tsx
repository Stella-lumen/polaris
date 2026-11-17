"use client";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule, ModuleRegistry,
  type ColDef, type ICellRendererParams, type RowClassParams,
} from "ag-grid-community";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { confirmDeclaration } from "@/lib/actions";
import { gridTheme } from "@/components/data-grid";

ModuleRegistry.registerModules([AllCommunityModule]);

type Row = Record<string, unknown> & {
  id: string;
  __section?: boolean;
  declaration: string;
  declId?: string;
};

export function DeclarationMatrix({
  engagementId,
  auditors,
  sections,
  confirmed,
}: {
  engagementId: string;
  auditors: { id: string; name: string; position: string }[];
  sections: { name: string; decls: { id: string; text: string }[] }[];
  confirmed: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const confirmedSet = useMemo(() => new Set(confirmed), [confirmed]);

  async function toggle(auditorId: string, declarationId: string) {
    const key = `${auditorId}|${declarationId}`;
    setBusy(key);
    try {
      await confirmDeclaration(engagementId, auditorId, declarationId);
      router.refresh();
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
          row[a.id] = confirmedSet.has(`${a.id}|${d.id}`) ? "CONFIRMED" : "NOT_CONFIRMED";
        }
        out.push(row);
      }
    }
    return out;
  }, [sections, auditors, confirmedSet]);

  const colDefs = useMemo<ColDef<Row>[]>(() => [
    {
      field: "declaration",
      headerName: "Declaration",
      flex: 3,
      minWidth: 320,
      wrapText: true,
      autoHeight: true,
      cellStyle: (p) =>
        p.data?.__section ? { fontWeight: 600, backgroundColor: "#f4f4f5" } : null,
      colSpan: (p) => (p.data?.__section ? auditors.length + 1 : 1),
    },
    ...auditors.map<ColDef<Row>>((a) => ({
      field: a.id,
      headerName: a.name,
      width: 170,
      minWidth: 150,
      sortable: false,
      filter: false,
      cellStyle: { backgroundColor: "transparent" },
      cellRenderer: (p: ICellRendererParams<Row>) => {
        if (!p.value || p.data?.__section) return null;
        const ok = p.value === "CONFIRMED";
        const key = `${a.id}|${p.data!.declId}`;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); toggle(a.id, String(p.data!.declId)); }}
            disabled={busy === key}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold text-white disabled:opacity-50 ${
              ok ? "bg-emerald-500" : "bg-red-500 hover:bg-red-400"
            }`}
          >
            {ok ? "Confirmed" : "Not Confirmed"}
          </button>
        );
      },
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [auditors, busy]);

  return (
    <div className="h-[70vh] w-full">
      <AgGridReact<Row>
        theme={gridTheme}
        rowData={rows}
        columnDefs={colDefs}
        defaultColDef={{ sortable: true, filter: true, resizable: true }}
        rowHeight={40}
        headerHeight={42}
        getRowClass={(p: RowClassParams<Row>) => (p.data?.__section ? "font-semibold" : "")}
        pagination
        paginationPageSize={14}
        suppressCellFocus
      />
    </div>
  );
}
