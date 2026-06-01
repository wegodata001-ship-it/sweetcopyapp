# Vercel — פריסה מה-root

## מבנה המאגר

```
/
├── package.json
├── next.config.ts
├── src/app/page.tsx
├── prisma/
├── public/
└── scripts/
```

**Root Directory ב-Vercel:** השאר ריק (ברירת מחדל = שורש המאגר).

## Build

Vercel מריץ אוטומטית:

```bash
npm install
npm run build   # prisma generate + next build
```

Build תקין אמור לקחת **2–5 דקות** (לא ~6 שניות).

## משתני סביבה

העתק מ-`.env.demo.example` ל-Vercel Environment Variables:

- `DATABASE_URL`, `DIRECT_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `APP_MODE=demo`, `DEMO_ONLY=true`
- `TENANT_DB_SCHEMA=demo`

## Entry point

- `src/app/page.tsx` — `dynamic = "force-dynamic"`
- Middleware מפנה לא מחוברים ל-`/login` (לא 404)

## אם עדיין 404

1. ודא **Root Directory ריק** (לא `wego-erp-v1`)
2. Framework = **Next.js**
3. Redeploy → **Clear build cache**
