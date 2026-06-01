# DEMO database — schema `hlwait` only

## Reset DEMO data layer (Supabase `khwwxynldoimdrnecfan` only)

```bash
npm run demo:hlwait:reset
```

This runs:

1. Safety check — refuses production / wrong project refs
2. `prisma db push --accept-data-loss` — syncs **hlwait** tables only
3. `prisma db seed` — admin, employee, demo customer & products

## Seed logins

| Role     | Email               | Password     |
|----------|---------------------|--------------|
| admin    | admin@sweet.demo    | Admin123!    |
| employee | employee@sweet.demo | Employee123! |

## Do not use on production

- No `prisma migrate dev` for this repo
- No `db push --force-reset` on production projects
- Set `DEMO_BLOCKED_SUPABASE_REFS` to your production ref in `.env.local`

## Prisma schema

Single file: `prisma/schema.prisma` — all models map to `public.hlwait_*` tables.

Legacy `public.*` ERP tables are **not** managed by Prisma anymore; they may still exist on old DBs but are unused by this schema.
