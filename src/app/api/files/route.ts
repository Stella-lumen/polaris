import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";

// List stored files for an entity (metadata only — no bytes)
export async function GET(req: Request) {
  await requireUser();
  const { searchParams } = new URL(req.url);
  const files = await prisma.storedFile.findMany({
    where: {
      entity_type: searchParams.get("entity_type") ?? undefined,
      entity_id: searchParams.get("entity_id") ?? undefined,
      organization_id: DEMO_ORGANIZATION_ID,
      deleted: false,
    },
    select: { id: true, name: true, mime_type: true, size: true, created_at: true },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(files);
}
