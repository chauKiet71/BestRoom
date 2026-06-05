import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const info: Record<string, any> = {
    node_version: process.version,
    env: {
      has_DATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_preview: process.env.DATABASE_URL?.slice(0, 50) + "...",
      has_EMAIL_USER: !!process.env.EMAIL_USER,
    },
    timestamp: new Date().toISOString(),
  };

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
  }

  try {
    // Test importing server
    const app = await import("../server");
    info.server_import = "ok";
  } catch (err: any) {
    info.server_import = "FAILED";
    info.server_import_error = err.message;
    info.server_import_stack = err.stack?.slice(0, 500);
  }

  res.status(200).json(info);
}
