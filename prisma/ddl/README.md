# Database DDL artifacts

Generated from `prisma/schema.prisma` via `prisma migrate diff --from-empty --to-schema-datamodel`.

| File | Target | Tender status |
|---|---|---|
| `postgresql.sql` | PostgreSQL 16 | Approved (infra item 3) |
| `mysql.sql` | MySQL 8.3 | Approved |
| `sqlserver.sql` | SQL Server 2022 | Approved — `Json` fields emitted as `NVARCHAR(MAX)` (SQL Server has no JSON column type); cyclic cascades emitted as `NO ACTION` (SQL Server requirement) |
| `sqlite.sql` | SQLite | Demo only — not tender-compliant |

Regenerate after schema changes:

```sh
for prov in postgresql mysql; do
  sed "s/provider = \"sqlite\"/provider = \"$prov\"/" prisma/schema.prisma > /tmp/s-$prov.prisma
  npx prisma migrate diff --from-empty --to-schema-datamodel /tmp/s-$prov.prisma --script > prisma/ddl/$prov.sql
done
# sqlserver: additionally map Json -> String @db.NVarChar(Max) and add
# onDelete/onUpdate NoAction to FK-side @relation attributes, then same diff.
```

Going live: create the target database, apply the matching file, point `DATABASE_URL` at it, run `prisma/seed.mjs`.
