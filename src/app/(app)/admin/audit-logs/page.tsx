import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";

export const instant = false;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const [rows, users] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { timestamp: "desc" },
      take: 500,
    }),
    prisma.user.findMany({ select: { id: true, email: true } }),
  ]);
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  const expanded = id ? rows.find((r) => String(r.id) === id) : null;

  // Union of keys across original/new values for the diff table
  const orig = (expanded?.original_values ?? {}) as Record<string, unknown>;
  const next = (expanded?.new_values ?? {}) as Record<string, unknown>;
  const diffKeys = [...new Set([...Object.keys(orig), ...Object.keys(next)])];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      <p className="text-muted-foreground">
        View all system changes and audit trail records. Click a row to expand and see value changes.
      </p>
      <DataGrid
        rows={rows.map((r) => ({
          id: r.id,
          timestamp: r.timestamp?.toISOString() ?? null,
          operation_type: r.operation_type,
          table_name: r.table_name,
          user_email: (r.user_id && emailById.get(r.user_id)) || "Unknown",
        }))}
        hrefPattern="/admin/audit-logs?id={id}"
        pageSize={50}
        colDefs={[
          { field: "id", headerName: "ID", width: 230 },
          { field: "timestamp", headerName: "Timestamp", flex: 1.4 },
          { field: "operation_type", headerName: "Operation" },
          { field: "table_name", headerName: "Table", flex: 2 },
          { field: "user_email", headerName: "User", flex: 1.4 },
        ]}
      />
      {expanded && (
        <div className="rounded-lg border bg-white">
          <div className="border-b px-4 py-2 text-sm font-semibold text-orange-600">
            Value Changes — {expanded.table_name} #{expanded.id} ({expanded.operation_type})
          </div>
          {diffKeys.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 text-left">
                  <th className="px-4 py-2 font-medium">Field</th>
                  <th className="px-4 py-2 font-medium">Old Value</th>
                  <th className="px-4 py-2 font-medium">New Value</th>
                </tr>
              </thead>
              <tbody>
                {diffKeys.map((k) => {
                  const o = orig[k], n = next[k];
                  const changed = JSON.stringify(o) !== JSON.stringify(n);
                  return (
                    <tr key={k} className={`border-b last:border-0 ${changed ? "bg-amber-50" : ""}`}>
                      <td className="px-4 py-1.5 font-medium">{k}</td>
                      <td className="px-4 py-1.5 text-muted-foreground">
                        {o == null ? "—" : typeof o === "object" ? JSON.stringify(o) : String(o)}
                      </td>
                      <td className="px-4 py-1.5">
                        {n == null ? "—" : typeof n === "object" ? JSON.stringify(n) : String(n)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">No value changes recorded.</div>
          )}
        </div>
      )}
    </div>
  );
}
