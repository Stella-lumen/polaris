// Generate supabase/schema.sql from prisma/ddl/postgresql.sql (full app schema).
import { readFileSync, writeFileSync } from "node:fs";

let sql = readFileSync("prisma/ddl/postgresql.sql", "utf8");

sql = sql.replaceAll("TIMESTAMP(3)", "TIMESTAMPTZ");
sql = sql.replaceAll('"id" TEXT NOT NULL,', '"id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,');
sql = sql.replace('-- CreateSchema\nCREATE SCHEMA IF NOT EXISTS "public";\n\n', "");

const tables = [...sql.matchAll(/CREATE TABLE "([a-z_]+)"/g)].map((m) => m[1]);
const withUpdatedAt = tables.filter((t) =>
  new RegExp('CREATE TABLE "' + t + '"[\\s\\S]*?"updated_at" TIMESTAMPTZ').test(sql));

const header = `-- =====================================================================
-- POLARIS INTERNAL AUDIT — COMPLETE Supabase / PostgreSQL schema
-- Generated from the FULL app schema (prisma/schema.prisma — ${tables.length} tables)
--
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Notes:
--   * Table/column names match the app's @@map names exactly — the
--     existing Prisma client can point at this DB unchanged.
--   * "user" is quoted throughout (reserved word in Postgres). In
--     Supabase it lives in the public schema — no clash with auth.users.
--   * TEXT ids default to gen_random_uuid() for manual inserts; the app
--     supplies its own ulid() ids on write, which remains valid.
--   * updated_at is maintained by set_updated_at() triggers (bottom).
-- =====================================================================

create extension if not exists pgcrypto;

`;

const triggerBlock = `
-- ================= updated_at triggers =================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

` + withUpdatedAt.map((t) => `create trigger trg_${t}_updated before update on "${t}" for each row execute function set_updated_at();`).join("\n");

const rls = `

-- ===================== ROW LEVEL SECURITY =============================
-- Left DISABLED: the app connects as service role / direct connection.
-- Enable per-table once per-organisation isolation is wired:
--
` + tables.map((t) => `-- alter table "${t}" enable row level security;`).join("\n") + "\n";

writeFileSync("supabase/schema.sql", header + sql + triggerBlock + rls);
console.log("tables:", tables.length, "| triggers:", withUpdatedAt.length, "| lines:", (header + sql + triggerBlock + rls).split("\n").length);
