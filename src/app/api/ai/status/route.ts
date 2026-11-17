import { NextResponse } from "next/server";
import { aiConfig, aiEnabled } from "@/lib/ai";

// Mirrors the observed contract
export function GET() {
  const cfg = aiConfig();
  return NextResponse.json({
    enabled: aiEnabled(),
    model: cfg.model,
    region: cfg.region,
    dataResidency: cfg.dataResidency,
  });
}
