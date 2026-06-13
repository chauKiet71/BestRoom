import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

export async function GET() {
  try {
    await ensureSchema();

    // Query top 9 users sorted by number of approved boarding rooms they own
    const rows = await sql`
      SELECT u.id, u.username, u.email, u.phone, u.role, u.avatar, u.fullname, u.experience_years, COALESCE(rooms_count.count, 0)::int as room_count
      FROM users u
      LEFT JOIN (
        SELECT owner_id, COUNT(*) as count 
        FROM rooms 
        WHERE approval_status = 'approved'
        GROUP BY owner_id
      ) rooms_count ON u.id = rooms_count.owner_id
      ORDER BY room_count DESC, u.username ASC
      LIMIT 9
    `;

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
