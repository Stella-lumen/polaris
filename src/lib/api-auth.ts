import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";

/** Per the published API spec: 120 requests/minute per key. */
const RATE_LIMIT = 120;
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; reset: number }>();

type ApiError = { error: NextResponse; requestId: string };
type ApiOk = { org: string; requestId: string };

function err(status: number, code: string, message: string, requestId: string, extra?: Record<string, string>): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "x-request-id": requestId, ...extra } },
  );
}

export function apiErr(requestId: string, status: number, code: string, message: string) {
  return err(status, code, message, requestId);
}

/** Validates x-api-key, enforces scope + rate limit. Returns {org} or an error response. */
export async function apiKeyAuth(req: Request, scope?: string): Promise<ApiError | ApiOk> {
  const requestId = randomUUID();
  const url = new URL(req.url);
  if (url.searchParams.has("api_key") || url.searchParams.has("key")) {
    return { error: err(400, "invalid_parameter", "API keys are not accepted in the URL — send the x-api-key header.", requestId), requestId };
  }
  const key = req.headers.get("x-api-key") ?? "";
  if (!key) {
    void auditAuthFail(requestId, null, "missing key");
    return { error: err(401, "invalid_key", "The key is missing, wrong, revoked or expired.", requestId), requestId };
  }
  const hash = createHash("sha256").update(key).digest("hex");
  const k = await prisma.apiKey.findFirst({ where: { key_hash: hash, deleted: false } });
  if (!k || k.disabled || (k.expires_at && k.expires_at < new Date())) {
    const reason = !k ? "unknown" : k.disabled ? "revoked" : "expired";
    void refuse(requestId, k?.id ?? null, reason);
    return { error: err(401, "invalid_key", "The key is missing, wrong, revoked or expired.", requestId), requestId };
  }

  const now = Date.now();
  let b = buckets.get(k.id);
  if (!b || b.reset < now) {
    b = { count: 0, reset: now + WINDOW_MS };
    buckets.set(k.id, b);
  }
  b.count++;
  if (b.count > RATE_LIMIT) {
    void refuse(requestId, k.id, "rate_limited");
    return {
      error: err(429, "rate_limited", "Rate limit exceeded — wait and retry.", requestId, {
        "Retry-After": String(Math.ceil((b.reset - now) / 1000)),
      }),
      requestId,
    };
  }

  const scopes = Array.isArray(k.scopes) ? (k.scopes as string[]) : [];
  if (scope && !scopes.includes(scope)) {
    void refuse(requestId, k.id, "scope", scope);
    return { error: err(403, "insufficient_scope", `This key does not have the ${scope} scope.`, requestId), requestId };
  }

  const { bumpCallCount } = await import("@/lib/api-keys");
  const bump = bumpCallCount(k);
  await prisma.apiKey.update({
    where: { id: k.id },
    data: { last_used_at: new Date(), calls_30d: bump.calls_30d, calls_30d_since: bump.calls_30d_since },
  });
  if (!k.last_used_at) {
    void auditUse(requestId, k.id, k.name, `was used for the first time — a call to ${scope ?? "the API"} succeeded`);
  }
  return { org: k.organization_id ?? DEMO_ORGANIZATION_ID, requestId };
}

/** Logs API auth failures + stamps the key's last-error — never the raw key. Fire-and-forget. */
async function refuse(requestId: string, keyId: string | null, kind: "unknown" | "revoked" | "expired" | "scope" | "rate_limited", scope?: string) {
  const { refusalReason } = await import("@/lib/api-keys");
  const reason = refusalReason(kind, scope);
  try {
    if (keyId) await prisma.apiKey.update({ where: { id: keyId }, data: { last_error: reason, last_error_at: new Date() } });
    const { logAudit } = await import("@/lib/audit");
    await logAudit("Api Keys", keyId ?? "unknown", "AUTH_FAIL",
      { message: kind === "unknown" ? "A call with an unrecognised API key was refused" : `A call was refused — ${reason.toLowerCase()}` },
      { system: true });
  } catch { /* auditing must never break auth */ }
}

async function auditAuthFail(requestId: string, keyId: string | null, reason: string) {
  try {
    const { logAudit } = await import("@/lib/audit");
    await logAudit("Api Keys", keyId ?? "unknown", "AUTH_FAIL", { reason, request_id: requestId }, { system: true });
  } catch { /* auditing must never break auth */ }
}

async function auditUse(requestId: string, keyId: string, keyName: string | null, what: string) {
  try {
    const { logAudit } = await import("@/lib/audit");
    await logAudit("Api Keys", keyId, "USE", { message: `The API key "${keyName ?? "unnamed"}" ${what}` }, { system: true });
  } catch { /* auditing must never break auth */ }
}

export type ListQuery = {
  page: number;
  pageSize: number;
  status: string | null;
  updatedSince: Date | null;
  sort: string | null;
};

/** Parses page/page_size/status/updated_since/sort per the spec; returns null + sends 400 on bad input. */
export function listQuery(req: Request, requestId: string): { q: ListQuery } | { error: NextResponse } {
  const url = new URL(req.url);
  const num = (name: string, def: number) => {
    const raw = url.searchParams.get(name);
    if (raw == null) return def;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  };
  const page = num("page", 1);
  const pageSize = num("page_size", 50);
  if (!Number.isFinite(page) || page < 1) {
    return { error: err(400, "invalid_parameter", "Invalid 'page' parameter.", requestId) };
  }
  if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > 200) {
    return { error: err(400, "invalid_parameter", "Invalid 'page_size' parameter (1–200).", requestId) };
  }
  const rawSince = url.searchParams.get("updated_since");
  const updatedSince = rawSince ? new Date(rawSince) : null;
  if (rawSince && (!updatedSince || isNaN(updatedSince.getTime()))) {
    return { error: err(400, "invalid_parameter", "Invalid 'updated_since' parameter — use ISO 8601.", requestId) };
  }
  const sort = url.searchParams.get("sort");
  return { q: { page, pageSize, status: url.searchParams.get("status"), updatedSince, sort } };
}

/** Sort param like "-updated_at" — restricted to an allowlist; returns a 400 response on unknown fields. */
export function orderByFrom(sort: string | null, allowed: string[], fallback: string, requestId: string) {
  if (!sort) return { [fallback]: "desc" } as Record<string, "asc" | "desc">;
  const field = sort.replace(/^-/, "");
  const dir = sort.startsWith("-") ? "desc" : "asc";
  if (!allowed.includes(field)) {
    return err(400, "invalid_parameter", `Invalid 'sort' field '${field}' — allowed: ${allowed.join(", ")}.`, requestId);
  }
  return { [field]: dir } as Record<string, "asc" | "desc">;
}

export function listResponse<T>(requestId: string, rows: T[], total: number, q: ListQuery) {
  return NextResponse.json(
    { data: rows, meta: { page: q.page, page_size: q.pageSize, total } },
    { headers: { "x-request-id": requestId } },
  );
}

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);
const day = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : null);
export { iso as isoDateTime, day as isoDate };
