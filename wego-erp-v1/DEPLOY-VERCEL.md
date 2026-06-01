# Vercel — תיקון 404 / Deploy ב-6 שניות

## סיבת הבעיה

המאגר ב-GitHub בנוי כך:

```
/                    ← Vercel בונה מכאן (ברירת מחדל)
  README.md
  package-lock.json  (ריק — אין Next.js)
  wego-erp-v1/       ← האפליקציה האמיתית
    package.json
    src/app/page.tsx
    next.config.ts
```

כש-**Root Directory** לא מוגדר, Vercel לא מריץ `next build` → פריסה של ~6 שניות → **404 NOT_FOUND**.

## הפתרון (חובה)

ב-Vercel Dashboard → **Project → Settings → General → Root Directory**:

```
wego-erp-v1
```

שמור → **Redeploy** (ללא cache).

## אימות אחרי תיקון

Build אמור לקחת **2–5 דקות** (לא 6 שניות), ובלוגים:

- `▲ Next.js`
- `Route (app)` עם `/`, `/login`, …
- `prisma generate`

## משתני סביבה ב-Vercel

העתק מ-`.env.demo.example` (פרויקט Supabase DEMO בלבד):

- `DATABASE_URL`, `DIRECT_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `APP_MODE=demo`, `DEMO_ONLY=true`
- `TENANT_DB_SCHEMA=demo`

## Entry point

- `src/app/page.tsx` — קיים, `dynamic = "force-dynamic"`
- אין `pages/index.tsx` (App Router בלבד)

## Middleware

- `src/middleware.ts` — מפנה לא מחוברים ל-`/login` (לא 404)
- אין redirect שובר לנתיב לא קיים

## אם עדיין 404

1. ודא Root Directory = `wego-erp-v1`
2. ודא Framework = **Next.js**
3. מחק `outputDirectory` מ-override ב-Vercel (אם הוגדר ידנית)
4. Redeploy with **Clear build cache**
