import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, sql } from "../../lib/db";
import { mapReviewFromDb } from "../../lib/mappers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const roomId = Array.isArray(id) ? id[0] : id;

  if (!roomId) {
    return res.status(400).json({ error: "Room ID is required." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    await ensureSchema();

    const { userId, username, rating, comment } = req.body;

    if (!userId || !username || !rating || !comment) {
      return res.status(400).json({ error: "Thiếu dữ liệu đánh giá (người dùng, số sao, nội dung)." });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: "Đánh giá sao phải nằm trong khoảng từ 1 tới 5 sao." });
    }

    // Check if room exists
    const roomCheck = await sql`SELECT id FROM rooms WHERE id = ${roomId}`;
    if (roomCheck.length === 0) {
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

    await sql`
      INSERT INTO reviews (id, room_id, user_id, username, rating, comment, created_at)
      VALUES (${newReview.id}, ${newReview.roomId}, ${newReview.userId}, ${newReview.username}, ${newReview.rating}, ${newReview.comment}, ${newReview.createdAt})
    `;

    // Recalculate average rating of this room
    const reviewsRows = await sql`SELECT rating FROM reviews WHERE room_id = ${roomId}`;
    const totalRating = reviewsRows.reduce((sum: number, r: any) => sum + Number(r.rating), 0);
    const avgRating = reviewsRows.length > 0 ? Math.round(totalRating / reviewsRows.length) : 5;

    await sql`UPDATE rooms SET rating = ${avgRating} WHERE id = ${roomId}`;

    // Get mapped reviews list to send back
    const allReviewsRows = await sql`SELECT * FROM reviews WHERE room_id = ${roomId} ORDER BY created_at ASC`;

    return res.status(201).json({
      success: true,
      newReview,
      updatedRating: avgRating,
      reviews: allReviewsRows.map(mapReviewFromDb)
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
