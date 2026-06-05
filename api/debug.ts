import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const info: Record<string, any> = {
    node_version: process.version,
    platform: process.platform,
    env: {
      has_DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 60) + "..." : "NOT SET",
      has_EMAIL_USER: !!process.env.EMAIL_USER,
      NODE_ENV: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  };

  // Test 1: pg connection only
  try {
    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    const result = await pool.query("SELECT NOW() as time");
    info.db_connected = true;
    info.db_time = result.rows[0].time;
    await pool.end();
  } catch (err: any) {
    info.db_connected = false;
    info.db_error = err.message;
    info.db_error_code = err.code;
  }

  res.status(200).json(info);
}
