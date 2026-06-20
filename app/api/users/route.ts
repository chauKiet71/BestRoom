import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapUserFromDb } from "@/lib/mappers";
import { getUserPostingStats } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    // Security Check: Only Admin is allowed to list users
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Quyền truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền xem danh sách người dùng!" },
        { status: 403 }
      );
    }

    const rows = await sql`
      SELECT id, username, email, phone, role, avatar, fullname, experience_years, working_hours, post_permission_status, free_posts_used 
      FROM users 
      ORDER BY role DESC, username ASC
    `;

    const users = await Promise.all(rows.map(async (r) => {
      const { password: _password, ...safeUser } = mapUserFromDb(r);
      const postingStats = await getUserPostingStats(safeUser.id);
      return { ...safeUser, ...postingStats };
    }));

    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
