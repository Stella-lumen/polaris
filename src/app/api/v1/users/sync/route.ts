import { apiKeyAuth, apiErr } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/users/sync — directory (Active Directory / Entra ID) user provisioning.
 *
 * Demo extension to the read-only v1 API. Accepts an export of directory users,
 * upserts them by email, maps AD groups to Polaris roles, and optionally
 * deactivates previously-synced users that are no longer in the directory.
 * Requires the `users:sync` scope.
 *
 * Body:
 * {
 *   "deactivate_missing": false,
 *   "users": [
 *     { "external_id": "ad-object-guid", "first_name": "…", "last_name": "…",
 *       "email": "…", "ad_group": "AGR-IAA-CAE" }
 *   ]
 * }
 */

const GROUP_ROLE_MAP: Record<string, string> = {
  "AGR-IAA-ADMINS": "org:admin",
  "AGR-IAA-CAE": "org:chief_audit_executive",
  "AGR-IAA-AUDITORS": "org:member",
  "AGR-IAA-REGULATOR": "org:regulator",
  "AGR-IAA-PREPARERS": "org:delegated_preparer",
};

const MAX_USERS = 500;

type SyncUser = {
  external_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  ad_group?: string;
};

export async function POST(req: Request) {
  const auth = await apiKeyAuth(req, "users:sync");
  if ("error" in auth) return auth.error;
  const rid = auth.requestId;

  let body: { deactivate_missing?: boolean; users?: SyncUser[] };
  try {
    body = await req.json();
  } catch {
    return apiErr(rid, 400, "invalid_parameter", "Request body must be valid JSON.");
  }
  if (!Array.isArray(body.users) || body.users.length === 0) {
    return apiErr(rid, 400, "invalid_parameter", "Body must contain a non-empty 'users' array.");
  }
  if (body.users.length > MAX_USERS) {
    return apiErr(rid, 400, "invalid_parameter", `A maximum of ${MAX_USERS} users may be synced per request.`);
  }

  const now = new Date();
  const warnings: string[] = [];
  let created = 0, updated = 0, unchanged = 0, deactivated = 0;
  const seenIds = new Set<string>();

  for (const [i, u] of body.users.entries()) {
    const email = u.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      warnings.push(`users[${i}]: skipped — missing or invalid email.`);
      continue;
    }
    const role = u.ad_group ? GROUP_ROLE_MAP[u.ad_group] : undefined;
    if (u.ad_group && !role) {
      warnings.push(`users[${i}] (${email}): unknown ad_group '${u.ad_group}' — defaulted to org:member.`);
    }
    const target = {
      first_name: u.first_name?.trim() || null,
      last_name: u.last_name?.trim() || null,
      role: role ?? "org:member",
      clerk_id: u.external_id?.trim() || null,
      disabled: false,
      updated_at: now,
      updated_by: "directory-sync",
    };

    const existing = await prisma.user.findFirst({
      where: { organization_id: auth.org, email, deleted: false },
    });
    if (!existing) {
      const row = await prisma.user.create({
        data: { ...target, email, organization_id: auth.org, created_by: "directory-sync", created_at: now },
      });
      seenIds.add(row.id);
      created++;
      await logAudit("Users", row.id, "INSERT", { email, role: target.role, source: "directory-sync", ad_group: u.ad_group }, { system: true, note: "directory-sync" });
      continue;
    }
    seenIds.add(existing.id);
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const f of ["first_name", "last_name", "role", "clerk_id"] as const) {
      if ((existing[f] ?? null) !== (target[f] ?? null)) changes[f] = { old: existing[f], new: target[f] };
    }
    if (existing.disabled) changes.disabled = { old: true, new: false };
    if (Object.keys(changes).length === 0) { unchanged++; continue; }
    await prisma.user.update({ where: { id: existing.id }, data: target });
    updated++;
    const oldVals = Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old])) as Prisma.InputJsonValue;
    const newVals = { ...Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new])), source: "directory-sync" } as Prisma.InputJsonValue;
    await logAudit("Users", existing.id, "UPDATE", newVals, { system: true, originalValues: oldVals, note: "directory-sync" });
  }

  if (body.deactivate_missing) {
    // Only accounts provisioned by the sync are ever deactivated — manually
    // created or pre-existing users are never touched.
    const stale = await prisma.user.findMany({
      where: {
        organization_id: auth.org, deleted: false, disabled: false,
        created_by: "directory-sync", id: { notIn: [...seenIds] },
      },
      select: { id: true, email: true },
    });
    for (const s of stale) {
      await prisma.user.update({ where: { id: s.id }, data: { disabled: true, updated_at: now, updated_by: "directory-sync" } });
      await logAudit("Users", s.id, "UPDATE", { disabled: true, source: "directory-sync" }, { system: true, originalValues: { disabled: false }, note: "directory-sync" });
    }
    deactivated = stale.length;
  }

  return NextResponse.json(
    { data: { created, updated, unchanged, deactivated, warnings } },
    { headers: { "x-request-id": rid } },
  );
}
