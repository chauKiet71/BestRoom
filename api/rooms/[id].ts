import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, sql } from "../lib/db";
import { mapRoomFromDb, mapReviewFromDb } from "../lib/mappers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const roomId = Array.isArray(id) ? id[0] : id;

  if (!roomId) {
    return res.status(400).json({ error: "Room ID is required." });
  }

  try {
    await ensureSchema();

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/rooms/:id
    // ─────────────────────────────────────────────────────────────────────────
    if (req.method === "GET") {
      // Increment interest count
      await sql`UPDATE rooms SET interested_count = COALESCE(interested_count, 0) + 1 WHERE id = ${roomId}`;

      // Fetch room details
      const roomRows = await sql`SELECT * FROM rooms WHERE id = ${roomId}`;
      if (roomRows.length === 0) {
        return res.status(404).json({ error: "Room not found" });
      }
      const mappedRoom = mapRoomFromDb(roomRows[0]);

      // Fetch associated reviews
      const reviewsRows = await sql`SELECT * FROM reviews WHERE room_id = ${roomId} ORDER BY created_at ASC`;
      mappedRoom.reviews = reviewsRows.map(mapReviewFromDb);

      return res.status(200).json(mappedRoom);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/rooms/:id
    // ─────────────────────────────────────────────────────────────────────────
    if (req.method === "PUT") {
      // Security Check
      const userRole = req.headers["x-user-role"];
      if (userRole !== "admin") {
        return res.status(403).json({ error: "Quyền truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền sửa đổi phòng!" });
      }

      const updatedFields = req.body;
      if (!updatedFields.title || !updatedFields.price || !updatedFields.city) {
        return res.status(400).json({ error: "Title, Price, and City are required fields." });
      }

      const checkExist = await sql`SELECT id FROM rooms WHERE id = ${roomId}`;
      if (checkExist.length === 0) {
        return res.status(404).json({ error: "Room not found to update." });
      }

      const images = Array.isArray(updatedFields.images) ? updatedFields.images : [updatedFields.image].filter(Boolean);

      const rows = await sql`
        UPDATE rooms SET
          title = ${updatedFields.title},
          description = ${updatedFields.description || ""},
          price = ${Number(updatedFields.price)},
          area = ${Number(updatedFields.area || 0)},
          city = ${updatedFields.city},
          ward = ${updatedFields.ward || ""},
          street = ${updatedFields.street || ""},
          address_detailed = ${updatedFields.addressDetailed || ""},
          contact_name = ${updatedFields.contactName || ""},
          contact_phone = ${updatedFields.contactPhone || ""},
          image = ${updatedFields.image || images[0] || ""},
          images = ${images},
          is_shared_owner = ${!!updatedFields.isSharedOwner},
          rating = ${Number(updatedFields.rating || 5)},
          has_wifi = ${updatedFields.hasWifi !== false},
          water_fee_type = ${updatedFields.waterFeeType || "có phí"},
          status = ${updatedFields.status || "còn phòng"},
          hours_type = ${updatedFields.hoursType || "tự do"},
          build_year = ${Number(updatedFields.buildYear || 2024)},
          has_parking = ${updatedFields.hasParking !== false},
          is_people_limited = ${!!updatedFields.isPeopleLimited},
          max_people = ${updatedFields.maxPeople ? Number(updatedFields.maxPeople) : null},
          has_elevator = ${!!updatedFields.hasElevator},
          has_contract = ${updatedFields.hasContract !== false},
          has_balcony = ${!!updatedFields.hasBalcony},
          has_mezzanine = ${!!updatedFields.hasMezzanine},
          has_furniture = ${!!updatedFields.hasFurniture},
          electricity_price = ${Number(updatedFields.electricityPrice || 3500)},
          district = ${updatedFields.district || ""}
        WHERE id = ${roomId}
        RETURNING *
      `;

      return res.status(200).json(mapRoomFromDb(rows[0]));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/rooms/:id
    // ─────────────────────────────────────────────────────────────────────────
    if (req.method === "DELETE") {
      // Security Check
      const userRole = req.headers["x-user-role"];
      if (userRole !== "admin") {
        return res.status(403).json({ error: "Quyền truy cập bị từ chối. Chỉ tài khoản Admin mới có quyền xóa phòng!" });
      }

      const deleteRes = await sql`DELETE FROM rooms WHERE id = ${roomId} RETURNING id`;
      if (deleteRes.length === 0) {
        return res.status(404).json({ error: "Room not found to delete." });
      }

      return res.status(200).json({ success: true, message: `Room ${roomId} deleted successfully.` });
    }

    return res.status(405).json({ error: "Method not allowed. Use GET, PUT, or DELETE." });
  } catch (err: any) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
