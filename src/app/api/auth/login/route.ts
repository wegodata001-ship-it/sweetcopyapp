import { NextRequest, NextResponse } from "next/server";
import { ensureBootstrapSuperAdmin } from "@/lib/auth/bootstrap";
import { verifyPassword } from "@/lib/auth/password";
import { resolveLoginUser } from "@/lib/auth/resolve-login-user";
import { signSessionToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { getPermissionStringsForUser } from "@/lib/auth/user-permissions";
import { logActivity } from "@/lib/activity-log";
import { looksLikeEmail } from "@/lib/employees/national-id";
import type { SessionRole } from "@/lib/auth/session-role";
import { parseSessionRole } from "@/lib/auth/session-role";

export async function POST(req: NextRequest) {
  try {
    await ensureBootstrapSuperAdmin();

    const body = (await req.json()) as {
      identifier?: string;
      email?: string;
      password?: string;
    };

    const rawIdentifier = body.identifier?.trim() || body.email?.trim() || "";
    const password = body.password;
    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { ok: false, code: "missing_fields", error: "אימייל / שם משתמש וסיסמה נדרשים" },
        { status: 400 },
      );
    }

    const user = await resolveLoginUser(rawIdentifier);

    if (!user) {
      const hint = looksLikeEmail(rawIdentifier) ? "bad_credentials" : "use_email";
      return NextResponse.json(
        { ok: false, code: hint, error: "פרטי התחברות שגויים" },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { ok: false, code: "inactive", error: "המשתמש אינו פעיל — פנו למנהל" },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, code: "bad_credentials", error: "פרטי התחברות שגויים" },
        { status: 401 },
      );
    }

    const role = parseSessionRole(user.role) ?? ("employee" as SessionRole);
    const permissions = await getPermissionStringsForUser(user.id, role);

    const token = await signSessionToken({
      sub: user.id,
      email: user.email,
      role,
      permissions,
      mustChangePassword: false,
    });

    await logActivity(user.id, "login");

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        nationalId: user.nationalId,
        phone: user.phone,
        role,
        mustChangePassword: false,
        permissions,
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    const code = msg.includes("JWT_SECRET") ? "server_config" : "server_error";
    return NextResponse.json({ ok: false, code, error: msg }, { status: 500 });
  }
}
