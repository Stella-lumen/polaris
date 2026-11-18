import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { logAudit } from "@/lib/actions";

const INLINE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp", "text/plain", "text/html"]);

// Download (or inline preview with ?inline=1) a stored file.
// Login required. If the file carries view_roles, the user's role must be listed.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const f = await prisma.storedFile.findFirst({ where: { id, organization_id: DEMO_ORGANIZATION_ID, deleted: false } });
  if (!f?.data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const roles = Array.isArray(f.view_roles) ? (f.view_roles as string[]) : null;
  if (roles && roles.length && !roles.includes(user.role ?? "") && user.role !== "org:admin") {
    await logAudit("Documents", f.id, "DENIED", { file: f.name, by: user.id });
    return NextResponse.json({ error: "You do not have access to this document" }, { status: 403 });
  }

  const inline = new URL(req.url).searchParams.get("inline") === "1";
  await logAudit("Documents", f.id, inline ? "VIEW" : "DOWNLOAD", { file: f.name, by: user.id });

  const canInline = INLINE_TYPES.has(f.mime_type ?? "");
  return new NextResponse(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.mime_type ?? "application/octet-stream",
      "Content-Disposition": `${inline && canInline ? "inline" : "attachment"}; filename="${(f.name ?? "file").replace(/"/g, "")}"`,
      "Content-Length": String(f.size ?? f.data.length),
    },
  });
}
