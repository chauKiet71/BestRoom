import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapUserFromDb } from "@/lib/mappers";
import { getUserPostingStats } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const { credential, password } = await request.json();
    if (!credential || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." },
        { status: 400 }
      );
    }

    const found = await sql`
      SELECT * FROM users WHERE LOWER(username) = LOWER(${credential}) OR LOWER(email) = LOWER(${credential})
    `;

    if (found.length === 0 || found[0].password !== password) {
      return NextResponse.json(
        { error: "Tài khoản hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    const { password: _, ...safeUser } = mapUserFromDb(found[0]);
    const postingStats = await getUserPostingStats(safeUser.id);
    return NextResponse.json({ success: true, user: { ...safeUser, ...postingStats } });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Đăng nhập thất bại: " + err.message },
      { status: 500 }
    );
  }
}
