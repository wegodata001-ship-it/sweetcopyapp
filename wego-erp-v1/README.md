# Sweet Copy App — DEMO

מערכת הדגמה (DEMO) ללקוחות. **אין להשתמש בפרויקט Supabase של ייצור.**

מאגר GitHub: [wegodata001-ship-it/sweetcopyapp](https://github.com/wegodata001-ship-it/sweetcopyapp.git)

---

## עקרונות

| כלל | פירוט |
|-----|--------|
| Supabase נפרד | פרויקט DEMO חדש בלבד |
| Schema מבודד | `demo` (או `hlwait_demo`) — לא `public` לטבלאות ERP |
| אין Production | `DEMO_ONLY=true` חוסם חיבור ל-ref של ייצור |
| נתונים מזויפים | Seed בלבד — לקוחות, מוצרים, הזמנות לדוגמה |
| מבנה האפליקציה | ללא שינוי ארכיטקטורה — התאמת ENV + seed |

---

## משתמשי התחברות (DEMO)

| שם משתמש | סיסמה | תפקיד |
|----------|--------|--------|
| `admin` | `Admin123!` | מנהל (ADMIN) |
| `employee` | `Employee123!` | עובד (EMPLOYEE) |

ההתחברות דרך מסך Login הקיים (`/login`) — מזהה לפי שם משתמש (`fullName`).

---

## התקנה מהירה

### 1. שכפול המאגר

```bash
git clone https://github.com/wegodata001-ship-it/sweetcopyapp.git
cd sweetcopyapp/wego-erp-v1
npm install
```

### 2. Supabase DEMO

1. צרו **פרויקט Supabase חדש** (לא אותו פרויקט של ייצור).
2. **SQL Editor** — הריצו לפי סדר את הקבצים ב-`supabase/migrations/`:
   - `20260601120000_hlwait_schema.sql`
   - `20260601130000_hlwait_bootstrap_rls.sql`
   - `20260601150000_demo_schema_seed.sql` ← נתוני דמו ב-schema `demo`
3. **Settings → API → Exposed schemas** — הוסיפו: `demo`
4. **Storage** — צרו bucket ציבורי (למשל `wego-reports-demo`).

### 3. משתני סביבה

```bash
cp .env.demo.example .env.local
```

מלאו ב-`.env.local` את מפתחות **פרויקט ה-DEMO בלבד**:

```env
APP_MODE=demo
DEMO_ONLY=true

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_DEMO_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

DATABASE_URL=postgresql://postgres.YOUR_DEMO_REF:...
DIRECT_URL=postgresql://postgres.YOUR_DEMO_REF:...

TENANT_DB_SCHEMA=demo
NEXT_PUBLIC_TENANT_DB_SCHEMA=demo

JWT_SECRET=your-long-random-secret

# חסימת ייצור (מומלץ): ref מ-URL של Supabase ייצור
DEMO_BLOCKED_SUPABASE_REFS=your-production-project-ref
```

> **אזהרה:** אל תעתיקו `.env` מייצור. אל תשימו סיסמאות אמיתיות ב-Git.

### 4. מסד נתונים + Seed

```bash
npm run demo:setup
```

> **חשוב:** אל תריצו `npx prisma migrate dev` — זה נכשל על DB עם נתונים ישנים.  
> ל-DEMO השתמשו רק ב-`demo:setup` (מבצע `db push --force-reset`).  
> פירוט: `prisma/DEMO-DATABASE.md`

או ידנית:

```bash
npx prisma db push --force-reset
npx prisma db seed
npm run tenant:bootstrap -- demo
```

### 5. הרצה

```bash
npm run dev
```

פתחו [http://localhost:3000](http://localhost:3000) והתחברו עם `admin` / `Admin123!`.

---

## מבנה Schemas

```
Supabase DEMO Project
├── public          ← משתמשי Login (Prisma User), ERP קיים
└── demo            ← טבלאות tenant (לקוחות, הזמנות, מלאי…) — seed
```

יצירת schema נוסף בעתיד:

```sql
SELECT hlwait.bootstrap_schema('new_client_demo');
```

או:

```bash
npm run tenant:bootstrap -- new_client_demo
```

---

## סקריפטים

| פקודה | תיאור |
|--------|--------|
| `npm run dev` | שרת פיתוח |
| `npm run demo:setup` | push + seed + bootstrap schema |
| `npm run tenant:bootstrap -- demo` | טבלאות + RLS + grants |
| `npx prisma db seed` | משתמשי demo + מלאי לדוגמה |
| `npm run prisma:hlwait:generate` | Prisma client ל-tenant |

---

## קבצים חשובים

| נתיב | תפקיד |
|------|--------|
| `.env.demo.example` | תבנית ENV לדמו |
| `src/lib/demo/` | בדיקות DEMO_ONLY / חסימת ייצור |
| `src/lib/tenant/` | Supabase + Prisma לפי schema דינמי |
| `prisma/seed.ts` | משתמשי admin/employee + מלאי דמו |
| `supabase/migrations/` | bootstrap + seed SQL |

---

## הצגה ללקוחות

- כל הנתונים ב-DB הם **דוגמה בלבד**.
- מומלץ: `EMAIL_TEST_MODE=true`, `SYSTEM_CLEAN_MODE=true`.
- פרסום: Vercel/Netlify עם משתני ENV של **פרויקט DEMO** בלבד.

---

## פיתוח נוסף (tenant layer)

קריאות Supabase ל-schema `demo`:

```typescript
import { getTenantSupabaseServiceClient } from "@/lib/tenant";

const db = getTenantSupabaseServiceClient();
const { data } = await db!.fromTenant("customers").select("*");
```

Schema נקבע מ-`TENANT_DB_SCHEMA` — ללא hardcode בקוד.

---

## רישיון / שימוש

פרויקט פנימי להדגמות. אין לחבר לנתוני לקוחות אמיתיים.
