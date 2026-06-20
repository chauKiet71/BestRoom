import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapRoomFromDb, mapUserFromDb } from "@/lib/mappers";
import { getUserPostingStats } from "@/lib/pricing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await ensureSchema();
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: "Username is required." }, { status: 400 });
    }

    // Query user by username (case-insensitive)
    const userRows = await sql`
      SELECT id, username, email, phone, role, avatar, fullname, experience_years, working_hours, post_permission_status, free_posts_used 
      FROM users 
      WHERE LOWER(username) = LOWER(${decodeURIComponent(username)})
    `;

    if (userRows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const { password: _password, ...user } = mapUserFromDb(userRows[0]);
    const postingStats = await getUserPostingStats(user.id);

    // Query all rooms posted by this user
    const roomRows = await sql`
      SELECT * 
      FROM rooms 
      WHERE owner_id = ${user.id}
        AND approval_status = 'approved'
        AND COALESCE(expires_at, created_at + INTERVAL '30 days') >= CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `;

    const rooms = roomRows.map(mapRoomFromDb);

    const scheduleRows = await sql`
      SELECT COUNT(*) AS count
      FROM viewing_schedules
      WHERE owner_id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      user: { ...user, ...postingStats },
      rooms,
      scheduleCount: Number(scheduleRows[0]?.count || 0),
    });
  } catch (err: any) {
    console.error("Error fetching user profile:", err);
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
