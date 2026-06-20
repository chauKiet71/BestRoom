import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { FREE_POST_LIMIT } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const { username, phone, email, password } = await request.json();
    if (!username || !phone || !email || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ các trường thông tin." },
        { status: 400 }
      );
    }

    // Duplication check
    const userCheck = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username})`;
    if (userCheck.length > 0) {
      return NextResponse.json(
        { error: "Tên đăng nhập đã tồn tại trong hệ thống." },
        { status: 400 }
      );
    }

    const emailCheck = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email})`;
    if (emailCheck.length > 0) {
      return NextResponse.json(
        { error: "Địa chỉ Email đã được đăng ký sử dụng." },
        { status: 400 }
      );
    }

    const newUser = {
      id: `user-${Date.now()}`,
      username,
      phone,
      email,
      password,
      role: "user",
      experienceYears: "3 năm",
      postPermissionStatus: "none",
      freePostsUsed: 0,
      freePostsLimit: FREE_POST_LIMIT,
      freePostsRemaining: FREE_POST_LIMIT,
      activePlan: null
    };

    await sql`
      INSERT INTO users (id, username, phone, email, password, role, post_permission_status, free_posts_used)
      VALUES (${newUser.id}, ${newUser.username}, ${newUser.phone}, ${newUser.email}, ${newUser.password}, ${newUser.role}, ${newUser.postPermissionStatus}, 0)
    `;

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Đăng ký thất bại: " + err.message },
      { status: 500 }
    );
  }
}
