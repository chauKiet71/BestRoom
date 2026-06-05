import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

try { dotenv.config(); } catch (_) {}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not configured.");
}

// neon() uses HTTP — no persistent TCP connections, ideal for serverless
export const sql = neon(DATABASE_URL || "");

// ── Schema init ─────────────────────────────────────────────────────────────
// Cached per module instance (i.e. per warm serverless container)
let _schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!_schemaReady) {
    _schemaReady = _initSchema().catch((err) => {
      _schemaReady = null; // allow retry on next cold start
      throw err;
    });
  }
  return _schemaReady;
}

async function _initSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          VARCHAR(50)  PRIMARY KEY,
      username    VARCHAR(100) UNIQUE NOT NULL,
      email       VARCHAR(255) UNIQUE NOT NULL,
      phone       VARCHAR(20)  NOT NULL,
      password    VARCHAR(255) NOT NULL,
      role        VARCHAR(20)  NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id                 VARCHAR(50)  PRIMARY KEY,
      title              VARCHAR(255) NOT NULL,
      description        TEXT,
      price              INT          NOT NULL,
      area               INT          NOT NULL,
      city               VARCHAR(100) NOT NULL,
      district           VARCHAR(100) DEFAULT '',
      ward               VARCHAR(100) NOT NULL,
      street             VARCHAR(100) NOT NULL,
      address_detailed   TEXT,
      contact_name       VARCHAR(100),
      contact_phone      VARCHAR(20),
      image              TEXT,
      images             TEXT[],
      is_shared_owner    BOOLEAN      DEFAULT FALSE,
      rating             INT          DEFAULT 5,
      has_wifi           BOOLEAN      DEFAULT TRUE,
      water_fee_type     VARCHAR(50)  DEFAULT 'có phí',
      status             VARCHAR(50)  DEFAULT 'còn phòng',
      hours_type         VARCHAR(50)  DEFAULT 'tự do',
      build_year         INT          DEFAULT 2025,
      has_parking        BOOLEAN      DEFAULT TRUE,
      is_people_limited  BOOLEAN      DEFAULT FALSE,
      max_people         INT,
      has_elevator       BOOLEAN      DEFAULT FALSE,
      has_contract       BOOLEAN      DEFAULT TRUE,
      has_balcony        BOOLEAN      DEFAULT FALSE,
      has_mezzanine      BOOLEAN      DEFAULT FALSE,
      has_furniture      BOOLEAN      DEFAULT FALSE,
      electricity_price  INT          DEFAULT 3500,
      interested_count   INT          DEFAULT 0,
      created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id          VARCHAR(50) PRIMARY KEY,
      room_id     VARCHAR(50) REFERENCES rooms(id) ON DELETE CASCADE,
      user_id     VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
      username    VARCHAR(100) NOT NULL,
      rating      INT          NOT NULL,
      comment     TEXT         NOT NULL,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Store reset codes in DB instead of in-memory (survives across invocations)
  await sql`
    CREATE TABLE IF NOT EXISTS reset_codes (
      email      VARCHAR(255) PRIMARY KEY,
      code       VARCHAR(10)  NOT NULL,
      expires_at BIGINT       NOT NULL
    )
  `;

  // Upgrade schema for existing databases (idempotent)
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS district          VARCHAR(100) DEFAULT ''`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_balcony       BOOLEAN      DEFAULT FALSE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_mezzanine     BOOLEAN      DEFAULT FALSE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_furniture      BOOLEAN      DEFAULT FALSE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS electricity_price INT          DEFAULT 3500`;
}
