import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapUserFromDb } from "@/lib/mappers";

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
      SELECT id, username, email, phone, role 
      FROM users 
      ORDER BY role DESC, username ASC
    `;

    // Map rows safely (excluding password hashes)
    const users = rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      phone: r.phone,
      role: r.role,
    }));

    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
