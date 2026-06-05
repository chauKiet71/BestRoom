import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, sql } from "../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    await ensureSchema();

    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Vui lòng điền đủ email, mã xác thực và mật khẩu mới." });
    }

    // Query reset code from database
    const resetRows = await sql`
      SELECT code, expires_at FROM reset_codes WHERE email = ${email}
    `;

    if (resetRows.length === 0) {
      return res.status(400).json({ error: "Không tìm thấy yêu cầu khôi phục mật khẩu hoặc mã xác thực đã hết hạn." });
    }

    const dbCode = resetRows[0].code;
    const dbExpiresAt = Number(resetRows[0].expires_at);

    if (dbCode !== code || dbExpiresAt < Date.now()) {
      return res.status(400).json({ error: "Mã xác nhận không đúng hoặc đã hết hạn sử dụng." });
    }

    // Update password
    const updateRes = await sql`
      UPDATE users SET password = ${newPassword} WHERE LOWER(email) = LOWER(${email}) RETURNING id
    `;

    if (updateRes.length === 0) {
      return res.status(404).json({ error: "Email tài khoản không tồn tại." });
    }

    // Consume the code (delete it from reset_codes table)
    await sql`
      DELETE FROM reset_codes WHERE email = ${email}
    `;

    return res.status(200).json({ success: true, message: "Mật khẩu đã được cập nhật thành công! Hãy đăng nhập lại." });
  } catch (err: any) {
    return res.status(500).json({ error: "Khôi phục mật khẩu thất bại: " + err.message });
  }
}
