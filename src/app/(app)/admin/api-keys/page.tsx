import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { ApiKeyCreate } from "@/components/api-key-create";
import { revokeApiKey } from "@/lib/actions";

export const instant = false;

export default async function ApiKeysPage() {
  const rows = await prisma.apiKey.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    orderBy: { created_at: "desc" },
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">API Keys</h1>
        <ApiKeyCreate />
      </div>
      <p className="text-sm text-muted-foreground">
        Keys grant scoped read access to the REST endpoints under <code>/api/v1</code> — send them in
        the <code>x-api-key</code> header. The key value is shown once at creation and only its
        SHA-256 hash is stored. See the{" "}
        <a href="/api-docs.html" target="_blank" className="text-orange-600 hover:underline">
          REST API documentation
        </a>{" "}
        for endpoints, scopes and examples.
      </p>
      <DataGrid
        rows={rows.map((k) => ({
          ...k,
          key_hash: `${k.key_hash?.slice(0, 12) ?? ""}…`,
          scopes: Array.isArray(k.scopes) ? (k.scopes as string[]).join(", ") : "",
          status: k.disabled ? "REVOKED" : "ACTIVE",
          expires_at: k.expires_at?.toISOString().slice(0, 10),
          last_used_at: k.last_used_at?.toISOString().slice(0, 10),
          created_at: k.created_at?.toISOString().slice(0, 10),
        })) as unknown as object[]}
        rowActions={["workflow"]}
        workflow={{ steps: ["ACTIVE", "REVOKED"], onAdvance: revokeApiKey }}
        colDefs={[
          { field: "name", headerName: "Name", flex: 1.5 },
          { field: "key_hash", headerName: "Key (hashed)", flex: 1.5 },
          { field: "scopes", headerName: "Scopes" },
          { field: "status", headerName: "Status" },
          { field: "expires_at", headerName: "Expires" },
          { field: "last_used_at", headerName: "Last Used" },
          { field: "created_at", headerName: "Created" },
        ]}
      />
    </div>
  );
}
