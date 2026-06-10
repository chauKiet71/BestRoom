import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapRoomFromDb } from "@/lib/mappers";

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
      SELECT id, username, email, phone, role, avatar, fullname 
      FROM users 
      WHERE LOWER(username) = LOWER(${decodeURIComponent(username)})
    `;

    if (userRows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const user = {
      id: userRows[0].id,
      username: userRows[0].username,
      email: userRows[0].email,
      phone: userRows[0].phone,
      role: userRows[0].role,
      avatar: userRows[0].avatar || "",
      fullname: userRows[0].fullname || "",
    };

    // Query all rooms posted by this user
    const roomRows = await sql`
      SELECT * 
      FROM rooms 
      WHERE owner_id = ${user.id} AND approval_status = 'approved'
      ORDER BY created_at DESC
    `;

    const rooms = roomRows.map(mapRoomFromDb);

    return NextResponse.json({
      success: true,
      user,
      rooms,
    });
  } catch (err: any) {
    console.error("Error fetching user profile:", err);
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
