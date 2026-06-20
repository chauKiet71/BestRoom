import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

try { dotenv.config(); } catch (_) {}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not configured.");
}

function missingDatabaseUrlError() {
  return new Error("DATABASE_URL is not configured.");
}

const sqlClient = DATABASE_URL ? neon(DATABASE_URL) : null;

export const sql = sqlClient ?? Object.assign(
  ((..._args: unknown[]) => {
    throw missingDatabaseUrlError();
  }) as any,
  {
    query: async () => {
      throw missingDatabaseUrlError();
    },
  }
);

let _schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!_schemaReady) {
    _schemaReady = _initSchema().catch((err) => {
      _schemaReady = null;
      throw err;
    });
  }
  return _schemaReady;
}

async function _initSchema(): Promise<void> {
  if (!sqlClient) {
    throw missingDatabaseUrlError();
  }

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
      room_type          VARCHAR(50)  DEFAULT 'Phòng trọ',
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
      rating             INT          DEFAULT 0,
      has_wifi           BOOLEAN      DEFAULT TRUE,
      water_fee_type     VARCHAR(50)  DEFAULT 'có phí',
      status             VARCHAR(50)  DEFAULT 'còn phòng',
      hours_type         VARCHAR(50)  DEFAULT 'tự do',
      build_year         INT          DEFAULT 2025,
      has_parking        BOOLEAN      DEFAULT TRUE,
      parking_fee_type   VARCHAR(50)  DEFAULT 'miễn phí',
      is_people_limited  BOOLEAN      DEFAULT FALSE,
      max_people         INT,
      has_elevator       BOOLEAN      DEFAULT FALSE,
      has_contract       BOOLEAN      DEFAULT TRUE,
      has_balcony        BOOLEAN      DEFAULT FALSE,
      has_mezzanine      BOOLEAN      DEFAULT FALSE,
      has_furniture      BOOLEAN      DEFAULT FALSE,
      has_air_conditioner BOOLEAN     DEFAULT FALSE,
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

  await sql`
    CREATE TABLE IF NOT EXISTS reset_codes (
      email      VARCHAR(255) PRIMARY KEY,
      code       VARCHAR(10)  NOT NULL,
      expires_at BIGINT       NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS viewing_schedules (
      id             VARCHAR(50) PRIMARY KEY,
      room_id        VARCHAR(50) REFERENCES rooms(id) ON DELETE CASCADE,
      owner_id       VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
      visitor_name   VARCHAR(255) NOT NULL,
      visitor_phone  VARCHAR(30)  NOT NULL,
      viewing_date   VARCHAR(30)  NOT NULL,
      time_slot      VARCHAR(100) NOT NULL,
      contact_method VARCHAR(50)  NOT NULL,
      visitors_count VARCHAR(50)  NOT NULL,
      note           TEXT,
      created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pricing_plans (
      id             VARCHAR(50) PRIMARY KEY,
      name           VARCHAR(120) NOT NULL,
      description    TEXT         DEFAULT '',
      price          INT          NOT NULL DEFAULT 0,
      post_limit     INT          NOT NULL DEFAULT 0,
      duration_days  INT          NOT NULL DEFAULT 30,
      is_active      BOOLEAN      DEFAULT TRUE,
      created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_plan_purchases (
      id              VARCHAR(50) PRIMARY KEY,
      user_id         VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
      plan_id         VARCHAR(50) REFERENCES pricing_plans(id) ON DELETE CASCADE,
      plan_name       VARCHAR(120) NOT NULL,
      price_paid      INT          NOT NULL DEFAULT 0,
      post_limit      INT          NOT NULL DEFAULT 0,
      remaining_posts INT          NOT NULL DEFAULT 0,
      status          VARCHAR(30)  NOT NULL DEFAULT 'active',
      start_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      end_at          TIMESTAMP    NOT NULL,
      created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS plan_payments (
      id              VARCHAR(50) PRIMARY KEY,
      invoice_number  VARCHAR(80) UNIQUE NOT NULL,
      user_id         VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
      plan_id         VARCHAR(50) REFERENCES pricing_plans(id) ON DELETE CASCADE,
      amount          INT          NOT NULL DEFAULT 0,
      status          VARCHAR(30)  NOT NULL DEFAULT 'pending',
      provider        VARCHAR(30)  NOT NULL DEFAULT 'sepay',
      provider_ref    VARCHAR(120) DEFAULT '',
      checkout_fields JSONB        DEFAULT '{}'::jsonb,
      paid_at         TIMESTAMP,
      created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS district          VARCHAR(100) DEFAULT ''`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type         VARCHAR(50)  DEFAULT 'Phòng trọ'`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_balcony       BOOLEAN      DEFAULT FALSE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_mezzanine     BOOLEAN      DEFAULT FALSE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_furniture      BOOLEAN      DEFAULT FALSE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_air_conditioner BOOLEAN      DEFAULT FALSE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS electricity_price INT          DEFAULT 3500`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS parking_fee_type  VARCHAR(50)  DEFAULT 'miễn phí'`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS owner_id          VARCHAR(50)  REFERENCES users(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS approval_status    VARCHAR(50)  DEFAULT 'approved'`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS rejection_reason   TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar             VARCHAR(255) DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS fullname           VARCHAR(255) DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years   VARCHAR(50) DEFAULT '3 năm'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS working_hours      VARCHAR(100) DEFAULT '8:00 - 21:00 (T2 - CN)'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS post_permission_status VARCHAR(30) DEFAULT 'none'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS free_posts_used    INT DEFAULT 0`;

  const plansCount = await sql`SELECT COUNT(*)::int AS count FROM pricing_plans`;
  if (Number(plansCount[0]?.count || 0) === 0) {
    await sql`
      INSERT INTO pricing_plans (id, name, description, price, post_limit, duration_days, is_active)
      VALUES
        ('plan-basic', 'Gói Cơ Bản', 'Phù hợp cho môi giới mới cần thêm lượt đăng sau 3 bài miễn phí.', 99000, 10, 30, TRUE),
        ('plan-pro', 'Gói Chuyên Nghiệp', 'Gia tăng số lượng bài đăng cho môi giới hoạt động thường xuyên.', 199000, 25, 45, TRUE),
        ('plan-max', 'Gói Tối Đa', 'Tối ưu cho đội nhóm hoặc môi giới có nhu cầu đăng tin số lượng lớn.', 349000, 50, 60, TRUE)
    `;
  }
}
