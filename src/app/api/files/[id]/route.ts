import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// Download a stored file — streams bytes with the original name/type
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const f = await prisma.storedFile.findFirst({ where: { id, deleted: false } });
  if (!f?.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.mime_type ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${(f.name ?? "file").replace(/"/g, "")}"`,
      "Content-Length": String(f.size ?? f.data.length),
    },
  });
}
