import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, sql } from "../lib/db";
import { sendResetCodeEmail } from "../lib/email";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    await ensureSchema();

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Vui lòng cung cấp địa chỉ email." });
    }

    // Verify user exists
    const checkUser = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email})`;
    if (checkUser.length === 0) {
      return res.status(404).json({ error: "Địa chỉ email không tồn tại trong cơ sở dữ liệu." });
    }

    // Generate random 6 DIGIT code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins expiration

    // Upsert reset code in PostgreSQL
    await sql`
      INSERT INTO reset_codes (email, code, expires_at)
      VALUES (${email}, ${code}, ${expiresAt})
      ON CONFLICT (email) DO UPDATE
      SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at
    `;

    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    let sentSuccessfully = false;
    let emailError = null;

    if (emailConfigured) {
      try {
        sentSuccessfully = await sendResetCodeEmail(email, code);
      } catch (err: any) {
        emailError = err.message;
      }
    }

    if (sentSuccessfully) {
      return res.status(200).json({
        success: true,
        message: `Mã xác nhận khôi phục mật khẩu đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư của bạn!`
      });
    } else {
      return res.status(200).json({
        success: true,
        message: emailConfigured
          ? `Không thể gửi email qua Gmail: ${emailError}. (Hệ thống tạm thời hiển thị mã xác nhận tại đây)`
          : "Mã xác nhận khôi phục mật khẩu đã được tạo! Vui lòng sao chép mã hiển thị bên dưới (Chưa cấu hình Gmail trong .env).",
        code: code // Fallback to transparent simulator if email failed or not configured
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Xử lý quên mật khẩu thất bại: " + err.message });
  }
}
