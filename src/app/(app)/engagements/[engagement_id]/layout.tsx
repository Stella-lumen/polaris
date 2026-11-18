import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { EngagementNav } from "@/components/engagement-nav";

const tabs = [
  { slug: "dashboard", label: "Overview" },
  { slug: "planning", label: "Planning" },
  { slug: "audit-program", label: "Audit Program" },
  { slug: "fieldwork", label: "Fieldwork" },
  { slug: "working-papers", label: "Working Papers" },
  { slug: "findings", label: "Findings" },
  { slug: "reporting", label: "Report" },
  { slug: "tasks", label: "Tasks" },
  { slug: "team", label: "Team & Hours" },
  { slug: "documents", label: "Documents" },
  { slug: "follow-up", label: "Follow-up" },
  { slug: "history", label: "History" },
  { slug: "", label: "Master Data" },
  { slug: "auditor-declarations", label: "Declarations" },
];

export default async function EngagementLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ engagement_id: string }>;
}) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findFirst({
    where: { id: engagement_id, deleted: false },
  });
  if (!engagement) notFound();
  const base = `/engagements/${engagement_id}`;

  return (
    <div className="flex flex-col gap-4">
      <EngagementNav base={base} tabs={tabs} />
      {children}
    </div>
  );
}
