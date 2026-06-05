import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const { email, code, newPassword } = await request.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Vui lòng điền đủ email, mã xác thực và mật khẩu mới." },
        { status: 400 }
      );
    }

    // Query reset code from database
    const resetRows = await sql`
      SELECT code, expires_at FROM reset_codes WHERE email = ${email}
    `;

    if (resetRows.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy yêu cầu khôi phục mật khẩu hoặc mã xác thực đã hết hạn." },
        { status: 400 }
      );
    }

    const dbCode = resetRows[0].code;
    const dbExpiresAt = Number(resetRows[0].expires_at);

    if (dbCode !== code || dbExpiresAt < Date.now()) {
      return NextResponse.json(
        { error: "Mã xác nhận không đúng hoặc đã hết hạn sử dụng." },
        { status: 400 }
      );
    }

    // Update password
    const updateRes = await sql`
      UPDATE users SET password = ${newPassword} WHERE LOWER(email) = LOWER(${email}) RETURNING id
    `;

    if (updateRes.length === 0) {
      return NextResponse.json(
        { error: "Email tài khoản không tồn tại." },
        { status: 404 }
      );
    }

    // Consume the code
    await sql`
      DELETE FROM reset_codes WHERE email = ${email}
    `;

    return NextResponse.json({
      success: true,
      message: "Mật khẩu đã được cập nhật thành công! Hãy đăng nhập lại."
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Khôi phục mật khẩu thất bại: " + err.message },
      { status: 500 }
    );
  }
}
