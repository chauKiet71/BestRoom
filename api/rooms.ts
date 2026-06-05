import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, sql } from "./lib/db";
import { mapRoomFromDb } from "./lib/mappers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const rows = await sql`SELECT * FROM rooms ORDER BY created_at DESC`;
      return res.status(200).json(rows.map(mapRoomFromDb));
    }

    if (req.method === "POST") {
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

      const rows = await sql`
        INSERT INTO rooms (
          id, title, description, price, area, city, district, ward, street, address_detailed,
          contact_name, contact_phone, image, images, is_shared_owner, rating,
          has_wifi, water_fee_type, status, hours_type, build_year, has_parking,
          is_people_limited, max_people, has_elevator, has_contract, interested_count, created_at,
          has_balcony, has_mezzanine, has_furniture, electricity_price
        ) VALUES (
          ${preparedRoom.id},
          ${preparedRoom.title},
          ${preparedRoom.description},
          ${preparedRoom.price},
          ${preparedRoom.area},
          ${preparedRoom.city},
          ${preparedRoom.district},
          ${preparedRoom.ward},
          ${preparedRoom.street},
          ${preparedRoom.addressDetailed || ""},
          ${preparedRoom.contactName || ""},
          ${preparedRoom.contactPhone || ""},
          ${preparedRoom.image || preparedRoom.images[0] || ""},
          ${preparedRoom.images},
          ${preparedRoom.isSharedOwner || false},
          ${preparedRoom.rating},
          ${preparedRoom.hasWifi !== false},
          ${preparedRoom.waterFeeType || "có phí"},
          ${preparedRoom.status || "còn phòng"},
          ${preparedRoom.hoursType || "tự do"},
          ${preparedRoom.buildYear},
          ${preparedRoom.hasParking !== false},
          ${preparedRoom.isPeopleLimited || false},
          ${preparedRoom.maxPeople || null},
          ${preparedRoom.hasElevator || false},
          ${preparedRoom.hasContract !== false},
          ${preparedRoom.interestedCount},
          ${preparedRoom.createdAt},
          ${preparedRoom.hasBalcony},
          ${preparedRoom.hasMezzanine},
          ${preparedRoom.hasFurniture},
          ${preparedRoom.electricityPrice}
        )
        RETURNING *
      `;

      return res.status(201).json(mapRoomFromDb(rows[0]));
    }

    return res.status(405).json({ error: "Method not allowed. Use GET or POST." });
  } catch (err: any) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
