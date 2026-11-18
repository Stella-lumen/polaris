import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { ApiKeyCreate } from "@/components/api-key-create";
import { EditDialog } from "@/components/edit-dialog";
import { expireApiKey, deleteApiKey, dismissTestKeyFlag, updateApiKey } from "@/lib/actions";
import { keyStatus, looksLikeTestKey } from "@/lib/api-keys";
import { fmtDate, fmtDateTime } from "@/lib/dates";

export const instant = false;

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: editId } = await searchParams;
  const [rows, users] = await Promise.all([
    prisma.apiKey.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { created_at: "desc" },
    }),
    prisma.user.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      select: { id: true, first_name: true, last_name: true, email: true },
    }),
  ]);
  const byId = new Map(users.map((u) => [u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email]));
  const editRow = editId ? rows.find((k) => k.id === editId) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">API keys</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Keys grant scoped, read-only access to the REST endpoints under <code>/api/v1</code> — sent in the{" "}
            <code>x-api-key</code> header. The key value is shown once at creation; only its hash is stored.
            New keys expire after 90 days unless you set a different date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin/api-docs"
            className="rounded-md border border-orange-600 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
          >
            View documentation
          </a>
          <ApiKeyCreate />
        </div>
      </div>
      <DataGrid
        rows={rows.map((k) => {
          const status = keyStatus(k);
          return {
            id: k.id,
            name: k.name ?? "Not assigned",
            purpose: k.purpose ?? "Not assigned",
            key_prefix: k.key_prefix ?? "pk_…",
            scopes: Array.isArray(k.scopes) ? (k.scopes as string[]).join(", ") : "Not assigned",
            status,
            test_flag: looksLikeTestKey(k.name, k.test_flag_dismissed) ? "Looks like a test key" : "",
            expires_at: fmtDate(k.expires_at),
            last_used_at: fmtDateTime(k.last_used_at),
            calls_30d: k.calls_30d ?? 0,
            last_error: k.last_error ?? "",
            created_by: byId.get(k.created_by ?? "") ?? "Not assigned",
            created_at: fmtDate(k.created_at),
            expirable: status === "Active",
            deletable: status !== "Active",
          };
        }) as unknown as object[]}
        hrefPattern="/admin/api-keys?id={id}"
        rowActions={["edit", "expire", "delete"]}
        expireConfig={{
          onExpire: expireApiKey,
          label: "Expire key",
          confirm: "Expire this key? Calls with it will be refused as expired. This cannot be undone.",
        }}
        deleteConfig={{ onDelete: deleteApiKey }}
        colDefs={[
          { field: "name", headerName: "Name", flex: 1.3, tooltipField: "name" },
          { field: "key_prefix", headerName: "Key", width: 110 },
          { field: "purpose", headerName: "Purpose", flex: 1.4, tooltipField: "purpose" },
          { field: "scopes", headerName: "Scopes", flex: 1.6, tooltipField: "scopes" },
          { field: "status", headerName: "Status", width: 95 },
          { field: "test_flag", headerName: "Flag", flex: 1, tooltipField: "test_flag" },
          { field: "expires_at", headerName: "Expires", width: 120 },
          { field: "last_used_at", headerName: "Last used", width: 150 },
          { field: "calls_30d", headerName: "Calls (30 days)", width: 120 },
          { field: "last_error", headerName: "Last error", flex: 1.4, tooltipField: "last_error" },
          { field: "created_by", headerName: "Created by", flex: 1.1, tooltipField: "created_by" },
          { field: "created_at", headerName: "Created", width: 120 },
        ]}
      />
      <TestKeyDecisions rows={rows.filter((k) => looksLikeTestKey(k.name, k.test_flag_dismissed))} />
      {editRow && (
        <EditDialog
          title="Edit API key"
          returnPath="/admin/api-keys"
          action={updateApiKey.bind(null, editRow.id)}
          values={{ name: editRow.name, purpose: editRow.purpose }}
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "purpose", label: "Purpose", placeholder: "e.g. Power BI dashboard refresh" },
          ]}
        />
      )}
    </div>
  );
}

function TestKeyDecisions({ rows }: { rows: { id: string; name: string | null; disabled: boolean }[] }) {
  if (!rows.length) return null;
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold text-amber-900">Keys that look like tests</h3>
      <p className="mt-1 text-xs text-amber-800">
        These look like developer or demo keys. Nothing is changed until you decide — one at a time.
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {rows.map((k) => (
          <li key={k.id} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm">
            <span><span className="font-medium">{k.name}</span> <span className="text-xs text-muted-foreground">— looks like a test key</span></span>
            <span className="flex gap-2">
              <form action={dismissTestKeyFlag.bind(null, k.id)}>
                <button className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50" title="This is a real key — hide the flag">
                  This is a real key
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  const { expireApiKey: go } = await import("@/lib/actions");
                  await go(k.id);
                }}
              >
                <button className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50" title="Expire it so calls are refused">
                  Expire it
                </button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
