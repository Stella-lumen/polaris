#!/usr/bin/env node
/**
 * Demo: push a directory (AD/Entra ID) user export into Polaris.
 *
 * Usage:
 *   set POLARIS_API_KEY=pk_...            (needs the users:sync scope)
 *   node scripts/sync-ad-users.mjs [path-to-export.json]
 *
 * Defaults to scripts/ad-users.sample.json and http://localhost:3005.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ?? join(here, "ad-users.sample.json");
const base = process.env.POLARIS_BASE_URL ?? "http://localhost:3005";
const key = process.env.POLARIS_API_KEY;

if (!key) {
  console.error("Set POLARIS_API_KEY to an API key with the users:sync scope.");
  process.exit(1);
}

const payload = JSON.parse(readFileSync(file, "utf8"));
console.log(`Syncing ${payload.users.length} directory users to ${base} …`);

const res = await fetch(`${base}/api/v1/users/sync`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-api-key": key },
  body: JSON.stringify({
    deactivate_missing: payload.deactivate_missing ?? false,
    users: payload.users,
  }),
});

const json = await res.json();
console.log(`HTTP ${res.status}  x-request-id: ${res.headers.get("x-request-id")}`);
console.log(JSON.stringify(json, null, 2));
