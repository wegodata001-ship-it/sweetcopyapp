# DEMO database — Prisma

## אל תריצו `prisma migrate dev` על DEMO

הפקודה `migrate dev` נכשלת כשיש נתונים ישנים ב-`public` (עמודות חובה חדשות, email ריק, וכו').

## הפקודה הנכונה ל-DEMO

```bash
npm run demo:setup
```

זה מריץ:

1. `prisma db push --force-reset` — מסנכרן schema ומאפס טבלאות (DB דמו בלבד)
2. `prisma db seed` — משתמשי `admin` / `employee` + מלאי לדוגמה
3. bootstrap ל-schema `demo`

## דרישות

- **פרויקט Supabase DEMO חדש וריק** (לא אותו DB של ייצור)
- `.env.local` מ-`.env.demo.example`
- `APP_MODE=demo` ו-`DEMO_ONLY=true`

## אם רואים את השגיאה מהצילום

| שגיאה | סיבה |
|--------|------|
| `Customer.name` required, 29 rows | DB ישן עם נתונים אמיתיים |
| `Payment.amount` required | אותו דבר |
| `User.email` NULL | משתמשים ללא email |
| `UserPermission.permission` | שורות ישנות |

**פתרון:** חיבור לפרויקט DEMO נפרד + `npm run demo:setup` (לא `migrate dev`).
