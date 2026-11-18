import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/actions";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Minimal uncompressed ZIP (STORE method) — no dependencies.
function zip(files: { name: string; data: Buffer }[]) {
  const enc = new TextEncoder();
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(f.data.length, 18); local.writeUInt32LE(f.data.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    parts.push(local, Buffer.from(name), f.data);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0, 8);
    c.writeUInt16LE(0, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(0, 14); c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(f.data.length, 20); c.writeUInt32LE(f.data.length, 24); c.writeUInt16LE(name.length, 28);
    c.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([c, Buffer.from(name)]));
    offset += 30 + name.length + f.data.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, centralBuf, end]);
}

export async function GET(req: Request) {
  const user = await requireUser();
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const docs = await prisma.guidingDocument.findMany({ where: { deleted: false, ...(ids.length ? { id: { in: ids } } : {}) } });
  const allowed = docs.filter((d) => {
    const vr = Array.isArray(d.view_roles) && (d.view_roles as string[]).length ? (d.view_roles as string[]) : null;
    return !vr || vr.includes(user.role ?? "") || user.role === "org:admin";
  });
  const files = await prisma.storedFile.findMany({ where: { entity_type: "guiding_document", entity_id: { in: allowed.map((d) => d.id) }, deleted: false } });
  const entries = files.filter((f) => f.data).map((f) => ({ name: `${allowed.find((d) => d.id === f.entity_id)?.name ?? "document"} - ${f.name}`, data: Buffer.from(f.data!) }));
  if (!entries.length) return new NextResponse("No files to export", { status: 404 });
  await logAudit("Guiding Documents", "export", "DOWNLOAD", { files: entries.length, by: user.id });
  const z = zip(entries);
  return new NextResponse(new Uint8Array(z), {
    headers: { "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="guiding-documents.zip"', "Content-Length": String(z.length) },
  });
}
