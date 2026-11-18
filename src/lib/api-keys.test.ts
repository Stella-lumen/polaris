import { describe, expect, it } from "vitest";
import { bumpCallCount, keyStatus, looksLikeTestKey, refusalReason } from "./api-keys";

const NOW = new Date("2026-06-15T12:00:00Z");

describe("keyStatus — sentence case", () => {
  it("active when enabled and unexpired", () => {
    expect(keyStatus({ disabled: false, expires_at: null }, NOW)).toBe("Active");
  });
  it("expired past the date", () => {
    expect(keyStatus({ disabled: false, expires_at: new Date(NOW.getTime() - 86400_000) }, NOW)).toBe("Expired");
  });
  it("revoked wins over expired", () => {
    expect(keyStatus({ disabled: true, expires_at: new Date(NOW.getTime() - 86400_000) }, NOW)).toBe("Revoked");
  });
});

describe("looksLikeTestKey", () => {
  it.each(["CI test key", "scope test", "temp-verify-declarations", "AD sync demo", "sync demo live", "Tender demo key"])(
    "flags %s", (name) => expect(looksLikeTestKey(name)).toBe(true),
  );
  it("does not flag a real key", () => {
    expect(looksLikeTestKey("Power BI dashboard")).toBe(false);
    expect(looksLikeTestKey(null)).toBe(false);
  });
  it("stays quiet once dismissed", () => {
    expect(looksLikeTestKey("scope test", true)).toBe(false);
  });
});

describe("bumpCallCount — rolling 30 days", () => {
  it("first call starts the window", () => {
    const r = bumpCallCount({}, NOW);
    expect(r.calls_30d).toBe(1);
    expect(r.calls_30d_since).toEqual(NOW);
  });
  it("increments inside the window", () => {
    const since = new Date(NOW.getTime() - 10 * 86400_000);
    const r = bumpCallCount({ calls_30d: 41, calls_30d_since: since }, NOW);
    expect(r.calls_30d).toBe(42);
    expect(r.calls_30d_since).toEqual(since);
  });
  it("resets after 30 days", () => {
    const since = new Date(NOW.getTime() - 31 * 86400_000);
    const r = bumpCallCount({ calls_30d: 500, calls_30d_since: since }, NOW);
    expect(r.calls_30d).toBe(1);
    expect(r.calls_30d_since).toEqual(NOW);
  });
});

describe("refusalReason", () => {
  it("each kind has plain words", () => {
    for (const k of ["missing", "unknown", "revoked", "expired", "scope", "rate_limited"] as const) {
      expect(refusalReason(k)).toBeTruthy();
      expect(refusalReason(k)).not.toMatch(/\b401|403|429\b/);
    }
    expect(refusalReason("scope", "risks:read")).toContain("risks:read");
  });
});
