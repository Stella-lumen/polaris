import { NextResponse } from "next/server";
import { apiKeyAuth } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req);
  if ("error" in auth) return auth.error;
  return NextResponse.json(
    { data: { status: "ok", key_valid: true } },
    { headers: { "x-request-id": auth.requestId } },
  );
}
