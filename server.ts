import express from "express";
import path from "path";
import fs from "fs";
import { Pool } from "pg";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Load environment variables
dotenv.config();

const DB_FILE_PATH = path.join(process.cwd(), "data", "rooms.json");
const USERS_FILE_PATH = path.join(process.cwd(), "data", "users.json");
const REVIEWS_FILE_PATH = path.join(process.cwd(), "data", "reviews.json");

// Check if we should use PostgreSQL or fallback to JSON files
const usePostgres = !!(
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes("ep-cool-butterfly-123456")
);

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Bắt lỗi kết nối không mong muốn từ pool tránh crash serverless function
pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client:", err);
});

if (usePostgres) {
  console.log("🔌 Neon PostgreSQL connection configured. Database mode: Postgres.");
} else {
  console.log("⚠️ DATABASE_URL is not configured or uses placeholder. Database mode: Local JSON files.");
}

// =================== POSTGRESQL HELPER MAPPERS ===================

function mapRoomFromDb(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    area: Number(row.area),
    city: row.city,
    district: row.district || "",
    ward: row.ward,
    street: row.street,
    addressDetailed: row.address_detailed,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    image: row.image,
    images: Array.isArray(row.images) ? row.images : [],
    isSharedOwner: !!row.is_shared_owner,
    rating: Number(row.rating),
    hasWifi: !!row.has_wifi,
    waterFeeType: row.water_fee_type,
    status: row.status,
    hoursType: row.hours_type,
    buildYear: Number(row.build_year),
    hasParking: !!row.has_parking,
    isPeopleLimited: !!row.is_people_limited,
    maxPeople: row.max_people ? Number(row.max_people) : undefined,
    hasElevator: !!row.has_elevator,
    hasContract: !!row.has_contract,
    hasBalcony: !!row.has_balcony,
    hasMezzanine: !!row.has_mezzanine,
    hasFurniture: !!row.has_furniture,
    electricityPrice: Number(row.electricity_price || 0),
    interestedCount: Number(row.interested_count || 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

function mapReviewFromDb(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    username: row.username,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

function mapUserFromDb(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    phone: row.phone,
    password: row.password,
    role: row.role
  };
}

// =================== LOCAL JSON DATABASE HELPERS ===================

// Helper function to read rooms
function getRooms(): any[] {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading room database:", error);
    return [];
  }
}

// Helper function to save rooms
function saveRooms(rooms: any[]): boolean {
  try {
    fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(rooms, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing room database:", error);
    return false;
  }
}

// Helper function to read users
function getUsers(): any[] {
  try {
    if (!fs.existsSync(USERS_FILE_PATH)) {
      const defaultUsers = [
        {
          id: "user-admin",
          username: "admin",
          email: "admin@bestroom.vn",
          phone: "0999999999",
          password: "admin",
          role: "admin"
        },
        {
          id: "user-test",
          username: "user123",
          email: "test@gmail.com",
          phone: "0912345678",
          password: "password123",
          role: "user"
        }
      ];
      fs.mkdirSync(path.dirname(USERS_FILE_PATH), { recursive: true });
      fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(defaultUsers, null, 2), "utf-8");
      return defaultUsers;
    }
    const data = fs.readFileSync(USERS_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users database:", error);
    return [];
  }
}

// Helper function to save users
function saveUsers(users: any[]): boolean {
  try {
    fs.mkdirSync(path.dirname(USERS_FILE_PATH), { recursive: true });
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing users database:", error);
    return false;
  }
}

// Helper function to read reviews
function getReviews(): any[] {
  try {
    if (!fs.existsSync(REVIEWS_FILE_PATH)) {
      const defaultReviews = [
        {
          id: "rev-1",
          roomId: "room-1",
          userId: "user-test",
          username: "user123",
          rating: 5,
          comment: "Phòng trọ cực kỳ đẹp, ban công mát mẻ đúng như mô tả. Chủ nhà dễ tính.",
          createdAt: new Date().toISOString()
        }
      ];
      fs.mkdirSync(path.dirname(REVIEWS_FILE_PATH), { recursive: true });
      fs.writeFileSync(REVIEWS_FILE_PATH, JSON.stringify(defaultReviews, null, 2), "utf-8");
      return defaultReviews;
    }
    const data = fs.readFileSync(REVIEWS_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading reviews database:", error);
    return [];
  }
}

// Helper function to save reviews
function saveReviews(reviews: any[]): boolean {
  try {
    fs.mkdirSync(path.dirname(REVIEWS_FILE_PATH), { recursive: true });
    fs.writeFileSync(REVIEWS_FILE_PATH, JSON.stringify(reviews, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing reviews database:", error);
    return false;
  }
}

// =================== POSTGRESQL INITIALIZER ===================

async function initDatabase() {
  if (!usePostgres) return;
  console.log("🌱 Initializing PostgreSQL tables...");
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL
      )
    `);

    // Create rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price INT NOT NULL,
        area INT NOT NULL,
        city VARCHAR(100) NOT NULL,
        district VARCHAR(100) DEFAULT '',
        ward VARCHAR(100) NOT NULL,
        street VARCHAR(100) NOT NULL,
        address_detailed TEXT,
        contact_name VARCHAR(100),
        contact_phone VARCHAR(20),
        image TEXT,
        images TEXT[],
        is_shared_owner BOOLEAN DEFAULT FALSE,
        rating INT DEFAULT 5,
        has_wifi BOOLEAN DEFAULT TRUE,
        water_fee_type VARCHAR(50) DEFAULT 'có phí',
        status VARCHAR(50) DEFAULT 'còn phòng',
        hours_type VARCHAR(50) DEFAULT 'tự do',
        build_year INT DEFAULT 2025,
        has_parking BOOLEAN DEFAULT TRUE,
        is_people_limited BOOLEAN DEFAULT FALSE,
        max_people INT,
        has_elevator BOOLEAN DEFAULT FALSE,
        has_contract BOOLEAN DEFAULT TRUE,
        has_balcony BOOLEAN DEFAULT FALSE,
        has_mezzanine BOOLEAN DEFAULT FALSE,
        has_furniture BOOLEAN DEFAULT FALSE,
        electricity_price INT DEFAULT 3500,
        interested_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(50) PRIMARY KEY,
        room_id VARCHAR(50) REFERENCES rooms(id) ON DELETE CASCADE,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(100) NOT NULL,
        rating INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Upgrade schema for existing databases
    await client.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS district VARCHAR(100) DEFAULT ''");
    await client.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_balcony BOOLEAN DEFAULT FALSE");
    await client.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_mezzanine BOOLEAN DEFAULT FALSE");
    await client.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_furniture BOOLEAN DEFAULT FALSE");
    await client.query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS electricity_price INT DEFAULT 3500");

    // Seed users
    const userCheck = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding default users to PostgreSQL...");
      const defaultUsers = getUsers();
      for (const u of defaultUsers) {
        await client.query(
          "INSERT INTO users (id, username, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6)",
          [u.id, u.username, u.email, u.phone, u.password, u.role]
        );
      }
    }

    // Seed rooms
    const roomCheck = await client.query("SELECT COUNT(*) FROM rooms");
    if (parseInt(roomCheck.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding default rooms to PostgreSQL...");
      const defaultRooms = getRooms();
      for (const r of defaultRooms) {
        await client.query(`
          INSERT INTO rooms (
            id, title, description, price, area, city, district, ward, street, address_detailed,
            contact_name, contact_phone, image, images, is_shared_owner, rating,
            has_wifi, water_fee_type, status, hours_type, build_year, has_parking,
            is_people_limited, max_people, has_elevator, has_contract, interested_count, created_at,
            has_balcony, has_mezzanine, has_furniture, electricity_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
        `, [
          r.id, r.title, r.description, r.price, r.area, r.city, r.district || "", r.ward, r.street, r.addressDetailed,
          r.contactName, r.contactPhone, r.image, r.images, r.isSharedOwner, r.rating,
          r.hasWifi, r.waterFeeType, r.status, r.hoursType, r.buildYear, r.hasParking,
          r.isPeopleLimited, r.maxPeople || null, r.hasElevator, r.hasContract, r.interestedCount || 0, r.createdAt,
          !!r.hasBalcony, !!r.hasMezzanine, !!r.hasFurniture, Number(r.electricityPrice || 3500)
        ]);
      }
    }

    // Seed reviews
    const reviewCheck = await client.query("SELECT COUNT(*) FROM reviews");
    if (parseInt(reviewCheck.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding default reviews to PostgreSQL...");
      const defaultReviews = getReviews();
      for (const rev of defaultReviews) {
        await client.query(
          "INSERT INTO reviews (id, room_id, user_id, username, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [rev.id, rev.roomId, rev.userId, rev.username, rev.rating, rev.comment, rev.createdAt]
        );
      }
    }

    await client.query("COMMIT");
    console.log("✅ PostgreSQL schema initialization and seeding complete.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ PostgreSQL initialization error:", error);
  } finally {
    client.release();
  }
}

// Global server in-memory store for password reset codes
const resetCodes: { [email: string]: { code: string; expiresAt: number } } = {};

// Config Nodemailer Transporter using Gmail Service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || ""
  }
});

// Helper function to send email via actual Gmail SMTP
async function sendResetCodeEmail(toEmail: string, code: string): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS not configured in .env. Reset code shown in console instead.");
    return false;
  }

  const mailOptions = {
    from: `"BestRoom Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "[BestRoom] Mã xác nhận khôi phục mật khẩu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px;">
        <h2 style="color: #2563eb; text-align: center;">Khôi phục mật khẩu BestRoom</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản BestRoom liên kết với địa chỉ email này.</p>
        <p>Mã xác thực của bạn là:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-family: monospace; font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 10px 20px; border-radius: 6px; letter-spacing: 4px; border: 1px solid #e5e7eb;">
            ${code}
          </span>
        </div>
        <p>Mã xác thực này có hiệu lực trong vòng <b>15 phút</b>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #9ca3af; text-align: center;">© 2026 BestRoom. All rights reserved.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log(`✉️ Reset password email sent successfully to ${toEmail}`);
  return true;
}

const app = express();

  // Middleware
  app.use(express.json());

  // API - Heatlh Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API - Get all rooms or filtered rooms
  app.get("/api/rooms", async (req, res) => {
    try {
      if (usePostgres) {
        const { rows } = await pool.query("SELECT * FROM rooms ORDER BY created_at DESC");
        res.json(rows.map(mapRoomFromDb));
      } else {
        const rooms = getRooms();
        res.json(rooms);
      }
    } catch (err: any) {
      res.status(500).json({ error: "Cannot retrieve boarding rooms: " + err.message });
    }
  });

  // API - Get single room and increment interested view count
  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (usePostgres) {
        // Increment interest
        await pool.query("UPDATE rooms SET interested_count = COALESCE(interested_count, 0) + 1 WHERE id = $1", [id]);
        
        // Fetch room
        const roomRes = await pool.query("SELECT * FROM rooms WHERE id = $1", [id]);
        if (roomRes.rows.length === 0) {
          return res.status(404).json({ error: "Room not found" });
        }
        const mappedRoom = mapRoomFromDb(roomRes.rows[0]);

        // Fetch reviews
        const reviewsRes = await pool.query("SELECT * FROM reviews WHERE room_id = $1 ORDER BY created_at ASC", [id]);
        mappedRoom.reviews = reviewsRes.rows.map(mapReviewFromDb);

        res.json(mappedRoom);
      } else {
        const rooms = getRooms();
        const index = rooms.findIndex((r) => r.id === id);
        if (index === -1) {
          return res.status(404).json({ error: "Room not found" });
        }
        
        // Increment viewing interest
        rooms[index].interestedCount = (rooms[index].interestedCount || 0) + 1;
        saveRooms(rooms);

        // Get reviews for this room
        const reviews = getReviews().filter(rev => rev.roomId === id);
        
        const detailedRoom = {
          ...rooms[index],
          reviews
        };

        res.json(detailedRoom);
      }
    } catch (err: any) {
      res.status(500).json({ error: "Error retrieving room details: " + err.message });
    }
  });

  // API - Add new boarding room (Admin Check Required)
  app.post("/api/rooms", async (req, res) => {
    try {
      // Security Check
      const userRole = req.headers["x-user-role"];
      if (userRole !== "admin") {
        return res.status(403).json({ error: "Quyền truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền thêm phòng!" });
       }

      const newRoom = req.body;
      if (!newRoom.title || !newRoom.price || !newRoom.city) {
        return res.status(400).json({ error: "Title, Price, and City are required fields." });
      }

      const timestamp = Date.now();
      const generatedId = `room-${timestamp}`;
      
      const preparedRoom = {
        ...newRoom,
        id: generatedId,
        price: Number(newRoom.price),
        area: Number(newRoom.area || 0),
        rating: Number(newRoom.rating || 5),
        buildYear: Number(newRoom.buildYear || 2024),
        images: Array.isArray(newRoom.images) ? newRoom.images : [newRoom.image].filter(Boolean),
        interestedCount: 0,
        createdAt: new Date().toISOString(),
        hasBalcony: !!newRoom.hasBalcony,
        hasMezzanine: !!newRoom.hasMezzanine,
        hasFurniture: !!newRoom.hasFurniture,
        electricityPrice: Number(newRoom.electricityPrice || 3500),
        district: newRoom.district || ""
      };

      if (usePostgres) {
        const queryText = `
          INSERT INTO rooms (
            id, title, description, price, area, city, district, ward, street, address_detailed,
            contact_name, contact_phone, image, images, is_shared_owner, rating,
            has_wifi, water_fee_type, status, hours_type, build_year, has_parking,
            is_people_limited, max_people, has_elevator, has_contract, interested_count, created_at,
            has_balcony, has_mezzanine, has_furniture, electricity_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
          RETURNING *
        `;
        const values = [
          preparedRoom.id,
          preparedRoom.title,
          preparedRoom.description,
          preparedRoom.price,
          preparedRoom.area,
          preparedRoom.city,
          preparedRoom.district,
          preparedRoom.ward,
          preparedRoom.street,
          preparedRoom.addressDetailed,
          preparedRoom.contactName,
          preparedRoom.contactPhone,
          preparedRoom.image || preparedRoom.images[0] || "",
          preparedRoom.images,
          preparedRoom.isSharedOwner,
          preparedRoom.rating,
          preparedRoom.hasWifi,
          preparedRoom.waterFeeType,
          preparedRoom.status,
          preparedRoom.hoursType,
          preparedRoom.buildYear,
          preparedRoom.hasParking,
          preparedRoom.isPeopleLimited,
          preparedRoom.maxPeople || null,
          preparedRoom.hasElevator,
          preparedRoom.hasContract,
          preparedRoom.interestedCount,
          preparedRoom.createdAt,
          preparedRoom.hasBalcony,
          preparedRoom.hasMezzanine,
          preparedRoom.hasFurniture,
          preparedRoom.electricityPrice
        ];
        const { rows } = await pool.query(queryText, values);
        res.status(201).json(mapRoomFromDb(rows[0]));
      } else {
        const rooms = getRooms();
        rooms.unshift(preparedRoom); // Add to the top of list
        saveRooms(rooms);
        res.status(201).json(preparedRoom);
      }
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create boarding room: " + err.message });
    }
  });

  // API - Edit boarding room (Admin Check Required)
  app.put("/api/rooms/:id", async (req, res) => {
    try {
      // Security Check
      const userRole = req.headers["x-user-role"];
      if (userRole !== "admin") {
        return res.status(403).json({ error: "Quyền truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền sửa đổi phòng!" });
      }

      const { id } = req.params;
      const updatedFields = req.body;

      if (usePostgres) {
        const checkExist = await pool.query("SELECT * FROM rooms WHERE id = $1", [id]);
        if (checkExist.rows.length === 0) {
          return res.status(404).json({ error: "Room not found to update." });
        }

        const images = Array.isArray(updatedFields.images) ? updatedFields.images : [updatedFields.image].filter(Boolean);

        const queryText = `
          UPDATE rooms SET
            title = $1, description = $2, price = $3, area = $4, city = $5, ward = $6,
            street = $7, address_detailed = $8, contact_name = $9, contact_phone = $10,
            image = $11, images = $12, is_shared_owner = $13, rating = $14,
            has_wifi = $15, water_fee_type = $16, status = $17, hours_type = $18,
            build_year = $19, has_parking = $20, is_people_limited = $21,
            max_people = $22, has_elevator = $23, has_contract = $24,
            has_balcony = $25, has_mezzanine = $26, has_furniture = $27, electricity_price = $28,
            district = $29
          WHERE id = $30
          RETURNING *
        `;
        const values = [
          updatedFields.title,
          updatedFields.description,
          Number(updatedFields.price),
          Number(updatedFields.area),
          updatedFields.city,
          updatedFields.ward,
          updatedFields.street,
          updatedFields.addressDetailed,
          updatedFields.contactName,
          updatedFields.contactPhone,
          updatedFields.image || images[0] || "",
          images,
          !!updatedFields.isSharedOwner,
          Number(updatedFields.rating),
          !!updatedFields.hasWifi,
          updatedFields.waterFeeType,
          updatedFields.status,
          updatedFields.hoursType,
          Number(updatedFields.buildYear),
          !!updatedFields.hasParking,
          !!updatedFields.isPeopleLimited,
          updatedFields.maxPeople ? Number(updatedFields.maxPeople) : null,
          !!updatedFields.hasElevator,
          !!updatedFields.hasContract,
          !!updatedFields.hasBalcony,
          !!updatedFields.hasMezzanine,
          !!updatedFields.hasFurniture,
          Number(updatedFields.electricityPrice || 3500),
          updatedFields.district || "",
          id
        ];
        const { rows } = await pool.query(queryText, values);
        res.json(mapRoomFromDb(rows[0]));
      } else {
        const rooms = getRooms();
        const index = rooms.findIndex((r) => r.id === id);
        
        if (index === -1) {
          return res.status(404).json({ error: "Room not found to update." });
        }

        rooms[index] = {
          ...rooms[index],
          ...updatedFields,
          id, // Keep original ID
          price: Number(updatedFields.price),
          area: Number(updatedFields.area),
          rating: Number(updatedFields.rating),
          buildYear: Number(updatedFields.buildYear),
          images: Array.isArray(updatedFields.images) ? updatedFields.images : [updatedFields.image].filter(Boolean),
          hasBalcony: !!updatedFields.hasBalcony,
          hasMezzanine: !!updatedFields.hasMezzanine,
          hasFurniture: !!updatedFields.hasFurniture,
          electricityPrice: Number(updatedFields.electricityPrice || 3500),
          district: updatedFields.district || ""
        };

        saveRooms(rooms);
        res.json(rooms[index]);
      }
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update room: " + err.message });
    }
  });

  // API - Delete boarding room (Admin Check Required)
  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      // Security Check
      const userRole = req.headers["x-user-role"];
      if (userRole !== "admin") {
        return res.status(403).json({ error: "Quyền truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền xóa phòng!" });
      }

      const { id } = req.params;

      if (usePostgres) {
        const { rowCount } = await pool.query("DELETE FROM rooms WHERE id = $1", [id]);
        if (rowCount === 0) {
          return res.status(404).json({ error: "Room not found to delete." });
        }
        res.json({ success: true, message: `Room ${id} deleted successfully.` });
      } else {
        const rooms = getRooms();
        const filtered = rooms.filter((r) => r.id !== id);
        
        if (rooms.length === filtered.length) {
          return res.status(404).json({ error: "Room not found to delete." });
        }

        saveRooms(filtered);
        res.json({ success: true, message: `Room ${id} deleted successfully.` });
      }
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete room: " + err.message });
    }
  });

  // API - Get aggregate location metadata to feed filtering options beautifully
  app.get("/api/meta", async (req, res) => {
    try {
      if (usePostgres) {
        const cityRes = await pool.query("SELECT DISTINCT city FROM rooms WHERE city IS NOT NULL AND city != ''");
        const wardRes = await pool.query("SELECT DISTINCT ward FROM rooms WHERE ward IS NOT NULL AND ward != ''");
        const streetRes = await pool.query("SELECT DISTINCT street FROM rooms WHERE street IS NOT NULL AND street != ''");
        const yearRes = await pool.query("SELECT DISTINCT build_year FROM rooms WHERE build_year IS NOT NULL ORDER BY build_year DESC");

        res.json({
          cities: cityRes.rows.map(r => r.city),
          wards: wardRes.rows.map(r => r.ward),
          streets: streetRes.rows.map(r => r.street),
          years: yearRes.rows.map(r => Number(r.build_year))
        });
      } else {
        const rooms = getRooms();
        const cities = Array.from(new Set(rooms.map(r => r.city).filter(Boolean)));
        const wards = Array.from(new Set(rooms.map(r => r.ward).filter(Boolean)));
        const streets = Array.from(new Set(rooms.map(r => r.street).filter(Boolean)));
        const years = Array.from(new Set(rooms.map(r => r.buildYear).filter(Boolean))).sort((a,b) => b-a);

        res.json({
          cities,
          wards,
          streets,
          years
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =================== AUTHENTICATION APIS ===================

  // Register New User
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, phone, email, password } = req.body;
      if (!username || !phone || !email || !password) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ các trường thông tin." });
      }

      if (usePostgres) {
        // Duplication check
        const userCheck = await pool.query("SELECT * FROM users WHERE LOWER(username) = LOWER($1)", [username]);
        if (userCheck.rows.length > 0) {
          return res.status(400).json({ error: "Tên đăng nhập đã tồn tại trong hệ thống." });
        }

        const emailCheck = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        if (emailCheck.rows.length > 0) {
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

        await pool.query(
          "INSERT INTO users (id, username, phone, email, password, role) VALUES ($1, $2, $3, $4, $5, $6)",
          [newUser.id, newUser.username, newUser.phone, newUser.email, newUser.password, newUser.role]
        );

        const { password: _, ...safeUser } = newUser;
        res.status(201).json({ success: true, user: safeUser });
      } else {
        const users = getUsers();
        
        // Duplication check
        const existsUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (existsUser) {
          return res.status(400).json({ error: "Tên đăng nhập đã tồn tại trong hệ thống." });
        }

        const existsEmail = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existsEmail) {
          return res.status(400).json({ error: "Địa chỉ Email đã được đăng ký sử dụng." });
        }

        const newUser = {
          id: `user-${Date.now()}`,
          username,
          phone,
          email,
          password,
          role: "user" // Default regular user
        };

        users.push(newUser);
        saveUsers(users);

        // Safe user output without password
        const { password: _, ...safeUser } = newUser;
        res.status(201).json({ success: true, user: safeUser });
      }
    } catch (err: any) {
      res.status(500).json({ error: "Đăng ký thất bại: " + err.message });
    }
  });

  // Login User or Admin
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { credential, password } = req.body;
      if (!credential || !password) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." });
      }

      if (usePostgres) {
        const found = await pool.query(
          "SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)",
          [credential]
        );

        if (found.rows.length === 0 || found.rows[0].password !== password) {
          return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
        }

        const { password: _, ...safeUser } = mapUserFromDb(found.rows[0]);
        res.json({ success: true, user: safeUser });
      } else {
        const users = getUsers();
        const foundUser = users.find(
          u => u.username.toLowerCase() === credential.toLowerCase() || u.email.toLowerCase() === credential.toLowerCase()
        );

        if (!foundUser || foundUser.password !== password) {
          return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
        }

        const { password: _, ...safeUser } = foundUser;
        res.json({ success: true, user: safeUser });
      }
    } catch (err: any) {
      res.status(500).json({ error: "Đăng nhập thất bại: " + err.message });
    }
  });

  // Forgot password - Create simulated code or send actual email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Vui lòng cung cấp địa chỉ email." });
      }

      if (usePostgres) {
        const checkUser = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        if (checkUser.rows.length === 0) {
          return res.status(404).json({ error: "Địa chỉ email không tồn tại trong cơ sở dữ liệu." });
        }
      } else {
        const users = getUsers();
        const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!exists) {
          return res.status(404).json({ error: "Địa chỉ email không tồn tại trong cơ sở dữ liệu." });
        }
      }

      // Generate random 6 DIGIT code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      resetCodes[email] = {
        code,
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins expiration
      };

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
        res.json({
          success: true,
          message: `Mã xác nhận khôi phục mật khẩu đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư của bạn!`
        });
      } else {
        res.json({
          success: true,
          message: emailConfigured
            ? `Không thể gửi email qua Gmail: ${emailError}. (Hệ thống tạm thời hiển thị mã xác nhận tại đây)`
            : "Mã xác nhận khôi phục mật khẩu đã được tạo! Vui lòng sao chép mã hiển thị bên dưới (Chưa cấu hình Gmail trong .env).",
          code: code // Fallback to transparent simulator if email failed or not configured
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: "Xử lý quên mật khẩu thất bại: " + err.message });
    }
  });

  // Confirm Verification Code & Change to New Password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Vui lòng điền đủ email, mã xác thực và mật khẩu mới." });
      }

      const resetData = resetCodes[email];
      if (!resetData || resetData.code !== code || resetData.expiresAt < Date.now()) {
        return res.status(400).json({ error: "Mã xác nhận không đúng hoặc đã hết hạn sử dụng." });
      }

      if (usePostgres) {
        const { rowCount } = await pool.query(
          "UPDATE users SET password = $1 WHERE LOWER(email) = LOWER($2)",
          [newPassword, email]
        );
        if (rowCount === 0) {
          return res.status(404).json({ error: "Email tài khoản không tồn tại." });
        }
      } else {
        const users = getUsers();
        const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (index === -1) {
          return res.status(404).json({ error: "Email tài khoản không tồn tại." });
        }

        // Update password
        users[index].password = newPassword;
        saveUsers(users);
      }

      // Consume the code
      delete resetCodes[email];

      res.json({ success: true, message: "Mật khẩu đã được cập nhật thành công! Hãy đăng nhập lại." });
    } catch (err: any) {
      res.status(500).json({ error: "Khôi phục mật khẩu thất bại: " + err.message });
    }
  });

  // =================== REVIEW / REVIEWS APIS ===================

  // Post new rating review of room
  app.post("/api/rooms/:id/reviews", async (req, res) => {
    try {
      const { id: roomId } = req.params;
      const { userId, username, rating, comment } = req.body;

      if (!userId || !username || !rating || !comment) {
        return res.status(400).json({ error: "Thiếu dữ liệu đánh giá (người dùng, số sao, nội dung)." });
      }

      const numRating = Number(rating);
      if (numRating < 1 || numRating > 5) {
        return res.status(400).json({ error: "Đánh giá sao phải nằm trong khoảng từ 1 tới 5 sao." });
      }

      if (usePostgres) {
        // Check if room exists
        const roomCheck = await pool.query("SELECT * FROM rooms WHERE id = $1", [roomId]);
        if (roomCheck.rows.length === 0) {
          return res.status(404).json({ error: "Phòng trọ không tồn tại để đánh giá." });
        }

        // Create review
        const newReview = {
          id: `rev-${Date.now()}`,
          roomId,
          userId,
          username,
          rating: numRating,
          comment,
          createdAt: new Date().toISOString()
        };

        await pool.query(
          "INSERT INTO reviews (id, room_id, user_id, username, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [newReview.id, newReview.roomId, newReview.userId, newReview.username, newReview.rating, newReview.comment, newReview.createdAt]
        );

        // Recalculate average rating of this room
        const reviewsRes = await pool.query("SELECT rating FROM reviews WHERE room_id = $1", [roomId]);
        const totalRating = reviewsRes.rows.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = Math.round(totalRating / reviewsRes.rows.length);

        await pool.query("UPDATE rooms SET rating = $1 WHERE id = $2", [avgRating, roomId]);

        res.status(201).json({
          success: true,
          newReview,
          updatedRating: avgRating,
          reviews: reviewsRes.rows.map(mapReviewFromDb)
        });
      } else {
        const rooms = getRooms();
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) {
          return res.status(404).json({ error: "Phòng trọ không tồn tại để đánh giá." });
        }

        // Create review record
        const reviews = getReviews();
        const newReview = {
          id: `rev-${Date.now()}`,
          roomId,
          userId,
          username,
          rating: numRating,
          comment,
          createdAt: new Date().toISOString()
        };

        reviews.push(newReview);
        saveReviews(reviews);

        // Recalculate average rating of this room
        const roomReviews = reviews.filter(rev => rev.roomId === roomId);
        const avgRating = roomReviews.length > 0 
          ? Math.round(roomReviews.reduce((sum, rev) => sum + rev.rating, 0) / roomReviews.length)
          : numRating;

        rooms[roomIndex].rating = avgRating;
        saveRooms(rooms);

        res.status(201).json({
          success: true,
          newReview,
          updatedRating: avgRating,
          reviews: roomReviews
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: "Không thể thêm phần đánh giá: " + err.message });
    }
  });

// Initialize Database tables and Seed mock data
if (usePostgres) {
  initDatabase().catch((err) => {
    console.error("❌ Database initialization failed:", err);
  });
}

export default app;
