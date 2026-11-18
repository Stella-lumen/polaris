import { EngagementNav } from "@/components/engagement-nav";

const tabs = [
  { slug: "", label: "Overview" },
  { slug: "time-entries", label: "Time entries" },
  { slug: "timesheets", label: "Timesheets" },
  { slug: "expenses", label: "Expenses" },
  { slug: "leave", label: "Leave & time off" },
];

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-primary">Resource Allocation</h1>
      <EngagementNav base="/resources" tabs={tabs} />
      {children}
    </div>
  );
}
