import { prisma } from "@/lib/db";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createReviewNote, advanceReviewNote } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";

export const instant = false;

async function advance(id: string, status: string) {
  "use server";
  await advanceReviewNote(id.split("|")[0], id.split("|")[1], status === "CLEARED" ? "clear" : "verify");
}

export default async function FieldworkReviewPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({ where: { id: engagement_id, deleted: false } });
  if (!engagement) notFound();
  const [joins, docs] = await Promise.all([
    prisma.fieldworkDocumentReviewNote.findMany({
      where: { deleted: false, r_review_note: { engagement_id, deleted: false } },
      include: {
        r_review_note: { include: { r_reviewer_engagement_auditor: { include: { r_user: true } } } },
        r_engagement_fieldwork_document: true,
      },
    }),
    prisma.engagementFieldworkDocument.findMany({ where: { engagement_id, deleted: false } }),
  ]);
  const rows = joins.map((j) => {
    const n = j.r_review_note;
    const u = n?.r_reviewer_engagement_auditor?.r_user;
    return {
      id: `${engagement_id}|${j.review_note_id}`,
      document_reference: j.r_engagement_fieldwork_document?.document_reference,
      note: n?.note,
      reviewer: u ? `${u.first_name} ${u.last_name}` : "",
      status: n?.verified_date ? "VERIFIED" : n?.cleared_date ? "CLEARED" : "OPEN",
      cleared_date: n?.cleared_date?.toISOString().slice(0, 10),
      verified_date: n?.verified_date?.toISOString().slice(0, 10),
    };
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">Fieldwork Documents Review Notes</h2>
          <div className="flex gap-3 text-sm">
            <Link href={`/engagements/${engagement_id}/dashboard`} className="text-orange-600 hover:underline">Back to Dashboard</Link>
            <Link href={`/engagements/${engagement_id}/fieldwork`} className="text-orange-600 hover:underline">Back to Fieldwork</Link>
          </div>
        </div>
        <CreateDialog
          title="Add Note"
          buttonLabel="Add Note"
          action={createReviewNote.bind(null, engagement_id, "fieldwork")}
          fields={[
            { name: "document_id", label: "Document", type: "select", required: true, options: docs.map((d) => ({ value: d.id, label: `${d.document_reference} — ${d.name}` })) },
            { name: "note", label: "Note", type: "textarea", required: true },
          ]}
        />
      </div>
      <DataGrid
        rows={rows as unknown as object[]}
        rowActions={["workflow"]}
        workflow={{ steps: ["OPEN", "CLEARED", "VERIFIED"], onAdvance: advance }}
        colDefs={[
          { field: "document_reference", headerName: "Document Reference" },
          { field: "note", headerName: "Note", flex: 3 },
          { field: "reviewer", headerName: "Reviewer" },
          { field: "status", headerName: "Status" },
          { field: "cleared_date", headerName: "Cleared Date" },
          { field: "verified_date", headerName: "Verified Date" },
        ]}
      />
    </div>
  );
}
