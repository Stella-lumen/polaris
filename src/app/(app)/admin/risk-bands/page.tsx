import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { EditDialog } from "@/components/edit-dialog";
import { createRiskRatingBand, updateRiskRatingBand, toggleRiskRatingBand, deleteRiskRatingBand, setAlertFloorBand, confirmRiskRatingBand } from "@/lib/actions";
import { BAND_CLASSES, alertFloorBand, type RiskBand } from "@/lib/risk";

export const instant = false;

const colors = ["green", "yellow", "orange", "red"].map((c) => ({ value: c, label: c }));
const SWATCH: Record<string, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

export default async function RiskBandsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: editId } = await searchParams;
  const [rows, risks] = await Promise.all([
    prisma.riskRatingBand.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { min_score: "asc" },
    }),
    prisma.riskAssessment.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      select: { residual_score: true, linked_planned_engagement_id: true },
    }),
  ]);

  const floor = alertFloorBand(rows as RiskBand[]);
  const editRow = editId ? rows.find((b) => b.id === editId) : null;

  const gridRows = rows.map((b) => {
    const inBand = risks.filter((r) => r.residual_score != null && r.residual_score >= (b.min_score ?? 0) && r.residual_score <= (b.max_score ?? 999));
    const covered = inBand.filter((r) => r.linked_planned_engagement_id).length;
    return {
      id: b.id,
      order: b.sort_order ?? "",
      label: b.label ?? "Not assigned",
      range: `${b.min_score ?? "?"}–${b.max_score ?? "?"}`,
      swatch: b.color ?? "",
      meaning: b.meaning ?? "Not assigned",
      expected_response: b.expected_response ?? "Not assigned",
      risk_count: inBand.length,
      coverage: inBand.length === 0 ? "No risks" : `${covered} of ${inBand.length} in the audit plan`,
      status: b.disabled ? "Inactive" : "Active",
      sample: b.is_sample ? "Sample" : "",
      alert_floor: b.is_alert_floor ? "Alerts start here" : "",
      disabled: b.disabled,
      expirable: !!b.is_sample,
      deletable: inBand.length === 0,
      delete_reason: inBand.length === 0 ? undefined : `${inBand.length} risk${inBand.length === 1 ? " sits" : "s sit"} inside this band — deactivate it instead`,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Risk rating bands</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            How risk scores are turned into ratings. A score is likelihood multiplied by impact,
            from 1 to 25. Higher ratings get audit attention first.
          </p>
        </div>
        <CreateDialog
          title="Add rating band"
          buttonLabel="Add band"
          action={createRiskRatingBand}
          fields={[
            { name: "label", label: "Label (e.g. High)", required: true },
            { name: "min_score", label: "Lowest score", type: "number", required: true },
            { name: "max_score", label: "Highest score", type: "number", required: true },
            { name: "color", label: "Colour", type: "select", options: colors, required: true },
            { name: "sort_order", label: "Sort order", type: "number" },
            { name: "meaning", label: "Meaning", type: "textarea", placeholder: "What this rating says about the risk" },
            { name: "expected_response", label: "Expected audit response", placeholder: "e.g. Audit in the current year" },
          ]}
        />
      </div>

      {/* 1–25 coverage bar — each score coloured by its band; gaps show as grey */}
      <div className="rounded-lg border p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Score coverage, 1–25</span>
          <form action={async (fd: FormData) => { "use server"; await setAlertFloorBand(String(fd.get("band"))); }} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Raise high-risk alerts from:</span>
            <select name="band" defaultValue={floor ? rows.find((b) => b.is_alert_floor)?.id : ""} className="rounded border border-neutral-300 px-2 py-1 text-xs">
              {rows.filter((b) => !b.disabled).map((b) => (
                <option key={b.id} value={b.id}>{b.label} ({b.min_score}+)</option>
              ))}
            </select>
            <button className="rounded-md border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50">Set</button>
          </form>
        </div>
        <div className="flex overflow-hidden rounded">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((s) => {
            const band = rows.find((b) => !b.disabled && s >= (b.min_score ?? 0) && s <= (b.max_score ?? 999));
            return (
              <div
                key={s}
                title={band ? `${s} — ${band.label}` : `${s} — not covered`}
                className={`flex h-6 flex-1 items-center justify-center text-[9px] font-medium ${band ? `${SWATCH[band.color ?? ""] ?? "bg-neutral-300"} text-white` : "bg-neutral-200 text-neutral-500"}`}
              >
                {s}
              </div>
            );
          })}
        </div>
      </div>

      <DataGrid
        rows={gridRows as unknown as object[]}
        hrefPattern="/admin/risk-bands?id={id}"
        rowActions={["edit", "toggle", "expire", "delete"]}
        toggle={{ field: "disabled", labels: ["Inactive", "Active"], onToggle: toggleRiskRatingBand }}
        expireConfig={{
          onExpire: confirmRiskRatingBand,
          label: "Confirm",
          confirm: "Confirm this band's wording is final (not sample)?",
        }}
        deleteConfig={{ onDelete: deleteRiskRatingBand }}
        badgeMap={{
          label: Object.fromEntries(rows.map((b) => [b.label ?? "", `inline-flex rounded border px-1.5 py-0.5 text-xs font-medium ${BAND_CLASSES[b.color ?? ""] ?? ""}`])),
          swatch: Object.fromEntries(rows.map((b) => [b.color ?? "", `inline-block h-4 w-8 rounded ${SWATCH[b.color ?? ""] ?? "bg-neutral-300"} text-transparent`])),
          status: {
            Active: "rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800",
            Inactive: "rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600",
          },
          sample: { Sample: "rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800" },
          alert_floor: { "Alerts start here": "rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800" },
        }}
        colDefs={[
          { field: "order", headerName: "Order", width: 80 },
          { field: "label", headerName: "Band", flex: 1 },
          { field: "range", headerName: "Scores", width: 90 },
          { field: "swatch", headerName: "Colour", width: 80 },
          { field: "meaning", headerName: "Meaning", flex: 1.6, tooltipField: "meaning" },
          { field: "expected_response", headerName: "Expected audit response", flex: 1.5, tooltipField: "expected_response" },
          { field: "sample", headerName: "Flag", width: 85 },
          { field: "risk_count", headerName: "Risks", width: 80 },
          { field: "coverage", headerName: "Audit coverage", flex: 1.2, tooltipField: "coverage" },
          { field: "alert_floor", headerName: "Alerts", width: 120 },
          { field: "status", headerName: "Status", width: 95 },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Click a row to edit it. Bands containing risks cannot be deleted — deactivate them instead.
        Sample wording can be confirmed from the sample flag.
      </p>

      {editRow && (
        <EditDialog
          title="Edit rating band"
          returnPath="/admin/risk-bands"
          action={updateRiskRatingBand.bind(null, editRow.id)}
          values={{
            label: editRow.label, min_score: editRow.min_score == null ? "" : String(editRow.min_score),
            max_score: editRow.max_score == null ? "" : String(editRow.max_score),
            color: editRow.color, sort_order: editRow.sort_order == null ? "" : String(editRow.sort_order),
            meaning: editRow.meaning, expected_response: editRow.expected_response,
          }}
          fields={[
            { name: "label", label: "Label", required: true },
            { name: "min_score", label: "Lowest score", type: "number", required: true },
            { name: "max_score", label: "Highest score", type: "number", required: true },
            { name: "color", label: "Colour", type: "select", options: colors, required: true },
            { name: "sort_order", label: "Sort order", type: "number" },
            { name: "meaning", label: "Meaning", type: "textarea" },
            { name: "expected_response", label: "Expected audit response" },
          ]}
        />
      )}
    </div>
  );
}
