import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { activatePlanForUser, getUserPostingStats } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const userRole = request.headers.get("x-user-role");
    const userId = request.headers.get("x-user-id");
    if (!userId || (userRole !== "user" && userRole !== "admin")) {
      return NextResponse.json({ error: "Bạn cần đăng nhập để mua gói đăng tin." }, { status: 403 });
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: "Thiếu mã gói dịch vụ." }, { status: 400 });
    }

    const planRows = await sql`
      SELECT *
      FROM pricing_plans
      WHERE id = ${planId}
        AND is_active = TRUE
      LIMIT 1
    `;

    if (planRows.length === 0) {
      return NextResponse.json({ error: "Gói dịch vụ không còn khả dụng." }, { status: 404 });
    }

    const plan = planRows[0];

    const purchase = await activatePlanForUser(userId, plan);
    const postingStats = await getUserPostingStats(userId);

    return NextResponse.json({
      success: true,
      purchase,
      postingStats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}
