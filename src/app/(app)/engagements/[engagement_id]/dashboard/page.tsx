import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SquarePen } from "lucide-react";

export const instant = false;

const stages = [
  { n: 1, slug: "auditor-declarations", name: "Independence Assessment" },
  { n: 2, slug: "planning", name: "Engagement Planning" },
  { n: 3, slug: "audit-program", name: "Engagement Audit Program" },
  { n: 4, slug: "fieldwork", name: "Engagement Fieldwork" },
  { n: 5, slug: "reporting", name: "Engagement Reporting" },
];

type StageItem = { prepared_date?: Date | null; authorised_date?: Date | null };

function stageStatus(items: StageItem[]) {
  if (items.length && items.every((i) => i.authorised_date)) return "AUTHORISED";
  if (items.some((i) => i.prepared_date)) return "PREPARED";
  return "PENDING";
}

const badgeClass: Record<string, string> = {
  PENDING: "bg-red-500",
  PREPARED: "bg-amber-500",
  AUTHORISED: "bg-emerald-600",
};

export default async function EngagementDashboardPage({
  params,
}: {
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({
    where: { id: engagement_id, deleted: false },
    include: { r_annual_audit_plan: true, r_engagement_type: true },
  });
  if (!engagement) notFound();

  const where = { engagement_id, deleted: false };
  const [declarations, planningDocs, programItems, fieldworkDocs, reportDocs] = await Promise.all([
    prisma.engagementAuditorDeclaration.findMany({ where, select: { authorised_date: true } }),
    prisma.engagementPlanningDocument.findMany({ where, select: { prepared_date: true, authorised_date: true } }),
    prisma.engagementAuditProgramItem.findMany({ where, select: { prepared_date: true, authorised_date: true } }),
    prisma.engagementFieldworkDocument.findMany({ where, select: { prepared_date: true, authorised_date: true } }),
    prisma.engagementReportDocument.findMany({ where, select: { prepared_date: true, authorised_date: true } }),
  ]);
  const stageItems = [declarations, planningDocs, programItems, fieldworkDocs, reportDocs];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-semibold text-primary">
        Engagement Dashboard - {engagement.engagement_name} ({engagement.engagement_number})
      </h2>
      <div>
        <Link
          href={`/engagements/${engagement_id}`}
          className="rounded-md bg-orange-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-500"
        >
          Master Data
        </Link>
      </div>
      <div className="flex w-full max-w-xl flex-col gap-4 pl-8">
        {stages.map((s, i) => {
          const items = stageItems[i] as StageItem[];
          const status = stageStatus(items);
          return (
            <Link
              key={s.slug}
              href={`/engagements/${engagement_id}/${s.slug}`}
              style={{ marginLeft: i * 24 }}
              className="flex items-center justify-between rounded-xl border bg-background px-5 py-4 shadow-sm transition-colors hover:border-orange-300"
            >
              <span className="text-sm">
                {s.n}. {s.name}
              </span>
              <span className="flex items-center gap-4">
                <SquarePen className="h-4 w-4 text-neutral-600" />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase text-white ${badgeClass[status]}`}
                >
                  {status} ({items.length})
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
