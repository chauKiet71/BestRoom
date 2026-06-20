import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { mapPlanFromDb, syncExpiredPlans } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    const userRole = request.headers.get("x-user-role");
    if (userRole === "admin") {
      await syncExpiredPlans();
      const rows = await sql`
        SELECT
          p.*,
          (COUNT(DISTINCT up.user_id) FILTER (WHERE up.status = 'active'))::int AS subscriber_count,
          COALESCE(SUM(up.price_paid), 0)::int AS revenue
        FROM pricing_plans p
        LEFT JOIN user_plan_purchases up ON up.plan_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at ASC
      `;

      return NextResponse.json(rows.map(mapPlanFromDb));
    }

    const rows = await sql`
      SELECT *
      FROM pricing_plans
      WHERE is_active = TRUE
      ORDER BY price ASC, created_at ASC
    `;

    return NextResponse.json(rows.map(mapPlanFromDb));
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Chỉ admin mới có thể tạo gói dịch vụ." }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name || !body.price || !body.postLimit) {
      return NextResponse.json({ error: "Tên gói, giá và số lượng bài đăng là bắt buộc." }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO pricing_plans (id, name, description, price, post_limit, duration_days, is_active)
      VALUES (
        ${`plan-${Date.now()}`},
        ${body.name},
        ${body.description || ""},
        ${Number(body.price || 0)},
        ${Number(body.postLimit || 0)},
        ${Number(body.durationDays || 30)},
        ${body.isActive !== false}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, plan: mapPlanFromDb(rows[0]) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
