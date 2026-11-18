"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, verifyPassword, hashPassword, requireUser } from "@/lib/auth";

// Brute-force throttle: 5 failed attempts per email locks for 15 minutes
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function login(formData: FormData): Promise<{ error: string } | undefined> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rec = attempts.get(email);
  if (rec && rec.lockedUntil > Date.now()) {
    return { error: `Account temporarily locked — try again in ${Math.ceil((rec.lockedUntil - Date.now()) / 60000)} minutes` };
  }
  const user = await prisma.user.findFirst({
    where: { email: { equals: email }, deleted: false, disabled: false },
  });
  if (!user || !verifyPassword(password, user.password_hash)) {
    const count = (rec?.count ?? 0) + 1;
    attempts.set(email, { count, lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0 });
    return { error: "Invalid email or password" };
  }
  attempts.delete(email);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function changePassword(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!verifyPassword(current, dbUser?.password_hash)) return { error: "Current password is incorrect" };
  if (next.length < 8) return { error: "New password must be at least 8 characters" };
  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash: hashPassword(next), updated_by: user.id },
  });
  return { ok: true };
}
