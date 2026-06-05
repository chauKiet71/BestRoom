import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapReviewFromDb } from "@/lib/mappers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required." }, { status: 400 });
    }

    const { userId, username, rating, comment } = await request.json();

    if (!userId || !username || !rating || !comment) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu đánh giá (người dùng, số sao, nội dung)." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: "Đánh giá sao phải nằm trong khoảng từ 1 tới 5 sao." },
        { status: 400 }
      );
    }

    // Check if room exists
    const roomCheck = await sql`SELECT id FROM rooms WHERE id = ${roomId}`;
    if (roomCheck.length === 0) {
      return NextResponse.json({ error: "Phòng trọ không tồn tại để đánh giá." }, { status: 404 });
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

    return NextResponse.json({
      success: true,
      newReview,
      updatedRating: avgRating,
      reviews: allReviewsRows.map(mapReviewFromDb)
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
