import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapPlanFromDb } from "@/lib/pricing";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();

    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Chỉ admin mới có thể cập nhật gói dịch vụ." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const rows = await sql`
      UPDATE pricing_plans
      SET
        name = ${body.name},
        description = ${body.description || ""},
        price = ${Number(body.price || 0)},
        post_limit = ${Number(body.postLimit || 0)},
        duration_days = ${Number(body.durationDays || 30)},
        is_active = ${body.isActive !== false}
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy gói dịch vụ." }, { status: 404 });
    }

    return NextResponse.json({ success: true, plan: mapPlanFromDb(rows[0]) });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
