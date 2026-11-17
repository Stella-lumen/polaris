import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const COOKIE = "polaris_session";
const TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const SECRET = process.env.AUTH_SECRET || "polaris-dev-secret-change-in-prod";

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function hashPassword(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw: string, hash: string | null | undefined) {
  return !!hash && bcrypt.compareSync(pw, hash);
}

export async function createSession(userId: string) {
  const payload = `${userId}.${Date.now() + TTL_MS}`;
  const jar = await cookies();
  jar.set(COOKIE, `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export type SessionUser = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  organization_id: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  await connection();
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = Buffer.from(raw.slice(0, dot), "base64url").toString();
  const expected = sign(payload);
  const given = raw.slice(dot + 1);
  if (expected.length !== given.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(given))) return null;
  const [userId, exp] = payload.split(".");
  if (!userId || Number(exp) < Date.now()) return null;
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted: false, disabled: false },
    select: { id: true, email: true, first_name: true, last_name: true, role: true, organization_id: true },
  });
  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/");
  return user;
}

/** Current actor id for audit fields — use inside server actions only. */
export async function actorId(): Promise<string> {
  return (await requireUser()).id;
}

const ADMIN_ROLES = new Set(["org:admin"]);
const AUTHORISE_ROLES = new Set(["org:admin", "org:chief_audit_executive"]);

export const isAdmin = (u: SessionUser) => ADMIN_ROLES.has(u.role ?? "");
export const canAuthorise = (u: SessionUser) => AUTHORISE_ROLES.has(u.role ?? "");

export async function requireRole(roles: string[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role ?? "")) redirect("/dashboard");
  return user;
}
