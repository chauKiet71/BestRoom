import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, sql } from "../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    await ensureSchema();

    const { username, phone, email, password } = req.body;
    if (!username || !phone || !email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ các trường thông tin." });
    }

    // Duplication check
    const userCheck = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username})`;
    if (userCheck.length > 0) {
      return res.status(400).json({ error: "Tên đăng nhập đã tồn tại trong hệ thống." });
    }

    const emailCheck = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email})`;
    if (emailCheck.length > 0) {
      return res.status(400).json({ error: "Địa chỉ Email đã được đăng ký sử dụng." });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      username,
      phone,
      email,
      password,
      role: "user"
    };

    await sql`
      INSERT INTO users (id, username, phone, email, password, role)
      VALUES (${newUser.id}, ${newUser.username}, ${newUser.phone}, ${newUser.email}, ${newUser.password}, ${newUser.role})
    `;

    const { password: _, ...safeUser } = newUser;
    return res.status(201).json({ success: true, user: safeUser });
  } catch (err: any) {
    return res.status(500).json({ error: "Đăng ký thất bại: " + err.message });
  }
}
