import { headers } from "next/headers";
import { CodeBlock } from "@/components/code-block";

export const instant = false;

const SCOPES: [string, string][] = [
  ["engagements:read", "Engagements list and detail"],
  ["audit-plan:read", "Annual audit plans"],
  ["risks:read", "Risk assessments"],
  ["findings:read", "Findings and corrective actions"],
  ["followups:read", "Corrective-action follow-up tracking"],
  ["tasks:read", "Scheduled tasks and assignments"],
  ["resources:read", "Time entries / resource allocations"],
  ["reports:read", "Aggregated report summaries"],
  ["documents:read", "Guiding documents and versions"],
  ["templates:read", "Document templates and field definitions"],
  ["notifications:read", "Notification outbox and escalation rules"],
  ["auditlogs:read", "Audit trail entries"],
  ["users:sync", "Directory provisioning (POST only)"],
];

const ENDPOINTS: [string, string, string][] = [
  ["GET", "/health", "Validate the key (any scope)"],
  ["GET", "/engagements", "List engagements"],
  ["GET", "/engagements/{id}", "Engagement detail"],
  ["GET", "/engagement-types", "Engagement types + default-config counts"],
  ["GET", "/engagement-types/{id}", "Type defaults: templates, checklist, budget guide"],
  ["GET", "/audit-plans", "Annual audit plans"],
  ["GET", "/audit-plan-periods", "Plan periods + warnings"],
  ["GET", "/risk-assessments", "Risk register"],
  ["GET", "/findings", "Findings + lifecycle status"],
  ["GET", "/follow-ups", "Corrective actions + overdue flags"],
  ["GET", "/tasks", "Tasks and due dates"],
  ["GET", "/resource-allocations", "Time and expense usage"],
  ["GET", "/reports/summary", "Portfolio aggregates"],
  ["GET", "/documents", "Guiding documents"],
  ["GET", "/templates", "Document templates"],
  ["GET", "/notifications", "Notification outbox"],
  ["GET", "/escalation-rules", "Escalation timings"],
  ["GET", "/audit-logs", "Audit trail entries"],
  ["POST", "/users/sync", "Directory user provisioning"],
];

const ERRORS: [string, string][] = [
  ["400 invalid_parameter", "Bad query parameter — fix and retry"],
  ["401 invalid_key", "Key missing, revoked or expired"],
  ["403 insufficient_scope", "Key lacks the endpoint's scope"],
  ["404 not_found", "Record does not exist"],
  ["429 rate_limited", "Over 120 requests/minute — see Retry-After"],
  ["500 internal_error", "Server error — quote the x-request-id"],
];

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left text-xs uppercase text-muted-foreground">
          {head.map((h) => <th key={h} className="py-1.5 pr-4 font-medium">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b last:border-0">
            {r.map((c, j) => (
              <td key={j} className="py-1.5 pr-4">
                {j === 0 || (head[0] === "Method" && j === 1) ? <code className="text-xs">{c}</code> : c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function ApiDocsPage() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${h.get("host")}`;
  const u = `${base}/api/v1/engagements?page_size=5`;

  const examples: [string, string][] = [
    ["curl", `curl -H "x-api-key: pk_YOUR_KEY" "${u}"`],
    ["Python", `import requests\n\nr = requests.get("${u}", headers={"x-api-key": "pk_YOUR_KEY"})\nfor eng in r.json()["data"]:\n    print(eng["title"], eng["status"])`],
    ["JavaScript", `const res = await fetch("${u}", {\n  headers: { "x-api-key": "pk_YOUR_KEY" },\n});\nconst { data, meta } = await res.json();\nconsole.log(meta.total, "engagements");`],
    ["C#", `var client = new HttpClient();\nclient.DefaultRequestHeaders.Add("x-api-key", "pk_YOUR_KEY");\nvar json = await client.GetStringAsync("${u}");`],
    ["PowerShell", `Invoke-RestMethod -Headers @{ "x-api-key" = "pk_YOUR_KEY" } \`\n  -Uri "${u}" | Select-Object -ExpandProperty data`],
  ];

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">API Documentation</h1>
        <a href="/api/docs" target="_blank" className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500">
          Open interactive docs (Swagger)
        </a>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Quick start</h2>
        <p className="text-sm text-muted-foreground">
          The REST API gives your BI tools and other systems scoped, read-only access to live audit data —
          no manual exports. Base URL: <code>{base}/api/v1</code>. HTTPS is enforced in production.
        </p>
        <CodeBlock title="List engagements" code={examples[0][1]} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Get an API key</h2>
        <p className="text-sm text-muted-foreground">
          Admin → API Keys → New Key. Pick the scopes the integration needs and an expiry (default 90 days).
          The key is shown <b>once</b> — copy it immediately. Only its SHA-256 hash is stored.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Authentication</h2>
        <p className="text-sm text-muted-foreground">
          Send the key in the <code>x-api-key</code> header on every request. Keys in the URL query string
          are rejected — keys must never appear in logs or browser history.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Scopes</h2>
        <Table head={["Scope", "Grants"]} rows={SCOPES.map((r) => [...r])} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Endpoints</h2>
        <Table head={["Method", "Path", "Description"]} rows={ENDPOINTS.map((r) => [...r])} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Paging, filters and sorting</h2>
        <p className="text-sm text-muted-foreground">
          <code>?page=1&amp;page_size=50</code> (max 200) · <code>?status=open</code> ·{" "}
          <code>?updated_since=2026-01-01T00:00:00Z</code> · <code>?sort=-updated_at</code>.
          List responses return <code>{"{ data: [...], meta: { page, page_size, total } }"}</code> and an{" "}
          <code>x-request-id</code> header.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Code examples — list open engagements</h2>
        {examples.map(([lang, code]) => (
          <CodeBlock key={lang} title={lang} code={code.replace("engagements?page_size=5", "engagements?status=open&page_size=5")} />
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Errors</h2>
        <Table head={["Code", "Meaning"]} rows={ERRORS.map((r) => [...r])} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Security best practices</h2>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          <li>Store keys in a secrets manager, never in source code or spreadsheets.</li>
          <li>Grant only the scopes the integration needs; rotate keys before expiry.</li>
          <li>Revoke immediately on suspected compromise — revocation takes effect at once.</li>
          <li>Every auth failure and key lifecycle event is written to the audit trail.</li>
          <li>Rate limit: 120 requests/minute per key. Back off on 429 using Retry-After.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Power BI and Excel</h2>
        <ol className="list-inside list-decimal text-sm text-muted-foreground">
          <li>Power BI: Get Data → Web → Advanced. URL: <code>{base}/api/v1/engagements</code>.</li>
          <li>Add HTTP header: <code>x-api-key</code> = your key. Choose Anonymous auth.</li>
          <li>Expand the <code>data</code> list into a table — refresh pulls live data.</li>
          <li>Excel: Data → Get Data → From Other Sources → From Web, same header.</li>
        </ol>
      </section>
    </div>
  );
}
