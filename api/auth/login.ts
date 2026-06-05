import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, sql } from "../lib/db";
import { mapUserFromDb } from "../lib/mappers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    await ensureSchema();

    const { credential, password } = req.body;
    if (!credential || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." });
    }

    const found = await sql`
      SELECT * FROM users WHERE LOWER(username) = LOWER(${credential}) OR LOWER(email) = LOWER(${credential})
    `;

    if (found.length === 0 || found[0].password !== password) {
      return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
    }

    const { password: _, ...safeUser } = mapUserFromDb(found[0]);
    return res.status(200).json({ success: true, user: safeUser });
  } catch (err: any) {
    return res.status(500).json({ error: "Đăng nhập thất bại: " + err.message });
  }
}
