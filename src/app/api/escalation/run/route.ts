import { NextResponse } from "next/server";
import { escalateOverdueWork } from "@/lib/escalation";

/**
 * External scheduler entry point. Call once a day (e.g. Windows Task Scheduler):
 *   curl -X POST -H "x-cron-secret: <CRON_SECRET>" http://server/api/escalation/run
 * Requires the CRON_SECRET environment variable; the endpoint refuses to run
 * without it so the engine cannot be triggered anonymously.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  const r = await escalateOverdueWork();
  return NextResponse.json({ ok: true, ...r });
}
