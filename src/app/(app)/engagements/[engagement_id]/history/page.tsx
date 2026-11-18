import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { toTimeline } from "@/lib/history-sentences";

export default async function EngagementHistoryPage({ params }: { params: Promise<{ engagement_id: string }> }) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findUnique({ where: { id: engagement_id } });
  if (!engagement) notFound();
  const [tasks, papers, findings] = await Promise.all([
    prisma.task.findMany({ where: { engagement_id }, select: { id: true } }),
    prisma.workingPaper.findMany({ where: { engagement_id }, select: { id: true } }),
    prisma.engagementFindingAndRecommendations.findMany({ where: { engagement_id }, select: { id: true } }),
  ]);
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { table_name: { in: ["Engagement", "Engagements"] }, record_id: engagement_id },
        { table_name: { in: ["Task", "Tasks"] }, record_id: { in: tasks.map((t) => t.id) } },
        { table_name: { in: ["Working Papers", "WorkingPaper"] }, record_id: { in: papers.map((p) => p.id) } },
        { table_name: { in: ["Findings", "Finding"] }, record_id: { in: findings.map((f) => f.id) } },
      ],
    },
    orderBy: { timestamp: "desc" },
    take: 80,
  });
  const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))] as string[];
  const users = new Map((await prisma.user.findMany({ where: { id: { in: userIds } } })).map((u) => [u.id, `${u.first_name} ${u.last_name}`]));
  const timeline = toTimeline(logs, users);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-primary">History</h2>
      {timeline.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No activity recorded for this engagement yet.</div>}
      <ol className="relative border-l border-zinc-200 pl-5">
        {timeline.map((ev, i) => (
          <li key={i} className="mb-4">
            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
            <p className="text-sm">{ev.sentence}</p>
            <p className="text-xs text-muted-foreground">{ev.when?.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
