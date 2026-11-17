import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeclarationMatrix } from "@/components/declaration-matrix";

export const instant = false;

export default async function AuditorDeclarationsPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({ where: { id: engagement_id, deleted: false } });
  if (!engagement) notFound();

  const [team, declarations, rows] = await Promise.all([
    prisma.engagementAuditor.findMany({
      where: { engagement_id, deleted: false },
      include: { r_user: true },
      orderBy: { created_at: "asc" },
    }),
    prisma.declaration.findMany({
      where: { deleted: false },
      include: { r_declaration_section: true },
      orderBy: [{ declaration_section_id: "asc" }, { created_at: "asc" }],
    }),
    prisma.engagementAuditorDeclaration.findMany({
      where: { engagement_id, deleted: false },
    }),
  ]);

  const confirmed = new Set(
    rows.filter((r) => r.confirmation_date).map((r) => `${r.engagement_auditor_id}|${r.declaration_id}`),
  );

  const sections = new Map<string, { name: string; decls: { id: string; text: string }[] }>();
  for (const d of declarations) {
    const sName = d.r_declaration_section?.custom_name ?? d.r_declaration_section?.name ?? "Other";
    if (!sections.has(sName)) sections.set(sName, { name: sName, decls: [] });
    sections.get(sName)!.decls.push({ id: d.id, text: d.custom_text ?? d.declaration_text ?? "" });
  }

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
        <h2 className="text-lg font-medium text-orange-600">Auditor Declarations</h2>
      </div>
      <DeclarationMatrix
        engagementId={engagement_id}
        auditors={team.map((a) => ({
          id: a.id,
          name: a.r_user ? `${a.r_user.first_name} ${a.r_user.last_name}` : a.id,
          position: a.position_on_audit ?? "",
        }))}
        sections={[...sections.values()]}
        confirmed={[...confirmed]}
      />
    </div>
  );
}
