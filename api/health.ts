import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema } from "./lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    return res.status(200).json({ status: "ok" });
  } catch (err: any) {
    return res.status(500).json({ error: "Database connection failed: " + err.message });
  }
}
