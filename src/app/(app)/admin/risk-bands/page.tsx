import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createRiskRatingBand } from "@/lib/actions";
import { BAND_CLASSES } from "@/lib/risk";

export const instant = false;

const colors = ["green", "yellow", "orange", "red"].map((c) => ({ value: c, label: c }));

export default async function RiskBandsPage() {
  const rows = await prisma.riskRatingBand.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    orderBy: { min_score: "asc" },
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Risk Rating Bands</h1>
        <CreateDialog
          title="Add Rating Band"
          buttonLabel="Add Band"
          action={createRiskRatingBand}
          fields={[
            { name: "label", label: "Label (e.g. High)", required: true },
            { name: "min_score", label: "Min Score", type: "number", required: true },
            { name: "max_score", label: "Max Score", type: "number", required: true },
            { name: "color", label: "Colour", type: "select", options: colors, required: true },
            { name: "sort_order", label: "Sort Order", type: "number" },
          ]}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Score bands applied to inherent and residual risk ratings (score = Likelihood × Impact, 1–25).
        High-risk coverage alerts apply to bands starting at 10 or above.
      </p>
      <DataGrid
        rows={rows.map((b) => ({ ...b, range: `${b.min_score}–${b.max_score}` })) as unknown as object[]}
        badgeMap={{ label: Object.fromEntries(rows.map((b) => [b.label ?? "", `inline-flex rounded border px-1.5 py-0.5 text-xs font-medium ${BAND_CLASSES[b.color ?? ""] ?? ""}`])) }}
        colDefs={[
          { field: "sort_order", headerName: "#", width: 70 },
          { field: "label", headerName: "Band", flex: 1 },
          { field: "range", headerName: "Score Range" },
          { field: "color", headerName: "Colour" },
        ]}
      />
    </div>
  );
}
