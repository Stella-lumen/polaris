import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeclarationMatrix } from "@/components/declaration-matrix";
import { requireUser, canAuthorise } from "@/lib/auth";
import { isEffective } from "@/lib/declarations";

export const instant = false;

export default async function AuditorDeclarationsPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const user = await requireUser();
  const engagement = await prisma.engagement.findFirst({ where: { id: engagement_id, deleted: false } });
  if (!engagement) notFound();

  const [team, declarations, rows] = await Promise.all([
    prisma.engagementAuditor.findMany({
      where: { engagement_id, deleted: false },
      include: { r_user: true },
      orderBy: { created_at: "asc" },
    }),
    prisma.declaration.findMany({
      where: { deleted: false, disabled: false },
      include: { r_declaration_section: true },
      orderBy: [{ declaration_section_id: "asc" }, { created_at: "asc" }],
    }),
    prisma.engagementAuditorDeclaration.findMany({
      where: { engagement_id, deleted: false },
      orderBy: { signed_at: "desc" },
    }),
  ]);

  const myAuditor = team.find((a) => a.user_id === user.id);
  const canReview = canAuthorise(user) || team.some((a) => a.user_id === user.id && ["LEAD", "CAE"].includes(a.position_on_audit ?? ""));

  // latest row per auditor|declaration
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const k = `${r.engagement_auditor_id}|${r.declaration_id}`;
    if (!latest.has(k)) latest.set(k, r);
  }

  const sections = new Map<string, { name: string; decls: { id: string; text: string }[] }>();
  for (const d of declarations) {
    const sName = d.r_declaration_section?.custom_name ?? d.r_declaration_section?.name ?? "Other";
    if (!sections.has(sName)) sections.set(sName, { name: sName, decls: [] });
    sections.get(sName)!.decls.push({ id: d.id, text: d.custom_text ?? d.declaration_text ?? "" });
  }

  const signedCount = [...latest.values()].filter(isEffective).length;
  const openConflicts = [...latest.values()].filter((r) => r.status === "CONFLICT");

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute left-0">
          <Link
            href={`/engagements/${engagement_id}/dashboard`}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
          >
            Back to Dashboard
          </Link>
        </div>
        <h2 className="text-lg font-medium text-orange-600">Independence assessment</h2>
        <div className="absolute right-0 flex gap-2">
          <a
            href={`/engagements/${engagement_id}/auditor-declarations/export`}
            target="_blank"
            title="Download all signed declarations for this engagement as a branded PDF"
            className="rounded-md border border-orange-600 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
          >
            Export signed declarations
          </a>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {team.map((a) => (
          <a
            key={a.id}
            href={`/engagements/${engagement_id}/auditor-declarations/export?auditor=${a.id}`}
            target="_blank"
            title={`Export ${a.r_user?.first_name ?? "this person"}'s signed declarations`}
            className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-orange-100 hover:text-orange-800"
          >
            {a.r_user ? `${a.r_user.first_name ?? ""} ${a.r_user.last_name ?? ""}`.trim() || a.r_user.email : "Team member"}
          </a>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {signedCount} of {team.length * declarations.length} declarations signed across the team.
        You can only sign your own row — the wording is kept exactly as signed, even if it is edited later.
        {" "}{myAuditor ? "" : "You are not on this engagement's team, so nothing below can be signed by you."}
      </p>
      <DeclarationMatrix
        engagementId={engagement_id}
        myAuditorId={myAuditor?.id ?? null}
        canReview={canReview}
        auditors={team.map((a) => ({
          id: a.id,
          name: a.r_user ? `${a.r_user.first_name ?? ""} ${a.r_user.last_name ?? ""}`.trim() || (a.r_user.email ?? "Team member") : "Team member",
          position: a.position_on_audit ?? "",
        }))}
        sections={[...sections.values()]}
        signings={[...latest.entries()].map(([key, r]) => ({
          key,
          rowId: r.id,
          status: r.status ?? "SIGNED",
          signedText: r.signed_text,
          conflictReason: r.conflict_reason,
          reviewComment: r.review_comment,
          signedAt: r.signed_at ?? r.confirmation_date,
          reviewer: r.reviewed_by_user_id,
          discloserUserId: team.find((a) => a.id === r.engagement_auditor_id)?.user_id ?? null,
        }))}
        openConflicts={openConflicts.map((r) => {
          const a = team.find((x) => x.id === r.engagement_auditor_id);
          const d = declarations.find((x) => x.id === r.declaration_id);
          return {
            rowId: r.id,
            auditor: a?.r_user ? `${a.r_user.first_name ?? ""} ${a.r_user.last_name ?? ""}`.trim() || (a.r_user.email ?? "Team member") : "Team member",
            discloserUserId: a?.user_id ?? "",
            declaration: (d ? (d.custom_text ?? d.declaration_text ?? "") : "Declaration").slice(0, 120),
            reason: r.conflict_reason ?? "",
          };
        })}
      />
    </div>
  );
}
