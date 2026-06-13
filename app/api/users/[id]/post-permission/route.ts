import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapUserFromDb } from "@/lib/mappers";

type PostPermissionAction = "request" | "approve" | "reject";

const statusByAction: Record<PostPermissionAction, "pending" | "approved" | "rejected"> = {
  request: "pending",
  approve: "approved",
  reject: "rejected",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();

    const { id: targetUserId } = await params;
    const currentUserId = request.headers.get("x-user-id");
    const currentUserRole = request.headers.get("x-user-role");
    const { action } = await request.json() as { action?: PostPermissionAction };

    if (!targetUserId || !action || !statusByAction[action]) {
      return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 400 });
    }

    const isAdminAction = action === "approve" || action === "reject";
    if (isAdminAction && currentUserRole !== "admin") {
      return NextResponse.json({ error: "Chỉ admin mới có quyền duyệt yêu cầu đăng tin." }, { status: 403 });
    }

    if (action === "request" && currentUserId !== targetUserId && currentUserRole !== "admin") {
      return NextResponse.json({ error: "Bạn chỉ có thể gửi yêu cầu cho tài khoản của chính mình." }, { status: 403 });
    }

    const rows = await sql`
      UPDATE users
      SET post_permission_status = ${statusByAction[action]}
      WHERE id = ${targetUserId}
      RETURNING id, username, email, phone, role, avatar, fullname, experience_years, working_hours, post_permission_status
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const { password: _password, ...user } = mapUserFromDb(rows[0]);
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
