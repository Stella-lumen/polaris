// Committee-ready PDF via pdfkit: cover page, summary, chart bars,
// wrapped tables that never cut off columns, page numbers and a
// confidentiality footer on every page.
import PDFDocument from "pdfkit";
import type { ReportResult, FilterValues } from "./types";

const ORANGE = "#ea580c";
const GREY = "#78716c";

export type PdfMeta = {
  org: string;
  title: string;
  period: string;
  filters: FilterValues;
  filterLabels: Record<string, string>;
  preparedBy: string;
  dataAt: Date;
  confidentiality?: string;
  contents?: string[]; // section list for the committee pack
};

function table(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  startY: number,
): number {
  const margin = 36;
  const width = doc.page.width - margin * 2;
  const colW = headers.map((_, i) => width / headers.length);
  const fontSize = rows.length > 400 ? 5.5 : 6.5;
  let y = startY;

  const rowHeight = (cells: string[], bold: boolean) => {
    doc.fontSize(fontSize).font(bold ? "Helvetica-Bold" : "Helvetica");
    return Math.max(
      ...cells.map((c, i) => doc.heightOfString(c || "", { width: colW[i] - 6 })),
      10,
    ) + 6;
  };

  const drawRow = (cells: string[], opts: { header?: boolean } = {}) => {
    const h = rowHeight(cells, !!opts.header);
    if (y + h > doc.page.height - 50) {
      doc.addPage();
      y = 50;
      if (!opts.header) drawRow(headers, { header: true });
    }
    doc.fontSize(fontSize).font(opts.header ? "Helvetica-Bold" : "Helvetica");
    let x = margin;
    cells.forEach((c, i) => {
      if (opts.header) {
        doc.rect(x, y - 2, colW[i], h + 2).fill(ORANGE);
        doc.fillColor("#ffffff");
      } else {
        doc.fillColor("#1c1917");
      }
      doc.text(c || "", x + 3, y + 2, { width: colW[i] - 6, lineBreak: true });
      x += colW[i];
    });
    doc.fillColor("#1c1917");
    doc.moveTo(margin, y + h).lineTo(doc.page.width - margin, y + h).strokeColor("#e7e5e4").lineWidth(0.5).stroke();
    y += h;
  };

  drawRow(headers, { header: true });
  rows.forEach((r) => drawRow(r));
  return y;
}

export async function buildPdf(result: ReportResult, meta: PdfMeta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ---- cover ----
    doc.rect(0, 0, doc.page.width, 6).fill(ORANGE);
    doc.moveDown(6);
    doc.fontSize(13).fillColor(GREY).text(meta.org, { align: "left" });
    doc.fontSize(11).fillColor(GREY).text("Internal Audit Activity", { align: "left" });
    doc.moveDown(2);
    doc.fontSize(30).fillColor(ORANGE).text(meta.title);
    doc.moveDown(1);
    doc.fontSize(11).fillColor("#1c1917");
    doc.text(`Period: ${meta.period}`);
    doc.text(`Prepared by: ${meta.preparedBy}`);
    doc.text(`Data as at: ${meta.dataAt.toLocaleString("en-ZA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`);
    const active = Object.entries(meta.filters).filter(([, v]) => v && v !== "all");
    doc.moveDown(0.5);
    doc.text(`Filters applied: ${active.length ? active.map(([k, v]) => `${meta.filterLabels[k] ?? k} = ${v}`).join(" · ") : "None (all records)"}`);
    doc.text(`Records: ${result.rows.length}`);
    if (meta.contents?.length) {
      doc.moveDown(1.5);
      doc.fontSize(14).fillColor(ORANGE).text("Contents");
      meta.contents.forEach((c, i) => doc.fontSize(10).fillColor("#1c1917").text(`${i + 1}. ${c}`));
    }
    doc.moveDown(2);
    doc.fontSize(8).fillColor(GREY).text(meta.confidentiality ?? "Confidential — for Audit Committee and Internal Audit use only.", { align: "left" });

    // ---- summary ----
    doc.addPage();
    doc.fontSize(16).fillColor(ORANGE).text("Summary");
    doc.moveDown(0.5);
    const cols = Math.min(result.summary.length, 6);
    const boxW = (doc.page.width - 72 - (cols - 1) * 8) / cols;
    result.summary.forEach((s, i) => {
      const x = 36 + i * (boxW + 8);
      doc.rect(x, doc.y, boxW, 44).fillAndStroke("#fff7ed", "#fed7aa");
      doc.fontSize(15).fillColor(ORANGE).text(String(s.value), x + 6, doc.y + 6, { width: boxW - 12 });
      doc.fontSize(7).fillColor(GREY).text(s.label, x + 6, doc.y + 2, { width: boxW - 12 });
    });
    doc.y += 52;
    doc.moveDown(1);

    // ---- charts ----
    for (const chart of result.charts.filter((c) => c.kind === "bars")) {
      if (chart.kind !== "bars") continue;
      doc.fontSize(12).fillColor("#1c1917").text(chart.title);
      const max = Math.max(1, ...chart.rows.map((r) => r.value));
      chart.rows.forEach((r) => {
        const y = doc.y + 3;
        doc.fontSize(7).fillColor("#1c1917").text(r.label.slice(0, 42), 36, y, { width: 170, lineBreak: false });
        doc.rect(210, y, (r.value / max) * (doc.page.width - 300), 9).fill(r.color ?? ORANGE);
        doc.fontSize(7).fillColor("#1c1917").text(String(r.value), doc.page.width - 80, y, { width: 40 });
        doc.y += 14;
      });
      doc.moveDown(0.8);
    }

    // ---- table ----
    doc.fontSize(16).fillColor(ORANGE).text(meta.title, 36, Math.max(doc.y, 60));
    doc.moveDown(0.5);
    const headers = ["#", ...result.columns.map((c) => c.label)];
    const rows = result.rows.map((r, i) => [
      String(i + 1),
      ...result.columns.map((c) => (r[c.key] instanceof Date ? (r[c.key] as Date).toLocaleDateString("en-ZA") : String(r[c.key] ?? ""))),
    ]);
    table(doc, headers, rows, doc.y);

    // ---- page numbers + footer on every page ----
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor(GREY);
      doc.text(
        `${meta.confidentiality ?? "Confidential — for Audit Committee and Internal Audit use only."}  ·  ${meta.org} Internal Audit`,
        36,
        doc.page.height - 28,
        { align: "left", lineBreak: false },
      );
      doc.text(`Page ${i + 1} of ${range.count}`, doc.page.width - 120, doc.page.height - 28, { align: "right", lineBreak: false });
    }

    doc.end();
  });
}
